"use client";

import React, { useState } from 'react';
import { LeadHeadline } from '@/lib/editorialTypography';
import { sanitizeText, cleanSource, cleanCategory, computeReadTime } from '@/lib/textUtils';

interface LeadStorySectionProps {
  story: any;
  onSelectStory: (story: any) => void;
  onToggleSave?: (story: any) => void;
  isSaved?: (story: any) => boolean;
}

export const LeadStorySection: React.FC<LeadStorySectionProps> = ({
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

  // Metadata cleanup: only real source name and valid category, suppress "1 MIN"
  const displaySource = cleanSource(story.source);
  const displayCategory = cleanCategory(story.category);
  const displayReadTime = computeReadTime(story);

  // Drop cap processing on clean summary
  const cleanSummary = sanitizeText(story.excerpt);
  const firstLetter = cleanSummary ? cleanSummary.charAt(0) : '';
  const restSummary = cleanSummary ? cleanSummary.slice(1) : '';

  return (
    <section aria-label="Lead Story" className="w-full">
      {hasImage ? (
        <div className="grid grid-cols-1 min-[900px]:grid-cols-12 gap-6 min-[900px]:gap-10 items-center">
          
          {/* Left Column ~60% (from 900px and up): Metadata, Biggest Headline, Summary with Drop Cap, CTA */}
          <div className="min-[900px]:col-span-7 flex flex-col justify-center">
            
            {/* Metadata (Clean Source + Category only if real; read time only if computed) */}
            <div className="font-mono text-[10px] sm:text-xs uppercase tracking-widest text-juice-cream/60 flex items-center gap-2">
              <span className="font-bold text-juice-cream/90">{displaySource}</span>
              {displayCategory && (
                <>
                  <span className="text-juice-cream/30">•</span>
                  <span className="text-juice-cream/70">{displayCategory}</span>
                </>
              )}
              {displayReadTime && (
                <>
                  <span className="text-juice-cream/30">•</span>
                  <span className="text-juice-cream/50">{displayReadTime}</span>
                </>
              )}
            </div>

            {/* Biggest Display Headline on page (~20px top spacing from metadata) */}
            <h2 
              onClick={() => onSelectStory(story)}
              className="cursor-pointer font-sans font-black text-3xl sm:text-5xl lg:text-6xl text-juice-cream tracking-tighter leading-[0.95] mt-5 mb-4 group"
            >
              <LeadHeadline 
                title={story.title} 
                className="group-hover:underline underline-offset-8 decoration-juice-cream/40 transition-all"
              />
            </h2>

            {/* Mobile / <900px Image: Placed below headline, capped at max 260px tall */}
            <div 
              onClick={() => onSelectStory(story)}
              className="min-[900px]:hidden w-full aspect-[16/10] max-h-[260px] overflow-hidden my-4 cursor-pointer"
            >
              <img 
                src={activeSrc} 
                alt={story.title} 
                onError={handleImageError}
                className="w-full h-full object-cover" 
              />
            </div>

            {/* 2-Line Summary with Elegant Print Drop Cap */}
            <p className="text-base sm:text-lg text-juice-cream/80 line-clamp-2 leading-relaxed mb-6 font-normal">
              {firstLetter && (
                <span className="float-left text-3xl sm:text-4xl font-serif font-bold text-juice-cream leading-none mr-2.5 mt-0.5 select-none">
                  {firstLetter}
                </span>
              )}
              {restSummary}
            </p>

            {/* "Read story →" CTA in Orange + Save */}
            <div className="flex items-center gap-6">
              <button
                type="button"
                onClick={() => onSelectStory(story)}
                className="text-juice-orange hover:text-juice-orange/90 font-bold text-sm tracking-wide uppercase inline-flex items-center gap-1.5 transition-transform group cursor-pointer"
              >
                <span>Read story</span>
                <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
              </button>

              {onToggleSave && (
                <button
                  type="button"
                  onClick={() => onToggleSave(story)}
                  className="text-juice-cream/70 hover:text-juice-cream text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer"
                >
                  {isSaved?.(story) ? 'Saved ✓' : 'Save +'}
                </button>
              )}
            </div>
          </div>

          {/* Right Column ~40% (Only from 900px and up): Desktop Single Capped Image (max ~340px tall, 16:10 crop) */}
          <div className="hidden min-[900px]:block min-[900px]:col-span-5">
            <div 
              onClick={() => onSelectStory(story)}
              className="w-full aspect-[16/10] max-h-[340px] overflow-hidden cursor-pointer"
            >
              <img 
                src={activeSrc} 
                alt={story.title} 
                onError={handleImageError}
                className="w-full h-full object-cover" 
              />
            </div>
          </div>

        </div>
      ) : (
        /* If no image: Typography carries the entire section cleanly */
        <div className="max-w-3xl flex flex-col justify-center">
          <div className="font-mono text-[10px] sm:text-xs uppercase tracking-widest text-juice-cream/60 flex items-center gap-2">
            <span className="font-bold text-juice-cream/90">{displaySource}</span>
            {displayCategory && (
              <>
                <span className="text-juice-cream/30">•</span>
                <span className="text-juice-cream/70">{displayCategory}</span>
              </>
            )}
            {displayReadTime && (
              <>
                <span className="text-juice-cream/30">•</span>
                <span className="text-juice-cream/50">{displayReadTime}</span>
              </>
            )}
          </div>

          <h2 
            onClick={() => onSelectStory(story)}
            className="cursor-pointer font-sans font-black text-3xl sm:text-5xl lg:text-6xl text-juice-cream tracking-tighter leading-[0.95] mt-5 mb-4 group"
          >
            <LeadHeadline 
              title={story.title} 
              className="group-hover:underline underline-offset-8 decoration-juice-cream/40 transition-all"
            />
          </h2>

          <p className="text-base sm:text-lg text-juice-cream/80 line-clamp-2 leading-relaxed mb-6 font-normal">
            {firstLetter && (
              <span className="float-left text-3xl sm:text-4xl font-serif font-bold text-juice-cream leading-none mr-2.5 mt-0.5 select-none">
                {firstLetter}
              </span>
            )}
            {restSummary}
          </p>

          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => onSelectStory(story)}
              className="text-juice-orange hover:text-juice-orange/90 font-bold text-sm tracking-wide uppercase inline-flex items-center gap-1.5 transition-transform group cursor-pointer"
            >
              <span>Read story</span>
              <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
            </button>

            {onToggleSave && (
              <button
                type="button"
                onClick={() => onToggleSave(story)}
                className="text-juice-cream/70 hover:text-juice-cream text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer"
              >
                {isSaved?.(story) ? 'Saved ✓' : 'Save +'}
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
