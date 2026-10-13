"use client";

import React, { useState, useEffect, useCallback } from 'react';

export interface RailSection {
  id: string;
  label: string;
  index: string;
}

interface ScrollRailProps {
  sections: RailSection[];
}

export const ScrollRail: React.FC<ScrollRailProps> = ({ sections }) => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeSectionId, setActiveSectionId] = useState<string>('');

  const updateScroll = useCallback(() => {
    const scrollY = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? Math.min(100, Math.max(0, (scrollY / docHeight) * 100)) : 0;
    setScrollProgress(Math.round(progress));

    // Determine active section based on viewport offset
    const offset = window.innerHeight * 0.35;
    let currentId = sections[0]?.id || '';

    for (let i = 0; i < sections.length; i++) {
      const el = document.getElementById(sections[i].id);
      if (el) {
        const rect = el.getBoundingClientRect();
        if (rect.top <= offset) {
          currentId = sections[i].id;
        }
      }
    }
    setActiveSectionId(currentId);
  }, [sections]);

  useEffect(() => {
    updateScroll();
    window.addEventListener('scroll', updateScroll, { passive: true });
    window.addEventListener('resize', updateScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', updateScroll);
      window.removeEventListener('resize', updateScroll);
    };
  }, [updateScroll]);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (!sections || sections.length === 0) return null;

  return (
    <aside 
      aria-label="Editorial Section Scroll Rail"
      className="hidden lg:flex fixed right-4 sm:right-6 top-1/2 -translate-y-1/2 z-40 flex-col items-center select-none"
    >
      {/* Scroll Percentage Marker */}
      <div className="font-mono text-[9px] uppercase tracking-widest text-[#FFFDD0]/50 mb-3 bg-[#385227]/80 backdrop-blur-sm px-1.5 py-0.5 rounded border border-[#FFFDD0]/15">
        {scrollProgress}%
      </div>

      {/* Vertical Rail Container */}
      <div className="relative py-2 flex flex-col items-center gap-4">
        {/* Background Baseline */}
        <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[1px] bg-[#FFFDD0]/20 pointer-events-none" />

        {/* Progress Fill Line */}
        <div 
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[2px] bg-[#FF6B4A] pointer-events-none transition-all duration-150"
          style={{ height: `${scrollProgress}%` }}
        />

        {/* Section Ticks & Interactive Nodes */}
        {sections.map((sec) => {
          const isActive = activeSectionId === sec.id;
          return (
            <button
              key={sec.id}
              onClick={() => scrollToSection(sec.id)}
              aria-label={`Scroll to ${sec.label}`}
              className="group relative flex items-center justify-center p-1 focus:outline-none"
            >
              {/* Horizontal Tick */}
              <div 
                className={`transition-all duration-300 ${
                  isActive
                    ? 'w-4 h-[2px] bg-[#FF6B4A]'
                    : 'w-2 h-[1px] bg-[#FFFDD0]/40 group-hover:w-3 group-hover:bg-[#FFFDD0]'
                }`}
              />

              {/* Tooltip / Label on Hover or when Active */}
              <span 
                className={`absolute right-6 px-2 py-1 rounded text-[9px] font-mono tracking-widest uppercase whitespace-nowrap transition-all duration-200 pointer-events-none ${
                  isActive
                    ? 'opacity-100 translate-x-0 bg-[#FF6B4A] text-[#FFFDD0] font-bold shadow-sm'
                    : 'opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 bg-[#385227]/90 text-[#FFFDD0]/80 border border-[#FFFDD0]/15'
                }`}
              >
                {sec.index} {sec.label}
              </span>
            </button>
          );
        })}
      </div>
    </aside>
  );
};
