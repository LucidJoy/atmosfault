"use client";

import { useState, memo, useContext } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FloatingDock } from "@/components/ui/floating-dock";
import { motion } from "framer-motion";
import {
  BadgeInfo,
  FilePenLine,
  FolderHeart,
  House,
  Linkedin,
  RotateCcw,
  RotateCw,
  Truck,
} from "lucide-react";
import { SmoothCursor } from "@/components/ui/smooth-cursor";
import { VideoText } from "@/components/ui/video-text";
import { DottedMap } from "@/components/ui/dotted-map";
import { TextAnimate } from "@/components/ui/text-animate";
import { SpinningText } from "@/components/ui/spinning-text";
import { useAtmos } from "@/context/AtmosContext";
import { toast } from "sonner";
import { sampleTracking } from "@/lib/sampleTracking";
import { markers } from "@/lib/markers";

const baseLinks = [
  {
    title: "Home",
    icon: (
      <House className="h-full w-full text-neutral-500 dark:text-neutral-300" />
    ),
    href: "#",
  },
  {
    title: "Track",
    icon: (
      <Truck className="h-full w-full text-neutral-500 dark:text-neutral-300" />
    ),
    href: "/map",
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
    title: "LinkedIn",
    icon: (
      <Linkedin className="h-full w-full text-neutral-500 dark:text-neutral-300" />
    ),
    href: "https://www.linkedin.com/in/lucidjoy/",
  },
];

const textVariants = {
  hidden: {
    opacity: 0,
    y: 30,
    rotate: 45,
    scale: 0.5,
  },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    rotate: 0,
    scale: 1,
    transition: {
      delay: i * 0.1,
      duration: 0.4,
      y: {
        type: "spring",
        damping: 12,
        stiffness: 200,
        mass: 0.8,
      },
      rotate: {
        type: "spring",
        damping: 8,
        stiffness: 150,
      },
      scale: {
        type: "spring",
        damping: 10,
        stiffness: 300,
      },
    },
  }),
  exit: (i: number) => ({
    opacity: 0,
    y: 30,
    rotate: 45,
    scale: 0.5,
    transition: {
      delay: i * 0.1,
      duration: 0.4,
    },
  }),
};

function TrackingInput() {
  const [trackingNumber, setTrackingNumber] = useState("");

  const router = useRouter();

  const handleTrack = () => {
    if (!trackingNumber) return;
    router.push(`/map?tracking=${trackingNumber}`);
  };

  return (
    <div className="space-y-4 max-w-md mx-auto relative">
      <Input
        value={trackingNumber}
        onChange={(e) => setTrackingNumber(e.target.value)}
        placeholder="Enter tracking number"
        className="h-14 text-base bg-white/80 backdrop-blur-sm border-slate-200 focus:border-slate-400 text-slate-800 placeholder:text-slate-400 shadow-sm rounded-xl transition-all cursor-none"
      />
      <Button onClick={() => handleTrack()}>Track on Map</Button>
    </div>
  );
}

export default function Home() {
  const [trackingNumber, setTrackingNumber] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const router = useRouter();
  const MemoizedDottedMap = memo(DottedMap);

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
    <>
      <div className="fixed -bottom-7 right-8 w-32 h-32 z-50">
        <SpinningText className="text-slate-400 text-xs">
          atmos fault • atmos fault • atmos fault •
        </SpinningText>
      </div>

      <div className="min-h-screen relative overflow-hidden">
        {/* Dotted Map Background */}
        <div className="absolute inset-0 -z-10 h-screen w-screen opacity-30 ">
          <MemoizedDottedMap dotRadius={0.1} markers={markers} />
        </div>

        <SmoothCursor />

        <FloatingDock mobileClassName="" items={links} />

        {/* Animated gradient orbs in background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute -top-40 -right-40 w-96 h-96 bg-red-200/20 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute -bottom-40 -left-40 w-96 h-96 bg-slate-200/30 rounded-full blur-3xl"
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>

        {/* Main Content */}
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-12">
          {/* Hero Section */}
          <div className="w-full max-w-4xl mx-auto">
            {/* Text Content */}
            <motion.div
              className="space-y-8 text-center"
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="space-y-6">
                {/* Hero Text with LAND AIR OCEAN */}
                <div className="-space-x-4">
                  <motion.div
                    className="flex flex-wrap gap-3 md:gap-4 items-center justify-center"
                    initial={{ opacity: 0, y: 100, scale: 0.8, rotateX: 45 }}
                    animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
                    transition={{
                      duration: 0.8,
                      delay: 0.2,
                      type: "spring",
                      stiffness: 100,
                      damping: 15,
                    }}
                  >
                    <VideoText
                      src="https://www.pexels.com/download/video/3573962/"
                      fontSize={20}
                      fontWeight="900"
                      textAnchor="start"
                      dominantBaseline="middle"
                      x="0%"
                      y="50%"
                      className="h-24 md:h-32 lg:h-44 w-full"
                      preload="metadata"
                    >
                      LAND
                    </VideoText>
                  </motion.div>

                  <motion.div
                    className="flex flex-wrap gap-3 md:gap-4 items-center justify-center -mt-[60px]"
                    initial={{ opacity: 0, y: 100, scale: 0.8, rotateX: 45 }}
                    animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
                    transition={{
                      duration: 0.8,
                      delay: 0.5,
                      type: "spring",
                      stiffness: 100,
                      damping: 15,
                    }}
                  >
                    <VideoText
                      src="https://www.pexels.com/download/video/3188904/"
                      fontSize={20}
                      fontWeight="900"
                      textAnchor="start"
                      dominantBaseline="middle"
                      x="0%"
                      y="50%"
                      className="h-24 md:h-32 lg:h-44 w-full"
                      preload="metadata"
                    >
                      AIR
                    </VideoText>
                  </motion.div>

                  <motion.div
                    className="flex flex-wrap gap-3 md:gap-4 items-center justify-center -mt-[60px]"
                    initial={{ opacity: 0, y: 100, scale: 0.8, rotateX: 45 }}
                    animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
                    transition={{
                      duration: 0.8,
                      delay: 0.8,
                      type: "spring",
                      stiffness: 100,
                      damping: 15,
                    }}
                  >
                    <VideoText
                      src="https://cdn.magicui.design/ocean-small.webm"
                      fontSize={20}
                      fontWeight="900"
                      textAnchor="start"
                      dominantBaseline="middle"
                      x="0%"
                      y="50%"
                      className="h-24 md:h-32 lg:h-44 w-full"
                      preload="metadata"
                    >
                      OCEAN
                    </VideoText>
                  </motion.div>

                  <TextAnimate
                    variants={textVariants}
                    by="character"
                    className="text-base text-slate-600 max-w-lg mx-auto leading-relaxed pt-4"
                  >
                    Your package is delayed. The atmosphere is to blame.
                    WindBorne balloons caught the culprit. We have the receipts.
                  </TextAnimate>
                </div>
              </div>

              {/* Tracking Input */}
              <motion.div
                className="space-y-4 max-w-md mx-auto relative"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <div className="relative">
                  <TrackingInput />
                </div>

                {/* <Button onClick={handleTrack} className="cursor-none">
                  Track on Map
                </Button> */}

                {/* Sample Numbers */}
                <div className="pt-3">
                  <p className="text-slate-500 text-xs mb-3 font-medium">
                    Try sample shipments:
                  </p>
                  <div className="flex flex-wrap gap-2 justify-around">
                    {sampleTracking.map((num) => (
                      <button
                        key={num}
                        onClick={() => {
                          setTrackingNumber(num);
                          router.push(`/map?tracking=${num}`);
                        }}
                        className="px-3 py-2 bg-white/60 hover:bg-white border border-slate-200 rounded-lg text-slate-600 text-xs transition-all duration-200 hover:border-slate-300 hover:shadow-sm font-mono cursor-none"
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
}
