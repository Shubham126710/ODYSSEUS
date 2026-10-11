"use client";

import React, { useState } from 'react';
import { LeadHeadline } from '@/lib/editorialTypography';
import { sanitizeText, cleanSource, cleanCategory, computeReadTime, isPlaceholderOrLogoUrl } from '@/lib/textUtils';

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
  const isBadInitialUrl = !story?.imageUrl || isPlaceholderOrLogoUrl(story?.imageUrl);
  const [imageError, setImageError] = useState(isBadInitialUrl);

  if (!story) return null;

  const handleImageError = () => {
    if (!useProxy && story.imageUrl) {
      setUseProxy(true);
    } else {
      setImageError(true);
    }
  };

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    if (e.currentTarget.naturalWidth < 300) {
      setImageError(true);
    }
  };

  const activeSrc = useProxy && story.imageUrl
    ? `/api/image-proxy?url=${encodeURIComponent(story.imageUrl)}`
    : story.imageUrl;

  const hasImage = !imageError && !!activeSrc && !isPlaceholderOrLogoUrl(activeSrc);

  // Metadata cleanup: only real source name and valid category, suppressed placeholder read-time
  const displaySource = cleanSource(story.source);
  const displayCategory = cleanCategory(story.category);
  const displayReadTime = computeReadTime(story);
  const cleanSummary = sanitizeText(story.excerpt);

  return (
    <section aria-label="Lead Story" className="w-full">
      {hasImage ? (
        <div className="lead-story-grid w-full">
          
          {/* Left Column (7/12 at >= 900px): small mono source + category, big headline, 2-line summary, Read story */}
          <div className="lead-col-left flex flex-col justify-center">
            
            {/* Metadata (Clean Source + Category) */}
            <div className="font-mono text-[10px] sm:text-xs uppercase tracking-widest text-[#FFFDD0]/60 flex items-center gap-2">
              <span className="font-bold text-[#FFFDD0]/90">{displaySource}</span>
              {displayCategory && (
                <>
                  <span className="text-[#FFFDD0]/30">•</span>
                  <span className="text-[#FFFDD0]/70">{displayCategory}</span>
                </>
              )}
              {displayReadTime && (
                <>
                  <span className="text-[#FFFDD0]/30">•</span>
                  <span className="text-[#FFFDD0]/50">{displayReadTime}</span>
                </>
              )}
            </div>

            {/* Big Headline */}
            <h2 
              onClick={() => onSelectStory(story)}
              className="cursor-pointer font-sans font-black text-3xl sm:text-4xl min-[900px]:text-5xl text-[#FFFDD0] tracking-tighter leading-[0.95] mt-4 mb-3 group"
            >
              <LeadHeadline 
                title={story.title} 
                className="group-hover:underline underline-offset-8 decoration-[#FFFDD0]/40 transition-all"
              />
            </h2>

            {/* Mobile / <900px Image: Placed below headline, capped at max 220px tall */}
            <div 
              onClick={() => onSelectStory(story)}
              style={{ maxHeight: '220px', aspectRatio: '16/10' }}
              className="lead-img-mobile w-full overflow-hidden my-4 cursor-pointer"
            >
              <img 
                src={activeSrc} 
                alt={story.title} 
                onError={handleImageError}
                onLoad={handleImageLoad}
                style={{ maxHeight: '220px' }}
                className="w-full h-full object-cover" 
              />
            </div>

            {/* 2-Line Summary */}
            <p className="text-sm sm:text-base text-[#FFFDD0]/80 line-clamp-2 leading-relaxed mb-6 font-normal">
              {cleanSummary}
            </p>

            {/* "Read story →" CTA in Orange + Save */}
            <div className="flex items-center gap-6">
              <button
                type="button"
                onClick={() => onSelectStory(story)}
                className="text-[#FF6B4A] hover:text-[#FF6B4A]/90 font-bold text-xs uppercase tracking-wider inline-flex items-center gap-1.5 transition-transform group cursor-pointer"
              >
                <span>Read story</span>
                <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
              </button>

              {onToggleSave && (
                <button
                  type="button"
                  onClick={() => onToggleSave(story)}
                  className="text-[#FFFDD0]/70 hover:text-[#FFFDD0] text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer"
                >
                  {isSaved?.(story) ? 'Saved ✓' : 'Save +'}
                </button>
              )}
            </div>
          </div>

          {/* Right Column (5/12 at >= 900px): ONE image in a fixed 4:3 box, max-height 320px, inside 1200px container */}
          <div className="lead-col-right" style={{ maxHeight: '320px' }}>
            <div 
              onClick={() => onSelectStory(story)}
              style={{ maxHeight: '320px', aspectRatio: '4/3' }}
              className="w-full overflow-hidden cursor-pointer"
            >
              <img 
                src={activeSrc} 
                alt={story.title} 
                onError={handleImageError}
                onLoad={handleImageLoad}
                style={{ maxHeight: '320px' }}
                className="w-full h-full object-cover" 
              />
            </div>
          </div>

        </div>
      ) : (
        /* If no usable image: Typography only carries the section cleanly */
        <div className="max-w-3xl flex flex-col justify-center">
          <div className="font-mono text-[10px] sm:text-xs uppercase tracking-widest text-[#FFFDD0]/60 flex items-center gap-2">
            <span className="font-bold text-[#FFFDD0]/90">{displaySource}</span>
            {displayCategory && (
              <>
                <span className="text-[#FFFDD0]/30">•</span>
                <span className="text-[#FFFDD0]/70">{displayCategory}</span>
              </>
            )}
            {displayReadTime && (
              <>
                <span className="text-[#FFFDD0]/30">•</span>
                <span className="text-[#FFFDD0]/50">{displayReadTime}</span>
              </>
            )}
          </div>

          <h2 
            onClick={() => onSelectStory(story)}
            className="cursor-pointer font-sans font-black text-3xl sm:text-4xl min-[900px]:text-5xl text-[#FFFDD0] tracking-tighter leading-[0.95] mt-4 mb-3 group"
          >
            <LeadHeadline 
              title={story.title} 
              className="group-hover:underline underline-offset-8 decoration-[#FFFDD0]/40 transition-all"
            />
          </h2>

          <p className="text-sm sm:text-base text-[#FFFDD0]/80 line-clamp-2 leading-relaxed mb-6 font-normal">
            {cleanSummary}
          </p>

          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => onSelectStory(story)}
              className="text-[#FF6B4A] hover:text-[#FF6B4A]/90 font-bold text-xs uppercase tracking-wider inline-flex items-center gap-1.5 transition-transform group cursor-pointer"
            >
              <span>Read story</span>
              <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
            </button>

            {onToggleSave && (
              <button
                type="button"
                onClick={() => onToggleSave(story)}
                className="text-[#FFFDD0]/70 hover:text-[#FFFDD0] text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer"
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
