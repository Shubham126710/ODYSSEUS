"use client";

import React from 'react';
import { sanitizeText, cleanSource, computeReadTime } from '@/lib/textUtils';

interface TheLatestListProps {
  headlines: any[];
  onSelectStory: (story: any) => void;
}

export const TheLatestList: React.FC<TheLatestListProps> = ({
  headlines,
  onSelectStory,
}) => {
  const items = (headlines || []).slice(0, 4);
  if (items.length === 0) return null;

  return (
    <section 
      aria-label="The Latest Wire Stories" 
      className="w-full py-8 sm:py-10 border-b border-[#FFFDD0]/15"
    >
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10">
        
        {/* Section Heading */}
        <div className="flex items-center justify-between pb-3 mb-6 border-b border-[#FFFDD0]/10">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF694F]" />
            <h2 className="font-mono text-[10px] sm:text-xs uppercase tracking-widest text-[#FFFDD0]/90 font-bold">
              THE LATEST / DEVELOPING STORIES
            </h2>
          </div>
          <span className="font-mono text-[10px] sm:text-xs uppercase tracking-widest text-[#FFFDD0]/40">
            REAL-TIME WIRE
          </span>
        </div>

        {/* 4-Item Restrained Editorial Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {items.map((item, idx) => {
            const displaySource = cleanSource(item.source);
            const displayReadTime = computeReadTime(item);

            return (
              <article 
                key={item.link || item.id || idx}
                onClick={() => onSelectStory(item)}
                className="group cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 text-[9px] sm:text-[10px] font-mono uppercase tracking-widest text-[#FFFDD0]/50 mb-1.5">
                    <span className="text-[#FF694F] font-bold">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <span>·</span>
                    <span className="font-semibold text-[#FFFDD0]/75">{displaySource}</span>
                  </div>

                  <h3 className="text-sm font-sans font-bold text-[#FFFDD0] leading-snug group-hover:text-[#FF694F] transition-colors line-clamp-2">
                    {sanitizeText(item.title)}
                  </h3>
                </div>

                <div className="mt-3 pt-2 border-t border-[#FFFDD0]/10 flex items-center justify-between text-[9px] font-mono uppercase tracking-wider text-[#FFFDD0]/40">
                  <span>{displayReadTime || '2 MIN'}</span>
                  <span className="group-hover:translate-x-1 transition-transform text-[#FF694F]">→</span>
                </div>
              </article>
            );
          })}
        </div>

      </div>
    </section>
  );
};
