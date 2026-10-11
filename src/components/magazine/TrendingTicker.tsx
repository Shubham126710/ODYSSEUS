import React from 'react';
import { sanitizeText } from '@/lib/textUtils';

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

  // Duplicate list for seamless infinite marquee loop
  const displayItems = [...headlines, ...headlines];

  return (
    <div 
      className="w-full h-8 sm:h-9 bg-juice-orange text-juice-cream flex items-center overflow-hidden border-y border-juice-cream/20 select-none"
    >
      {/* Static "TRENDING" Label */}
      <div className="h-full flex items-center px-3 sm:px-4 bg-juice-orange shrink-0 border-r border-juice-cream/20 z-10">
        <div className="flex items-center gap-4 font-mono font-bold text-[10px] tracking-widest uppercase text-juice-cream">
          <span className="w-1.5 h-1.5 rounded-full bg-juice-cream animate-pulse shrink-0" />
          <span>TRENDING</span>
        </div>
      </div>

      {/* Scrolling Marquee Container */}
      <div className="flex-1 overflow-hidden relative h-full flex items-center">
        {/* Marquee Track (Smooth, pauses on hover) */}
        <div className="flex items-center gap-8 pl-4 animate-marquee hover:[animation-play-state:paused] whitespace-nowrap cursor-pointer">
          {displayItems.map((item, idx) => {
            const num = (idx % headlines.length) + 1;
            const source = item.source ? item.source.split('>')[0].trim() : 'Wire';

            return (
              <button
                key={idx}
                type="button"
                onClick={() => onSelectStory(item)}
                className="group flex items-center gap-2 text-xs font-sans font-bold text-juice-cream transition-colors cursor-pointer text-left focus:outline-none"
              >
                {/* Numbered Item [01] */}
                <span className="font-mono text-[10px] text-juice-cream/70 group-hover:text-juice-cream shrink-0">
                  [{num.toString().padStart(2, '0')}]
                </span>

                {/* Source */}
                <span className="font-mono text-[9px] uppercase tracking-wider text-juice-cream/60 shrink-0">
                  {source} •
                </span>

                {/* Headline */}
                <span className="group-hover:underline underline-offset-4 decoration-juice-cream whitespace-nowrap">
                  {sanitizeText(item.title)}
                </span>

                <span className="mx-2 text-juice-cream/30 select-none">•</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
