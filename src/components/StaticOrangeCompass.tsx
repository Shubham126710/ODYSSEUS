import React from 'react';

export const StaticOrangeCompass = ({ className = "w-12 h-12" }: { className?: string }) => {
  return (
    <svg 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Odysseus Logo"
    >
      {/* Main Body - Orange Ball Style */}
      <circle cx="50" cy="50" r="48" className="fill-juice-orange" />
      
      {/* Compass Lines */}
      <path d="M50 2 A 48 48 0 0 1 50 98" className="stroke-juice-green/20" strokeWidth="2" fill="none" />
      <path d="M50 2 A 48 48 0 0 0 50 98" className="stroke-juice-green/20" strokeWidth="2" fill="none" />
      <path d="M2 50 A 48 48 0 0 1 98 50" className="stroke-juice-green/20" strokeWidth="2" fill="none" />
      
      {/* Outer Ring */}
      <circle cx="50" cy="50" r="45" className="stroke-juice-cream" strokeWidth="3" />
      
      {/* Needle - Fixed Position (NE) */}
      <g style={{ transform: 'rotate(45deg)', transformOrigin: '50px 50px' }}>
        {/* North Needle (Cream) */}
        <path d="M50 10 L58 50 L42 50 Z" className="fill-juice-cream" />
        {/* South Needle (Dark Green) */}
        <path d="M50 90 L58 50 L42 50 Z" className="fill-juice-green" />
        {/* Center Pivot */}
        <circle cx="50" cy="50" r="6" className="fill-juice-cream stroke-juice-green" strokeWidth="2" />
      </g>
    </svg>
  );
};
