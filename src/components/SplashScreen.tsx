"use client";

import React, { useEffect, useState } from 'react';
import { StaticOrangeCompass } from "@/components/StaticOrangeCompass";

interface SplashScreenProps {
  onComplete?: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [opacity, setOpacity] = useState(1);
  const [messageIndex, setMessageIndex] = useState(0);

  const messages = [
    "Calibrating Compass...",
    "Charting Course...",
    "Gathering Sources...",
    "Aligning Perspectives...",
    "Setting Sail..."
  ];

  useEffect(() => {
    // Cycle through messages
    const messageInterval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 500);

    // Start fade out after 2.5 seconds
    const timer = setTimeout(() => {
      setOpacity(0);
    }, 2500);

    // Remove from DOM after fade out completes (3s total)
    const cleanup = setTimeout(() => {
      setIsVisible(false);
      if (onComplete) onComplete();
    }, 3000);

    return () => {
      clearInterval(messageInterval);
      clearTimeout(timer);
      clearTimeout(cleanup);
    };
  }, [onComplete]);

  if (!isVisible) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-juice-green text-juice-cream transition-opacity duration-500 ease-in-out"
      style={{ opacity }}
    >
      <div className="relative flex flex-col items-center">
        {/* Rotating Compass */}
        <div className="animate-[spin_3s_ease-in-out_infinite]">
          <StaticOrangeCompass className="w-32 h-32 md:w-48 md:h-48 drop-shadow-2xl" />
        </div>
        
        {/* Loading Text */}
        <div className="mt-12 space-y-2 text-center">
          <h1 className="font-serif text-4xl md:text-6xl font-bold tracking-widest animate-pulse">
            ODYSSEUS
          </h1>
          <p className="text-sm md:text-base font-mono uppercase tracking-[0.3em] opacity-60 min-w-[300px]">
            {messages[messageIndex]}
          </p>
        </div>
      </div>
    </div>
  );
};