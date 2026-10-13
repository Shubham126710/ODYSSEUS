"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Playfair_Display } from 'next/font/google';
import { 
  sanitizeText, 
  cleanSource, 
  cleanCategory, 
  computeReadTime, 
  isPlaceholderOrLogoUrl, 
  upgradeThumbnailResolution,
} from '@/lib/textUtils';

const playfair = Playfair_Display({
  subsets: ['latin'],
  style: ['normal', 'italic'],
});

interface FeaturedImageGalleryProps {
  stories: any[];
  onSelectStory: (story: any) => void;
  onToggleSave?: (story: any) => void;
  isSaved?: (story: any) => boolean;
}

export const FeaturedImageGallery: React.FC<FeaturedImageGalleryProps> = ({
  stories,
  onSelectStory,
  onToggleSave,
  isSaved,
}) => {
  const featured = (stories || []).slice(0, 5);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [useProxy, setUseProxy] = useState(false);
  const [imageError, setImageError] = useState(false);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const totalStories = featured.length;
  const currentStory = featured[currentIndex] || featured[0];

  const handlePrev = useCallback((e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (totalStories <= 1) return;
    setCurrentIndex(prev => (prev === 0 ? totalStories - 1 : prev - 1));
  }, [totalStories]);

  const handleNext = useCallback((e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (totalStories <= 1) return;
    setCurrentIndex(prev => (prev === totalStories - 1 ? 0 : prev + 1));
  }, [totalStories]);

  // Image error and proxy handling for the active story
  const rawImageUrl = currentStory?.imageUrl 
    ? upgradeThumbnailResolution(currentStory.imageUrl) 
    : null;

  useEffect(() => {
    if (!currentStory) return;
    const upgraded = currentStory.imageUrl 
      ? upgradeThumbnailResolution(currentStory.imageUrl) 
      : null;
    setImageError(!upgraded || isPlaceholderOrLogoUrl(upgraded));
    setUseProxy(false);
  }, [currentStory?.id, currentStory?.link, currentStory?.imageUrl, currentIndex]);

  const handleImageError = () => {
    if (!useProxy && rawImageUrl) {
      setUseProxy(true);
    } else {
      setImageError(true);
    }
  };

  const activeSrc = useProxy && rawImageUrl
    ? `/api/image-proxy?url=${encodeURIComponent(rawImageUrl)}`
    : rawImageUrl;

  const hasImage = !imageError && !!activeSrc && !isPlaceholderOrLogoUrl(activeSrc);

  // Keyboard navigation (ArrowLeft & ArrowRight)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName;
      if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') return;

      if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev]);

  // Touch gesture handling without breaking vertical scrolling
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const deltaX = e.changedTouches[0].clientX - touchStartRef.current.x;
    const deltaY = e.changedTouches[0].clientY - touchStartRef.current.y;
    touchStartRef.current = null;

    // Only swipe when horizontal delta is substantial and clearly exceeds vertical movement
    if (Math.abs(deltaX) > 45 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
      if (deltaX < 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
  };

  if (!currentStory || totalStories === 0) return null;

  const displaySource = cleanSource(currentStory.source);
  const displayCategory = cleanCategory(currentStory.category);
  const displayReadTime = computeReadTime(currentStory);
  const savedState = isSaved ? isSaved(currentStory) : false;

  return (
    <section 
      aria-label="Featured Story Showcase" 
      className="w-full py-10 sm:py-14 md:py-16 border-b border-[#FFFDD0]/15"
    >
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10">
        <div className="max-w-[1040px] mx-auto">
          
          {/* Top Folio Bar: Section Title + Minimal Slide Progress Indicator */}
          <div className="flex items-center justify-between text-[10px] sm:text-xs font-mono uppercase tracking-widest text-[#FFFDD0]/50 mb-5">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF694F]" />
              <span className="font-bold text-[#FFFDD0]/80">FEATURED REPORTING</span>
            </div>

            <div className="flex items-center gap-2 text-[11px] sm:text-xs font-mono">
              <span className="text-[#FFFDD0] font-bold">
                {String(currentIndex + 1).padStart(2, '0')}
              </span>
              <span className="text-[#FFFDD0]/30">/</span>
              <span className="text-[#FFFDD0]/50">
                {String(totalStories).padStart(2, '0')}
              </span>
            </div>
          </div>

          {/* Single Prominent, Centered Image Showcase */}
          <div 
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onClick={() => onSelectStory(currentStory)}
            className="group relative w-full aspect-[16/9] max-h-[520px] rounded-2xl overflow-hidden bg-[#385227]/40 cursor-pointer shadow-xl select-none"
          >
            {hasImage ? (
              <img
                key={currentStory.id || currentStory.link || currentIndex}
                src={activeSrc}
                alt={currentStory.title}
                onError={handleImageError}
                className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.015]"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-[#385227]/30 text-[#FFFDD0]/30 p-4">
                <span className={`${playfair.className} italic text-5xl sm:text-6xl`}>O</span>
                <span className="font-mono text-xs uppercase tracking-widest text-[#FFFDD0]/40 mt-3">
                  THE ODYSSEUS JOURNAL
                </span>
              </div>
            )}

            {/* Subtle Previous Story Button */}
            {totalStories > 1 && (
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Previous story"
                className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-[#243619]/65 hover:bg-[#FFFDD0] text-[#FFFDD0] hover:text-[#243619] backdrop-blur-md border border-[#FFFDD0]/20 flex items-center justify-center transition-all duration-200 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 shadow-md cursor-pointer z-20"
              >
                <svg 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
            )}

            {/* Subtle Next Story Button */}
            {totalStories > 1 && (
              <button
                type="button"
                onClick={handleNext}
                aria-label="Next story"
                className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-[#243619]/65 hover:bg-[#FFFDD0] text-[#FFFDD0] hover:text-[#243619] backdrop-blur-md border border-[#FFFDD0]/20 flex items-center justify-center transition-all duration-200 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 shadow-md cursor-pointer z-20"
              >
                <svg 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            )}
          </div>

          {/* Clean Article Metadata & Headline Beneath Image (No redundant box borders) */}
          <div className="mt-6 sm:mt-7 flex flex-col gap-2.5">
            <div className="flex items-center gap-2 font-mono text-[10px] sm:text-xs uppercase tracking-widest text-[#FF694F] font-bold">
              <span>{displayCategory || 'REPORT'}</span>
            </div>

            <h3
              onClick={() => onSelectStory(currentStory)}
              className="text-2xl sm:text-3xl md:text-4xl font-sans font-bold text-[#FFFDD0] leading-snug cursor-pointer hover:text-[#FFFDD0]/85 transition-colors line-clamp-3"
            >
              {sanitizeText(currentStory.title)}
            </h3>

            {/* Publication Source, Reading Time, and Bookmark */}
            <div className="flex items-center justify-between text-xs sm:text-sm font-mono uppercase tracking-widest text-[#FFFDD0]/60 mt-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[#FFFDD0]/85">{displaySource}</span>
                {displayReadTime && (
                  <>
                    <span className="text-[#FFFDD0]/30">·</span>
                    <span>{displayReadTime}</span>
                  </>
                )}
              </div>

              {onToggleSave && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleSave(currentStory);
                  }}
                  aria-label={savedState ? "Remove from saved library" : "Save story"}
                  className="text-[#FFFDD0]/50 hover:text-[#FF694F] transition-colors p-1.5 rounded-full hover:bg-[#FFFDD0]/5 cursor-pointer"
                >
                  <svg 
                    width="15" 
                    height="15" 
                    viewBox="0 0 24 24" 
                    fill={savedState ? "currentColor" : "none"} 
                    stroke="currentColor" 
                    strokeWidth="2"
                  >
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                  </svg>
                </button>
              )}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
