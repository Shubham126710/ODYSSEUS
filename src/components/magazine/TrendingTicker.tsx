import React from 'react';
import { decodeHtmlEntities } from '@/lib/textUtils';

interface TrendingTickerProps {
  headlines: Array<{
    title: string;
    source?: string;
    link?: string;
    excerpt?: string;
    readTime?: string;
  }>;
  onSelectStory: (story: any) => void;
}

export const TrendingTicker: React.FC<TrendingTickerProps> = ({
  headlines,
  onSelectStory,
}) => {
  if (!headlines || headlines.length === 0) return null;

  // Duplicate list for infinite seamless marquee loop
  const displayItems = [...headlines, ...headlines];

  return (
    <div 
      className="w-full h-10 bg-[#EA580C] text-[#FFFDD0] flex items-center shadow-md overflow-hidden border-y border-white/20 relative z-20 select-none"
    >
      {/* Static "TRENDING" Newspaper Badge */}
      <div className="h-full flex items-center pl-4 pr-5 bg-[#C2410C] shrink-0 border-r border-white/20 z-10">
        <div className="flex items-center gap-2 font-mono font-black text-[10px] tracking-[0.25em] uppercase text-[#FFFDD0]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#FFFDD0] animate-pulse" />
          <span>TRENDING</span>
        </div>
      </div>

      {/* Scrolling Marquee Container */}
      <div className="flex-1 overflow-hidden relative h-full flex items-center">
        {/* Soft Edge Gradient Fades */}
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#EA580C] to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#EA580C] to-transparent z-10 pointer-events-none" />

        {/* Marquee Track (Smooth, pauses on hover) */}
        <div className="flex items-center gap-10 pl-4 animate-marquee hover:[animation-play-state:paused] whitespace-nowrap cursor-pointer">
          {displayItems.map((item, idx) => {
            const num = (idx % headlines.length) + 1;
            const source = item.source ? item.source.split('>')[0].trim() : 'Wire';

            return (
              <button
                key={idx}
                type="button"
                onClick={() => onSelectStory(item)}
                className="group flex items-center gap-2.5 text-xs font-serif font-bold text-white hover:text-[#FFFDD0] transition-colors cursor-pointer text-left focus:outline-none"
              >
                {/* Numbered Item [01] */}
                <span className="font-mono text-[10px] font-bold text-[#FFFDD0]/75 group-hover:text-white shrink-0">
                  [{num.toString().padStart(2, '0')}]
                </span>

                {/* Source Pill */}
                <span className="font-mono text-[9px] uppercase tracking-wider text-[#FFFDD0]/60 shrink-0">
                  {source} •
                </span>

                {/* Headline */}
                <span className="group-hover:underline underline-offset-4 decoration-white/70 whitespace-nowrap">
                  {decodeHtmlEntities(item.title)}
                </span>

                <span className="mx-3 text-white/30 select-none">•</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
