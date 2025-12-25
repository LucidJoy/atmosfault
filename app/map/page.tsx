"use client";

import { Suspense, useState } from "react";
import Map, { Marker, Source, Layer } from "react-map-gl/mapbox";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FloatingDock } from "@/components/ui/floating-dock";
import TrackDialog from "@/components/TrackDialog";
import {
  MapPin,
  Clock,
  Package,
  Loader2,
  House,
  Search,
  BadgeInfo,
  FolderHeart,
  FilePenLine,
  Linkedin,
  AlertTriangle,
  Zap,
  Skull,
  Wind,
  RotateCw,
} from "lucide-react";
import { AtmosProvider, useAtmos } from "@/context/AtmosContext";
import { getWeatherEmoji } from "@/lib/services/weather";
import "mapbox-gl/dist/mapbox-gl.css";
import { toast } from "sonner";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

// Threat level to color/style mapping
const getThreatLevelColor = (level: string): string => {
  switch (level) {
    case "PEACEFUL":
      return "#22c55e"; // green
    case "TURBULENT":
      return "#eab308"; // yellow
    case "CHAOTIC":
      return "#f97316"; // orange
    case "APOCALYPTIC":
      return "#ef4444"; // red
    case "DOOMED":
      return "#7c2d12"; // dark red
    default:
      return "#6b7280"; // gray
  }
};

const getThreatLevelBadge = (level: string): string => {
  switch (level) {
    case "PEACEFUL":
      return "bg-green-500";
    case "TURBULENT":
      return "bg-yellow-500";
    case "CHAOTIC":
      return "bg-orange-500";
    case "APOCALYPTIC":
      return "bg-red-500";
    case "DOOMED":
      return "bg-red-900";
    default:
      return "bg-gray-500";
  }
};

const getThreatIcon = (level: string) => {
  switch (level) {
    case "PEACEFUL":
      return null;
    case "TURBULENT":
      return <Wind className="w-4 h-4" />;
    case "CHAOTIC":
      return <AlertTriangle className="w-4 h-4" />;
    case "APOCALYPTIC":
      return <Zap className="w-4 h-4" />;
    case "DOOMED":
      return <Skull className="w-4 h-4" />;
    default:
      return null;
  }
};

// Status to color mapping
const getStatusColor = (status: string): string => {
  switch (status) {
    case "pending":
      return "#6b7280"; // gray
    case "in_transit":
      return "#3b82f6"; // blue
    case "delivered":
      return "#22c55e"; // green
    case "failed":
      return "#ef4444"; // red
    case "on_hold":
      return "#f59e0b"; // amber
    default:
      return "#6b7280"; // gray
  }
};

const getStatusBadgeColor = (status: string): string => {
  switch (status) {
    case "pending":
      return "bg-gray-500";
    case "in_transit":
      return "bg-blue-500";
    case "delivered":
      return "bg-green-500";
    case "failed":
      return "bg-red-500";
    case "on_hold":
      return "bg-amber-500";
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

  const [isSyncing, setIsSyncing] = useState(false);
  // const router = useRouter();

  const baseLinks = [
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
    // {
    //   title: "Resume",
    //   icon: (
    //     <FilePenLine className="h-full w-full text-neutral-500 dark:text-neutral-300" />
    //   ),
    //   href: "https://drive.google.com/file/d/1v6y4h-x0-5pSba4iXBv6ak1mohCixNcM/view?usp=sharing",
    // },
    {
      title: "LinkedIn",
      icon: (
        <Linkedin className="h-full w-full text-neutral-500 dark:text-neutral-300" />
      ),
      href: "https://www.linkedin.com/in/lucidjoy/",
    },
  ];

  const handleSyncBalloons = async () => {
    if (isSyncing) return;

    setIsSyncing(true);
    const toastId = toast.loading("Syncing WindBorne balloon data...");

    try {
      const response = await fetch("/api/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(
          `Balloons synced! ${data.totalRecords} atmospheric snapshots captured`,
          {
            id: toastId,
          }
        );
      } else {
        toast.error(data.error || "Failed to sync balloon data", {
          id: toastId,
        });
      }
    } catch (error) {
      toast.error("Failed to sync balloon data. Please try again.", {
        id: toastId,
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Filter timeline events that have coordinates for map visualization
  const eventsWithCoords =
    trackingData?.timeline.filter(
      (event) =>
        event.location.longitude != null && event.location.latitude != null
    ) || [];

  // Create GeoJSON for trajectory line
  const trajectoryGeoJSON =
    eventsWithCoords.length > 1
      ? {
          type: "Feature" as const,
          properties: {},
          geometry: {
            type: "LineString" as const,
            coordinates: eventsWithCoords.map((event) => [
              event.location.longitude!,
              event.location.latitude!,
            ]),
          },
        }
      : null;

  const links = [
    ...baseLinks,
    {
      title: "Sync Balloons",
      icon: (
        <RotateCw
          className={`h-full w-full text-neutral-500 dark:text-neutral-300 ${
            isSyncing ? "animate-spin" : ""
          }`}
        />
      ),
      onClick: handleSyncBalloons,
    },
  ];

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-100">
      {/* Floating Dock */}
      <FloatingDock items={links} />

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
          {trajectoryGeoJSON && (
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
          {eventsWithCoords.map((event, index) => (
            <Marker
              key={index}
              longitude={event.location.longitude!}
              latitude={event.location.latitude!}
              anchor="center"
            >
              <div className="group relative">
                <div
                  className="w-3 h-3 rounded-full border-2 border-white shadow-lg hover:scale-150 hover:border-4 transition-all duration-200 cursor-pointer"
                  style={{
                    backgroundColor: getStatusColor(event.status),
                  }}
                />
                <div className="absolute -top-16 left-1/2 -translate-x-1/2 whitespace-nowrap bg-white/95 backdrop-blur-md text-slate-800 px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-lg border border-slate-200 z-10">
                  <div className="text-center">
                    <p className="font-medium">{event.location.city}</p>
                    <p className="text-slate-500 text-[10px]">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            </Marker>
          ))}

          {/* Current Location Marker */}
          {trackingData &&
            trackingData.currentLocation.longitude &&
            trackingData.currentLocation.latitude && (
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
                    📦
                  </div>
                  <div className="absolute -top-16 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-800 backdrop-blur-md text-white px-3 py-2 rounded-lg text-sm font-semibold shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 border border-slate-700 z-10">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      {trackingData.currentLocation.city}
                    </div>
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 rotate-45" />
                  </div>
                </div>
              </Marker>
            )}

          {/* Culprit Balloon Markers */}
          {trackingData?.blame?.culpritBalloons
            .slice(0, 5)
            .map((balloon, index) => (
              <Marker
                key={balloon.balloonId}
                longitude={balloon.longitude}
                latitude={balloon.latitude}
                anchor="center"
              >
                <div className="group relative">
                  <div
                    className="text-3xl opacity-80 hover:opacity-100 transition-opacity cursor-pointer"
                    style={{
                      filter: `hue-rotate(${balloon.severity * 3.6}deg)`,
                      animation: `float ${
                        3 + index * 0.5
                      }s ease-in-out infinite`,
                    }}
                  >
                    🎈
                  </div>
                  <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-48 bg-red-900/95 backdrop-blur-md text-white px-3 py-2 rounded-lg text-xs font-semibold shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 border border-red-700 z-20">
                    <p className="font-bold mb-1">CULPRIT DETECTED</p>
                    <p className="text-[10px] leading-tight">
                      {balloon.balloonId}
                    </p>
                    <p className="text-[10px] text-red-200 mt-1">
                      Severity: {balloon.severity}/100
                    </p>
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-red-900 rotate-45" />
                  </div>
                </div>
              </Marker>
            ))}
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
                  className={`${getStatusBadgeColor(
                    trackingData.status
                  )} animate-fadeIn px-3 py-1 text-xs font-semibold`}
                >
                  {trackingData.status.replace("_", " ").toUpperCase()}
                </Badge>
              </div>

              {/* Origin & Destination */}
              <div
                className="space-y-3 animate-fadeIn"
                style={{ animationDelay: "100ms" }}
              >
                <div className="flex items-center gap-2 text-slate-700">
                  <MapPin className="w-4 h-4" />
                  <h3 className="text-sm font-semibold">Route</h3>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 space-y-2 hover:bg-slate-100 transition-colors border border-slate-200">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">From</span>
                    <span className="text-slate-800 font-medium">
                      {trackingData.origin.city}, {trackingData.origin.country}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">To</span>
                    <span className="text-slate-800 font-medium">
                      {trackingData.destination.city},{" "}
                      {trackingData.destination.country}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t border-slate-200">
                    <span className="text-slate-600">Current</span>
                    <span className="text-blue-600 font-bold">
                      {trackingData.currentLocation.city}
                    </span>
                  </div>
                </div>
              </div>

              {/* Service Info */}
              {trackingData.metadata && (
                <div
                  className="space-y-3 animate-fadeIn"
                  style={{ animationDelay: "150ms" }}
                >
                  <div className="flex items-center gap-2 text-slate-700">
                    <Package className="w-4 h-4" />
                    <h3 className="text-sm font-semibold">Service Details</h3>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-3 space-y-2 hover:from-blue-100 hover:to-cyan-100 transition-all">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Service</span>
                      <span className="text-slate-800 font-medium capitalize">
                        {trackingData.metadata.service}
                      </span>
                    </div>
                    {trackingData.metadata.productName && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Product</span>
                        <span className="text-slate-800 font-medium">
                          {trackingData.metadata.productName}
                        </span>
                      </div>
                    )}
                    {trackingData.metadata.totalPieces && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Pieces</span>
                        <span className="text-slate-800 font-medium">
                          {trackingData.metadata.totalPieces}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Weather Section */}
              {trackingData.weather && (
                <div
                  className="space-y-3 animate-fadeIn"
                  style={{ animationDelay: "175ms" }}
                >
                  <div className="flex items-center gap-2 text-slate-700">
                    <Wind className="w-4 h-4" />
                    <h3 className="text-sm font-semibold">Current Weather</h3>
                  </div>
                  <div className="bg-gradient-to-br from-sky-50 to-cyan-50 border border-cyan-200 rounded-lg p-4 space-y-3 hover:from-sky-100 hover:to-cyan-100 transition-all">
                    <div className="flex items-center justify-between">
                      <span className="text-3xl">{getWeatherEmoji(trackingData.weather.icon)}</span>
                      <div className="text-right">
                        <p className="text-lg font-bold text-slate-800">
                          {trackingData.weather.temperature.toFixed(1)}°C
                        </p>
                        <p className="text-xs text-slate-600 capitalize">
                          Feels like {trackingData.weather.feelsLike.toFixed(1)}°C
                        </p>
                      </div>
                    </div>
                    <div className="text-sm text-slate-700 capitalize border-t border-cyan-200 pt-3">
                      <p className="font-medium">{trackingData.weather.description}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-white/50 rounded px-2 py-1.5">
                        <span className="text-slate-600">Humidity</span>
                        <p className="font-semibold text-slate-800">
                          {trackingData.weather.humidity}%
                        </p>
                      </div>
                      <div className="bg-white/50 rounded px-2 py-1.5">
                        <span className="text-slate-600">Clouds</span>
                        <p className="font-semibold text-slate-800">
                          {trackingData.weather.clouds}%
                        </p>
                      </div>
                      <div className="bg-white/50 rounded px-2 py-1.5">
                        <span className="text-slate-600">Pressure</span>
                        <p className="font-semibold text-slate-800">
                          {trackingData.weather.pressure} hPa
                        </p>
                      </div>
                      <div className="bg-white/50 rounded px-2 py-1.5">
                        <span className="text-slate-600">Wind</span>
                        <p className="font-semibold text-slate-800">
                          {trackingData.weather.windSpeed.toFixed(1)} m/s
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ATMOSPHERIC BLAME SECTION */}
              {trackingData.blame &&
                trackingData.blame.culpritBalloons.length > 0 && (
                  <div
                    className="space-y-3 animate-fadeIn border-2 border-red-500 rounded-lg p-4"
                    style={{ animationDelay: "175ms" }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-red-700">
                        {getThreatIcon(trackingData.blame.overallThreat)}
                        <h3 className="text-sm font-bold">
                          ATMOSPHERIC BLAME DETECTED
                        </h3>
                      </div>
                      <Badge
                        className={`${getThreatLevelBadge(
                          trackingData.blame.overallThreat
                        )} text-xs font-bold`}
                      >
                        {trackingData.blame.overallThreat}
                      </Badge>
                    </div>

                    {/* Doom Meter */}
                    <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg p-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-semibold text-red-900">
                          DOOM LEVEL
                        </span>
                        <span className="text-lg font-bold text-red-600">
                          {trackingData.blame.doomLevel}/100
                        </span>
                      </div>
                      <div className="w-full bg-red-100 rounded-full h-3 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-orange-500 to-red-600 transition-all duration-1000 animate-pulse"
                          style={{ width: `${trackingData.blame.doomLevel}%` }}
                        />
                      </div>
                    </div>

                    {/* Top Culprit */}
                    {trackingData.blame.culpritBalloons[0] && (
                      <div className="bg-red-900/10 border border-red-300 rounded-lg p-3">
                        <p className="text-xs font-bold text-red-900 mb-2">
                          🎈 PRIMARY CULPRIT
                        </p>
                        <p className="text-xs text-red-800 mb-1 font-mono">
                          {trackingData.blame.culpritBalloons[0].balloonId}
                        </p>
                        <p className="text-xs text-red-700 leading-tight mb-2">
                          {trackingData.blame.culpritBalloons[0].dramaticReason}
                        </p>
                        <details className="text-xs">
                          <summary className="cursor-pointer text-blue-600 hover:text-blue-800 font-medium">
                            Scientific explanation
                          </summary>
                          <p className="text-slate-600 mt-2 leading-tight">
                            {
                              trackingData.blame.culpritBalloons[0]
                                .scientificReason
                            }
                          </p>
                        </details>
                      </div>
                    )}

                    {/* Additional Culprits Count */}
                    {trackingData.blame.culpritBalloons.length > 1 && (
                      <p className="text-xs text-center text-slate-600 font-medium">
                        + {trackingData.blame.culpritBalloons.length - 1} more
                        atmospheric accomplices detected
                      </p>
                    )}

                    {/* Alternate Timeline */}
                    <details className="bg-slate-50 border border-slate-300 rounded-lg p-3">
                      <summary className="cursor-pointer text-xs font-bold text-slate-700">
                        📊 Alternate Timeline (Without Balloon Data)
                      </summary>
                      <p className="text-xs text-slate-600 mt-2 leading-relaxed italic">
                        {trackingData.blame.alternateTimeline}
                      </p>
                    </details>
                  </div>
                )}

              {/* Estimated Delivery */}
              {trackingData.estimatedDelivery && (
                <div
                  className="space-y-3 animate-fadeIn"
                  style={{ animationDelay: "200ms" }}
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
                style={{ animationDelay: "250ms" }}
              >
                <h3 className="text-sm font-semibold text-slate-700">
                  Shipment History
                </h3>
                <div className="space-y-3">
                  {trackingData.timeline.map((event, index) => (
                    <div
                      key={index}
                      className="group relative pl-4 pb-3 border-l-2 hover:border-l-4 transition-all duration-200 cursor-pointer"
                      style={{
                        borderColor: getStatusColor(event.status),
                        animationDelay: `${300 + index * 50}ms`,
                      }}
                    >
                      <div
                        className="absolute -left-2 top-0 w-4 h-4 rounded-full border-2 border-white group-hover:scale-125 transition-transform"
                        style={{
                          backgroundColor: getStatusColor(event.status),
                        }}
                      />
                      <p className="text-sm font-medium text-slate-800 group-hover:text-blue-600 transition-colors">
                        {event.description}
                      </p>
                      <p className="text-xs text-slate-600 mt-1">
                        {new Date(event.timestamp).toLocaleString()}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {event.location.city}, {event.location.country}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status Legend */}
              <div
                className="pt-4 border-t border-slate-200 animate-fadeIn"
                style={{ animationDelay: "300ms" }}
              >
                <h3 className="text-xs font-semibold mb-3 text-slate-600">
                  Status Legend
                </h3>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="flex flex-col items-center gap-1 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200">
                    <div className="w-3 h-3 rounded-full bg-gray-500 animate-pulse" />
                    <span className="text-slate-600 text-center">Pending</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 p-2 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors border border-blue-200">
                    <div
                      className="w-3 h-3 rounded-full bg-blue-500 animate-pulse"
                      style={{ animationDelay: "100ms" }}
                    />
                    <span className="text-slate-600 text-center">
                      In Transit
                    </span>
                  </div>
                  <div className="flex flex-col items-center gap-1 p-2 bg-green-50 rounded-lg hover:bg-green-100 transition-colors border border-green-200">
                    <div
                      className="w-3 h-3 rounded-full bg-green-500 animate-pulse"
                      style={{ animationDelay: "200ms" }}
                    />
                    <span className="text-slate-600 text-center">
                      Delivered
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

        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
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
