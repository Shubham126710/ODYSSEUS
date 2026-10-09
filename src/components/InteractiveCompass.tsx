"use client";

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

export const InteractiveCompass = ({ className = "w-64 h-64" }: { className?: string }) => {
  const compassRef = useRef<SVGSVGElement>(null);
  const needleRef = useRef<SVGGElement>(null);
  const centerRef = useRef<{ x: number; y: number } | null>(null);
  const currentAngleRef = useRef(0);
  const isSpinningRef = useRef(false);

  useEffect(() => {
    const updateCenter = () => {
      if (!compassRef.current) return;
      const rect = compassRef.current.getBoundingClientRect();
      centerRef.current = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
    };

    updateCenter();
    window.addEventListener('resize', updateCenter);
    window.addEventListener('scroll', updateCenter, { passive: true });

    const handlePointerMove = (e: PointerEvent) => {
      if (isSpinningRef.current || !needleRef.current) return;

      if (!centerRef.current) {
        updateCenter();
        if (!centerRef.current) return;
      }

      const deltaX = e.clientX - centerRef.current.x;
      const deltaY = e.clientY - centerRef.current.y;

      const angleRad = Math.atan2(deltaY, deltaX);
      const rawAngle = (angleRad * (180 / Math.PI)) + 90;

      // Calculate shortest angular distance to prevent wild 360° reverse flips
      let diff = (rawAngle - currentAngleRef.current) % 360;
      if (diff < -180) diff += 360;
      if (diff > 180) diff -= 360;

      currentAngleRef.current += diff;

      gsap.to(needleRef.current, {
        rotation: currentAngleRef.current,
        transformOrigin: "50px 50px",
        duration: 0.12,
        ease: "power1.out",
        overwrite: "auto",
      });
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });

    return () => {
      window.removeEventListener('resize', updateCenter);
      window.removeEventListener('scroll', updateCenter);
      window.removeEventListener('pointermove', handlePointerMove);
    };
  }, []);

  const handleCompassClick = () => {
    if (!needleRef.current) return;
    isSpinningRef.current = true;

    // Add 2 full spins with momentum
    currentAngleRef.current += 720;

    gsap.to(needleRef.current, {
      rotation: currentAngleRef.current,
      transformOrigin: "50px 50px",
      duration: 1.2,
      ease: "power3.out",
      overwrite: true,
      onComplete: () => {
        isSpinningRef.current = false;
      },
    });

    if (compassRef.current) {
      gsap.fromTo(
        compassRef.current,
        { scale: 0.94 },
        { scale: 1, duration: 0.4, ease: "back.out(2)" }
      );
    }
  };

  return (
    <div 
      onClick={handleCompassClick}
      className={`${className} relative flex items-center justify-center group cursor-pointer select-none`}
    >
      {/* "Spin Me" Badge - Mimicking the "Spin the Ball" tag */}
      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-juice-green text-juice-cream text-[10px] font-bold px-2 py-1 uppercase tracking-widest border border-juice-cream/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap shadow-md">
        Spin the Compass
      </div>

      <svg 
        ref={compassRef}
        viewBox="0 0 100 100" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-2xl transition-transform duration-300 group-hover:scale-105"
        aria-label="Interactive Compass"
      >
        {/* Main Body - Orange Ball Style */}
        <circle cx="50" cy="50" r="48" className="fill-juice-orange" />
        
        {/* Compass Lines - Mimicking Basketball Lines but as Compass Markings */}
        {/* Vertical Meridian */}
        <path d="M50 2 A 48 48 0 0 1 50 98" className="stroke-juice-green/20" strokeWidth="1" fill="none" />
        <path d="M50 2 A 48 48 0 0 0 50 98" className="stroke-juice-green/20" strokeWidth="1" fill="none" />
        
        {/* Horizontal Equator */}
        <path d="M2 50 A 48 48 0 0 1 98 50" className="stroke-juice-green/20" strokeWidth="1" fill="none" />
        
        {/* Outer Ring */}
        <circle cx="50" cy="50" r="45" className="stroke-juice-cream" strokeWidth="2" />

        {/* Rotating Needle Group */}
        <g 
          ref={needleRef} 
          style={{ transformOrigin: '50px 50px' }}
        >
          {/* North Needle (Cream) */}
          <path d="M50 10 L58 50 L42 50 Z" className="fill-juice-cream" />
          
          {/* South Needle (Dark Green) */}
          <path d="M50 90 L58 50 L42 50 Z" className="fill-juice-green" />
          
          {/* Center Pivot */}
          <circle cx="50" cy="50" r="5" className="fill-juice-cream stroke-juice-green" strokeWidth="2" />
        </g>
      </svg>
    </div>
  );
};
