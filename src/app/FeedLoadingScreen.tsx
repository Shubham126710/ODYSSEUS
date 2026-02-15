"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { StaticOrangeCompass } from '@/components/StaticOrangeCompass';

export const FeedLoadingScreen = () => {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-juice-orange text-juice-cream"
    >
      <div className="relative flex flex-col items-center px-4">
        {/* Rotating Compass */}
        <div className="animate-[spin_3s_ease-in-out_infinite]">
          <StaticOrangeCompass className="w-24 h-24 md:w-48 md:h-48 drop-shadow-2xl" />
        </div>
        
        {/* Loading Text */}
        <div className="mt-8 md:mt-12 space-y-2 text-center">
          <h2 className="font-serif text-2xl md:text-5xl font-bold tracking-widest animate-pulse whitespace-nowrap">
            CURATING FEED
          </h2>
          <p className="text-xs md:text-base font-mono uppercase tracking-[0.2em] md:tracking-[0.3em] opacity-80">
            Gathering stories from across the web...
          </p>
        </div>
      </div>
    </motion.div>
  );
};
