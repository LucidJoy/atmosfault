import { db } from '@/database/drizzle';
import { balloon_snapshots } from '@/database/schema';
import { and, gte, lte, sql } from 'drizzle-orm';
import type { TrackingResponse, TimelineEvent } from '../types/dhl-tracking';

/**
 * AtmosFault Blame Engine
 *
 * The hilarious-but-educational core that connects package delays
 * to atmospheric chaos detected by WindBorne weather balloons.
 */

// Atmospheric threat levels (hurricane-style)
export type ThreatLevel = 'PEACEFUL' | 'TURBULENT' | 'CHAOTIC' | 'APOCALYPTIC' | 'DOOMED';

// Blame reason categories
export type BlameCategory =
  | 'JET_STREAM_CHAOS'
  | 'PRESSURE_WARFARE'
  | 'TURBULENCE_NIGHTMARE'
  | 'ALTITUDE_MADNESS'
  | 'ATMOSPHERIC_HOSTAGE';

export interface AtmosphericBlame {
  balloonId: string;
  trackingNumber: string;
  latitude: number;
  longitude: number;
  altitude: number;
  detectedAt: Date;
  threatLevel: ThreatLevel;
  category: BlameCategory;
  dramaticReason: string;
  scientificReason: string;
  distanceFromRoute: number; // km
  severity: number; // 0-100
}

export interface BlameChain {
  packageLocation: {
    city: string;
    latitude?: number;
    longitude?: number;
  };
  culpritBalloons: AtmosphericBlame[];
  overallThreat: ThreatLevel;
  doomLevel: number; // 0-100: How doomed is your package?
  alternateTimeline: string; // What would've happened without balloon data
}

/**
 * Calculate distance between two points using Haversine formula
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Determine threat level based on altitude
 */
function getThreatLevel(altitude: number): ThreatLevel {
  if (altitude < 5) return 'PEACEFUL';
  if (altitude < 10) return 'TURBULENT';
  if (altitude < 15) return 'CHAOTIC';
  if (altitude < 20) return 'APOCALYPTIC';
  return 'DOOMED';
}

/**
 * Get blame category based on altitude patterns
 */
function getBlameCategory(altitude: number): BlameCategory {
  if (altitude < 3) return 'PRESSURE_WARFARE';
  if (altitude < 8) return 'TURBULENCE_NIGHTMARE';
  if (altitude < 15) return 'JET_STREAM_CHAOS';
  if (altitude < 20) return 'ALTITUDE_MADNESS';
  return 'ATMOSPHERIC_HOSTAGE';
}

/**
 * Generate dramatic blame reasons
 */
function getDramaticReason(category: BlameCategory, altitude: number): string {
  const reasons: Record<BlameCategory, string[]> = {
    JET_STREAM_CHAOS: [
      `A rogue jet stream at ${altitude.toFixed(1)}km hijacked your package like a high-altitude carjacking`,
      `Jet stream winds are treating your package like a pinball at ${altitude.toFixed(1)}km`,
      `The jet stream is running a protection racket at ${altitude.toFixed(1)}km - your package paid the toll`,
    ],
    PRESSURE_WARFARE: [
      `Competing pressure systems are using your package as a bargaining chip at ${altitude.toFixed(1)}km`,
      `A low-pressure zone is holding your package hostage for atmospheric ransom`,
      `Pressure systems are playing tug-of-war with your package at ${altitude.toFixed(1)}km`,
    ],
    TURBULENCE_NIGHTMARE: [
      `Turbulence at ${altitude.toFixed(1)}km is giving your package the ride of its life (not in a good way)`,
      `Your package is experiencing what we call "aggressive atmospheric disagreement" at ${altitude.toFixed(1)}km`,
      `Turbulence is treating your package like a cocktail shaker at ${altitude.toFixed(1)}km`,
    ],
    ALTITUDE_MADNESS: [
      `The ${altitude.toFixed(1)}km altitude zone is known to atmospheric scientists as "The Bermuda Triangle of Shipping"`,
      `At ${altitude.toFixed(1)}km, your package entered an atmospheric no-man's-land`,
      `Altitude ${altitude.toFixed(1)}km is where packages go to question their life choices`,
    ],
    ATMOSPHERIC_HOSTAGE: [
      `Your package is being held captive by atmospheric forces at ${altitude.toFixed(1)}km`,
      `A weather pattern at ${altitude.toFixed(1)}km has taken your package prisoner`,
      `Your package is trapped in atmospheric bureaucracy at ${altitude.toFixed(1)}km`,
    ],
  };

  const options = reasons[category];
  return options[Math.floor(Math.random() * options.length)];
}

/**
 * Generate scientific explanation
 */
function getScientificReason(category: BlameCategory, altitude: number): string {
  const science: Record<BlameCategory, string> = {
    JET_STREAM_CHAOS: `Jet stream activity at ${altitude.toFixed(1)}km altitude creates wind shear conditions exceeding 100 knots, forcing aircraft to adjust flight paths and causing routing delays.`,
    PRESSURE_WARFARE: `Pressure differential at ${altitude.toFixed(1)}km creates unstable atmospheric conditions, requiring flight path modifications for safety.`,
    TURBULENCE_NIGHTMARE: `Clear air turbulence detected at ${altitude.toFixed(1)}km with wind speed variations of 40+ knots per vertical kilometer, necessitating altitude changes.`,
    ALTITUDE_MADNESS: `Atmospheric instability at ${altitude.toFixed(1)}km creates challenging flight conditions requiring extended routing.`,
    ATMOSPHERIC_HOSTAGE: `Complex weather system at ${altitude.toFixed(1)}km creating multi-layer wind patterns that impact optimal flight routing.`,
  };

  return science[category];
}

/**
 * Calculate severity score (0-100)
 */
function calculateSeverity(altitude: number, distance: number): number {
  // Higher altitude = more severe
  const altitudeFactor = Math.min(altitude / 25, 1) * 50;

  // Closer distance = more severe
  const distanceFactor = Math.max(0, 1 - distance / 1000) * 50;

  return Math.min(Math.round(altitudeFactor + distanceFactor), 100);
}

/**
 * Find balloons near a DHL shipment event
 */
async function findNearbyBalloons(
  latitude: number,
  longitude: number,
  radiusKm: number = 500
): Promise<AtmosphericBlame[]> {
  // Query balloons within approximate bounding box
  const latDelta = radiusKm / 111; // 1 degree latitude ≈ 111km
  const lonDelta = radiusKm / (111 * Math.cos((latitude * Math.PI) / 180));

  const balloons = await db
    .select()
    .from(balloon_snapshots)
    .where(
      and(
        gte(sql`CAST(${balloon_snapshots.latitude} AS DECIMAL)`, String(latitude - latDelta)),
        lte(sql`CAST(${balloon_snapshots.latitude} AS DECIMAL)`, String(latitude + latDelta)),
        gte(sql`CAST(${balloon_snapshots.longitude} AS DECIMAL)`, String(longitude - lonDelta)),
        lte(sql`CAST(${balloon_snapshots.longitude} AS DECIMAL)`, String(longitude + lonDelta))
      )
    )
    .limit(50);

  // Calculate distances and create blame objects
  const blames: AtmosphericBlame[] = [];

  for (const balloon of balloons) {
    const balloonLat = parseFloat(balloon.latitude as unknown as string);
    const balloonLon = parseFloat(balloon.longitude as unknown as string);
    const balloonAlt = parseFloat(balloon.altitude as unknown as string);

    const distance = calculateDistance(latitude, longitude, balloonLat, balloonLon);

    if (distance <= radiusKm) {
      const threatLevel = getThreatLevel(balloonAlt);
      const category = getBlameCategory(balloonAlt);
      const severity = calculateSeverity(balloonAlt, distance);

      blames.push({
        balloonId: `ATM-${balloon.snapshotHour.toString().padStart(2, '0')}${balloon.arrayIndex.toString().padStart(6, '0')}`,
        trackingNumber: '', // Will be set by caller
        latitude: balloonLat,
        longitude: balloonLon,
        altitude: balloonAlt,
        detectedAt: new Date(balloon.fetchedAt),
        threatLevel,
        category,
        dramaticReason: getDramaticReason(category, balloonAlt),
        scientificReason: getScientificReason(category, balloonAlt),
        distanceFromRoute: distance,
        severity,
      });
    }
  }

  // Sort by severity (highest first)
  return blames.sort((a, b) => b.severity - a.severity);
}

/**
 * Generate alternate timeline (what would've happened without balloon data)
 */
function generateAlternateTimeline(doomLevel: number): string {
  if (doomLevel < 20) {
    return "Your package would've arrived on time, blissfully unaware of the atmospheric drama unfolding around it.";
  } else if (doomLevel < 40) {
    return "Your package would've been delayed by 2-3 hours, with the carrier blaming 'unforeseen weather conditions' (which we now foresee, thanks to balloons).";
  } else if (doomLevel < 60) {
    return "Your package would've taken a scenic detour through 3 extra states, adding a full day to delivery, while the airline pretended everything was fine.";
  } else if (doomLevel < 80) {
    return "Your package would've been grounded for 48 hours with vague explanations about 'operational issues' (aka: pilots don't like flying through atmospheric chaos).";
  } else {
    return "Your package would've been rerouted through an alternate dimension. Delivery estimate: sometime between tomorrow and the heat death of the universe.";
  }
}

/**
 * Main blame engine: Analyze DHL tracking data and blame balloons
 */
export async function blameTheBalloons(
  trackingData: TrackingResponse
): Promise<BlameChain | null> {
  // Get current location
  const currentLoc = trackingData.currentLocation;

  if (!currentLoc.latitude || !currentLoc.longitude) {
    return null; // Can't blame balloons without coordinates
  }

  // Find nearby balloons
  const culprits = await findNearbyBalloons(
    currentLoc.latitude,
    currentLoc.longitude,
    1000 // 1000km radius
  );

  // Set tracking number for all blames
  culprits.forEach(blame => blame.trackingNumber = trackingData.trackingNumber);

  // Calculate overall doom level
  const doomLevel = culprits.length > 0
    ? Math.min(
        Math.round(
          culprits.slice(0, 5).reduce((sum, b) => sum + b.severity, 0) / Math.min(culprits.length, 5)
        ),
        100
      )
    : 0;

  // Determine overall threat
  const overallThreat: ThreatLevel =
    doomLevel < 20 ? 'PEACEFUL' :
    doomLevel < 40 ? 'TURBULENT' :
    doomLevel < 60 ? 'CHAOTIC' :
    doomLevel < 80 ? 'APOCALYPTIC' : 'DOOMED';

  return {
    packageLocation: {
      city: currentLoc.city,
      latitude: currentLoc.latitude,
      longitude: currentLoc.longitude,
    },
    culpritBalloons: culprits.slice(0, 10), // Top 10 culprits
    overallThreat,
    doomLevel,
    alternateTimeline: generateAlternateTimeline(doomLevel),
  };
}
