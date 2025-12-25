/**
 * Dynamic geocoding service with Mapbox API
 *
 * Uses Mapbox Geocoding API (free tier: 600 requests/month) for city coordinate lookup
 * Falls back to static mapping if API fails or is unavailable
 * Caches results in-memory to minimize API calls
 */

interface CityCoordinates {
  latitude: number;
  longitude: number;
}

// In-memory cache for geocoding results (30 min TTL)
const geocodeCache = new Map<string, { coords: CityCoordinates | null; timestamp: number }>();
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

// Fallback static mapping for major cities (used if API fails)
const CITY_COORDINATES_FALLBACK: Record<string, CityCoordinates> = {
  // Europe
  'AARHUS': { latitude: 56.1629, longitude: 10.2039 },
  'BILLUND': { latitude: 55.7403, longitude: 9.1178 },
  'LEIPZIG': { latitude: 51.3397, longitude: 12.3731 },
  'LONDON-HEATHROW': { latitude: 51.4700, longitude: -0.4543 },
  'LONDON': { latitude: 51.5074, longitude: -0.1278 },
  'EAST MIDLANDS': { latitude: 52.8311, longitude: -1.3278 },
  'PARIS': { latitude: 48.8566, longitude: 2.3522 },
  'BERLIN': { latitude: 52.5200, longitude: 13.4050 },
  'MUNICH': { latitude: 48.1351, longitude: 11.5820 },
  'FRANKFURT': { latitude: 50.1109, longitude: 8.6821 },
  'BRUSSELS': { latitude: 50.8503, longitude: 4.3517 },
  'AMSTERDAM': { latitude: 52.3676, longitude: 4.9041 },

  // USA
  'LOS ANGELES GATEWAY': { latitude: 33.9416, longitude: -118.4085 },
  'LOS ANGELES': { latitude: 34.0522, longitude: -118.2437 },
  'SAN DIEGO': { latitude: 32.7157, longitude: -117.1611 },
  'SOLANA BEACH': { latitude: 32.9911, longitude: -117.2714 },
  'SOUTH SAN DIEGO': { latitude: 32.6900, longitude: -117.1570 },
  'NEW YORK': { latitude: 40.7128, longitude: -74.0060 },
  'CHICAGO': { latitude: 41.8781, longitude: -87.6298 },
  'ATLANTA': { latitude: 33.7490, longitude: -84.3880 },
  'MIAMI': { latitude: 25.7617, longitude: -80.1918 },
  'DENVER': { latitude: 39.7392, longitude: -104.9903 },
  'SEATTLE': { latitude: 47.6062, longitude: -122.3321 },

  // Asia
  'SINGAPORE': { latitude: 1.3521, longitude: 103.8198 },
  'HONG KONG': { latitude: 22.3193, longitude: 114.1694 },
  'TOKYO': { latitude: 35.6762, longitude: 139.6503 },
  'DUBAI': { latitude: 25.2048, longitude: 55.2708 },
  'BANGKOK': { latitude: 13.7563, longitude: 100.5018 },
  'SHANGHAI': { latitude: 31.2304, longitude: 121.4737 },
};

/**
 * Extract city name and country from DHL address string
 * DHL format: "CITY NAME - State/Province - COUNTRY"
 */
function extractCityAndCountry(addressLocality: string): { city: string; country?: string } {
  const parts = addressLocality.split(' - ');
  const city = parts[0].trim();
  const country = parts.length > 2 ? parts[2].trim() : undefined;
  return { city, country };
}

/**
 * Country code mapping for Mapbox (ISO 3166-1 alpha-2)
 */
const COUNTRY_CODE_MAP: Record<string, string> = {
  'GB': 'GB',
  'UK': 'GB',
  'US': 'US',
  'USA': 'US',
  'DE': 'DE',
  'FR': 'FR',
  'NL': 'NL',
  'BE': 'BE',
  'DK': 'DK',
  'SG': 'SG',
  'HK': 'HK',
  'TH': 'TH',
  'AE': 'AE',
  'JP': 'JP',
  'CN': 'CN',
};

/**
 * Fetch coordinates from Mapbox Geocoding API with country bias
 */
async function fetchFromMapbox(
  cityName: string,
  countryCode?: string
): Promise<CityCoordinates | null> {
  const apiKey = process.env.MAPBOX_API_KEY;

  if (!apiKey) {
    console.warn('MAPBOX_API_KEY not configured, falling back to static mapping');
    return null;
  }

  try {
    const query = encodeURIComponent(cityName);

    // Use country bias if provided to disambiguate results
    let url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?access_token=${apiKey}&limit=1&types=place`;

    if (countryCode) {
      const isoCode = COUNTRY_CODE_MAP[countryCode] || countryCode;
      url += `&country=${isoCode}`;
    }

    const response = await fetch(url);

    if (!response.ok) {
      console.warn(`Mapbox API error: ${response.status}`);
      return null;
    }

    const data = await response.json();

    if (!data.features || data.features.length === 0) {
      console.warn(`Mapbox: No results for city "${cityName}"${countryCode ? ` in ${countryCode}` : ''}`);
      return null;
    }

    const [longitude, latitude] = data.features[0].center;
    return { latitude, longitude };
  } catch (error) {
    console.warn(`Mapbox API error for "${cityName}":`, error instanceof Error ? error.message : error);
    return null;
  }
}

/**
 * Get coordinates for a city using Mapbox API with fallback
 * Strategy: Cache → Mapbox API → Static fallback mapping
 *
 * @param addressLocality - DHL address in format "CITY - STATE - COUNTRY" or just city name
 * @param countryCode - Optional country code to disambiguate (overrides parsed country)
 */
export async function getCityCoordinates(
  addressLocality: string,
  countryCode?: string
): Promise<CityCoordinates | null> {
  const { city: cityName, country: parsedCountry } = extractCityAndCountry(addressLocality);
  const country = countryCode || parsedCountry;

  // Cache key includes country to avoid collisions (e.g., "EAST MIDLANDS:GB" vs "EAST MIDLANDS:US")
  const cacheKey = country ? `${cityName}:${country}` : cityName;

  // Check cache first
  const cached = geocodeCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.coords;
  }

  // Try Mapbox API with country bias
  const mapboxCoords = await fetchFromMapbox(cityName, country);
  if (mapboxCoords) {
    geocodeCache.set(cacheKey, { coords: mapboxCoords, timestamp: Date.now() });
    return mapboxCoords;
  }

  // Fallback to static mapping
  const fallbackCoords = CITY_COORDINATES_FALLBACK[cityName] || null;
  if (fallbackCoords) {
    geocodeCache.set(cacheKey, { coords: fallbackCoords, timestamp: Date.now() });
    return fallbackCoords;
  }

  // Last resort: fuzzy match in fallback mapping
  for (const [knownCity, coords] of Object.entries(CITY_COORDINATES_FALLBACK)) {
    if (knownCity.includes(cityName) || cityName.includes(knownCity)) {
      geocodeCache.set(cacheKey, { coords, timestamp: Date.now() });
      return coords;
    }
  }

  console.warn(`No coordinates found for city: ${addressLocality}${country ? ` (${country})` : ''}`);
  geocodeCache.set(cacheKey, { coords: null, timestamp: Date.now() });
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
