"use client";

import React, { useState } from 'react';
import { sanitizeText } from '@/lib/textUtils';

interface StoryListRowProps {
  story: any;
  onSelectStory: (story: any) => void;
  onToggleSave?: (story: any) => void;
  isSaved?: (story: any) => boolean;
}

export const StoryListRow: React.FC<StoryListRowProps> = ({
  story,
  onSelectStory,
  onToggleSave,
  isSaved,
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

  return (
    <article className="border-b border-juice-cream/15 py-5 sm:py-6 flex flex-col md:flex-row md:items-center gap-4 sm:gap-6 justify-between group transition-colors">
      <div className="flex items-start sm:items-center gap-4 sm:gap-6 flex-1 min-w-0">
        
        {/* Small Thumbnail: Render ONLY if an image exists, NEVER a placeholder */}
        {hasImage && (
          <div 
            onClick={() => onSelectStory(story)}
            className="w-20 sm:w-28 h-14 sm:h-20 shrink-0 overflow-hidden cursor-pointer"
          >
            <img 
              src={activeSrc} 
              alt={story.title} 
              onError={handleImageError}
              className="w-full h-full object-cover" 
            />
          </div>
        )}

        {/* Story Metadata & Headline */}
        <div className="flex-1 min-w-0 space-y-1">
          {/* Metadata */}
          <div className="font-mono text-[9px] sm:text-[10px] uppercase tracking-widest text-juice-cream/60 flex items-center gap-2">
            <span className="font-bold text-juice-cream/80">{story.category || 'General'}</span>
            <span>•</span>
            <span>{story.source}</span>
            <span>•</span>
            <span>{story.readTime || '3 min'}</span>
          </div>

          {/* Medium-Large Headline in Heavy Grotesk (Underline on hover) */}
          <h3 
            onClick={() => onSelectStory(story)}
            className="font-sans font-black text-lg sm:text-2xl text-juice-cream tracking-tight leading-snug group-hover:underline underline-offset-4 decoration-juice-cream/40 transition-all cursor-pointer"
          >
            {sanitizeText(story.title)}
          </h3>
        </div>

      </div>

      {/* Action CTA: "Read →" in Orange with Subtle Arrow Nudge */}
      <div className="flex items-center gap-4 shrink-0 pl-0 md:pl-4 self-end md:self-center">
        {onToggleSave && (
          <button
            type="button"
            onClick={() => onToggleSave(story)}
            className="text-juice-cream/40 hover:text-juice-cream text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer"
            title={isSaved?.(story) ? 'Saved' : 'Save'}
          >
            {isSaved?.(story) ? 'Saved ✓' : 'Save +'}
          </button>
        )}

        <button
          type="button"
          onClick={() => onSelectStory(story)}
          className="text-juice-orange hover:text-juice-orange/90 font-bold text-xs uppercase tracking-wider inline-flex items-center gap-1 group/btn cursor-pointer"
        >
          <span>Read</span>
          <span className="transition-transform duration-200 group-hover/btn:translate-x-1">→</span>
        </button>
      </div>
    </article>
  );
};
