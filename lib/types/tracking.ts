export type PackageStatus = "pending" | "in_transit" | "delivered" | "failed";

export interface Location {
  latitude: number;
  longitude: number;
  altitude: number;
  timestamp: string;
}

export interface TimelineEvent {
  status: PackageStatus;
  timestamp: string;
  location: Location;
  description: string;
}

export interface PackageMetadata {
  balloonId: string;
  arrayIndex: number;
  snapshotHour: number;
  origin?: string;
  destination?: string;
}

export interface WeatherData {
  temperature: number; // Celsius
  feelsLike: number;
  pressure: number; // hPa
  humidity: number; // %
  windSpeed: number; // m/s
  windDirection: number; // degrees
  description: string; // e.g., "clear sky"
  icon: string; // weather icon code
  clouds: number; // % cloud coverage
}

export interface TrackingResponse {
  trackingNumber: string;
  status: PackageStatus;
  currentLocation: Location;
  timeline: TimelineEvent[];
  estimatedDelivery: string | null;
  metadata: PackageMetadata;
  weather?: WeatherData; // Weather at balloon location
}

export interface TrackingError {
  error: string;
  trackingNumber?: string;
  message?: string;
}
