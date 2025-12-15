"use client";

import React, { useState, useEffect, useRef } from 'react';

export const InteractiveCompass = ({ className = "w-64 h-64" }: { className?: string }) => {
  const [rotation, setRotation] = useState(0);
  const compassRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!compassRef.current) return;

      const rect = compassRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const deltaX = e.clientX - centerX;
      const deltaY = e.clientY - centerY;

      const angleRad = Math.atan2(deltaY, deltaX);
      const angleDeg = angleRad * (180 / Math.PI);
      
      setRotation(angleDeg + 90);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className={`${className} relative flex items-center justify-center group cursor-pointer`}>
      {/* "Spin Me" Badge - Mimicking the "Spin the Ball" tag */}
      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-juice-green text-juice-cream text-[10px] font-bold px-2 py-1 uppercase tracking-widest border border-juice-cream/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
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
        <g style={{ transform: `rotate(${rotation}deg)`, transformOrigin: '50px 50px', transition: 'transform 0.1s ease-out' }}>
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
