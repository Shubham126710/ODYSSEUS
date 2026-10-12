import React from 'react';
import { sanitizeText } from '@/lib/textUtils';

interface TrendingTickerProps {
  headlines?: Array<{
    title: string;
    source?: string;
    link?: string;
    excerpt?: string;
    readTime?: string;
  }>;
  onSelectStory: (story: any) => void;
}

const FALLBACK_TRENDING_ITEMS = [
  { title: "One killed, 11 injured in second Houthi strike on Riyadh airport in two days", source: "Wire" },
  { title: "Federal Agents Search Home of Rep. Ilhan Omar", source: "NYT" },
  { title: "Inside the Muslim Sanctuary Rebuilt After the Caliphate", source: "WIRED" },
  { title: "Saudi and Yemeni Airports Hit in New Round of Strikes", source: "NYT" },
  { title: "Six Ukrainian energy sites hit by Russia since ceasefire", source: "BBC" },
  { title: "Who’s Winning the Race for Congress? Special Midterms Analysis", source: "NYT" },
];

export const TrendingTicker: React.FC<TrendingTickerProps> = ({
  headlines,
  onSelectStory,
}) => {
  // Always ensure we have active items so the ticker never collapses
  const rawItems = (headlines && headlines.length > 0) ? headlines : FALLBACK_TRENDING_ITEMS;

  // Duplicate list for seamless infinite marquee loop
  const displayItems = [...rawItems, ...rawItems];

  return (
    <div 
      style={{
        backgroundColor: '#FF6B4A',
        color: '#FFFDD0',
        borderColor: 'rgba(255, 253, 208, 0.25)',
        height: '36px',
        minHeight: '36px',
      }}
      className="w-full flex items-center overflow-hidden border-y select-none relative z-20"
    >
      {/* Static "TRENDING" Label */}
      <div 
        style={{
          backgroundColor: '#FF6B4A',
          borderColor: 'rgba(255, 253, 208, 0.25)',
        }}
        className="h-full flex items-center px-3 sm:px-4 shrink-0 border-r z-10"
      >
        <div className="flex items-center gap-2 sm:gap-3 font-mono font-bold text-[10px] tracking-widest uppercase text-[#FFFDD0]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#FFFDD0] animate-pulse shrink-0" />
          <span>TRENDING</span>
        </div>
      </div>

      {/* Scrolling Marquee Container */}
      <div className="flex-1 overflow-hidden relative h-full flex items-center">
        {/* Marquee Track (Smooth 38s, pauses on hover) */}
        <div 
          style={{ animationDuration: '38s' }}
          className="flex items-center gap-8 pl-4 animate-marquee hover:[animation-play-state:paused] whitespace-nowrap cursor-pointer"
        >
          {displayItems.map((item, idx) => {
            const num = (idx % rawItems.length) + 1;
            const source = item.source ? item.source.split('>')[0].trim() : 'Wire';

            return (
              <button
                key={idx}
                type="button"
                onClick={() => onSelectStory(item)}
                style={{ color: '#FFFDD0' }}
                className="group flex items-center gap-2 text-xs font-sans font-bold transition-colors cursor-pointer text-left focus:outline-none"
              >
                {/* Numbered Item [01] */}
                <span 
                  style={{ color: 'rgba(255, 253, 208, 0.7)' }}
                  className="font-mono text-[10px] group-hover:text-[#FFFDD0] shrink-0"
                >
                  [{num.toString().padStart(2, '0')}]
                </span>

                {/* Source */}
                <span 
                  style={{ color: 'rgba(255, 253, 208, 0.65)' }}
                  className="font-mono text-[9px] uppercase tracking-wider shrink-0"
                >
                  {source} •
                </span>

                {/* Headline */}
                <span className="group-hover:underline underline-offset-4 decoration-[#FFFDD0] whitespace-nowrap">
                  {sanitizeText(item.title)}
                </span>

                <span 
                  style={{ color: 'rgba(255, 253, 208, 0.35)' }}
                  className="mx-2 select-none"
                >
                  •
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
