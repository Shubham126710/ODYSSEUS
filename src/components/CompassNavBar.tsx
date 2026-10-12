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

export interface CompassNavBarProps {
  sections?: CompassSection[];
  isMobile?: boolean;
}

export const CompassNavBar: React.FC<CompassNavBarProps> = ({ 
  sections = COMPASS_SECTIONS,
  isMobile = false,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const isFeedHome = pathname === '/feed';

  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Track DOM cell centers and total track width
  const [cellCenters, setCellCenters] = useState<number[]>([]);
  const [trackWidth, setTrackWidth] = useState<number>(600);

  // Active section index and marker position in pixels
  const [activeIdx, setActiveIdx] = useState<number>(0);
  const [markerX, setMarkerX] = useState<number>(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Reduced motion preference
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(media.matches);
    const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, []);

  // Determine active route index for category pages
  const routeActiveIndex = useMemo(() => {
    if (isFeedHome) return 0;
    const currentCat = pathname.replace('/feed/', '').toLowerCase();
    const idx = sections.findIndex(s => s.id === currentCat);
    return idx !== -1 ? idx : 0;
  }, [pathname, isFeedHome, sections]);

  // Measure cell centers accurately from the real rendered DOM buttons
  const measureCells = useCallback(() => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const width = containerRect.width;
    setTrackWidth(width);

    const centers: number[] = [];
    sections.forEach((_, idx) => {
      const btn = buttonRefs.current[idx];
      if (btn) {
        const btnRect = btn.getBoundingClientRect();
        centers.push(btnRect.left - containerRect.left + btnRect.width / 2);
      } else {
        // Fallback mathematical distribution
        const cellWidth = width / sections.length;
        centers.push(idx * cellWidth + cellWidth / 2);
      }
    });

    if (centers.length > 0) {
      setCellCenters(centers);
    }
  }, [sections]);

  // Recalculate on mount, resize, and after DOM updates
  useEffect(() => {
    measureCells();
    window.addEventListener('resize', measureCells);

    // ResizeObserver on body to detect content/image load shifts
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && document.body) {
      ro = new ResizeObserver(() => measureCells());
      ro.observe(document.body);
    }

    return () => {
      window.removeEventListener('resize', measureCells);
      ro?.disconnect();
    };
  }, [measureCells]);

  // Continuous scroll listener to interpolate marker X and determine active label
  useEffect(() => {
    if (!isFeedHome) {
      // On category routes, place marker under current category cell
      const targetCenter = cellCenters[routeActiveIndex] ?? (isMobile ? trackWidth / 12 : 50);
      setMarkerX(targetCenter);
      setActiveIdx(routeActiveIndex);
      return;
    }

    let rafId: number | null = null;

    const updateScrollMarker = () => {
      if (sections.length === 0 || cellCenters.length === 0) return;

      const headerHeight = isMobile ? 100 : 72;
      const scrollY = window.scrollY;
      const y = scrollY + headerHeight + 40;

      // Measure current tops for all sections
      const tops = sections.map(sec => {
        const el = document.getElementById(sec.id);
        if (el) {
          return el.getBoundingClientRect().top + scrollY;
        }
        return 0;
      });

      const N = sections.length;
      let computedX = cellCenters[0];
      let currentActive = 0;

      if (y <= tops[0]) {
        // Before or at first section
        computedX = cellCenters[0];
        currentActive = 0;
      } else {
        let matched = false;
        for (let i = 0; i < N - 1; i++) {
          const tCur = tops[i];
          const tNext = tops[i + 1];
          if (y >= tCur && y < tNext) {
            const span = Math.max(1, tNext - tCur);
            const fraction = Math.min(1, Math.max(0, (y - tCur) / span));
            computedX = cellCenters[i] + fraction * (cellCenters[i + 1] - cellCenters[i]);
            currentActive = fraction < 0.5 ? i : i + 1;
            matched = true;
            break;
          }
        }

        if (!matched && y >= tops[N - 1]) {
          // After the last section's top: move toward end of track as page ends
          const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
          const maxTarget = maxScroll + headerHeight + 40;
          const remaining = Math.max(1, maxTarget - tops[N - 1]);
          const fraction = Math.min(1, Math.max(0, (y - tops[N - 1]) / remaining));
          const lastCenter = cellCenters[N - 1];
          computedX = lastCenter + fraction * (trackWidth - lastCenter);
          currentActive = N - 1;
        }
      }

      setMarkerX(computedX);
      setActiveIdx(currentActive);
    };

    const handleScroll = () => {
      if (rafId !== null) return;
      rafId = window.requestAnimationFrame(() => {
        updateScrollMarker();
        rafId = null;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    updateScrollMarker();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [isFeedHome, sections, cellCenters, trackWidth, routeActiveIndex, isMobile]);

  // Click handler: smooth-scroll to section on /feed, or navigate
  const handleItemClick = useCallback((index: number, section: CompassSection) => {
    setActiveIdx(index);
    if (isFeedHome) {
      const el = document.getElementById(section.id);
      if (el) {
        const headerHeight = isMobile ? 100 : 72;
        const top = el.getBoundingClientRect().top + window.scrollY - headerHeight;
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
  }, [isFeedHome, prefersReducedMotion, router, isMobile]);

  return (
    <nav
      aria-label="Compass navigation"
      className={`select-none ${isMobile ? 'w-full' : 'w-auto'}`}
    >
      <div
        ref={containerRef}
        style={{ width: isMobile ? '100%' : `${sections.length * 100}px` }}
        className="flex flex-col items-center"
      >
        {/* Row 1: All Section Labels in Equal-Width Cells */}
        <div className={`flex items-center ${isMobile ? 'w-full justify-between' : 'justify-center'}`}>
          {sections.map((section, idx) => {
            const isActive = activeIdx === idx;
            return (
              <button
                key={section.id}
                ref={el => { buttonRefs.current[idx] = el; }}
                type="button"
                onClick={() => handleItemClick(idx, section)}
                aria-current={isActive ? 'page' : undefined}
                style={{
                  width: isMobile ? undefined : '100px',
                  flex: isMobile ? '1 1 0%' : '0 0 100px',
                }}
                className={`py-1 text-center font-mono tracking-wider sm:tracking-widest uppercase transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#FF6B4A] ${
                  isMobile ? 'text-[10px] sm:text-[11px]' : 'text-[11px]'
                } ${
                  isActive
                    ? 'text-[#FFFDD0] font-bold opacity-100'
                    : 'text-[#FFFDD0]/55 hover:text-[#FFFDD0]/85 font-medium'
                }`}
              >
                {section.label}
              </button>
            );
          })}
        </div>

        {/* Row 2: Moving Meter Baseline, Cell Ticks & Continuous Orange Marker */}
        <div 
          className="relative w-full h-[14px] mt-0.5 pointer-events-none flex items-center"
        >
          {/* Thin 1px Baseline spanning the full row */}
          <div 
            style={{
              position: 'absolute',
              top: '6px',
              left: 0,
              right: 0,
              height: '1px',
              backgroundColor: 'rgba(255, 253, 208, 0.25)',
            }}
          />

          {/* Thicker 2px Orange Progress Fill from left edge up to marker */}
          <motion.div
            style={{
              position: 'absolute',
              top: '5.5px',
              left: 0,
              height: '2px',
              backgroundColor: '#FF6B4A',
            }}
            animate={{ width: markerX }}
            transition={
              prefersReducedMotion
                ? { duration: 0 }
                : { type: 'spring', stiffness: 350, damping: 35, bounce: 0 }
            }
          />

          {/* Cell Center Ticks */}
          {cellCenters.map((centerX, idx) => {
            const isActive = activeIdx === idx;
            return (
              <div
                key={`tick-${idx}`}
                style={{
                  position: 'absolute',
                  left: `${centerX}px`,
                  transform: 'translateX(-50%)',
                  top: isActive ? '3px' : '4.5px',
                  width: '1px',
                  height: isActive ? '7px' : '4px',
                  backgroundColor: isActive
                    ? 'rgba(255, 253, 208, 0.9)'
                    : 'rgba(255, 253, 208, 0.35)',
                  transition: 'height 0.15s ease, background-color 0.15s ease',
                }}
              />
            );
          })}

          {/* Short Orange Marker (2px wide, 12px tall) Moving continuously Left-to-Right */}
          <motion.div
            style={{
              position: 'absolute',
              top: '0.5px',
              width: '2px',
              height: '12px',
              backgroundColor: '#FF6B4A',
              borderRadius: '1px',
              boxShadow: '0 0 6px rgba(255, 107, 74, 0.6)',
              transform: 'translateX(-50%)',
              zIndex: 10,
            }}
            animate={{ left: markerX }}
            transition={
              prefersReducedMotion
                ? { duration: 0 }
                : { type: 'spring', stiffness: 350, damping: 35, bounce: 0 }
            }
          />
        </div>
      </div>
    </nav>
  );
};
