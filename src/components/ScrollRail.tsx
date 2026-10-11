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

  // Generate 51 ticks (every 2% for an airy, elegant precision gauge)
  // Only key milestones (0, 20, 40, 60, 80, 100) receive numeric values
  const ticks = useMemo(() => {
    return Array.from({ length: 51 }, (_, i) => {
      const percent = i * 2;
      return {
        percent,
        isMilestone: percent % 20 === 0, // 0, 20, 40, 60, 80, 100
        isMajor: percent % 10 === 0,     // 10, 30, 50, 70, 90
        label: percent.toString().padStart(2, '0'),
      };
    });
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

      // Boundary fallback for active section detection
      if (currentScroll < 100 && sections.length > 0) {
        setActiveSectionId(sections[0].id);
      } else if (maxScroll > 0 && currentScroll >= maxScroll - 80 && sections.length > 0) {
        setActiveSectionId(sections[sections.length - 1].id);
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
  }, [sections]);

  // IntersectionObserver for section detection (smooth transitions between active sections)
  useEffect(() => {
    if (typeof window === 'undefined' || !sections.length) return;

    const observerOptions = {
      root: null,
      rootMargin: `-${navOffset}px 0px -40% 0px`,
      threshold: [0, 0.2, 0.5],
    };

    const handleIntersect: IntersectionObserverCallback = (entries) => {
      // Find the topmost intersecting entry
      const visible = entries.filter((e) => e.isIntersecting);
      if (visible.length > 0) {
        visible.sort((a, b) => Math.abs(a.boundingClientRect.top - navOffset) - Math.abs(b.boundingClientRect.top - navOffset));
        setActiveSectionId(visible[0].target.id);
      }
    };

    const observer = new IntersectionObserver(handleIntersect, observerOptions);

    sections.forEach((sec) => {
      const el = document.getElementById(sec.id);
      if (el) observer.observe(el);
    });

    const checkInitial = () => {
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
      aria-label="Vertical reading progress and section navigation"
      className={`fixed right-1 sm:right-2 top-28 bottom-10 z-40 select-none pointer-events-none flex items-stretch justify-end opacity-75 hover:opacity-100 transition-opacity duration-300 group/rail ${className}`}
    >
      <div className="relative h-full flex items-stretch pointer-events-auto">

        {/* SECTION NAVIGATION LABELS (Rotated vertically, whisper-quiet until hovered/active) */}
        <nav
          aria-label="Section shortcuts"
          className="hidden lg:flex flex-col justify-between py-3 pr-1.5 items-end pointer-events-auto"
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
                className={`group/btn py-1 px-0.5 cursor-pointer transition-all duration-200 flex items-center justify-center focus:outline-none focus-visible:ring-1 focus-visible:ring-[#EA580C] ${
                  isActive
                    ? 'text-[#FFFDD0] font-bold opacity-100'
                    : 'text-white/25 hover:text-white/70 font-medium opacity-60 hover:opacity-100'
                }`}
                style={{
                  writingMode: 'vertical-rl',
                  transform: 'rotate(180deg)',
                }}
              >
                <span className="flex items-center gap-1">
                  {isActive && (
                    <span className="w-1 h-1 rounded-full bg-[#EA580C] mb-1 shrink-0" />
                  )}
                  <span className={`font-mono text-[7px] sm:text-[7.5px] uppercase tracking-[0.22em] transition-all duration-200 ${
                    isActive 
                      ? 'text-[#FFFDD0] font-bold tracking-[0.28em]' 
                      : 'text-white/30 group-hover/btn:text-white/75'
                  }`}>
                    {section.label}
                  </span>
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
          className="relative w-4 sm:w-5 h-full flex flex-col items-end cursor-pointer pointer-events-auto"
        >
          {/* Thin 1px Vertical Track Line */}
          <div className="absolute right-0 top-0 bottom-0 w-[1px] bg-white/12 group-hover/rail:bg-white/25 transition-colors duration-200" />

          {/* Graduated Horizontal Ticks & Numeric Milestone Labels */}
          <div className="relative w-full h-full flex flex-col justify-between pointer-events-none py-1">
            {ticks.map((tick) => (
              <div
                key={tick.percent}
                className="flex items-center justify-end w-full relative"
                style={{ height: '0px' }}
              >
                {/* Milestone Numeric Label (Only 00, 20, 40, 60, 80, 100) */}
                {tick.isMilestone && (
                  <span
                    className="absolute right-2.5 sm:right-3 font-mono text-[6px] sm:text-[6.5px] select-none text-white/20 group-hover/rail:text-white/40 transition-colors pointer-events-none"
                  >
                    {tick.label}
                  </span>
                )}

                {/* Subtle Horizontal Hairline Tick Mark */}
                <span
                  className={`block transition-all duration-150 ${
                    tick.isMilestone
                      ? 'w-2 sm:w-2.5 h-[1px] bg-white/20 group-hover/rail:bg-white/35'
                      : tick.isMajor
                      ? 'w-1.5 sm:w-2 h-[1px] bg-white/12 group-hover/rail:bg-white/25'
                      : 'w-1 h-[1px] bg-white/[0.06] group-hover/rail:bg-white/[0.12]'
                  }`}
                />
              </div>
            ))}
          </div>

          {/* ACTIVE PROGRESS INDICATOR (Delicate 1px line + tiny readout) */}
          <div
            ref={indicatorRef}
            className="absolute right-0 pointer-events-none flex items-center justify-end will-change-[top] z-10"
            style={{
              top: '0%',
              transform: 'translateY(-50%)',
              transition: 'top 60ms linear',
            }}
          >
            {/* Live Percentage Value Label */}
            <span
              ref={percentLabelRef}
              className="mr-1 font-mono text-[7px] sm:text-[7.5px] font-bold text-[#EA580C] tracking-tight select-none"
            >
              000%
            </span>

            {/* Delicate Accent Tick Line */}
            <span className="w-2.5 sm:w-3.5 h-[1.5px] bg-[#EA580C] shrink-0" />
          </div>

        </div>

      </div>
    </aside>
  );
};
