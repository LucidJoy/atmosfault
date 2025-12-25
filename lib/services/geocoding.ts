/**
 * Simple geocoding service for DHL tracking visualization
 *
 * Maps city names to coordinates for map display
 * In production, this would use a proper geocoding API (Google Maps, Mapbox, etc.)
 */

interface CityCoordinates {
  latitude: number;
  longitude: number;
}

// Static mapping of major cities
const CITY_COORDINATES: Record<string, CityCoordinates> = {
  // Europe
  'AARHUS': { latitude: 56.1629, longitude: 10.2039 },
  'BILLUND': { latitude: 55.7403, longitude: 9.1178 },
  'LEIPZIG': { latitude: 51.3397, longitude: 12.3731 },
  'LONDON-HEATHROW': { latitude: 51.4700, longitude: -0.4543 },
  'LONDON': { latitude: 51.5074, longitude: -0.1278 },
  'EAST MIDLANDS': { latitude: 52.8311, longitude: -1.3278 },
  'PARIS': { latitude: 48.8566, longitude: 2.3522 },
  'BERLIN': { latitude: 52.5200, longitude: 13.4050 },

  // USA
  'LOS ANGELES GATEWAY': { latitude: 33.9416, longitude: -118.4085 },
  'LOS ANGELES': { latitude: 34.0522, longitude: -118.2437 },
  'SAN DIEGO': { latitude: 32.7157, longitude: -117.1611 },
  'SOLANA BEACH': { latitude: 32.9911, longitude: -117.2714 },
  'SOUTH SAN DIEGO': { latitude: 32.6900, longitude: -117.1570 },
  'NEW YORK': { latitude: 40.7128, longitude: -74.0060 },

  // Asia
  'SINGAPORE': { latitude: 1.3521, longitude: 103.8198 },
  'HONG KONG': { latitude: 22.3193, longitude: 114.1694 },
  'TOKYO': { latitude: 35.6762, longitude: 139.6503 },
  'DUBAI': { latitude: 25.2048, longitude: 55.2708 },
};

/**
 * Extract city name from DHL address string
 * DHL format: "CITY NAME - State/Province - COUNTRY"
 */
function extractCityName(addressLocality: string): string {
  // Remove extra parts after " - "
  const parts = addressLocality.split(' - ');
  return parts[0].trim().toUpperCase();
}

/**
 * Get coordinates for a city
 * Returns approximate coordinates or null if city not found
 */
export function getCityCoordinates(addressLocality: string): CityCoordinates | null {
  const cityName = extractCityName(addressLocality);

  // Direct lookup
  if (CITY_COORDINATES[cityName]) {
    return CITY_COORDINATES[cityName];
  }

  // Fuzzy match - check if any known city contains the search term
  for (const [knownCity, coords] of Object.entries(CITY_COORDINATES)) {
    if (knownCity.includes(cityName) || cityName.includes(knownCity)) {
      return coords;
    }
  }

  // Default: return null if no match
  // In production, would call geocoding API here
  console.warn(`No coordinates found for city: ${addressLocality}`);
  return null;
}

/**
 * Add coordinates to all locations in a tracking response
 * This enriches DHL data with geographic coordinates for map visualization
 */
export function enrichLocationsWithCoordinates<T extends { city: string }>(
  locations: T[]
): (T & { latitude?: number; longitude?: number })[] {
  return locations.map((location) => {
    const coords = getCityCoordinates(location.city);
    return {
      ...location,
      latitude: coords?.latitude,
      longitude: coords?.longitude,
    };
  });
}
