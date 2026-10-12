"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { StaticOrangeCompass } from './StaticOrangeCompass';
import { motion, AnimatePresence } from 'framer-motion';

interface SectionMilestone {
  id: string;
  num: string;
  name: string;
  label: string;
  cardinal: string;
}

const MILESTONES: SectionMilestone[] = [
  { id: 'hub-dispatch', num: '01', name: 'DISPATCH', label: 'Folio Dispatch', cardinal: 'N' },
  { id: 'hub-lead', num: '02', name: 'COVER', label: 'Lead Cover', cardinal: 'E' },
  { id: 'hub-desks', num: '03', name: 'DESKS', label: 'Curated Desks', cardinal: 'S' },
  { id: 'hub-salon', num: '04', name: 'SALON', label: 'Salon Collection', cardinal: 'W' },
  { id: 'hub-colophon', num: '05', name: 'COLOPHON', label: 'Colophon', cardinal: 'N' },
];

export const CompassScrollWheel: React.FC = () => {
  const [scrollProgress, setScrollProgress] = useState(0); // 0 to 1
  const [degrees, setDegrees] = useState(0); // 0 to 360
  const [activeMilestone, setActiveMilestone] = useState<SectionMilestone>(MILESTONES[0]);
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

  // Scrubbing logic for clicking / dragging
  const scrubToClientY = useCallback((clientY: number, smooth: boolean = false) => {
    if (!trackRef.current || typeof window === 'undefined') return;
    const rect = trackRef.current.getBoundingClientRect();
    const relativeY = clientY - rect.top;
    const percent = Math.min(Math.max(relativeY / rect.height, 0), 1);

    const docElem = document.documentElement;
    const totalHeight = docElem.scrollHeight - docElem.clientHeight;
    window.scrollTo({
      top: percent * totalHeight,
      behavior: smooth ? 'smooth' : 'auto',
    });
  }, []);

  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    scrubToClientY(e.clientY, true);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    scrubToClientY(e.clientY, false);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      scrubToClientY(e.clientY, false);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, scrubToClientY]);

  // 41 ticks from 0% to 100% (every 2.5%)
  const TICK_COUNT = 41;

  return (
    <aside
      className="hidden lg:flex fixed right-0 top-20 bottom-5 z-40 w-16 sm:w-20 select-none pointer-events-auto flex-col items-center justify-between py-2 pr-1.5 pl-1"
      aria-label="Precision Navigation Ruler"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Top Astrolabe Mini Compass */}
      <button
        onClick={() => scrollToMilestone('hub-dispatch')}
        className="group relative flex flex-col items-center justify-center p-1.5 rounded-full bg-black/20 hover:bg-black/35 border border-white/20 transition-all cursor-pointer mb-2 shrink-0 shadow-lg"
        title="Scroll to broadsheet head (01 DISPATCH)"
      >
        <div
          className="w-6 h-6 transition-transform duration-150 ease-out"
          style={{ transform: `rotate(${degrees}deg)` }}
        >
          <StaticOrangeCompass className="w-full h-full drop-shadow-xs" />
        </div>
        <span className="font-mono text-[7px] font-black text-white/70 uppercase tracking-wider mt-0.5">
          {degrees}°
        </span>
      </button>

      {/* Main Track: Vertical Ruler with Rotated Section Markers */}
      <div className="relative flex-1 w-full flex items-stretch justify-between my-1">
        
        {/* Left Column: Vertical Rotated Section Milestone Tags */}
        <div className="flex flex-col justify-between py-1 items-center pr-1">
          {MILESTONES.map((m) => {
            const isActive = activeMilestone.id === m.id;
            return (
              <button
                key={m.id}
                onClick={() => scrollToMilestone(m.id)}
                className={`group flex items-center gap-1 transition-all duration-200 cursor-pointer text-left py-1 ${
                  isActive
                    ? 'text-[#FF6B4A] font-black scale-105'
                    : 'text-white/40 hover:text-white/90 font-semibold'
                }`}
                title={`Jump to ${m.num} / ${m.label}`}
              >
                {/* Active Orange Pip */}
                <span
                  className={`w-1.5 h-1.5 rounded-full transition-all shrink-0 ${
                    isActive
                      ? 'bg-[#FF6B4A] shadow-[0_0_6px_#FF6B4A]'
                      : 'bg-white/20 group-hover:bg-white/60'
                  }`}
                />

                {/* Vertical Rotated Text (Swiss Technical Label) */}
                <span
                  style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                  className="font-mono text-[8px] sm:text-[9px] uppercase tracking-widest whitespace-nowrap"
                >
                  {m.num} {m.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right Rail: Precision Technical Graduated Ruler Tape */}
        <div
          ref={trackRef}
          onClick={handleTrackClick}
          onMouseDown={handleMouseDown}
          className="relative flex-1 max-w-[28px] h-full flex flex-col items-end cursor-pointer group pr-0.5"
          title="Click or drag to scrub scroll position"
        >
          {/* Subtle Vertical Hairline Axis */}
          <div className="absolute right-0 top-0 bottom-0 w-[1px] bg-white/20 group-hover:bg-white/35 transition-colors" />

          {/* Active Fill Spine (Hermès Orange progress tape) */}
          <div
            className="absolute right-0 top-0 w-[2px] bg-[#FF6B4A] transition-[height] duration-75 ease-out shadow-[0_0_8px_rgba(234,88,12,0.8)]"
            style={{ height: `${scrollProgress * 100}%` }}
          />

          {/* Graduated Horizontal Tick Lines */}
          <div className="relative w-full h-full flex flex-col justify-between pointer-events-none py-0.5">
            {Array.from({ length: TICK_COUNT }).map((_, index) => {
              const tickPercent = index / (TICK_COUNT - 1);
              const isMajor = index % 8 === 0; // 0%, 20%, 40%, 60%, 80%, 100%
              const isMedium = index % 4 === 0 && !isMajor;
              const isNearActive = Math.abs(scrollProgress - tickPercent) < 0.02;

              return (
                <div
                  key={index}
                  className="flex items-center justify-end w-full relative"
                >
                  {/* Major Tick Percentage Numeric Label */}
                  {isMajor && (
                    <span
                      className={`absolute right-4 font-mono text-[7px] font-bold transition-colors ${
                        isNearActive ? 'text-[#FF6B4A]' : 'text-white/40'
                      }`}
                    >
                      {Math.round(tickPercent * 100).toString().padStart(2, '0')}
                    </span>
                  )}

                  {/* Horizontal Ruler Tick Mark */}
                  <span
                    className={`transition-all duration-150 rounded-full ${
                      isNearActive
                        ? 'w-5 h-[2px] bg-[#FF6B4A] shadow-[0_0_8px_rgba(234,88,12,0.9)]'
                        : isMajor
                        ? 'w-3.5 h-[1.5px] bg-white/80'
                        : isMedium
                        ? 'w-2.5 h-[1px] bg-white/50'
                        : 'w-1.5 h-[1px] bg-white/25'
                    }`}
                  />
                </div>
              );
            })}
          </div>

          {/* Highlighted Active Position Marker & Attached Precision Badge */}
          <div
            className="absolute right-0 pointer-events-none flex items-center justify-end transition-all duration-75 ease-out"
            style={{ top: `${scrollProgress * 100}%`, transform: 'translateY(-50%)' }}
          >
            {/* Attached Live Numerical Readout Pill (inspired by getartcraft 085%✦) */}
            <div className="mr-1.5 flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/75 border border-[#FF6B4A]/70 shadow-lg backdrop-blur-md">
              <span className="font-mono text-[8px] sm:text-[9px] font-black text-[#FF6B4A] tracking-tight">
                {Math.round(scrollProgress * 100).toString().padStart(3, '0')}%
              </span>
              <span className="text-[7px] text-[#FF6B4A]">✦</span>
            </div>

            {/* Glowing Active Slider Line */}
            <div className="w-5 h-[2.5px] rounded-full bg-[#FF6B4A] shadow-[0_0_10px_#FF6B4A]" />
          </div>
        </div>

      </div>

      {/* Bottom Cardinal Readout */}
      <div className="mt-2 shrink-0 flex flex-col items-center">
        <span className="font-mono text-[8px] font-black text-[#FF6B4A] uppercase tracking-wider">
          {getCardinal(degrees)}
        </span>
        <span className="font-mono text-[7px] text-white/50 uppercase tracking-widest">
          AXIS
        </span>
      </div>

      {/* Expanded Quick-Jump Drawer on Hover (Optional Popout) */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, x: 10, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 10, scale: 0.95 }}
            transition={{ duration: 0.16 }}
            className="absolute right-18 top-1/2 -translate-y-1/2 w-48 bg-[#4D6E39]/95 backdrop-blur-xl border border-[#FFFDD0]/30 rounded-2xl p-3 shadow-2xl text-white pointer-events-auto"
          >
            <div className="flex items-center justify-between border-b border-white/15 pb-2 mb-2">
              <span className="text-[9px] font-mono font-bold uppercase tracking-[0.18em] text-[#FF6B4A]">
                ✦ Chrono Nav
              </span>
              <span className="text-[9px] font-mono font-bold text-white/80">
                {Math.round(scrollProgress * 100)}%
              </span>
            </div>

            <div className="space-y-1">
              {MILESTONES.map((m) => {
                const isActive = activeMilestone.id === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => scrollToMilestone(m.id)}
                    className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-left transition-all ${
                      isActive
                        ? 'bg-[#FF6B4A] text-white font-bold shadow-md'
                        : 'text-white/80 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <span className="font-mono text-[10px] truncate">
                      {m.num} {m.label}
                    </span>
                    <span className={`text-[9px] font-mono ${isActive ? 'text-white' : 'text-white/50'}`}>
                      {m.cardinal}
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </aside>
  );
};
