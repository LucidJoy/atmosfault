import { db } from '@/database/drizzle';
import { balloon_snapshots } from '@/database/schema';
import { eq, and, desc } from 'drizzle-orm';
import type { Balloons, PackageStatus, TimelineEvent, TrackingResponse, Location } from '@/lib/types';
import { getWeatherAtLocation } from './weather';

export function parseTrackingNumber(trackingNumber: string): { hour: number; index: number } | null {
  // Validate format: ATM-XXXXXXXX
  const regex = /^ATM-(\d{8})$/;
  const match = trackingNumber.match(regex);

  if (!match) {
    return null;
  }

  const digits = match[1];

  // Extract hour (positions 0-1) and index (positions 2-7)
  const hour = parseInt(digits.substring(0, 2), 10);
  const index = parseInt(digits.substring(2), 10);

  // Validate hour range (0-23)
  if (hour < 0 || hour > 23) {
    return null;
  }

  return { hour, index };
}

export function determineStatus(altitude: number, fetchedAt: Date): PackageStatus {
  const now = new Date();
  const hoursSinceFetch = (now.getTime() - fetchedAt.getTime()) / (1000 * 60 * 60);

  // If data is very old (>24 hours), mark as failed
  if (hoursSinceFetch > 24) {
    return 'failed';
  }

  // Status based on altitude
  if (altitude < 1) {
    return 'pending';
  } else if (altitude >= 1 && altitude < 20) {
    return 'in_transit';
  } else {
    return 'delivered';
  }
}

export function calculateEstimatedDelivery(
  status: PackageStatus,
  altitude: number,
  fetchedAt: Date
): string | null {
  if (status === 'failed') {
    return null;
  }

  const baseTime = new Date(fetchedAt);

  if (status === 'pending') {
    // Pending: +8 hours
    baseTime.setHours(baseTime.getHours() + 8);
  } else if (status === 'in_transit') {
    // In transit: +2-4 hours based on altitude
    if (altitude < 10) {
      baseTime.setHours(baseTime.getHours() + 4);
    } else {
      baseTime.setHours(baseTime.getHours() + 2);
    }
  } else if (status === 'delivered') {
    // Already delivered, use the fetched time
    return fetchedAt.toISOString();
  }

  return baseTime.toISOString();
}

export function buildTimeline(snapshots: Balloons[]): TimelineEvent[] {
  // Sort snapshots by snapshotHour to show progression over time
  const sorted = [...snapshots].sort((a, b) => a.snapshotHour - b.snapshotHour);

  return sorted.map((snapshot) => {
    const status = determineStatus(snapshot.altitude, new Date(snapshot.fetchedAt));
    const location: Location = {
      latitude: snapshot.latitude,
      longitude: snapshot.longitude,
      altitude: snapshot.altitude,
      timestamp: new Date(snapshot.fetchedAt).toISOString(),
    };

    let description: string;
    switch (status) {
      case 'pending':
        description = `Hour ${snapshot.snapshotHour}: At origin facility`;
        break;
      case 'in_transit':
        description = `Hour ${snapshot.snapshotHour}: In transit - altitude ${snapshot.altitude.toFixed(1)} km`;
        break;
      case 'delivered':
        description = `Hour ${snapshot.snapshotHour}: Delivered to destination`;
        break;
      case 'failed':
        description = `Hour ${snapshot.snapshotHour}: Delivery failed`;
        break;
    }

    return {
      status,
      timestamp: new Date(snapshot.fetchedAt).toISOString(),
      location,
      description,
    };
  });
}

export async function getTrackingInfo(trackingNumber: string): Promise<TrackingResponse | null> {
  // Parse the tracking number
  const parsed = parseTrackingNumber(trackingNumber);

  if (!parsed) {
    return null;
  }

  const { index } = parsed;

  // Query the database for ALL snapshots with this arrayIndex across ALL hours
  // This gives us the complete flight path across different time snapshots
  const snapshots = await db
    .select()
    .from(balloon_snapshots)
    .where(eq(balloon_snapshots.arrayIndex, index))
    .orderBy(balloon_snapshots.snapshotHour)
    .limit(100); // Limit to 100 snapshots for performance

  if (snapshots.length === 0) {
    return null;
  }

  // Get the most recent snapshot
  const latest = snapshots[0];

  // Convert decimal strings to numbers
  const latitude = parseFloat(latest.latitude as unknown as string);
  const longitude = parseFloat(latest.longitude as unknown as string);
  const altitude = parseFloat(latest.altitude as unknown as string);
  const fetchedAt = new Date(latest.fetchedAt);

  // Transform snapshots to Balloons type
  const balloonsSnapshots: Balloons[] = snapshots.map((s) => ({
    id: s.id,
    latitude: parseFloat(s.latitude as unknown as string),
    longitude: parseFloat(s.longitude as unknown as string),
    altitude: parseFloat(s.altitude as unknown as string),
    snapshotHour: s.snapshotHour,
    arrayIndex: s.arrayIndex,
    fetchedAt: new Date(s.fetchedAt),
  }));

  // Determine status
  const status = determineStatus(altitude, fetchedAt);

  // Build current location
  const currentLocation: Location = {
    latitude,
    longitude,
    altitude,
    timestamp: fetchedAt.toISOString(),
  };

  // Build timeline
  const timeline = buildTimeline(balloonsSnapshots);

  // Calculate estimated delivery
  const estimatedDelivery = calculateEstimatedDelivery(status, altitude, fetchedAt);

  // Fetch weather data at balloon location
  const weather = await getWeatherAtLocation(latitude, longitude);

  // Build response
  const response: TrackingResponse = {
    trackingNumber,
    status,
    currentLocation,
    timeline,
    estimatedDelivery,
    metadata: {
      balloonId: latest.id,
      arrayIndex: latest.arrayIndex,
      snapshotHour: latest.snapshotHour,
      destination: status === 'delivered' ? 'Upper Atmosphere' : undefined,
    },
    weather: weather || undefined, // Include weather data if available
  };

  return response;
}
