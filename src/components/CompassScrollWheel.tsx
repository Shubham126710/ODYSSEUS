"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { StaticOrangeCompass } from './StaticOrangeCompass';
import { motion, AnimatePresence } from 'framer-motion';

interface SectionMilestone {
  id: string;
  label: string;
  cardinal: string;
  degrees: number;
}

const MILESTONES: SectionMilestone[] = [
  { id: 'hub-dispatch', label: 'Folio Dispatch', cardinal: 'N', degrees: 0 },
  { id: 'hub-lead', label: 'Lead Cover', cardinal: 'E', degrees: 90 },
  { id: 'hub-desks', label: 'Curated Desks', cardinal: 'S', degrees: 180 },
  { id: 'hub-salon', label: 'Salon Archive', cardinal: 'W', degrees: 270 },
  { id: 'hub-colophon', label: 'Colophon', cardinal: 'N', degrees: 360 },
];

export const CompassScrollWheel = () => {
  const [scrollProgress, setScrollProgress] = useState(0); // 0 to 1
  const [degrees, setDegrees] = useState(0); // 0 to 360
  const [activeMilestone, setActiveMilestone] = useState(MILESTONES[0]);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  // Calculate cardinal direction string from degrees
  const getCardinal = (deg: number): string => {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round((deg % 360) / 22.5) % 16;
    return directions[index];
  };

  const handleScroll = useCallback(() => {
    if (typeof window === 'undefined') return;
    const docElem = document.documentElement;
    const totalHeight = docElem.scrollHeight - docElem.clientHeight;
    if (totalHeight <= 0) return;

    const currentScroll = window.scrollY;
    const progress = Math.min(Math.max(currentScroll / totalHeight, 0), 1);
    const deg = Math.round(progress * 360);

    setScrollProgress(progress);
    setDegrees(deg);

    // Determine current active section
    let current = MILESTONES[0];
    for (const m of MILESTONES) {
      const el = document.getElementById(m.id);
      if (el) {
        const rect = el.getBoundingClientRect();
        if (rect.top <= window.innerHeight * 0.45) {
          current = m;
        }
      }
    }
    setActiveMilestone(current);
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Jump to section smoothly
  const scrollToMilestone = (id: string) => {
    if (typeof document === 'undefined') return;
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Interactive scrubbing on the wheel track
  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const clickY = e.clientY - rect.top;
    const percent = Math.min(Math.max(clickY / rect.height, 0), 1);
    
    const docElem = document.documentElement;
    const totalHeight = docElem.scrollHeight - docElem.clientHeight;
    window.scrollTo({
      top: percent * totalHeight,
      behavior: 'smooth'
    });
  };

  return (
    <aside 
      className="hidden xl:flex fixed right-4 2xl:right-8 top-1/2 -translate-y-1/2 z-40 flex-col items-center select-none"
      aria-label="Compass Navigational Wheel"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Outer Shell Card */}
      <div className="relative flex flex-col items-center bg-[#5D8246]/95 backdrop-blur-md border border-[#FFFDD0]/30 rounded-full py-4 px-2 shadow-[0_12px_36px_rgba(0,0,0,0.35)] hover:shadow-[0_16px_45px_rgba(234,88,12,0.35)] hover:border-[#EA580C]/70 transition-all duration-300 text-white">
        
        {/* Top Mini Compass Astrolabe (Rotating Needle) */}
        <button
          onClick={() => scrollToMilestone('hub-dispatch')}
          className="group relative flex flex-col items-center justify-center p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
          title="Scroll to top of broadsheet"
        >
          <div 
            className="w-7 h-7 transition-transform duration-200 ease-out"
            style={{ transform: `rotate(${degrees}deg)` }}
          >
            <StaticOrangeCompass className="w-full h-full drop-shadow-xs" />
          </div>
          <span className="font-mono text-[9px] font-bold text-white/80 uppercase tracking-widest mt-1">
            {degrees.toString().padStart(3, '0')}°
          </span>
          <span className="font-mono text-[8px] font-black text-[#EA580C] uppercase tracking-wider">
            {getCardinal(degrees)}
          </span>
        </button>

        {/* Divider hairline */}
        <div className="w-4 h-px bg-white/15 my-2" />

        {/* The Vertical Compass Ruler / Horizontal Tick Marks Tape */}
        <div 
          ref={trackRef}
          onClick={handleTrackClick}
          className="relative w-8 h-56 my-1 flex flex-col items-center justify-center cursor-pointer group"
          title="Click to scrub navigational position"
        >
          {/* Subtle vertical spine track */}
          <div className="absolute top-0 bottom-0 w-[1px] bg-white/20 group-hover:bg-white/30 transition-colors" />

          {/* Active Progress Fill Spine */}
          <div 
            className="absolute top-0 w-[2px] bg-[#EA580C] transition-[height] duration-150 ease-out"
            style={{ height: `${scrollProgress * 100}%` }}
          />

          {/* 25 Horizontal Compass Tick Lines (Gauge markers) */}
          <div className="relative w-full h-full flex flex-col justify-between py-1 pointer-events-none">
            {Array.from({ length: 25 }).map((_, index) => {
              const markerProgress = index / 24;
              const isMajor = index % 6 === 0; // 0, 6, 12, 18, 24 (Major Cardinal ticks)
              const isMedium = index % 3 === 0 && !isMajor; // Intermediate ticks
              const isActive = Math.abs(scrollProgress - markerProgress) < 0.04;

              return (
                <div 
                  key={index} 
                  className="flex items-center justify-center w-full relative"
                >
                  <span
                    className={`transition-all duration-200 rounded-full ${
                      isActive
                        ? 'w-7 h-[2px] bg-[#EA580C] shadow-[0_0_8px_rgba(234,88,12,0.9)]'
                        : isMajor
                        ? 'w-5 h-[1.5px] bg-white/90'
                        : isMedium
                        ? 'w-3.5 h-[1px] bg-white/50'
                        : 'w-2 h-[1px] bg-white/25'
                    }`}
                  />
                  {/* Subtle Major Cardinal Letter Indicator */}
                  {isMajor && (
                    <span 
                      className={`absolute right-[-10px] text-[7px] font-mono font-bold ${
                        isActive ? 'text-[#EA580C]' : 'text-white/40'
                      }`}
                    >
                      {index === 0 ? 'N' : index === 6 ? 'E' : index === 12 ? 'S' : index === 18 ? 'W' : 'N'}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Precision Active Indicator Needle (Orange Center Crosshair) */}
          <div 
            className="absolute left-0 right-0 pointer-events-none flex items-center justify-between transition-all duration-100 ease-out"
            style={{ top: `${scrollProgress * 100}%`, transform: 'translateY(-50%)' }}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-[#EA580C] shadow-[0_0_8px_#EA580C]" />
            <div className="flex-1 h-[2px] bg-[#EA580C] mx-0.5 shadow-[0_0_6px_rgba(234,88,12,0.8)]" />
            <div className="w-1.5 h-1.5 rounded-full bg-[#EA580C] shadow-[0_0_8px_#EA580C]" />
          </div>
        </div>

        {/* Divider hairline */}
        <div className="w-4 h-px bg-white/15 my-2" />

        {/* Bottom Percentage Readout */}
        <div className="flex flex-col items-center">
          <span className="font-mono text-[9px] font-bold text-white">
            {Math.round(scrollProgress * 100)}%
          </span>
          <span className="font-mono text-[7px] font-bold uppercase tracking-widest text-white/50">
            HEAD
          </span>
        </div>

      </div>

      {/* Expanded Astrolabe Section Popout Drawer on Hover */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, x: 10, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 10, scale: 0.95 }}
            transition={{ duration: 0.18 }}
            className="absolute right-14 top-1/2 -translate-y-1/2 w-48 bg-[#5D8246]/95 backdrop-blur-xl border border-[#FFFDD0]/30 rounded-2xl p-3.5 shadow-2xl text-white pointer-events-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/15 pb-2 mb-2.5">
              <span className="text-[9px] font-mono font-bold uppercase tracking-[0.2em] text-[#EA580C]">
                ✦ Compass Index
              </span>
              <span className="text-[9px] font-mono font-bold text-white/70">
                {degrees}° {getCardinal(degrees)}
              </span>
            </div>

            {/* Quick-jump milestone links */}
            <div className="space-y-1 font-mono text-xs">
              {MILESTONES.map((m) => {
                const isActive = activeMilestone.id === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => scrollToMilestone(m.id)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-all ${
                      isActive
                        ? 'bg-[#EA580C] text-white font-bold shadow-md'
                        : 'text-white/80 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <span className="text-[11px] truncate">{m.label}</span>
                    <span className={`text-[9px] font-bold ${isActive ? 'text-white' : 'text-white/40'}`}>
                      {m.cardinal} {m.degrees}°
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Footer advice */}
            <div className="mt-2.5 pt-2 border-t border-white/10 text-[9px] font-mono text-white/40 text-center uppercase tracking-wider">
              Click marker to navigate
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </aside>
  );
};
