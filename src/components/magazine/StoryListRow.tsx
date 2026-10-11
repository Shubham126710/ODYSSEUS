"use client";

import React from 'react';
import { sanitizeText, cleanSource } from '@/lib/textUtils';

interface StoryListRowProps {
  story: any;
  index?: number;
  onSelectStory: (story: any) => void;
  onToggleSave?: (story: any) => void;
  isSaved?: (story: any) => boolean;
  theme?: 'olive' | 'cream';
}

export const StoryListRow: React.FC<StoryListRowProps> = ({
  story,
  onSelectStory,
  theme = 'olive',
}) => {
  if (!story) return null;

  const displaySource = cleanSource(story.source);

  const isCream = theme === 'cream';
  const textColor = isCream ? 'text-[#5D8246]' : 'text-[#FFFDD0]';
  const metaColor = isCream ? 'text-[#5D8246]/60' : 'text-[#FFFDD0]/60';
  const readColor = isCream 
    ? 'text-[#5D8246] group-hover:text-[#FF6B4A]' 
    : 'text-[#FFFDD0] group-hover:text-[#FF6B4A]';
  const borderColor = isCream ? 'border-[#5D8246]/15' : 'border-[#FFFDD0]/15';

  return (
    <article className={`border-b ${borderColor} py-3.5 sm:py-4 flex items-center justify-between gap-4 sm:gap-6 group transition-colors`}>
      <div className="flex items-center gap-3 sm:gap-6 flex-1 min-w-0">
        {/* Tiny mono source */}
        <span className={`font-mono text-[10px] sm:text-[11px] uppercase tracking-wider font-bold shrink-0 w-24 sm:w-28 truncate ${metaColor}`}>
          {displaySource}
        </span>

        {/* Hairline subtle divider */}
        <span className={`hidden sm:inline-block ${metaColor} opacity-25 select-none font-mono text-xs`}>
          |
        </span>

        {/* Headline (text only, no thumbnail) */}
        <h3 
          onClick={() => onSelectStory(story)}
          className={`font-sans font-bold text-sm sm:text-base lg:text-lg min-w-0 flex-1 truncate cursor-pointer transition-colors group-hover:underline underline-offset-4 decoration-current/40 ${textColor}`}
        >
          {sanitizeText(story.title)}
        </h3>
      </div>

      {/* READ → CTA */}
      <button
        type="button"
        onClick={() => onSelectStory(story)}
        className={`${readColor} shrink-0 font-bold text-xs uppercase tracking-wider inline-flex items-center gap-1 group/btn cursor-pointer transition-colors`}
      >
        <span>Read</span>
        <span className="transition-transform duration-200 group-hover/btn:translate-x-1">→</span>
      </button>
    </article>
  );
};
