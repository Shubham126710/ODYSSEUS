"use client";

import React, { useState, useEffect } from 'react';
import { LeadHeadline } from '@/lib/editorialTypography';
import { 
  sanitizeText, 
  cleanSource, 
  cleanCategory, 
  computeReadTime, 
  isPlaceholderOrLogoUrl, 
  capitalizeFirstLetter,
  upgradeThumbnailResolution,
} from '@/lib/textUtils';

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
  const rawImageUrl = story?.imageUrl ? upgradeThumbnailResolution(story.imageUrl) : null;
  const isBadInitialUrl = !rawImageUrl || isPlaceholderOrLogoUrl(rawImageUrl);
  const [imageError, setImageError] = useState(isBadInitialUrl);

  // Synchronize state whenever the story changes
  useEffect(() => {
    const upgraded = story?.imageUrl ? upgradeThumbnailResolution(story.imageUrl) : null;
    const isBad = !upgraded || isPlaceholderOrLogoUrl(upgraded);
    setImageError(isBad);
    setUseProxy(false);
  }, [story?.id, story?.link, story?.imageUrl]);

  if (!story) return null;

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const currentSrc = e.currentTarget.currentSrc || e.currentTarget.src || '';
    if (!useProxy && rawImageUrl && !currentSrc.includes('/api/image-proxy')) {
      setUseProxy(true);
    } else {
      setImageError(true);
    }
  };

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    // Only reject tracking pixels or tiny icons (< 100x60), allow legitimate editorial images
    if (e.currentTarget.naturalWidth < 100 || e.currentTarget.naturalHeight < 60) {
      setImageError(true);
    }
  };

  const activeSrc = useProxy && rawImageUrl
    ? `/api/image-proxy?url=${encodeURIComponent(rawImageUrl)}`
    : rawImageUrl;

  const hasImage = !imageError && !!activeSrc && !isPlaceholderOrLogoUrl(activeSrc);

  // Metadata cleanup: only real source name and valid category, suppressed placeholder read-time
  const displaySource = cleanSource(story.source);
  const displayCategory = cleanCategory(story.category);
  const displayReadTime = computeReadTime(story);

  return (
    <section aria-label="Lead Story" className="w-full">
      {hasImage ? (
        <div className="lead-story-grid w-full">
          
          {/* Left Column (7/12 at >= 900px): small mono source + category, headline, Read story */}
          <div className="lead-col-left flex flex-col justify-start">
            
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

            {/* Dominant Big Headline: font-size clamp(40px, 5.2vw, 76px), line-height 0.95, tracking -0.03em */}
            <h2 
              onClick={() => onSelectStory(story)}
              style={{
                fontSize: 'clamp(40px, 5.2vw, 76px)',
                lineHeight: 0.95,
                letterSpacing: '-0.03em',
              }}
              className="cursor-pointer font-sans font-black text-[#FFFDD0] mt-3 mb-4 group line-clamp-3"
            >
              <LeadHeadline 
                title={capitalizeFirstLetter(story.title)} 
                className="group-hover:underline underline-offset-8 decoration-[#FFFDD0]/40 transition-all"
              />
            </h2>

            {/* 2-line summary */}
            {(story.excerpt || story.contentSnippet || story.description) && (
              <p className="text-xs sm:text-sm text-[#FFFDD0]/70 line-clamp-2 mb-4 leading-relaxed font-sans max-w-xl">
                {sanitizeText(story.excerpt || story.contentSnippet || story.description)}
              </p>
            )}

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

            {/* "Read story →" CTA in Orange + Save */}
            <div className="flex items-center gap-6 mt-2">
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
                fetchPriority="high"
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
            style={{
              fontSize: 'clamp(40px, 5.2vw, 76px)',
              lineHeight: 0.95,
              letterSpacing: '-0.03em',
            }}
            className="cursor-pointer font-sans font-black text-[#FFFDD0] mt-3 mb-4 group line-clamp-3"
          >
            <LeadHeadline 
              title={capitalizeFirstLetter(story.title)} 
              className="group-hover:underline underline-offset-8 decoration-[#FFFDD0]/40 transition-all"
            />
          </h2>

          {/* 2-line summary */}
          {(story.excerpt || story.contentSnippet || story.description) && (
            <p className="text-xs sm:text-sm text-[#FFFDD0]/70 line-clamp-2 mb-4 leading-relaxed font-sans max-w-xl">
              {sanitizeText(story.excerpt || story.contentSnippet || story.description)}
            </p>
          )}

          <div className="flex items-center gap-6 mt-2">
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
