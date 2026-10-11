"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';

export interface ScrollRailSection {
  id: string;
  label: string;
}

export interface ScrollRailProps {
  sections: ScrollRailSection[];
  navOffset?: number;
  className?: string;
}

export const ScrollRail: React.FC<ScrollRailProps> = ({
  sections,
  navOffset = 72,
  className = "",
}) => {
  const [activeSectionId, setActiveSectionId] = useState<string>(sections[0]?.id || '');
  const trackRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const percentLabelRef = useRef<HTMLSpanElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Generate 101 ticks (0% to 100% in 1% increments)
  const ticks = useMemo(() => {
    return Array.from({ length: 101 }, (_, i) => ({
      percent: i,
      isMajor: i % 5 === 0, // 0, 5, 10, 15 ... 95, 100
      isDecade: i % 10 === 0,
      label: i.toString().padStart(2, '0'),
    }));
  }, []);

  // Smooth scroll to section with navOffset and prefers-reduced-motion check
  const scrollToSection = useCallback((id: string) => {
    if (typeof document === 'undefined') return;
    const element = document.getElementById(id);
    if (!element) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const top = element.getBoundingClientRect().top + window.scrollY - navOffset;

    window.scrollTo({
      top: Math.max(0, top),
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    });
  }, [navOffset]);

  // Scrub document scroll position based on vertical pointer position
  const scrubToClientY = useCallback((clientY: number, smooth: boolean = false) => {
    if (!trackRef.current || typeof window === 'undefined') return;
    const rect = trackRef.current.getBoundingClientRect();
    const relativeY = clientY - rect.top;
    const percent = Math.min(Math.max(relativeY / rect.height, 0), 1);

    const docElem = document.documentElement;
    const maxScroll = docElem.scrollHeight - window.innerHeight;
    const targetScroll = percent * maxScroll;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    window.scrollTo({
      top: targetScroll,
      behavior: (smooth && !prefersReducedMotion) ? 'smooth' : 'auto',
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

  // Scroll Progress Calculation via requestAnimationFrame for 60/120fps performance
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let rAFId: number | null = null;

    const updateScrollProgress = () => {
      const docElem = document.documentElement;
      const maxScroll = docElem.scrollHeight - window.innerHeight;
      const currentScroll = window.scrollY;

      const progress = maxScroll > 0
        ? Math.min(Math.max((currentScroll / maxScroll) * 100, 0), 100)
        : 0;

      // Update indicator position directly in DOM (zero re-render overhead)
      if (indicatorRef.current) {
        indicatorRef.current.style.top = `${progress}%`;
      }

      // Update active percentage string directly in DOM
      if (percentLabelRef.current) {
        const text = progress >= 100 
          ? '100%' 
          : `${Math.round(progress).toString().padStart(3, '0')}%`;
        percentLabelRef.current.textContent = text;
      }
    };

    const onScroll = () => {
      if (rAFId === null) {
        rAFId = window.requestAnimationFrame(() => {
          updateScrollProgress();
          rAFId = null;
        });
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    updateScrollProgress();

    return () => {
      if (rAFId !== null) window.cancelAnimationFrame(rAFId);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  // IntersectionObserver for section detection (smooth transitions between active sections)
  useEffect(() => {
    if (typeof window === 'undefined' || !sections.length) return;

    const observerOptions = {
      root: null,
      rootMargin: `-${navOffset}px 0px -45% 0px`,
      threshold: [0, 0.2, 0.5],
    };

    const handleIntersect: IntersectionObserverCallback = (entries) => {
      // Find the topmost intersecting entry
      const visible = entries.filter((e) => e.isIntersecting);
      if (visible.length > 0) {
        // Sort by distance from top of viewport
        visible.sort((a, b) => Math.abs(a.boundingClientRect.top - navOffset) - Math.abs(b.boundingClientRect.top - navOffset));
        setActiveSectionId(visible[0].target.id);
      }
    };

    const observer = new IntersectionObserver(handleIntersect, observerOptions);

    sections.forEach((sec) => {
      const el = document.getElementById(sec.id);
      if (el) observer.observe(el);
    });

    // Fallback: check on initial load in case observer hasn't fired yet
    const checkInitial = () => {
      const scrollY = window.scrollY;
      let matched = sections[0]?.id;
      for (const sec of sections) {
        const el = document.getElementById(sec.id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= window.innerHeight * 0.45) {
            matched = sec.id;
          }
        }
      }
      if (matched) setActiveSectionId(matched);
    };
    checkInitial();

    return () => observer.disconnect();
  }, [sections, navOffset]);

  if (!sections || sections.length === 0) return null;

  return (
    <aside
      aria-label="Vertical navigation rail and scroll progress indicator"
      className={`fixed right-0 top-16 bottom-0 z-40 select-none pointer-events-none flex items-stretch justify-end pr-0.5 sm:pr-1 ${className}`}
    >
      <div className="relative h-full flex items-stretch pointer-events-auto">

        {/* SECTION NAVIGATION LABELS (Visible on desktop lg+) */}
        <nav
          aria-label="Section shortcuts"
          className="hidden lg:flex flex-col justify-between py-8 pr-2.5 items-end pointer-events-auto"
        >
          {sections.map((section) => {
            const isActive = activeSectionId === section.id;
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => scrollToSection(section.id)}
                aria-label={`Navigate to section ${section.label}`}
                aria-current={isActive ? 'true' : undefined}
                className={`group py-2 px-1 cursor-pointer transition-all duration-300 flex items-center justify-center focus:outline-none focus-visible:ring-1 focus-visible:ring-[#EA580C] ${
                  isActive
                    ? 'text-[#FFFDD0] font-bold opacity-100'
                    : 'text-white/35 hover:text-white/80 font-medium opacity-60 hover:opacity-100'
                }`}
                style={{
                  writingMode: 'vertical-rl',
                  transform: 'rotate(180deg)',
                }}
              >
                <span className={`font-mono text-[9px] uppercase tracking-[0.25em] transition-all duration-200 ${
                  isActive ? 'text-[#FFFDD0] scale-105' : 'text-white/50'
                }`}>
                  {section.label}
                </span>
              </button>
            );
          })}
        </nav>

        {/* PRECISION TECHNICAL GRADUATED RULER RAIL */}
        <div
          ref={trackRef}
          onClick={handleTrackClick}
          onMouseDown={handleMouseDown}
          role="slider"
          aria-label="Scroll progress gauge"
          aria-valuemin={0}
          aria-valuemax={100}
          className="relative w-8 sm:w-11 md:w-12 h-full flex flex-col items-end cursor-pointer group pointer-events-auto"
        >
          {/* Thin 1px Vertical Track Line */}
          <div className="absolute right-0 top-0 bottom-0 w-[1px] bg-white/20 group-hover:bg-white/30 transition-colors duration-200" />

          {/* Graduated Horizontal Ticks & Numeric Percentage Labels */}
          <div className="relative w-full h-full flex flex-col justify-between pointer-events-none py-1">
            {ticks.map((tick) => (
              <div
                key={tick.percent}
                className="flex items-center justify-end w-full relative"
                style={{ height: '0px' }}
              >
                {/* Percentage Numeric Label (Displayed every 5% on desktop, every 10% on tablet) */}
                {tick.isMajor && (
                  <span
                    className={`absolute right-3.5 sm:right-4 font-mono text-[7px] select-none transition-colors duration-150 ${
                      tick.isDecade
                        ? 'text-white/40 font-semibold'
                        : 'hidden sm:inline text-white/25'
                    }`}
                  >
                    {tick.label}
                  </span>
                )}

                {/* Horizontal Tick Mark extending to the left from the vertical track */}
                <span
                  className={`block transition-all duration-150 ${
                    tick.isDecade
                      ? 'w-3 sm:w-3.5 h-[1px] bg-white/70'
                      : tick.isMajor
                      ? 'w-2 sm:w-2.5 h-[1px] bg-white/45'
                      : 'w-1 sm:w-1.5 h-[1px] bg-white/20'
                  }`}
                />
              </div>
            ))}
          </div>

          {/* ACTIVE PROGRESS INDICATOR (Subtle thin indicator line + live percentage badge) */}
          <div
            ref={indicatorRef}
            className="absolute right-0 pointer-events-none flex items-center justify-end will-change-[top]"
            style={{
              top: '0%',
              transform: 'translateY(-50%)',
              transition: 'top 80ms ease-out',
            }}
          >
            {/* Live Percentage Value Label */}
            <span
              ref={percentLabelRef}
              className="mr-1.5 font-mono text-[8px] sm:text-[9px] font-bold text-[#EA580C] tracking-tight select-none"
            >
              000%
            </span>

            {/* Thin Subtle Accent Line extending from track */}
            <span className="w-4 sm:w-5 h-[1.5px] bg-[#EA580C] shadow-[0_0_6px_rgba(234,88,12,0.8)]" />
          </div>

        </div>

      </div>
    </aside>
  );
};
