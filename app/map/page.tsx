"use client";

import { Suspense } from "react";
import Map, { Marker, Source, Layer } from "react-map-gl/mapbox";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FloatingDock } from "@/components/ui/floating-dock";
import TrackDialog from "@/components/TrackDialog";
import {
  MapPin,
  Clock,
  TrendingUp,
  Loader2,
  Cloud,
  Wind,
  Droplets,
  Gauge,
  House,
  Search,
  BadgeInfo,
  FolderHeart,
  FilePenLine,
  Linkedin,
} from "lucide-react";
import { getWeatherEmoji, getWindDirectionName } from "@/lib/services/weather";
import { AtmosProvider, useAtmos } from "@/context/AtmosContext";
import "mapbox-gl/dist/mapbox-gl.css";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

// Altitude to color mapping
const getAltitudeColor = (altitude: number): string => {
  if (altitude < 1) return "#ef4444"; // red - pending
  if (altitude < 5) return "#f97316"; // orange - low altitude
  if (altitude < 10) return "#eab308"; // yellow - medium
  if (altitude < 15) return "#84cc16"; // lime - high
  if (altitude < 20) return "#22c55e"; // green - very high
  return "#3b82f6"; // blue - delivered
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case "pending":
      return "bg-gray-500";
    case "in_transit":
      return "bg-blue-500";
    case "delivered":
      return "bg-green-500";
    case "failed":
      return "bg-red-500";
    default:
      return "bg-gray-500";
  }
};

function MapPageContent() {
  const {
    setTrackDialogOpen,
    trackingData,
    error,
    mapRef,
    viewState,
    setViewState,
  } = useAtmos();

  const dockItems = [
    {
      title: "Home",
      icon: (
        <House className="h-full w-full text-neutral-500 dark:text-neutral-300" />
      ),
      href: "/",
    },
    {
      title: "Track",
      icon: (
        <Search className="h-full w-full text-neutral-500 dark:text-neutral-300" />
      ),
      onClick: () => setTrackDialogOpen(true),
    },
    {
      title: "About",
      icon: (
        <BadgeInfo className="h-full w-full text-neutral-500 dark:text-neutral-300" />
      ),
      href: "/about",
    },
    {
      title: "Portfolio",
      icon: (
        <FolderHeart className="h-full w-full text-neutral-500 dark:text-neutral-300" />
      ),
      href: "https://lucidjoy.vercel.app/",
    },
    {
      title: "Resume",
      icon: (
        <FilePenLine className="h-full w-full text-neutral-500 dark:text-neutral-300" />
      ),
      href: "https://drive.google.com/file/d/1v6y4h-x0-5pSba4iXBv6ak1mohCixNcM/view?usp=sharing",
    },
    {
      title: "LinkedIn",
      icon: (
        <Linkedin className="h-full w-full text-neutral-500 dark:text-neutral-300" />
      ),
      href: "https://www.linkedin.com/in/lucidjoy/",
    },
  ];

  // Create GeoJSON for trajectory line
  const trajectoryGeoJSON = trackingData
    ? {
        type: "Feature" as const,
        properties: {},
        geometry: {
          type: "LineString" as const,
          coordinates: trackingData.timeline.map((event) => [
            event.location.longitude,
            event.location.latitude,
          ]),
        },
      }
    : null;

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-100">
      {/* Floating Dock */}
      <FloatingDock items={dockItems} />

      {/* Track Dialog */}
      <TrackDialog />

      <div className="flex-1 relative">
        {/* Map */}
        <Map
          ref={mapRef}
          mapboxAccessToken={MAPBOX_TOKEN}
          {...viewState}
          onMove={(evt) => setViewState(evt.viewState)}
          style={{ width: "100%", height: "100%" }}
          fadeDuration={10}
          mapStyle={"mapbox://styles/mapbox/light-v11"}
        >
          {/* Trajectory Line */}
          {trajectoryGeoJSON &&
            trackingData &&
            trackingData.timeline.length > 1 && (
              <Source id="trajectory" type="geojson" data={trajectoryGeoJSON}>
                <Layer
                  id="trajectory-line"
                  type="line"
                  paint={{
                    "line-color": "#3b82f6",
                    "line-width": 3,
                    "line-opacity": 0.6,
                  }}
                />
              </Source>
            )}

          {/* Timeline Markers */}
          {trackingData?.timeline.map((event, index) => (
            <Marker
              key={index}
              longitude={event.location.longitude}
              latitude={event.location.latitude}
              anchor="center"
            >
              <div className="group relative">
                <div
                  className="w-3 h-3 rounded-full border-2 border-white shadow-lg hover:scale-150 hover:border-4 transition-all duration-200 cursor-pointer"
                  style={{
                    backgroundColor: getAltitudeColor(event.location.altitude),
                  }}
                />
                <div className="absolute -top-16 left-1/2 -translate-x-1/2 whitespace-nowrap bg-white/95 backdrop-blur-md text-slate-800 px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-lg border border-slate-200">
                  <div className="text-center">
                    <p className="font-medium">
                      {event.location.altitude.toFixed(1)} km
                    </p>
                    <p className="text-slate-500 text-[10px]">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            </Marker>
          ))}

          {/* Current Location Marker */}
          {trackingData && (
            <Marker
              longitude={trackingData.currentLocation.longitude}
              latitude={trackingData.currentLocation.latitude}
              anchor="bottom"
            >
              <div className="relative group">
                <div
                  className="text-5xl animate-bounce"
                  style={{ animationDuration: "3s" }}
                >
                  🎈
                </div>
                <div className="absolute -top-16 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-800 backdrop-blur-md text-white px-3 py-2 rounded-lg text-sm font-semibold shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 border border-slate-700">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    {trackingData.currentLocation.altitude.toFixed(1)} km
                  </div>
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800  rotate-45" />
                </div>
              </div>
            </Marker>
          )}
        </Map>

        {/* Info Panel */}
        {trackingData && (
          <Card className="absolute top-4 right-4 w-96 max-h-[calc(100vh-8rem)] glass backdrop-blur-xl border-slate-200 shadow-2xl animate-slideInRight overflow-hidden flex flex-col">
            <div className="p-6 space-y-6 overflow-y-auto apple-scrollbar flex-1">
              {/* Header */}
              <div className="space-y-3 pb-4 border-b border-slate-200">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  {trackingData.trackingNumber}
                </h2>
                <Badge
                  className={`${getStatusColor(
                    trackingData.status
                  )} animate-fadeIn px-3 py-1 text-xs font-semibold`}
                >
                  {trackingData.status.replace("_", " ").toUpperCase()}
                </Badge>
              </div>

              {/* Current Location */}
              <div
                className="space-y-3 animate-fadeIn"
                style={{ animationDelay: "100ms" }}
              >
                <div className="flex items-center gap-2 text-slate-700">
                  <MapPin className="w-4 h-4" />
                  <h3 className="text-sm font-semibold">Current Location</h3>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 space-y-2 hover:bg-slate-100 transition-colors border border-slate-200">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Latitude</span>
                    <span className="text-slate-800 font-mono">
                      {trackingData.currentLocation.latitude.toFixed(4)}°
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Longitude</span>
                    <span className="text-slate-800 font-mono">
                      {trackingData.currentLocation.longitude.toFixed(4)}°
                    </span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t border-slate-200">
                    <span className="text-slate-600 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      Altitude
                    </span>
                    <span className="text-blue-600 font-bold">
                      {trackingData.currentLocation.altitude.toFixed(2)} km
                    </span>
                  </div>
                </div>
              </div>

              {/* Weather Conditions */}
              {trackingData.weather && (
                <div
                  className="space-y-3 animate-fadeIn"
                  style={{ animationDelay: "200ms" }}
                >
                  <div className="flex items-center gap-2 text-slate-700">
                    <Cloud className="w-4 h-4" />
                    <h3 className="text-sm font-semibold">
                      Atmospheric Conditions
                    </h3>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-4 space-y-3 hover:from-blue-100 hover:to-cyan-100 transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-4xl">
                          {getWeatherEmoji(trackingData.weather.icon)}
                        </span>
                        <div>
                          <p className="text-lg font-bold text-slate-800">
                            {trackingData.weather.temperature.toFixed(1)}°C
                          </p>
                          <p className="text-xs text-slate-600 capitalize">
                            {trackingData.weather.description}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-blue-200">
                      <div className="flex items-center gap-2 text-xs">
                        <Wind className="w-3 h-3 text-blue-600" />
                        <div>
                          <p className="text-slate-600">Wind</p>
                          <p className="text-slate-800 font-medium">
                            {trackingData.weather.windSpeed.toFixed(1)} m/s{" "}
                            {getWindDirectionName(
                              trackingData.weather.windDirection
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <Droplets className="w-3 h-3 text-blue-600" />
                        <div>
                          <p className="text-slate-600">Humidity</p>
                          <p className="text-slate-800 font-medium">
                            {trackingData.weather.humidity}%
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <Gauge className="w-3 h-3 text-blue-600" />
                        <div>
                          <p className="text-slate-600">Pressure</p>
                          <p className="text-slate-800 font-medium">
                            {trackingData.weather.pressure} hPa
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <Cloud className="w-3 h-3 text-blue-600" />
                        <div>
                          <p className="text-slate-600">Clouds</p>
                          <p className="text-slate-800 font-medium">
                            {trackingData.weather.clouds}%
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Estimated Delivery */}
              {trackingData.estimatedDelivery && (
                <div
                  className="space-y-3 animate-fadeIn"
                  style={{ animationDelay: "250ms" }}
                >
                  <div className="flex items-center gap-2 text-slate-700">
                    <Clock className="w-4 h-4" />
                    <h3 className="text-sm font-semibold">
                      Estimated Delivery
                    </h3>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 hover:bg-green-100 transition-colors">
                    <p className="text-sm text-slate-800">
                      {new Date(
                        trackingData.estimatedDelivery
                      ).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}

              {/* Timeline */}
              <div
                className="space-y-3 animate-fadeIn"
                style={{ animationDelay: "300ms" }}
              >
                <h3 className="text-sm font-semibold text-slate-700">
                  Timeline
                </h3>
                <div className="space-y-3">
                  {trackingData.timeline.map((event, index) => (
                    <div
                      key={index}
                      className="group relative pl-4 pb-3 border-l-2 hover:border-l-4 transition-all duration-200 cursor-pointer"
                      style={{
                        borderColor: getAltitudeColor(event.location.altitude),
                        animationDelay: `${400 + index * 50}ms`,
                      }}
                    >
                      <div
                        className="absolute -left-2 top-0 w-4 h-4 rounded-full border-2 border-white group-hover:scale-125 transition-transform"
                        style={{
                          backgroundColor: getAltitudeColor(
                            event.location.altitude
                          ),
                        }}
                      />
                      <p className="text-sm font-medium text-slate-800 group-hover:text-blue-600 transition-colors">
                        {event.description}
                      </p>
                      <p className="text-xs text-slate-600 mt-1">
                        {new Date(event.timestamp).toLocaleString()}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        {event.location.altitude.toFixed(1)} km
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Altitude Legend */}
              <div
                className="pt-4 border-t border-slate-200 animate-fadeIn"
                style={{ animationDelay: "400ms" }}
              >
                <h3 className="text-xs font-semibold mb-3 text-slate-600">
                  Altitude Legend
                </h3>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="flex flex-col items-center gap-1 p-2 bg-red-50 rounded-lg hover:bg-red-100 transition-colors border border-red-200">
                    <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-slate-600 text-center">&lt;1 km</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 p-2 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors border border-yellow-200">
                    <div
                      className="w-3 h-3 rounded-full bg-yellow-500 animate-pulse"
                      style={{ animationDelay: "200ms" }}
                    />
                    <span className="text-slate-600 text-center">5-10 km</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 p-2 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors border border-blue-200">
                    <div
                      className="w-3 h-3 rounded-full bg-blue-500 animate-pulse"
                      style={{ animationDelay: "400ms" }}
                    />
                    <span className="text-slate-600 text-center">
                      &gt;20 km
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Error Message */}
        {error && (
          <Card className="absolute top-4 right-4 p-4 w-80 bg-red-50 backdrop-blur-xl border-red-300 text-red-800 animate-shake">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse mt-1" />
              <div>
                <p className="text-sm font-semibold">Error</p>
                <p className="text-xs mt-1">{error}</p>
              </div>
            </div>
          </Card>
        )}
      </div>

      <style jsx global>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes shake {
          0%,
          100% {
            transform: translateX(0);
          }
          10%,
          30%,
          50%,
          70%,
          90% {
            transform: translateX(-5px);
          }
          20%,
          40%,
          60%,
          80% {
            transform: translateX(5px);
          }
        }

        .animate-slideInRight {
          animation: slideInRight 0.4s ease-out;
        }

        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
          opacity: 0;
        }

        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }

        /* Apple-style Scrollbar */
        .apple-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(148, 163, 184, 0.3) transparent;
        }

        .apple-scrollbar::-webkit-scrollbar {
          width: 8px;
        }

        .apple-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }

        .apple-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.3);
          border-radius: 10px;
          border: 2px solid transparent;
          background-clip: padding-box;
        }

        .apple-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(148, 163, 184, 0.5);
          border-radius: 10px;
          border: 2px solid transparent;
          background-clip: padding-box;
        }

        .apple-scrollbar::-webkit-scrollbar-thumb:active {
          background: rgba(148, 163, 184, 0.7);
        }

        /* Hide scrollbar when not scrolling (auto-hide behavior) */
        .apple-scrollbar:not(:hover)::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.2);
        }
      `}</style>
    </div>
  );
}

export default function MapPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-100">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-slate-700 mx-auto mb-4" />
            <p className="text-slate-800 text-lg">Loading map...</p>
          </div>
        </div>
      }
    >
      <AtmosProvider>
        <MapPageContent />
      </AtmosProvider>
    </Suspense>
  );
}
