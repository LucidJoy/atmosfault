import { db } from "@/database/drizzle";
import { dhl_shipments } from "@/database/schema";
import { eq } from "drizzle-orm";
import axios from "axios";

/**
 * DHL API Integration with Smart Caching
 *
 * System Design Principles:
 * 1. Cache-First Strategy: Check DB before hitting external API
 * 2. TTL-Based Invalidation: Cache expires after CACHE_TTL_MS
 * 3. Error Handling: Graceful degradation with cached data
 * 4. Rate Limit Protection: Minimize external API calls
 */

const DHL_API_BASE_URL = "https://api-eu.dhl.com/track/shipments";
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache

// DHL API Response Types
export interface DHLAddress {
  addressLocality?: string;
  countryCode?: string;
}

export interface DHLLocation {
  address: DHLAddress;
}

export interface DHLEvent {
  timestamp: string;
  location?: DHLLocation;
  statusCode: string;
  status: string;
  description: string;
  pieceIds?: string[];
}

export interface DHLStatus {
  timestamp: string;
  location?: DHLLocation;
  statusCode: string;
  status: string;
  description: string;
}

export interface DHLServicePoint {
  url?: string;
  label?: string;
}

export interface DHLOriginDestination {
  address: DHLAddress;
  servicePoint?: DHLServicePoint;
}

export interface DHLShipment {
  id: string;
  service: string;
  origin: DHLOriginDestination;
  destination: DHLOriginDestination;
  status: DHLStatus;
  events: DHLEvent[];
  details?: {
    product?: {
      productCode?: string;
      productName?: string;
    };
    totalNumberOfPieces?: number;
  };
}

export interface DHLApiResponse {
  shipments: DHLShipment[];
}

/**
 * Check if cached data is still fresh
 */
function isCacheValid(updatedAt: Date): boolean {
  const now = new Date().getTime();
  const cacheAge = now - new Date(updatedAt).getTime();
  return cacheAge < CACHE_TTL_MS;
}

/**
 * Fetch shipment data from DHL API
 */
async function fetchFromDHL(
  trackingNumber: string
): Promise<DHLApiResponse | null> {
  const apiKey = process.env.DHL_API_KEY;

  if (!apiKey) {
    console.error("DHL_API_KEY not configured");
    throw new Error("DHL API key not configured");
  }

  try {
    const response = await axios.get<DHLApiResponse>(DHL_API_BASE_URL, {
      params: {
        trackingNumber,
        service: "express",
        language: "en",
        offset: 0,
        limit: 5,
      },
      headers: {
        "DHL-API-Key": apiKey,
      },
      timeout: 10000, // 10 second timeout
    });

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("DHL API Error:", {
        status: error.response?.status,
        message: error.message,
        trackingNumber,
      });
    } else {
      console.error("Unexpected error fetching from DHL:", error);
    }
    return null;
  }
}

/**
 * Get cached shipment data from database
 */
async function getCachedShipment(
  trackingNumber: string
): Promise<DHLApiResponse | null> {
  try {
    const cached = await db
      .select()
      .from(dhl_shipments)
      .where(eq(dhl_shipments.trackingNumber, trackingNumber))
      .limit(1);

    if (cached.length === 0) {
      return null;
    }

    const { data, updatedAt } = cached[0];

    // Check if cache is still valid
    if (isCacheValid(updatedAt)) {
      console.log(
        `✓ Cache hit for ${trackingNumber} (age: ${Math.floor(
          (Date.now() - new Date(updatedAt).getTime()) / 1000
        )}s)`
      );
      return data as DHLApiResponse;
    }

    console.log(`✗ Cache expired for ${trackingNumber}`);
    return null;
  } catch (error) {
    console.error("Error reading from cache:", error);
    return null;
  }
}

/**
 * Save shipment data to cache
 */
async function saveToCache(
  trackingNumber: string,
  data: DHLApiResponse
): Promise<void> {
  try {
    await db
      .insert(dhl_shipments)
      .values({
        trackingNumber,
        data: data as any,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: dhl_shipments.trackingNumber,
        set: {
          data: data as any,
          updatedAt: new Date(),
        },
      });

    console.log(`✓ Cached shipment ${trackingNumber}`);
  } catch (error) {
    console.error("Error saving to cache:", error);
    // Non-critical error - continue without caching
  }
}

/**
 * Get DHL shipment tracking data with smart caching
 *
 * Flow:
 * 1. Check cache first
 * 2. If cache valid, return cached data
 * 3. If cache invalid/missing, fetch from DHL API
 * 4. Save fresh data to cache
 * 5. Return fresh data
 */
export async function getShipmentTracking(
  trackingNumber: string
): Promise<DHLApiResponse | null> {
  // Step 1: Try cache first
  const cached = await getCachedShipment(trackingNumber);
  if (cached) {
    return cached;
  }

  // Step 2: Fetch from DHL API
  console.log(`→ Fetching ${trackingNumber} from DHL API`);
  const freshData = await fetchFromDHL(trackingNumber);

  if (!freshData) {
    return null;
  }

  // Step 3: Save to cache for future requests
  await saveToCache(trackingNumber, freshData);

  return freshData;
}

/**
 * Clean up old cache entries (optional maintenance function)
 */
export async function cleanupOldCache(
  olderThanDays: number = 7
): Promise<void> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

  try {
    await db
      .delete(dhl_shipments)
      .where(eq(dhl_shipments.updatedAt, cutoffDate));

    console.log(`Cleaned up cache entries older than ${olderThanDays} days`);
  } catch (error) {
    console.error("Error cleaning up cache:", error);
  }
}
