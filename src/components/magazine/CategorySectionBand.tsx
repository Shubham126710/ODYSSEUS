"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { sanitizeText, cleanSource, computeReadTime, isPlaceholderOrLogoUrl, capitalizeFirstLetter } from '@/lib/textUtils';

interface CategorySectionBandProps {
  id: string;
  title: string;
  stories: any[];
  theme: 'cream' | 'olive';
  totalCount?: number;
  onSelectStory: (story: any) => void;
  onToggleSave?: (story: any) => void;
  isSaved?: (story: any) => boolean;
}

const CategoryStoryBlock: React.FC<{
  story: any;
  theme: 'cream' | 'olive';
  onSelectStory: (story: any) => void;
  onToggleSave?: (story: any) => void;
  isSaved?: (story: any) => boolean;
}> = ({ story, theme, onSelectStory, onToggleSave, isSaved }) => {
  const [useProxy, setUseProxy] = useState(false);
  const isBadInitialUrl = !story?.imageUrl || isPlaceholderOrLogoUrl(story?.imageUrl);
  const [imageError, setImageError] = useState(isBadInitialUrl);

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

  const isCream = theme === 'cream';
  const textColor = isCream ? 'text-juice-green' : 'text-juice-cream';
  const metaColor = isCream ? 'text-juice-green/60' : 'text-juice-cream/60';
  const summaryColor = isCream ? 'text-juice-green/80' : 'text-juice-cream/80';
  const readColor = isCream ? 'text-juice-green hover:text-juice-orange' : 'text-juice-cream hover:text-juice-orange';
  const saveColor = isCream ? 'text-juice-green/70 hover:text-juice-green' : 'text-juice-cream/70 hover:text-juice-cream';

  const displaySource = cleanSource(story.source);
  const displayReadTime = computeReadTime(story);

  return (
    <article className="flex flex-col justify-between space-y-4 group">
      <div>
        {/* Fixed 16:10 image box: never rendered if broken, < 300px, or placeholder logo */}
        {hasImage && (
          <div 
            onClick={() => onSelectStory(story)}
            className="w-full aspect-[16/10] h-auto overflow-hidden mb-4 cursor-pointer"
          >
            <img
              src={activeSrc}
              alt={story.title}
              onError={handleImageError}
              onLoad={handleImageLoad}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Tiny Mono Metadata: source name only, no breadcrumbs */}
        <div className={`font-mono text-[9px] sm:text-[10px] uppercase tracking-widest ${metaColor} flex items-center gap-2`}>
          <span className="font-bold">{displaySource}</span>
          {displayReadTime && (
            <>
              <span className="opacity-40">•</span>
              <span>{displayReadTime}</span>
            </>
          )}
        </div>

        {/* Large Heavy-Grotesk Headline */}
        <h3
          onClick={() => onSelectStory(story)}
          className={`font-sans font-black text-xl sm:text-2xl tracking-tight leading-tight mt-2 mb-2 cursor-pointer transition-colors group-hover:underline underline-offset-4 decoration-current/40 ${textColor}`}
        >
          {capitalizeFirstLetter(sanitizeText(story.title))}
        </h3>

        {/* Short Summary (2 lines) */}
        <p className={`text-xs sm:text-sm line-clamp-2 leading-relaxed ${summaryColor}`}>
          {sanitizeText(story.excerpt)}
        </p>
      </div>

      {/* Action Links */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={() => onSelectStory(story)}
          className={`font-bold text-xs uppercase tracking-wider inline-flex items-center gap-1 group/btn cursor-pointer transition-colors ${readColor}`}
        >
          <span>Read</span>
          <span className="transition-transform duration-200 group-hover/btn:translate-x-1">→</span>
        </button>

        {onToggleSave && (
          <button
            type="button"
            onClick={() => onToggleSave(story)}
            className={`text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer ${saveColor}`}
          >
            {isSaved?.(story) ? 'Saved ✓' : 'Save +'}
          </button>
        )}
      </div>
    </article>
  );
};

export const CategorySectionBand: React.FC<CategorySectionBandProps> = ({
  id,
  title,
  stories,
  theme,
  totalCount,
  onSelectStory,
  onToggleSave,
  isSaved,
}) => {
  // Allow a band to render with 2 stories; hide it only if it has fewer than 2
  if (!stories || stories.length < 2) return null;

  // Take up to 3 stories per category section
  const sectionStories = stories.slice(0, 3);
  const isCream = theme === 'cream';
  const displayCount = totalCount && totalCount > 0 ? totalCount : sectionStories.length;

  return (
    <section 
      id={id} 
      style={{
        backgroundColor: isCream ? '#FFFDD0' : '#5D8246',
        color: isCream ? '#5D8246' : '#FFFDD0',
      }}
      className={`w-full py-16 sm:py-24 scroll-mt-[100px] md:scroll-mt-[64px] border-t ${
        isCream 
          ? 'bg-juice-cream text-juice-green border-juice-green/20' 
          : 'bg-juice-green text-juice-cream border-juice-cream/15'
      }`}
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 space-y-12 sm:space-y-16">
        
        {/* Section Header: Huge display type, tight tracking & line-height */}
        <div className={`border-b ${isCream ? 'border-juice-green/20' : 'border-juice-cream/15'} pb-4 sm:pb-6`}>
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <h2 
              className="font-sans font-black uppercase select-none leading-[0.88] tracking-[-0.04em]"
              style={{ fontSize: 'clamp(56px, 11vw, 160px)' }}
            >
              {title}
            </h2>
            
            <div className="flex items-center gap-4 pb-2">
              <span className="font-mono text-[10px] sm:text-xs uppercase tracking-widest opacity-60">
                [{displayCount} DISPATCHES]
              </span>
              <Link
                href={`/feed/${id}`}
                className={`font-mono text-xs uppercase tracking-widest font-bold hover:text-juice-orange transition-colors inline-flex items-center gap-1 group cursor-pointer ${
                  isCream ? 'text-juice-green' : 'text-juice-cream'
                }`}
              >
                <span>See all</span>
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </Link>
            </div>
          </div>
        </div>

        {/* 2 or 3 Story Columns */}
        <div className={`grid grid-cols-1 ${sectionStories.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3'} gap-8 sm:gap-10`}>
          {sectionStories.map((story) => (
            <CategoryStoryBlock
              key={story.id || story.link}
              story={story}
              theme={theme}
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
