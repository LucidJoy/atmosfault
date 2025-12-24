"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FloatingDock } from "@/components/ui/floating-dock";
import { motion } from "framer-motion";
import { BadgeInfo, House, Truck } from "lucide-react";
import { SmoothCursor } from "@/components/ui/smooth-cursor";
import { VideoText } from "@/components/ui/video-text";
import { DottedMap } from "@/components/ui/dotted-map";
import { Highlighter } from "@/components/ui/highlighter";

const links = [
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
    href: "#",
  },
  {
    title: "About",
    icon: (
      <BadgeInfo className="h-full w-full text-neutral-500 dark:text-neutral-300" />
    ),
    href: "#",
  },
];

export default function Home() {
  const [trackingNumber, setTrackingNumber] = useState("");
  const router = useRouter();

  const handleTrack = () => {
    if (!trackingNumber) return;
    router.push(`/map?tracking=${trackingNumber}`);
  };

  return (
    <>
      <div className="min-h-screen relative overflow-hidden">
        {/* Dotted Map Background */}
        <div className="absolute inset-0 -z-10 h-screen w-screen opacity-30 ">
          <DottedMap dotRadius={0.1} />
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
                {/* <motion.div
                  className="flex items-center gap-3"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <h2 className="text-2xl font-bold bg-gradient-to-br from-slate-900 via-slate-800 to-slate-600 bg-clip-text text-transparent">
                    AtmosFault
                  </h2>
                  <div className="flex items-center gap-2 px-3 py-1 bg-red-50 border border-red-100 rounded-full">
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-xs font-medium text-red-700">
                      Live
                    </span>
                  </div>
                </motion.div> */}

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
                    >
                      OCEAN
                    </VideoText>
                  </motion.div>

                  <div className="text-base text-slate-600 max-w-lg mx-auto leading-relaxed pt-4">
                    Your package travels through all three realms of Earth.
                    Watch it traverse{" "}
                    <Highlighter action="highlight" color="#FF9800">
                      land
                    </Highlighter>
                    , soar through air, and drift across ocean in real-time.
                  </div>
                </div>
              </div>

              {/* Tracking Input */}
              <motion.div
                id="track"
                className="space-y-4 max-w-md mx-auto"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <div className="relative">
                  <Input
                    placeholder="Enter tracking number"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleTrack()}
                    className="h-14 text-base bg-white/80 backdrop-blur-sm border-slate-200 focus:border-slate-400 text-slate-800 placeholder:text-slate-400 shadow-sm rounded-xl transition-all"
                  />
                </div>
                <Button
                  onClick={handleTrack}
                  className="w-full h-14 text-base bg-gradient-to-r from-slate-900 to-slate-700 hover:from-slate-800 hover:to-slate-600 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl font-medium"
                >
                  Track on Map
                  <svg
                    className="w-5 h-5 ml-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    />
                  </svg>
                </Button>

                {/* Sample Numbers */}
                <div className="pt-3">
                  <p className="text-slate-500 text-xs mb-3 font-medium">
                    Try sample balloons:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {["ATM-00000000", "ATM-10000029", "ATM-23000100"].map(
                      (num) => (
                        <button
                          key={num}
                          onClick={() => {
                            setTrackingNumber(num);
                            router.push(`/map?tracking=${num}`);
                          }}
                          className="px-3 py-2 bg-white/60 hover:bg-white border border-slate-200 rounded-lg text-slate-600 text-xs transition-all duration-200 hover:border-slate-300 hover:shadow-sm font-mono"
                        >
                          {num}
                        </button>
                      )
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>

          {/* Feature Section */}
          <motion.div
            id="about"
            className="mt-32 max-w-6xl mx-auto w-full"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
                Why AtmosFault?
              </h2>
              <p className="text-slate-600 max-w-2xl mx-auto">
                The most advanced platform for monitoring atmospheric balloon
                missions
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  icon: (
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  ),
                  title: "Global Coverage",
                  description:
                    "Track balloons anywhere on Earth with real-time positioning and satellite integration",
                },
                {
                  icon: (
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  ),
                  title: "Real-time Data",
                  description:
                    "Live altitude, velocity, and telemetry updates streamed directly to your dashboard",
                },
                {
                  icon: (
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                  ),
                  title: "Predictive Analytics",
                  description:
                    "Advanced trajectory modeling and landing zone predictions using ML algorithms",
                },
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  className="group relative bg-white/70 backdrop-blur-sm border border-slate-200/80 rounded-2xl p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-red-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                  <div className="relative space-y-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-slate-100 to-slate-50 rounded-xl flex items-center justify-center text-slate-700 group-hover:scale-110 transition-transform">
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-semibold text-slate-800">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}
