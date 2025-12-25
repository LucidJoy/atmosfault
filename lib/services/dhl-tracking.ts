import { getShipmentTracking, DHLApiResponse, DHLEvent, DHLShipment } from './dhl';
import { getCityCoordinates } from './geocoding';
import { blameTheBalloons } from './blame-engine';
import type { TrackingResponse, PackageStatus, Location, TimelineEvent } from '../types/dhl-tracking';

/**
 * Map DHL status codes to our application status
 */
function mapDHLStatus(statusCode: string): PackageStatus {
  switch (statusCode.toLowerCase()) {
    case 'delivered':
      return 'delivered';
    case 'transit':
      return 'in_transit';
    case 'failure':
      return 'failed';
    case 'pending':
      return 'pending';
    default:
      // Default to in_transit for unknown codes
      return 'in_transit';
  }
}

/**
 * Extract location from DHL event with coordinates
 */
function extractLocation(event: DHLEvent): Location {
  const city = event.location?.address?.addressLocality || 'Unknown';
  const countryCode = event.location?.address?.countryCode || 'Unknown';

  // Get coordinates for map visualization
  const coords = getCityCoordinates(city);

  return {
    city,
    country: countryCode,
    countryCode,
    timestamp: event.timestamp,
    latitude: coords?.latitude,
    longitude: coords?.longitude,
  };
}

/**
 * Transform DHL events to timeline events
 */
function buildTimeline(events: DHLEvent[]): TimelineEvent[] {
  // DHL events are already in chronological order (oldest first)
  return events.map((event) => ({
    status: mapDHLStatus(event.statusCode),
    timestamp: event.timestamp,
    location: extractLocation(event),
    description: event.description,
  }));
}

/**
 * Get current/latest location from shipment
 */
function getCurrentLocation(shipment: DHLShipment): Location {
  const latestEvent = shipment.events[0]; // DHL returns newest first
  return extractLocation(latestEvent);
}

/**
 * Estimate delivery date (if not yet delivered)
 */
function getEstimatedDelivery(shipment: DHLShipment): string | null {
  if (shipment.status.statusCode === 'delivered') {
    return shipment.status.timestamp;
  }

  // For active shipments, estimate 2-5 days based on status
  const now = new Date();
  const estimatedDays = shipment.status.statusCode === 'transit' ? 3 : 5;
  now.setDate(now.getDate() + estimatedDays);

  return now.toISOString();
}

/**
 * Main tracking service - transforms DHL API data to our app format
 */
export async function getDHLTrackingInfo(trackingNumber: string): Promise<TrackingResponse | null> {
  // Fetch from DHL (with caching)
  const dhlData = await getShipmentTracking(trackingNumber);

  if (!dhlData || dhlData.shipments.length === 0) {
    return null;
  }

  const shipment = dhlData.shipments[0];

  // Transform to our app's format
  const response: TrackingResponse = {
    trackingNumber: shipment.id,
    status: mapDHLStatus(shipment.status.statusCode),
    currentLocation: getCurrentLocation(shipment),
    origin: {
      city: shipment.origin.address.addressLocality || 'Unknown',
      country: shipment.origin.address.countryCode || 'Unknown',
    },
    destination: {
      city: shipment.destination.address.addressLocality || 'Unknown',
      country: shipment.destination.address.countryCode || 'Unknown',
    },
    timeline: buildTimeline(shipment.events),
    estimatedDelivery: getEstimatedDelivery(shipment),
    metadata: {
      service: shipment.service,
      productName: shipment.details?.product?.productName,
      totalPieces: shipment.details?.totalNumberOfPieces,
    },
  };

  // 🎈 BLAME THE BALLOONS! 🎈
  // Find WindBorne balloons near the package route and blame them for delays
  try {
    const blameData = await blameTheBalloons(response);
    if (blameData) {
      response.blame = blameData;
      console.log(`🎈 Found ${blameData.culpritBalloons.length} culprit balloons! Doom level: ${blameData.doomLevel}`);
    }
  } catch (error) {
    console.error('Failed to blame balloons (they got away this time):', error);
    // Non-critical - continue without blame data
  }

  return response;
}
