import React from 'react';

interface EditorialMonogramPosterProps {
  source: string;
  category?: string;
  title?: string;
  className?: string;
}

const THEME_STYLES: Record<string, { bg: string; accent: string; glyph: string }> = {
  tech: {
    bg: 'linear-gradient(135deg, #131A14 0%, #1E2B20 100%)',
    accent: '#E65100',
    glyph: '✦',
  },
  design: {
    bg: 'linear-gradient(135deg, #1C1917 0%, #292524 100%)',
    accent: '#FF6B4A',
    glyph: '◈',
  },
  culture: {
    bg: 'linear-gradient(135deg, #1E1B24 0%, #2D2837 100%)',
    accent: '#D97706',
    glyph: '◆',
  },
  science: {
    bg: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
    accent: '#0284C7',
    glyph: '❖',
  },
  default: {
    bg: 'linear-gradient(135deg, #18181B 0%, #27272A 100%)',
    accent: '#FF6B4A',
    glyph: '✦',
  },
};

export const EditorialMonogramPoster: React.FC<EditorialMonogramPosterProps> = ({
  source,
  category = 'General',
  title = '',
  className = 'w-full h-full',
}) => {
  const cat = (category || '').toLowerCase();
  const theme = cat.includes('tech')
    ? THEME_STYLES.tech
    : cat.includes('design')
    ? THEME_STYLES.design
    : cat.includes('culture')
    ? THEME_STYLES.culture
    : cat.includes('science')
    ? THEME_STYLES.science
    : THEME_STYLES.default;

  const cleanSource = source.replace(/^(The\s+)/i, '').trim();
  const initials = (cleanSource.length >= 2 ? cleanSource.slice(0, 2) : cleanSource.charAt(0) + '•').toUpperCase();

  return (
    <div
      style={{ background: theme.bg }}
      className={`relative overflow-hidden select-none flex flex-col justify-between p-5 text-[#FFFDD0] ${className}`}
    >
      {/* Background Architectural Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px)',
          backgroundSize: '16px 16px',
        }}
      />

      {/* Top Foil Header */}
      <div className="relative z-10 flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.2em] text-white/70">
        <span className="flex items-center gap-1.5 font-bold">
          <span style={{ color: theme.accent }}>{theme.glyph}</span>
          <span>{source}</span>
        </span>
        <span className="text-[9px] text-white/40">EDITORIAL</span>
      </div>

      {/* Centerpiece Monogram */}
      <div className="relative z-10 my-auto flex flex-col items-center justify-center text-center py-4">
        <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-center shadow-lg">
          <span className="font-serif font-bold text-2xl tracking-wider text-white">
            {initials}
          </span>
        </div>
        <span className="mt-3 text-[10px] font-mono uppercase tracking-[0.25em] text-white/50">
          ODYSSEUS DISPATCH
        </span>
      </div>

      {/* Bottom Meta */}
      <div className="relative z-10 flex items-center justify-between pt-3 border-t border-white/10 text-[9px] font-mono uppercase tracking-wider text-white/50">
        <span className="truncate max-w-[150px]">{category}</span>
        <span style={{ color: theme.accent }} className="font-bold">VERIFIED</span>
      </div>
    </div>
  );
};
