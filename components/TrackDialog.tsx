"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Loader2, MapPin, Search } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { useAtmos } from "@/context/AtmosContext";
import { sampleTracking } from "@/lib/sampleTracking";

const TrackDialog = () => {
  const {
    trackDialogOpen,
    setTrackDialogOpen,
    trackingNumber,
    setTrackingNumber,
    loading,
    fetchTrackingData,
    handleTrack,
  } = useAtmos();

  return (
    <Dialog open={trackDialogOpen} onOpenChange={setTrackDialogOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="w-5 h-5 text-slate-600" />
            Track Your Balloon
          </DialogTitle>
          <DialogDescription>
            Enter your tracking number to see real-time balloon location and
            atmospheric data
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="relative group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 transition-all duration-300 group-focus-within:scale-110">
              <MapPin className="w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors duration-300" />
            </div>
            <Input
              placeholder="Enter DHL tracking number"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleTrack()}
              className="pl-10 bg-white/90 backdrop-blur-sm border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 text-slate-800 placeholder:text-slate-400 shadow-sm hover:shadow-md focus:shadow-lg rounded-xl transition-all duration-300 hover:bg-white"
            />
          </div>

          <div className="w-full flex items-center justify-center">
            <Button
              onClick={handleTrack}
              disabled={loading || !trackingNumber}
              className="relative overflow-hidden rounded-xl shadow-md hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 disabled:hover:scale-100 group"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              <span className="relative flex items-center justify-center">
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Tracking...
                  </>
                ) : (
                  <>Track on Map</>
                )}
              </span>
            </Button>
          </div>

          {/* Sample Numbers */}
          <div className="pt-2">
            <p className="text-slate-500 text-xs mb-3 font-medium">
              Try sample balloons:
            </p>
            <div className="flex flex-wrap gap-2 justify-around">
              {sampleTracking.map((num) => (
                <button
                  key={num}
                  onClick={() => {
                    setTrackingNumber(num);
                    fetchTrackingData(num);
                    setTrackDialogOpen(false);
                  }}
                  className="px-3 py-2 bg-white/60 hover:bg-white border border-slate-200 rounded-lg text-slate-600 text-xs transition-all duration-200 hover:border-slate-300 hover:shadow-sm font-mono"
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TrackDialog;
