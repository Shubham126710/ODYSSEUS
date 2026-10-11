import React from 'react';

interface EditorialMonogramPosterProps {
  source: string;
  category?: string;
  title?: string;
  className?: string;
}

// Color schemes per editorial theme
const THEME_MAP: Record<string, { bg: string; border: string; accent: string; text: string; glyph: string }> = {
  tech: {
    bg: 'bg-gradient-to-br from-[#1E2E20] to-[#2E4632]',
    border: 'border-[#5D8246]/30',
    accent: '#FF6B4A',
    text: 'text-[#F5F2EB]',
    glyph: '✦',
  },
  design: {
    bg: 'bg-gradient-to-br from-[#2E2822] to-[#453A30]',
    border: 'border-[#D9822B]/30',
    accent: '#FF6B4A',
    text: 'text-[#F5F2EB]',
    glyph: '◈',
  },
  culture: {
    bg: 'bg-gradient-to-br from-[#22272E] to-[#323942]',
    border: 'border-[#5A874F]/30',
    accent: '#FF6B4A',
    text: 'text-[#F5F2EB]',
    glyph: '◆',
  },
  science: {
    bg: 'bg-gradient-to-br from-[#1C2630] to-[#28384A]',
    border: 'border-[#4A7BB0]/30',
    accent: '#FF6B4A',
    text: 'text-[#F5F2EB]',
    glyph: '❖',
  },
  default: {
    bg: 'bg-gradient-to-br from-[#243624] to-[#364F36]',
    border: 'border-[#5D8246]/30',
    accent: '#FF6B4A',
    text: 'text-[#F5F2EB]',
    glyph: '✦',
  },
};

export const EditorialMonogramPoster: React.FC<EditorialMonogramPosterProps> = ({
  source,
  category = 'General',
  title = '',
  className = 'w-full h-full',
}) => {
  const catKey = category.toLowerCase().includes('tech')
    ? 'tech'
    : category.toLowerCase().includes('design')
    ? 'design'
    : category.toLowerCase().includes('culture')
    ? 'culture'
    : category.toLowerCase().includes('science')
    ? 'science'
    : 'default';

  const theme = THEME_MAP[catKey];

  // Derive a 2-character monogram
  const cleanSource = source.replace(/^(The\s+)/i, '').trim();
  const monogram = (cleanSource.length >= 2 ? cleanSource.slice(0, 2) : cleanSource.charAt(0) + 'X').toUpperCase();

  return (
    <div
      className={`relative overflow-hidden select-none flex flex-col justify-between p-4 ${theme.bg} ${theme.text} ${className}`}
    >
      {/* Background Architectural Geometry & Halftone Grid */}
      <svg
        className="absolute inset-0 w-full h-full opacity-15 pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id={`poster-grid-${catKey}`} width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1" fill="currentColor" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#poster-grid-${catKey})`} />
        {/* Subtle Diagonal Latitude Line */}
        <line x1="0" y1="100%" x2="100%" y2="0" stroke="currentColor" strokeWidth="1" strokeDasharray="3 4" />
      </svg>

      {/* Top Foil Header */}
      <div className="relative z-10 flex items-center justify-between text-[9px] font-mono uppercase tracking-[0.2em] opacity-75">
        <span className="flex items-center gap-1.5 font-bold">
          <span style={{ color: theme.accent }}>{theme.glyph}</span>
          <span>{source}</span>
        </span>
        <span className="text-[8px] opacity-60">ARCHIVAL FOLIO</span>
      </div>

      {/* Centerpiece Monogram & Compass Coordinates */}
      <div className="relative z-10 my-auto flex flex-col items-center justify-center text-center py-2">
        <div className="relative flex items-center justify-center">
          {/* Concentric coordinate ring around monogram */}
          <div className="absolute w-16 h-16 rounded-full border border-white/20 animate-[spin_120s_linear_infinite]" />
          <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-xs border border-white/20 flex items-center justify-center">
            <span className="font-serif font-black text-xl tracking-wider text-juice-cream">
              {monogram}
            </span>
          </div>
        </div>
        <span className="mt-2 text-[9px] font-mono uppercase tracking-[0.25em] text-white/50">
          EDITION DISPATCH
        </span>
      </div>

      {/* Bottom Editorial Banner */}
      <div className="relative z-10 flex items-center justify-between pt-2 border-t border-white/10 text-[8px] font-mono uppercase tracking-wider text-white/60">
        <span className="truncate max-w-[140px]">{category}</span>
        <span style={{ color: theme.accent }} className="font-bold">ODYSSEUS</span>
      </div>
    </div>
  );
};
