"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useRouter, usePathname } from 'next/navigation';

export interface CompassSection {
  id: string;
  label: string;
  route?: string;
}

export const COMPASS_SECTIONS: CompassSection[] = [
  { id: 'for-you', label: 'FOR YOU', route: '/feed' },
  { id: 'tech', label: 'TECH', route: '/feed/tech' },
  { id: 'design', label: 'DESIGN', route: '/feed/design' },
  { id: 'culture', label: 'CULTURE', route: '/feed/culture' },
  { id: 'science', label: 'SCIENCE', route: '/feed/science' },
  { id: 'sports', label: 'SPORTS', route: '/feed/sports' },
];

const ITEM_WIDTH = 112; // 7rem (112px) per item for exact mathematical alignment

export const CompassNavBar: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const isFeedHome = pathname === '/feed';

  // Determine initial active index based on route
  const routeActiveIndex = useMemo(() => {
    if (isFeedHome) return 0;
    const currentCat = pathname.replace('/feed/', '').toLowerCase();
    const idx = COMPASS_SECTIONS.findIndex(s => s.id === currentCat);
    return idx !== -1 ? idx : 0;
  }, [pathname, isFeedHome]);

  const [activeIdx, setActiveIdx] = useState<number>(routeActiveIndex);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Check prefers-reduced-motion
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(media.matches);
    const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, []);

  // Update active index if route changes
  useEffect(() => {
    setActiveIdx(routeActiveIndex);
  }, [routeActiveIndex]);

  // IntersectionObserver for the For You page section scroll tracking
  useEffect(() => {
    if (!isFeedHome || typeof window === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = COMPASS_SECTIONS.findIndex(s => s.id === entry.target.id);
            if (index !== -1) {
              setActiveIdx(index);
            }
          }
        });
      },
      // Narrow detection window in the center 20% of the viewport
      { rootMargin: '-40% 0px -40% 0px', threshold: 0 }
    );

    COMPASS_SECTIONS.forEach((section) => {
      const el = document.getElementById(section.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [isFeedHome]);

  // Click handler: smooth-scroll if on /feed, or navigate route
  const handleItemClick = useCallback((index: number, section: CompassSection) => {
    if (isFeedHome) {
      setActiveIdx(index);
      const el = document.getElementById(section.id);
      if (el) {
        const navOffset = 72; // Account for sticky header
        const top = el.getBoundingClientRect().top + window.scrollY - navOffset;
        window.scrollTo({
          top: Math.max(0, top),
          behavior: prefersReducedMotion ? 'auto' : 'smooth',
        });
      }
    } else {
      setActiveIdx(index);
      if (section.id === 'for-you') {
        router.push('/feed');
      } else {
        router.push(`/feed/${section.id}`);
      }
    }
  }, [isFeedHome, prefersReducedMotion, router]);

  // Exact shift: -(activeIdx * ITEM_WIDTH + ITEM_WIDTH / 2)
  // Since the wrapper has left: 50%, this centers item `activeIdx` exactly under the needle
  const targetX = -(activeIdx * ITEM_WIDTH + ITEM_WIDTH / 2);

  return (
    <nav
      aria-label="Compass navigation"
      className="relative h-14 flex items-center justify-center overflow-hidden w-full max-w-[340px] sm:max-w-[420px] md:max-w-[480px] select-none"
      style={{
        maskImage: 'linear-gradient(to right, transparent 0%, black 18%, black 82%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 18%, black 82%, transparent 100%)',
      }}
    >
      {/* Fixed Orange Needle Marker (Centered right at 50%) */}
      <div 
        aria-hidden="true"
        className="absolute left-1/2 top-1.5 -translate-x-1/2 z-30 pointer-events-none flex flex-col items-center"
      >
        <div className="w-0 h-0 border-x-[3.5px] border-x-transparent border-t-[5px] border-t-juice-orange" />
      </div>

      {/* Origin wrapper at 50% */}
      <div className="relative left-1/2 w-0 h-full flex flex-col justify-center">
        
        {/* Horizontally translating motion track */}
        <motion.div
          animate={{ x: targetX }}
          transition={
            prefersReducedMotion
              ? { duration: 0 }
              : { type: 'spring', stiffness: 300, damping: 30 }
          }
          className="flex flex-col items-start whitespace-nowrap will-change-transform"
        >
          {/* Labels Row */}
          <div className="flex items-center">
            {COMPASS_SECTIONS.map((section, idx) => {
              const isActive = activeIdx === idx;
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => handleItemClick(idx, section)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`w-28 shrink-0 text-center font-mono text-[11px] tracking-widest uppercase transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-juice-orange py-1 ${
                    isActive
                      ? 'text-juice-cream font-black scale-105 opacity-100'
                      : 'text-juice-cream/40 hover:text-juice-cream/70 font-medium'
                  }`}
                >
                  {section.label}
                </button>
              );
            })}
          </div>

          {/* Compass Bezel / Ruler Ticks Track */}
          <div className="flex items-end w-full h-3 border-t border-juice-cream/20 mt-1 pointer-events-none">
            {COMPASS_SECTIONS.map((section, idx) => (
              <div 
                key={`bezel-${section.id}`} 
                className="w-28 shrink-0 flex items-start justify-between px-1"
              >
                {/* 7 subtle ruler ticks per section item */}
                <span className="w-[1px] h-1.5 bg-juice-cream/25" />
                <span className="w-[1px] h-1 bg-juice-cream/20" />
                <span className="w-[1px] h-1.5 bg-juice-cream/25" />
                {/* Center primary mark directly under label */}
                <span className="w-[1px] h-2.5 bg-juice-cream/60" />
                <span className="w-[1px] h-1.5 bg-juice-cream/25" />
                <span className="w-[1px] h-1 bg-juice-cream/20" />
                <span className="w-[1px] h-1.5 bg-juice-cream/25" />
              </div>
            ))}
          </div>

        </motion.div>

      </div>
    </nav>
  );
};
