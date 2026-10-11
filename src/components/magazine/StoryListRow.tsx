"use client";

import React, { useState } from 'react';
import { sanitizeText, cleanSource, cleanCategory, computeReadTime } from '@/lib/textUtils';

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
  index = 0,
  onSelectStory,
  onToggleSave,
  isSaved,
  theme = 'olive',
}) => {
  const [useProxy, setUseProxy] = useState(false);
  const [imageError, setImageError] = useState(!story?.imageUrl);

  if (!story) return null;

  const handleImageError = () => {
    if (!useProxy && story.imageUrl) {
      setUseProxy(true);
    } else {
      setImageError(true);
    }
  };

  const activeSrc = useProxy && story.imageUrl
    ? `/api/image-proxy?url=${encodeURIComponent(story.imageUrl)}`
    : story.imageUrl;

  const hasImage = !imageError && !!activeSrc;

  // Metadata cleanup: only real source name and valid category, suppress "1 MIN"
  const displaySource = cleanSource(story.source);
  const displayCategory = cleanCategory(story.category);
  const displayReadTime = computeReadTime(story);

  // Hierarchy: First 2 rows after lead story's headline are slightly larger
  const isProminent = index < 2;

  const isCream = theme === 'cream';
  const textColor = isCream ? 'text-juice-green' : 'text-juice-cream';
  const metaColor = isCream ? 'text-juice-green/60' : 'text-juice-cream/60';
  const metaBold = isCream ? 'text-juice-green/85' : 'text-juice-cream/85';
  const saveColor = isCream ? 'text-juice-green/70 hover:text-juice-green' : 'text-juice-cream/70 hover:text-juice-cream';
  const readColor = isCream ? 'text-juice-green group-hover:text-juice-orange' : 'text-juice-cream group-hover:text-juice-orange';
  const borderColor = isCream ? 'border-juice-green/15' : 'border-juice-cream/15';

  return (
    <article className={`border-b ${borderColor} py-5 sm:py-6 flex flex-col md:flex-row md:items-center gap-4 sm:gap-6 justify-between group transition-colors`}>
      <div className="flex items-start sm:items-center gap-4 sm:gap-6 flex-1 min-w-0">
        
        {/* Fixed 128px x 96px (4:3) Thumbnail Column:
            If a story has no image, keeps the column empty so all headlines start at the same x position */}
        <div className="w-[128px] h-[96px] shrink-0 overflow-hidden">
          {hasImage ? (
            <div 
              onClick={() => onSelectStory(story)}
              className="w-full h-full cursor-pointer overflow-hidden"
            >
              <img 
                src={activeSrc} 
                alt={story.title} 
                onError={handleImageError}
                className="w-full h-full object-cover" 
              />
            </div>
          ) : (
            <div className="w-full h-full pointer-events-none" aria-hidden="true" />
          )}
        </div>

        {/* Story Metadata & Headline */}
        <div className="flex-1 min-w-0 space-y-1">
          {/* Metadata */}
          <div className={`font-mono text-[9px] sm:text-[10px] uppercase tracking-widest ${metaColor} flex items-center gap-2`}>
            <span className={`font-bold ${metaBold}`}>{displaySource}</span>
            {displayCategory && (
              <>
                <span className="opacity-40">•</span>
                <span>{displayCategory}</span>
              </>
            )}
            {displayReadTime && (
              <>
                <span className="opacity-40">•</span>
                <span>{displayReadTime}</span>
              </>
            )}
          </div>

          {/* Headline in Heavy Grotesk: First 2 rows slightly larger for editorial rhythm */}
          <h3 
            onClick={() => onSelectStory(story)}
            className={`font-sans font-black tracking-tight leading-snug cursor-pointer transition-colors group-hover:underline underline-offset-4 decoration-current/40 ${textColor} ${
              isProminent
                ? 'text-xl sm:text-2xl min-[900px]:text-3xl'
                : 'text-lg sm:text-xl min-[900px]:text-2xl'
            }`}
          >
            {sanitizeText(story.title)}
          </h3>
        </div>

      </div>

      {/* Action CTA: "READ →" cream by default and orange on hover; "SAVE +" at 70% opacity */}
      <div className="flex items-center gap-4 shrink-0 pl-0 md:pl-4 self-end md:self-center">
        {onToggleSave && (
          <button
            type="button"
            onClick={() => onToggleSave(story)}
            className={`${saveColor} text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer`}
            title={isSaved?.(story) ? 'Saved' : 'Save'}
          >
            {isSaved?.(story) ? 'Saved ✓' : 'Save +'}
          </button>
        )}

        <button
          type="button"
          onClick={() => onSelectStory(story)}
          className={`${readColor} font-bold text-xs uppercase tracking-wider inline-flex items-center gap-1 group/btn cursor-pointer transition-colors`}
        >
          <span>Read</span>
          <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
        </button>
      </div>
    </article>
  );
};
