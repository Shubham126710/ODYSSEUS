import React from 'react';

export const CompassLogo = ({ className = "w-12 h-12" }: { className?: string }) => {
  return (
    <svg 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Odysseus Compass Logo"
    >
      {/* Outer Circle "O" */}
      <circle cx="50" cy="50" r="42" stroke="currentColor" strokeWidth="6" />
      
      {/* Compass Markings - Minimal */}
      <path d="M50 15 V22" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M50 78 V85" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M15 50 H22" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M78 50 H85" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      
      {/* Needle - Pointing NE */}
      <path d="M50 50 L70 30" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M50 50 L30 70" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.5" />
      
      {/* Center Dot */}
      <circle cx="50" cy="50" r="5" fill="currentColor" />
    </svg>
  );
};
