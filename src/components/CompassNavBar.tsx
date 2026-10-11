"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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

const ITEM_WIDTH = 112; // Exactly 112px per item for exact mathematical alignment

export const CompassNavBar: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const isFeedHome = pathname === '/feed';

  const navRef = useRef<HTMLElement>(null);
  const [windowWidth, setWindowWidth] = useState(448);

  // Explicit visible window width: ~448px on desktop, 360px on mobile
  useEffect(() => {
    const updateWidth = () => {
      if (typeof window !== 'undefined') {
        const isMobile = window.innerWidth < 640;
        setWindowWidth(isMobile ? 360 : 448);
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

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

  // Scroll tracking on /feed for sections: for-you, tech, design, culture, science, sports
  useEffect(() => {
    if (!isFeedHome || typeof window === 'undefined') return;

    const handleScroll = () => {
      const headerHeight = 64;
      const triggerThreshold = headerHeight + 80;

      let currentIdx = 0;
      for (let i = 0; i < COMPASS_SECTIONS.length; i++) {
        const el = document.getElementById(COMPASS_SECTIONS[i].id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= triggerThreshold) {
            currentIdx = i;
          }
        }
      }
      setActiveIdx(currentIdx);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isFeedHome]);

  // Click handler: smooth-scroll if on /feed, or navigate route
  const handleItemClick = useCallback((index: number, section: CompassSection) => {
    setActiveIdx(index);
    if (isFeedHome) {
      const el = document.getElementById(section.id);
      if (el) {
        const navOffset = 64; // Header height
        const top = el.getBoundingClientRect().top + window.scrollY - navOffset;
        window.scrollTo({
          top: Math.max(0, top),
          behavior: prefersReducedMotion ? 'auto' : 'smooth',
        });
      } else {
        router.push(section.route || `/feed/${section.id}`);
      }
    } else {
      if (section.id === 'for-you') {
        router.push('/feed');
      } else {
        router.push(section.route || `/feed/${section.id}`);
      }
    }
  }, [isFeedHome, prefersReducedMotion, router]);

  // Exact centering offset computed from real item width:
  // windowWidth/2 - (index * 112 + 56)
  const targetX = windowWidth / 2 - (activeIdx * ITEM_WIDTH + ITEM_WIDTH / 2);

  return (
    <nav
      ref={navRef}
      aria-label="Compass navigation"
      className="relative h-14 flex items-center overflow-hidden shrink-0 select-none"
      style={{
        width: `${windowWidth}px`,
        maxWidth: `${windowWidth}px`,
        maskImage: 'linear-gradient(to right, transparent 0%, black 16%, black 84%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 16%, black 84%, transparent 100%)',
      }}
    >
      {/* Fixed Orange Needle Marker: 2px x 10px orange line at exact horizontal center of the window, above tick row */}
      <div 
        aria-hidden="true"
        className="absolute left-1/2 -translate-x-1/2 top-[24px] z-30 pointer-events-none flex flex-col items-center"
      >
        <div style={{ backgroundColor: '#FF6B4A', width: '2px', height: '10px' }} className="rounded-full shadow-xs" />
      </div>

      {/* Horizontally translating motion track (width: max-content) */}
      <motion.div
        animate={{ x: targetX }}
        transition={
          prefersReducedMotion
            ? { duration: 0 }
            : { type: 'spring', stiffness: 320, damping: 32 }
        }
        style={{ width: 'max-content' }}
        className="flex flex-col items-start whitespace-nowrap will-change-transform"
      >
        {/* Labels Row */}
        <div className="flex items-center" style={{ width: 'max-content' }}>
          {COMPASS_SECTIONS.map((section, idx) => {
            const isActive = activeIdx === idx;
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => handleItemClick(idx, section)}
                aria-current={isActive ? 'page' : undefined}
                style={{ flex: '0 0 112px', width: '112px' }}
                className={`text-center font-mono text-[11px] tracking-widest uppercase transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#FF6B4A] py-1 ${
                  isActive
                    ? 'text-[#FFFDD0] font-bold opacity-100'
                    : 'text-[#FFFDD0] opacity-40 hover:opacity-75 font-normal'
                }`}
              >
                {section.label}
              </button>
            );
          })}
        </div>

        {/* Compass Bezel / Ruler Ticks Track below */}
        <div 
          className="flex items-end h-3 border-t border-[#FFFDD0]/20 mt-1 pointer-events-none"
          style={{ width: 'max-content' }}
        >
          {COMPASS_SECTIONS.map((section) => (
            <div 
              key={`bezel-${section.id}`} 
              style={{ flex: '0 0 112px', width: '112px' }}
              className="flex items-start justify-between px-2"
            >
              <span className="w-[1px] h-1.5 bg-[#FFFDD0]/25" />
              <span className="w-[1px] h-1 bg-[#FFFDD0]/20" />
              <span className="w-[1px] h-1.5 bg-[#FFFDD0]/25" />
              {/* Primary center tick mark directly under label center & needle */}
              <span className="w-[1px] h-2.5 bg-[#FFFDD0]/60" />
              <span className="w-[1px] h-1.5 bg-[#FFFDD0]/25" />
              <span className="w-[1px] h-1 bg-[#FFFDD0]/20" />
              <span className="w-[1px] h-1.5 bg-[#FFFDD0]/25" />
            </div>
          ))}
        </div>

      </motion.div>
    </nav>
  );
};
