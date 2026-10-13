"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  sanitizeText, 
  cleanSource, 
  computeReadTime, 
  cleanExcerpt,
  isPlaceholderOrLogoUrl, 
  upgradeThumbnailResolution,
} from '@/lib/textUtils';

interface CategoryEditorialSectionProps {
  id: string;
  sectionIndex: string; // e.g. "02"
  title: string;        // e.g. "TECHNOLOGY"
  stories: any[];
  totalCount?: number;
  layoutVariant?: 'grid-3' | 'feature-2';
  onSelectStory: (story: any) => void;
  onToggleSave?: (story: any) => void;
  isSaved?: (story: any) => boolean;
}

export const CategoryEditorialSection: React.FC<CategoryEditorialSectionProps> = ({
  id,
  sectionIndex,
  title,
  stories,
  totalCount,
  layoutVariant = 'grid-3',
  onSelectStory,
  onToggleSave,
  isSaved,
}) => {
  if (!stories || stories.length === 0) return null;

  return (
    <section 
      id={id} 
      aria-label={`${title} Section`}
      className="w-full py-12 sm:py-16 border-b border-[#FFFDD0]/15 scroll-mt-24"
    >
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10">
        
        {/* Restrained Category Heading & Thin Divider */}
        <div className="border-b border-[#FFFDD0]/15 pb-4 mb-8 sm:mb-10 flex flex-wrap items-baseline justify-between gap-4">
          <div className="flex items-baseline gap-3">
            <span className="font-mono text-xs uppercase tracking-widest text-[#FF694F] font-bold">
              {sectionIndex}
            </span>
            <span className="text-[#FFFDD0]/30 font-mono">/</span>
            <h2 className="text-xl sm:text-2xl font-sans font-black tracking-tight text-[#FFFDD0] uppercase">
              {title}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            {totalCount !== undefined && totalCount > 0 && (
              <span className="font-mono text-[10px] sm:text-xs uppercase tracking-widest text-[#FFFDD0]/40 hidden sm:inline">
                {totalCount} ARTICLES
              </span>
            )}
            <Link
              href={`/feed/${id}`}
              className="font-mono text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#FF694F] hover:underline flex items-center gap-1.5"
            >
              <span>EXPLORE {title}</span>
              <span className="text-sm">→</span>
            </Link>
          </div>
        </div>

        {/* Layout: Either 2-Column Feature or 3-Column Image Grid */}
        {layoutVariant === 'feature-2' && stories.length >= 2 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12">
            {stories.slice(0, 2).map((story, idx) => (
              <EditorialCategoryItem
                key={story.id || story.link || idx}
                story={story}
                isLead={true}
                onSelectStory={onSelectStory}
                onToggleSave={onToggleSave}
                isSaved={isSaved}
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {stories.slice(0, 3).map((story, idx) => (
              <EditorialCategoryItem
                key={story.id || story.link || idx}
                story={story}
                isLead={false}
                onSelectStory={onSelectStory}
                onToggleSave={onToggleSave}
                isSaved={isSaved}
              />
            ))}
          </div>
        )}

      </div>
    </section>
  );
};

const EditorialCategoryItem: React.FC<{
  story: any;
  isLead?: boolean;
  onSelectStory: (story: any) => void;
  onToggleSave?: (story: any) => void;
  isSaved?: (story: any) => boolean;
}> = ({
  story,
  isLead = false,
  onSelectStory,
  onToggleSave,
  isSaved,
}) => {
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
  const displayReadTime = computeReadTime(story);
  const displayExcerpt = cleanExcerpt(story.excerpt || story.content || '', isLead ? 180 : 120);
  const savedState = isSaved ? isSaved(story) : false;

  return (
    <article className="group flex flex-col justify-start">
      {/* Constrained Image Box */}
      {hasImage && (
        <div 
          onClick={() => onSelectStory(story)}
          className={`${isLead ? 'editorial-feature-img' : 'editorial-card-img-standard'} bg-[#385227]/40 cursor-pointer relative mb-4`}
        >
          <img
            src={activeSrc}
            alt={story.title}
            onError={handleImageError}
            className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500 ease-out"
          />
        </div>
      )}

      {/* Small Uppercase Metadata */}
      <div className="flex items-center gap-2 font-mono text-[9px] sm:text-[10px] uppercase tracking-widest text-[#FFFDD0]/60 mb-2">
        <span className="font-bold text-[#FFFDD0]/80">{displaySource}</span>
        {displayReadTime && (
          <>
            <span className="text-[#FFFDD0]/30">·</span>
            <span>{displayReadTime}</span>
          </>
        )}
      </div>

      {/* Headline */}
      <h3
        onClick={() => onSelectStory(story)}
        className={`${isLead ? 'text-lg sm:text-xl' : 'text-base sm:text-lg'} font-sans font-bold text-[#FFFDD0] leading-snug cursor-pointer group-hover:text-[#FFFDD0]/85 transition-colors line-clamp-3 mb-2`}
      >
        {sanitizeText(story.title)}
      </h3>

      {/* Short Excerpt */}
      {displayExcerpt && (
        <p className="text-xs sm:text-sm font-sans text-[#FFFDD0]/70 leading-relaxed line-clamp-2 mb-3">
          {displayExcerpt}
        </p>
      )}

      {/* Footer Details */}
      <div className="mt-auto flex items-center justify-between text-xs font-mono">
        <button
          onClick={() => onSelectStory(story)}
          className="text-[#FF694F] hover:underline uppercase text-[10px] tracking-wider font-bold flex items-center gap-1"
        >
          <span>READ</span>
          <span>→</span>
        </button>

        {onToggleSave && (
          <button
            onClick={() => onToggleSave(story)}
            aria-label="Save story"
            className="text-[#FFFDD0]/40 hover:text-[#FF694F] transition-colors p-1"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill={savedState ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
            </svg>
          </button>
        )}
      </div>
    </article>
  );
};
