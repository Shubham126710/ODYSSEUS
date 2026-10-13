"use client";

import React, { useState, useEffect } from 'react';
import { 
  sanitizeText, 
  cleanSource, 
  cleanCategory, 
  computeReadTime, 
  isPlaceholderOrLogoUrl, 
  upgradeThumbnailResolution,
} from '@/lib/textUtils';

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
  // Take top 3 featured stories
  const featured = (stories || []).slice(0, 3);
  if (featured.length === 0) return null;

  return (
    <section 
      aria-label="Featured Story Gallery" 
      className="w-full py-10 sm:py-14 border-b border-[#FFFDD0]/15"
    >
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10">
        
        {/* Subtle Section Label */}
        <div className="flex items-center justify-between text-[10px] sm:text-xs font-mono uppercase tracking-widest text-[#FFFDD0]/50 mb-6">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF694F]" />
            <span className="font-bold text-[#FFFDD0]/80">FEATURED REPORTING</span>
          </div>
          <span>ISSUE 108</span>
        </div>

        {/* 3-Column Image Gallery Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10">
          {featured.map((story, idx) => (
            <GalleryItem
              key={story.id || story.link || idx}
              story={story}
              onSelectStory={onSelectStory}
              onToggleSave={onToggleSave}
              isSaved={isSaved}
            />
          ))}
        </div>

      </div>
    </section>
  );
};

const GalleryItem: React.FC<{
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
    setImageError(!upgraded || isPlaceholderOrLogoUrl(upgraded));
    setUseProxy(false);
  }, [story?.id, story?.link, story?.imageUrl]);

  const handleImageError = () => {
    if (!useProxy && rawImageUrl) setUseProxy(true);
    else setImageError(true);
  };

  const activeSrc = useProxy && rawImageUrl
    ? `/api/image-proxy?url=${encodeURIComponent(rawImageUrl)}`
    : rawImageUrl;

  const hasImage = !imageError && !!activeSrc && !isPlaceholderOrLogoUrl(activeSrc);

  const displaySource = cleanSource(story.source);
  const displayCategory = cleanCategory(story.category);
  const displayReadTime = computeReadTime(story);
  const savedState = isSaved ? isSaved(story) : false;

  return (
    <article className="group flex flex-col justify-start">
      {/* 16:10 Image Thumbnail Box (No heavy enclosing card or border) */}
      <div 
        onClick={() => onSelectStory(story)}
        className="w-full aspect-[16/10] overflow-hidden rounded-xl bg-[#385227]/40 cursor-pointer relative mb-4"
      >
        {hasImage ? (
          <img
            src={activeSrc}
            alt={story.title}
            onError={handleImageError}
            className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500 ease-out"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-[#385227]/30 text-[#FFFDD0]/30 p-4">
            <span className="font-serif italic text-4xl">O</span>
          </div>
        )}
      </div>

      {/* Typography: Category Label */}
      <div className="flex items-center gap-2 font-mono text-[10px] sm:text-[11px] uppercase tracking-widest mb-2 text-[#FF694F] font-bold">
        <span>{displayCategory || 'REPORT'}</span>
      </div>

      {/* Headline */}
      <h3
        onClick={() => onSelectStory(story)}
        className="text-lg sm:text-xl font-sans font-bold text-[#FFFDD0] leading-snug cursor-pointer group-hover:text-[#FFFDD0]/85 transition-colors line-clamp-3 mb-3"
      >
        {sanitizeText(story.title)}
      </h3>

      {/* Publication name and estimated reading time */}
      <div className="flex items-center justify-between text-[10px] sm:text-xs font-mono uppercase tracking-widest text-[#FFFDD0]/60 mt-auto pt-2 border-t border-[#FFFDD0]/10">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-[#FFFDD0]/80">{displaySource}</span>
          {displayReadTime && (
            <>
              <span className="text-[#FFFDD0]/30">·</span>
              <span>{displayReadTime}</span>
            </>
          )}
        </div>

        {onToggleSave && (
          <button
            onClick={() => onToggleSave(story)}
            aria-label={savedState ? "Remove from saved library" : "Save story"}
            className="text-[#FFFDD0]/40 hover:text-[#FF694F] transition-colors p-1"
          >
            <svg 
              width="13" 
              height="13" 
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
    </article>
  );
};
