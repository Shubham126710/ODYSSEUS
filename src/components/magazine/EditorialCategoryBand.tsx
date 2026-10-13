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
import { LeadHeadline } from '@/lib/editorialTypography';

interface EditorialCategoryBandProps {
  id: string;
  sectionIndex: string; // e.g. "02 /"
  title: string;        // e.g. "TECHNOLOGY"
  stories: any[];
  theme: 'cream' | 'olive';
  totalCount?: number;
  layoutVariant?: 'grid' | 'feature-split';
  onSelectStory: (story: any) => void;
  onToggleSave?: (story: any) => void;
  isSaved?: (story: any) => boolean;
}

export const EditorialCategoryBand: React.FC<EditorialCategoryBandProps> = ({
  id,
  sectionIndex,
  title,
  stories,
  theme,
  totalCount,
  layoutVariant = 'grid',
  onSelectStory,
  onToggleSave,
  isSaved,
}) => {
  if (!stories || stories.length === 0) return null;

  const isCream = theme === 'cream';
  const bgClass = isCream ? 'bg-[#FFFDD0]' : 'bg-[#5D8246]';
  const borderHairline = isCream ? 'border-[#243619]/20' : 'border-[#FFFDD0]/15';
  const subMetaColor = isCream ? 'theme-cream-text-muted' : 'theme-olive-text-muted';

  return (
    <section 
      id={id} 
      aria-label={`${title} Section`}
      className={`w-full py-16 sm:py-20 transition-colors duration-300 scroll-mt-24 ${bgClass}`}
    >
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Editorial Section Header */}
        <div className={`border-b ${borderHairline} pb-4 mb-10 flex flex-wrap items-baseline justify-between gap-4`}>
          <div className="flex items-baseline gap-3">
            <span className="font-mono text-xl sm:text-2xl font-bold text-[#FF6B4A]">
              {sectionIndex}
            </span>
            <h2 className={`text-2xl sm:text-4xl font-sans font-black tracking-tight uppercase ${isCream ? 'theme-cream-text-main' : 'theme-olive-text-main'}`}>
              {title}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            {totalCount !== undefined && totalCount > 0 && (
              <span className={`font-mono text-[10px] sm:text-xs uppercase tracking-widest ${subMetaColor} hidden sm:inline`}>
                {totalCount} ARTICLES IN DESK
              </span>
            )}
            <Link
              href={`/feed/${id}`}
              className="font-mono text-[11px] sm:text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors text-[#FF6B4A] hover:underline"
            >
              <span>EXPLORE {title}</span>
              <span className="text-sm font-sans">→</span>
            </Link>
          </div>
        </div>

        {/* Varied Layout Compositions */}
        {layoutVariant === 'feature-split' && stories.length >= 2 ? (
          /* Feature Split: 1 Large Left (58%) + 2 Stacked Right (42%) */
          <div className="category-split-row items-start">
            <div className="category-split-left">
              <EditorialCategoryCard
                story={stories[0]}
                theme={theme}
                prominent={true}
                onSelectStory={onSelectStory}
                onToggleSave={onToggleSave}
                isSaved={isSaved}
              />
            </div>
            <div className="category-split-right">
              {stories.slice(1, 3).map((story) => (
                <EditorialCategoryCard
                  key={story.id || story.link}
                  story={story}
                  theme={theme}
                  horizontalCompact={true}
                  onSelectStory={onSelectStory}
                  onToggleSave={onToggleSave}
                  isSaved={isSaved}
                />
              ))}
            </div>
          </div>
        ) : (
          /* Standard 3-Column Editorial Grid */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {stories.slice(0, 3).map((story) => (
              <EditorialCategoryCard
                key={story.id || story.link}
                story={story}
                theme={theme}
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

const EditorialCategoryCard: React.FC<{
  story: any;
  theme: 'cream' | 'olive';
  prominent?: boolean;
  horizontalCompact?: boolean;
  onSelectStory: (story: any) => void;
  onToggleSave?: (story: any) => void;
  isSaved?: (story: any) => boolean;
}> = ({
  story,
  theme,
  prominent = false,
  horizontalCompact = false,
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
  const isCream = theme === 'cream';

  const cardBg = isCream ? 'theme-cream-card-bg' : 'theme-olive-card-bg';
  const titleColor = isCream ? 'theme-cream-text-main' : 'theme-olive-text-main';
  const metaColor = isCream ? 'theme-cream-text-meta' : 'theme-olive-text-meta';
  const excerptColor = isCream ? 'theme-cream-text-muted' : 'theme-olive-text-muted';
  const dividerColor = isCream ? 'border-[#243619]/15' : 'border-[#FFFDD0]/10';

  const displaySource = cleanSource(story.source);
  const displayReadTime = computeReadTime(story);
  const displayExcerpt = cleanExcerpt(story.excerpt || story.content || '', prominent ? 200 : 130);
  const savedState = isSaved ? isSaved(story) : false;

  if (horizontalCompact) {
    return (
      <article className={`group ${cardBg} border rounded-2xl p-4 sm:p-5 flex flex-row gap-4 items-center justify-between transition-all hover:border-[#FF6B4A]/50`}>
        <div className="flex-1 min-w-0">
          <div className={`flex items-center gap-2 font-mono text-[9px] uppercase tracking-widest ${metaColor} mb-2`}>
            <span className="font-bold">{displaySource}</span>
            {displayReadTime && (
              <>
                <span>·</span>
                <span>{displayReadTime}</span>
              </>
            )}
          </div>

          <h4
            onClick={() => onSelectStory(story)}
            className={`text-sm sm:text-base font-sans font-bold ${titleColor} leading-snug cursor-pointer group-hover:text-[#FF6B4A] transition-colors line-clamp-2`}
          >
            {sanitizeText(story.title)}
          </h4>

          <div className="mt-3 flex items-center gap-3">
            <button
              onClick={() => onSelectStory(story)}
              className="text-[11px] font-mono font-bold tracking-wider uppercase text-[#FF6B4A] flex items-center gap-1"
            >
              <span>READ</span>
              <span className="text-sm font-sans">→</span>
            </button>
            {onToggleSave && (
              <button
                onClick={() => onToggleSave(story)}
                aria-label="Save story"
                className="opacity-50 hover:opacity-100 transition-opacity"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill={savedState ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                </svg>
              </button>
            )}
          </div>
        </div>

        {hasImage && (
          <div
            onClick={() => onSelectStory(story)}
            className="editorial-thumb-box cursor-pointer bg-black/10"
          >
            <img
              src={activeSrc}
              alt={story.title}
              onError={handleImageError}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            />
          </div>
        )}
      </article>
    );
  }

  return (
    <article className={`group ${cardBg} border rounded-2xl overflow-hidden p-5 sm:p-6 flex flex-col justify-between transition-all hover:border-[#FF6B4A]/50`}>
      <div>
        {hasImage && (
          <div
            onClick={() => onSelectStory(story)}
            className={`${prominent ? 'editorial-img-box' : 'editorial-card-img-standard'} mb-4 cursor-pointer bg-black/10`}
          >
            <img
              src={activeSrc}
              alt={story.title}
              onError={handleImageError}
              className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500 ease-out"
            />
          </div>
        )}

        <div className={`flex items-center gap-2 font-mono text-[9px] sm:text-[10px] uppercase tracking-widest ${metaColor} mb-2`}>
          <span className="font-bold">{displaySource}</span>
          {displayReadTime && (
            <>
              <span>·</span>
              <span>{displayReadTime}</span>
            </>
          )}
        </div>

        <h3
          onClick={() => onSelectStory(story)}
          className={`${prominent ? 'text-xl sm:text-2xl' : 'text-base sm:text-lg'} font-sans font-bold ${titleColor} leading-snug cursor-pointer group-hover:text-[#FF6B4A] transition-colors`}
        >
          {prominent ? <LeadHeadline title={story.title} /> : sanitizeText(story.title)}
        </h3>

        {displayExcerpt && (
          <p className={`mt-3 text-xs sm:text-sm font-sans ${excerptColor} leading-relaxed line-clamp-3`}>
            {displayExcerpt}
          </p>
        )}
      </div>

      <div className={`mt-5 pt-4 border-t ${dividerColor} flex items-center justify-between`}>
        <button
          onClick={() => onSelectStory(story)}
          className="text-xs font-mono font-bold tracking-wider uppercase text-[#FF6B4A] flex items-center gap-1.5"
        >
          <span>READ STORY</span>
          <span className="text-sm font-sans">→</span>
        </button>

        {onToggleSave && (
          <button
            onClick={() => onToggleSave(story)}
            aria-label={savedState ? "Remove from saved" : "Save story"}
            className={`p-2 rounded-full border transition-colors ${
              savedState
                ? 'border-[#FF6B4A] bg-[#FF6B4A]/20 text-[#FF6B4A]'
                : `${isCream ? 'border-[#243619]/20 text-[#243619]/60' : 'border-[#FFFDD0]/20 text-[#FFFDD0]/60'} hover:text-[#FF6B4A]`
            }`}
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
