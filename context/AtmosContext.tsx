"use client";

import {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  ReactNode,
  Dispatch,
  SetStateAction,
  RefObject,
} from "react";
import { useSearchParams } from "next/navigation";
import type { MapRef } from "react-map-gl/mapbox";
import type { TrackingResponse } from "@/lib/types";

interface ViewState {
  longitude: number;
  latitude: number;
  zoom: number;
}

interface AtmosContextType {
  // Dialog state
  trackDialogOpen: boolean;
  setTrackDialogOpen: Dispatch<SetStateAction<boolean>>;

  // Tracking state
  trackingNumber: string;
  setTrackingNumber: Dispatch<SetStateAction<string>>;
  trackingData: TrackingResponse | null;
  setTrackingData: Dispatch<SetStateAction<TrackingResponse | null>>;
  error: string | null;
  setError: Dispatch<SetStateAction<string | null>>;
  loading: boolean;
  setLoading: Dispatch<SetStateAction<boolean>>;

  // Map state
  mapRef: RefObject<MapRef | null>;
  viewState: ViewState;
  setViewState: Dispatch<SetStateAction<ViewState>>;

  // Actions
  fetchTrackingData: (tracking: string) => Promise<void>;
  handleTrack: () => void;
}

const AtmosContext = createContext<AtmosContextType | undefined>(undefined);

export const AtmosProvider = ({ children }: { children: ReactNode }) => {
  const searchParams = useSearchParams();
  const mapRef = useRef<MapRef>(null);

  // Dialog state
  const [trackDialogOpen, setTrackDialogOpen] = useState(false);

  // Tracking state
  const [trackingNumber, setTrackingNumber] = useState(
    searchParams.get("tracking") || ""
  );
  const [trackingData, setTrackingData] = useState<TrackingResponse | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Map state
  const [viewState, setViewState] = useState({
    longitude: -98.5795,
    latitude: 39.8283,
    zoom: 3,
  });

  // Fetch tracking data function
  const fetchTrackingData = async (tracking: string) => {
    if (!tracking) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/track/${tracking}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to fetch tracking data");
        setTrackingData(null);
      } else {
        setTrackingData(data);
      }
    } catch (err) {
      setError("Failed to fetch tracking data");
      setTrackingData(null);
    } finally {
      setLoading(false);
    }
  };

  // Handle track action
  const handleTrack = () => {
    if (!trackingNumber) return;
    fetchTrackingData(trackingNumber);
    setTrackDialogOpen(false);
  };

  // Auto-fetch on mount if tracking param exists
  useEffect(() => {
    const tracking = searchParams.get("tracking");
    if (tracking) {
      fetchTrackingData(tracking);
    }
  }, [searchParams]);

  // Auto-fly to location when tracking data updates
  useEffect(() => {
    if (trackingData?.currentLocation && mapRef.current) {
      mapRef.current.flyTo({
        center: [
          trackingData.currentLocation.longitude,
          trackingData.currentLocation.latitude,
        ],
        zoom: 3,
        duration: 2000,
        essential: true,
      });
    }
  }, [trackingData]);

  return (
    <AtmosContext.Provider
      value={{
        // Dialog state
        trackDialogOpen,
        setTrackDialogOpen,

        // Tracking state
        trackingNumber,
        setTrackingNumber,
        trackingData,
        setTrackingData,
        error,
        setError,
        loading,
        setLoading,

        // Map state
        mapRef,
        viewState,
        setViewState,

        // Actions
        fetchTrackingData,
        handleTrack,
      }}
    >
      {children}
    </AtmosContext.Provider>
  );
};

// Custom hook for using the context
export const useAtmos = (): AtmosContextType => {
  const context = useContext(AtmosContext);
  if (!context) {
    throw new Error("useAtmos must be used within an AtmosProvider");
  }
  return context;
};

export default AtmosContext;
