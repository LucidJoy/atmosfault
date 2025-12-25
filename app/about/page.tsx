"use client";

import { DottedMap } from "@/components/ui/dotted-map";
import { FloatingDock } from "@/components/ui/floating-dock";
import { SpinningText } from "@/components/ui/spinning-text";
import { LightRays } from "@/components/ui/light-rays";
import { TextHoverEffect } from "@/components/ui/text-hover-effect";
import {
  TextRevealCard,
  TextRevealCardDescription,
  TextRevealCardTitle,
} from "@/components/ui/text-reveal-card";
import { motion } from "framer-motion";
import {
  BadgeInfo,
  FilePenLine,
  FolderHeart,
  House,
  Linkedin,
  Truck,
} from "lucide-react";

const links = [
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

const markers = [
  {
    lat: 40.7128,
    lng: -74.006,
    size: 0.3,
  }, // New York
  {
    lat: 34.0522,
    lng: -118.2437,
    size: 0.3,
  }, // Los Angeles
  {
    lat: 51.5074,
    lng: -0.1278,
    size: 0.3,
  }, // London
  {
    lat: -33.8688,
    lng: 151.2093,
    size: 0.3,
  }, // Sydney
  {
    lat: 48.8566,
    lng: 2.3522,
    size: 0.3,
  }, // Paris
  {
    lat: 35.6762,
    lng: 139.6503,
    size: 0.3,
  }, // Tokyo
  {
    lat: 55.7558,
    lng: 37.6176,
    size: 0.3,
  }, // Moscow
  {
    lat: 39.9042,
    lng: 116.4074,
    size: 0.3,
  }, // Beijing
  {
    lat: 28.6139,
    lng: 77.209,
    size: 0.3,
  }, // New Delhi
  {
    lat: -23.5505,
    lng: -46.6333,
    size: 0.3,
  }, // São Paulo
  {
    lat: 1.3521,
    lng: 103.8198,
    size: 0.3,
  }, // Singapore
  {
    lat: 25.2048,
    lng: 55.2708,
    size: 0.3,
  }, // Dubai
  {
    lat: 52.52,
    lng: 13.405,
    size: 0.3,
  }, // Berlin
  {
    lat: 19.4326,
    lng: -99.1332,
    size: 0.3,
  }, // Mexico City
  {
    lat: -26.2041,
    lng: 28.0473,
    size: 0.3,
  }, // Johannesburg
];

const About = () => {
  return (
    <>
      <div className="fixed -bottom-7 right-8 w-32 h-32 z-50">
        <SpinningText className="text-slate-400 text-xs">
          atmos fault • atmos fault • atmos fault •
        </SpinningText>
      </div>

      <FloatingDock mobileClassName="" items={links} />

      <div className="min-h-screen relative overflow-hidden">
        <div className="absolute inset-0 -z-10 h-screen w-screen opacity-30 ">
          <DottedMap dotRadius={0.1} markers={markers} />
        </div>

        <div className="fixed bottom-0 left-0 right-0 h-[40vh] overflow-hidden">
          <div className="absolute bottom-0 left-0 right-0 translate-y-1/2">
            <TextHoverEffect text="ATMOS" />
          </div>
        </div>

        {/* Feature Section */}
        <motion.div id="about" className="mt-8 max-w-6xl mx-auto w-full">
          <div className="flex items-center justify-center mb-10">
            <TextRevealCard text="Lost in clouds" revealText="Found in data ">
              <TextRevealCardTitle>Atmosfault</TextRevealCardTitle>
              <TextRevealCardDescription>
                The most advanced platform for monitoring atmospheric balloon
                missions.
              </TextRevealCardDescription>
            </TextRevealCard>
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
                transition={{ delay: 0.5 + index * 0.1 }}
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
    </>
  );
};

export default About;
