"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  sanitizeText, 
  cleanSource, 
  cleanCategory, 
  computeReadTime, 
  cleanExcerpt,
  isPlaceholderOrLogoUrl,
  upgradeThumbnailResolution,
} from '@/lib/textUtils';
import { LeadHeadline } from '@/lib/editorialTypography';

export interface FeaturedStoryCarouselProps {
  stories: any[];
  onSelectStory: (story: any) => void;
  onToggleSave?: (story: any) => void;
  isSaved?: (story: any) => boolean;
}

export const FeaturedStoryCarousel: React.FC<FeaturedStoryCarouselProps> = ({
  stories,
  onSelectStory,
  onToggleSave,
  isSaved,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter valid stories (up to 5)
  const validStories = (stories || []).slice(0, 5);
  const totalSlides = validStories.length;

  const nextSlide = useCallback(() => {
    if (totalSlides === 0) return;
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    if (totalSlides === 0) return;
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  const goToSlide = (idx: number) => {
    if (idx >= 0 && idx < totalSlides) {
      setCurrentIndex(idx);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea') return;

      if (e.key === 'ArrowRight') {
        nextSlide();
      } else if (e.key === 'ArrowLeft') {
        prevSlide();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextSlide, prevSlide]);

  // Subtle auto-advance (7 seconds) with pause on hover & reduced-motion check
  useEffect(() => {
    if (totalSlides <= 1 || isPaused) return;

    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const timer = setInterval(() => {
      nextSlide();
    }, 7000);

    return () => clearInterval(timer);
  }, [totalSlides, isPaused, nextSlide]);

  // Touch Swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;

    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }
    touchStartX.current = null;
  };

  if (totalSlides === 0) return null;

  const currentStory = validStories[currentIndex];

  return (
    <section 
      aria-label="Featured Cover Stories"
      ref={containerRef}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="w-full relative mt-6 mb-12"
    >
      {/* Section Subhead & Slide Controls Bar */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#FFFDD0]/15">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] sm:text-xs uppercase tracking-widest text-[#FF6B4A] font-bold">
            COVER DISPATCH
          </span>
          <span className="font-mono text-[10px] sm:text-xs text-[#FFFDD0]/40">·</span>
          <span className="font-mono text-[10px] sm:text-xs uppercase tracking-widest text-[#FFFDD0]/60">
            CURATED STORIES
          </span>
        </div>

        {/* Carousel Controls: Numbers + Arrows */}
        <div className="flex items-center gap-3">
          {/* Slide Indicator (e.g. 01 / 05) */}
          <div className="font-mono text-xs tracking-widest text-[#FFFDD0]/80">
            <span className="font-bold text-[#FFFDD0]">
              {String(currentIndex + 1).padStart(2, '0')}
            </span>
            <span className="text-[#FFFDD0]/40 mx-1">/</span>
            <span className="text-[#FFFDD0]/60">
              {String(totalSlides).padStart(2, '0')}
            </span>
          </div>

          {/* Prev / Next buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={prevSlide}
              aria-label="Previous story"
              className="w-8 h-8 rounded-full border border-[#FFFDD0]/20 flex items-center justify-center text-[#FFFDD0]/80 hover:text-[#FFFDD0] hover:border-[#FFFDD0]/50 hover:bg-[#FFFDD0]/10 transition-colors focus:outline-none focus:ring-2 focus:ring-[#FF6B4A]"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <button
              onClick={nextSlide}
              aria-label="Next story"
              className="w-8 h-8 rounded-full border border-[#FFFDD0]/20 flex items-center justify-center text-[#FFFDD0]/80 hover:text-[#FFFDD0] hover:border-[#FFFDD0]/50 hover:bg-[#FFFDD0]/10 transition-colors focus:outline-none focus:ring-2 focus:ring-[#FF6B4A]"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Main Slide Presentation with Responsive Editorial Grid */}
      <div className="relative overflow-hidden rounded-2xl bg-[#385227]/50 border border-[#FFFDD0]/15">
        <CarouselSlide
          key={currentStory.id || currentStory.link || currentIndex}
          story={currentStory}
          onSelectStory={onSelectStory}
          onToggleSave={onToggleSave}
          isSaved={isSaved}
        />

        {/* Bottom Progress Bar & Jump Ticks */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#FFFDD0]/10 flex z-10">
          {validStories.map((_, idx) => (
            <button
              key={idx}
              onClick={() => goToSlide(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className="flex-1 h-full relative transition-all duration-300 focus:outline-none"
            >
              <div 
                className={`h-full transition-all duration-500 ${
                  idx === currentIndex 
                    ? 'bg-[#FF6B4A]' 
                    : 'bg-transparent hover:bg-[#FFFDD0]/20'
                }`} 
              />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

const CarouselSlide: React.FC<{
  story: any;
  onSelectStory: (story: any) => void;
  onToggleSave?: (story: any) => void;
  isSaved?: (story: any) => boolean;
}> = ({ story, onSelectStory, onToggleSave, isSaved }) => {
  const [useProxy, setUseProxy] = useState(false);
  const rawImageUrl = story?.imageUrl ? upgradeThumbnailResolution(story.imageUrl) : null;
  const isBadInitialUrl = !rawImageUrl || isPlaceholderOrLogoUrl(rawImageUrl);
  const [imageError, setImageError] = useState(isBadInitialUrl);

  useEffect(() => {
    const upgraded = story?.imageUrl ? upgradeThumbnailResolution(story.imageUrl) : null;
    const isBad = !upgraded || isPlaceholderOrLogoUrl(upgraded);
    setImageError(isBad);
    setUseProxy(false);
  }, [story?.id, story?.link, story?.imageUrl]);

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

  const displaySource = cleanSource(story.source);
  const displayCategory = cleanCategory(story.category);
  const displayReadTime = computeReadTime(story);
  const displayExcerpt = cleanExcerpt(story.excerpt || story.content || '', 220);
  const savedState = isSaved ? isSaved(story) : false;

  return (
    <div className="editorial-carousel-slide">
      {/* Editorial Text Column */}
      <div className="editorial-carousel-text">
        <div>
          {/* Metadata Row */}
          <div className="flex items-center flex-wrap gap-2 text-[10px] sm:text-xs font-mono uppercase tracking-widest text-[#FFFDD0]/70 mb-3">
            <span className="font-bold text-[#FF6B4A]">
              {displayCategory || 'DISPATCH'}
            </span>
            <span className="text-[#FFFDD0]/30">/</span>
            <span className="font-semibold text-[#FFFDD0]">
              {displaySource}
            </span>
            {displayReadTime && (
              <>
                <span className="text-[#FFFDD0]/30">·</span>
                <span>{displayReadTime}</span>
              </>
            )}
          </div>

          {/* Headline */}
          <h2 
            onClick={() => onSelectStory(story)}
            className="text-xl sm:text-2xl lg:text-3xl font-sans font-bold text-[#FFFDD0] leading-snug cursor-pointer hover:text-[#FFFDD0]/90 transition-colors"
          >
            <LeadHeadline title={story.title} />
          </h2>

          {/* Excerpt */}
          {displayExcerpt && (
            <p className="mt-3 text-xs sm:text-sm text-[#FFFDD0]/80 leading-relaxed font-sans line-clamp-3">
              {displayExcerpt}
            </p>
          )}
        </div>

        {/* Action Row */}
        <div className="pt-5 mt-5 border-t border-[#FFFDD0]/15 flex items-center justify-between gap-4">
          <button
            onClick={() => onSelectStory(story)}
            style={{ backgroundColor: '#FFFDD0', color: '#2F4322' }}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full font-mono text-xs uppercase tracking-wider font-bold hover:bg-[#FF6B4A] hover:text-[#FFFDD0] transition-colors focus:outline-none focus:ring-2 focus:ring-[#FF6B4A]"
          >
            <span style={{ color: '#2F4322' }}>READ STORY</span>
            <span className="text-sm font-sans" style={{ color: '#FF6B4A' }}>→</span>
          </button>

          {onToggleSave && (
            <button
              onClick={() => onToggleSave(story)}
              aria-label={savedState ? "Remove from saved library" : "Save to library"}
              className={`p-2.5 rounded-full border transition-colors ${
                savedState
                  ? 'border-[#FF6B4A] bg-[#FF6B4A]/20 text-[#FF6B4A]'
                  : 'border-[#FFFDD0]/25 text-[#FFFDD0]/70 hover:text-[#FFFDD0] hover:border-[#FFFDD0]/50'
              }`}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill={savedState ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Photography Column */}
      <div 
        onClick={() => onSelectStory(story)}
        className="editorial-carousel-media cursor-pointer group"
      >
        {hasImage ? (
          <div className="w-full h-full relative">
            <img
              src={activeSrc}
              alt={story.title}
              onError={handleImageError}
              className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-700 ease-out"
            />
            {/* Subtle photographic vignette overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10 pointer-events-none" />
          </div>
        ) : (
          /* Editorial Monogram Texture Fallback */
          <div className="w-full h-full min-h-[240px] bg-[#314823] flex flex-col items-center justify-center p-8 text-center border-l border-[#FFFDD0]/10">
            <span className="font-serif italic text-6xl text-[#FFFDD0]/20 select-none">
              O
            </span>
            <span className="font-mono text-xs uppercase tracking-widest text-[#FFFDD0]/50 mt-4">
              ODYSSEUS EDITORIAL
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
