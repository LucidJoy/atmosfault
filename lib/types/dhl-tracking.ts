/**
 * DHL-based tracking response types with AtmosFault blame data
 * Maps DHL API data to our application's tracking interface
 */

import type { BlameChain } from '../services/blame-engine';

export type PackageStatus = "pending" | "in_transit" | "delivered" | "failed" | "on_hold";

export interface Location {
  city: string;
  country: string;
  countryCode: string;
  timestamp: string;
  // For map visualization - will be populated via geocoding or static mapping
  latitude?: number;
  longitude?: number;
}

export interface TimelineEvent {
  status: PackageStatus;
  timestamp: string;
  location: Location;
  description: string;
}

export interface PackageMetadata {
  service: string;
  productName?: string;
  totalPieces?: number;
  pieceIds?: string[];
}

export interface TrackingResponse {
  trackingNumber: string;
  status: PackageStatus;
  currentLocation: Location;
  origin: {
    city: string;
    country: string;
  };
  destination: {
    city: string;
    country: string;
  };
  timeline: TimelineEvent[];
  estimatedDelivery: string | null;
  metadata: PackageMetadata;
  // AtmosFault blame data
  blame?: BlameChain;
}

export interface TrackingError {
  error: string;
  trackingNumber?: string;
  message?: string;
}
