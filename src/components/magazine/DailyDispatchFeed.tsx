"use client";

import React, { useState, useEffect } from 'react';
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

interface DailyDispatchFeedProps {
  stories: any[];
  onSelectStory: (story: any) => void;
  onToggleSave?: (story: any) => void;
  isSaved?: (story: any) => boolean;
}

export const DailyDispatchFeed: React.FC<DailyDispatchFeedProps> = ({
  stories,
  onSelectStory,
  onToggleSave,
  isSaved,
}) => {
  if (!stories || stories.length === 0) return null;

  const lead = stories[0];
  const secondary = stories.slice(1, 3);
  const textDispatches = stories.slice(3, 6);

  return (
    <section 
      id="dispatch"
      aria-label="The Daily Dispatch" 
      className="w-full py-12 sm:py-16 border-b border-[#FFFDD0]/15 scroll-mt-24"
    >
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10">
        
        {/* Restrained Section Heading with Thin Horizontal Rule */}
        <div className="border-b border-[#FFFDD0]/15 pb-4 mb-10 flex flex-wrap items-baseline justify-between gap-3">
          <div className="flex items-baseline gap-3">
            <span className="font-mono text-xs uppercase tracking-widest text-[#FF694F] font-bold">
              01
            </span>
            <span className="text-[#FFFDD0]/30 font-mono">/</span>
            <h2 className="text-xl sm:text-2xl font-sans font-black tracking-tight text-[#FFFDD0] uppercase">
              THE DAILY DISPATCH
            </h2>
          </div>
          <span className="font-mono text-[10px] sm:text-xs uppercase tracking-widest text-[#FFFDD0]/50">
            IN-DEPTH PERSPECTIVES
          </span>
        </div>

        {/* Desktop Layout: 2/3 Primary Lead + 1/3 Secondary Column */}
        <div className="editorial-dispatch-grid w-full items-start">
          
          {/* Primary Article (62% width on desktop) */}
          {lead && (
            <div className="editorial-dispatch-left">
              <PrimaryLeadItem
                story={lead}
                onSelectStory={onSelectStory}
                onToggleSave={onToggleSave}
                isSaved={isSaved}
              />
            </div>
          )}

          {/* Secondary Column: 2 smaller stories (38% width on desktop) */}
          {secondary.length > 0 && (
            <div className="editorial-dispatch-right flex flex-col divide-y divide-[#FFFDD0]/15">
              {secondary.map((story) => (
                <SecondaryStoryItem
                  key={story.id || story.link}
                  story={story}
                  onSelectStory={onSelectStory}
                  onToggleSave={onToggleSave}
                  isSaved={isSaved}
                />
              ))}
            </div>
          )}

        </div>

        {/* Compact Row of Additional Headlines Underneath */}
        {textDispatches.length > 0 && (
          <div className="mt-12 pt-8 border-t border-[#FFFDD0]/15">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {textDispatches.map((story, idx) => (
                <CompactTextDispatch
                  key={story.id || story.link}
                  index={idx + 1}
                  story={story}
                  onSelectStory={onSelectStory}
                  onToggleSave={onToggleSave}
                  isSaved={isSaved}
                />
              ))}
            </div>
          </div>
        )}

      </div>
    </section>
  );
};

const PrimaryLeadItem: React.FC<{
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
  const displayExcerpt = cleanExcerpt(story.excerpt || story.content || '', 220);
  const savedState = isSaved ? isSaved(story) : false;

  return (
    <article className="group flex flex-col justify-start">
      {/* Constrained Image Box */}
      {hasImage && (
        <div 
          onClick={() => onSelectStory(story)}
          className="editorial-img-box mb-5 cursor-pointer bg-[#385227]/40 relative"
        >
          <img
            src={activeSrc}
            alt={story.title}
            onError={handleImageError}
            className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500 ease-out"
          />
        </div>
      )}

      {/* Metadata */}
      <div className="flex items-center gap-2 font-mono text-[10px] sm:text-xs uppercase tracking-widest text-[#FFFDD0]/60 mb-2.5">
        <span className="font-bold text-[#FF694F]">{displayCategory || 'REPORT'}</span>
        <span className="text-[#FFFDD0]/30">/</span>
        <span className="font-semibold text-[#FFFDD0]/90">{displaySource}</span>
        {displayReadTime && (
          <>
            <span className="text-[#FFFDD0]/30">·</span>
            <span>{displayReadTime}</span>
          </>
        )}
      </div>

      {/* Strong Headline */}
      <h3
        onClick={() => onSelectStory(story)}
        className="text-2xl sm:text-3xl font-sans font-bold text-[#FFFDD0] leading-snug cursor-pointer group-hover:text-[#FFFDD0]/85 transition-colors mb-3"
      >
        <LeadHeadline title={story.title} />
      </h3>

      {/* Excerpt */}
      {displayExcerpt && (
        <p className="text-sm sm:text-base text-[#FFFDD0]/75 font-sans leading-relaxed max-w-2xl mb-4">
          {displayExcerpt}
        </p>
      )}

      {/* Action */}
      <div className="flex items-center justify-between pt-1">
        <button
          onClick={() => onSelectStory(story)}
          className="text-xs font-mono uppercase tracking-wider font-bold text-[#FF694F] hover:underline flex items-center gap-1.5"
        >
          <span>READ ARTICLE</span>
          <span className="text-sm">→</span>
        </button>

        {onToggleSave && (
          <button
            onClick={() => onToggleSave(story)}
            aria-label="Save story"
            className="text-[#FFFDD0]/40 hover:text-[#FF694F] transition-colors p-1"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill={savedState ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
            </svg>
          </button>
        )}
      </div>
    </article>
  );
};

const SecondaryStoryItem: React.FC<{
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
  const displayReadTime = computeReadTime(story);
  const savedState = isSaved ? isSaved(story) : false;

  return (
    <article className="group py-6 first:pt-0 last:pb-0 flex flex-row gap-5 items-center justify-between">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 font-mono text-[9px] sm:text-[10px] uppercase tracking-widest text-[#FFFDD0]/50 mb-2">
          <span className="font-bold text-[#FFFDD0]/80">{displaySource}</span>
          {displayReadTime && (
            <>
              <span>·</span>
              <span>{displayReadTime}</span>
            </>
          )}
        </div>

        <h4 
          onClick={() => onSelectStory(story)}
          className="text-base sm:text-lg font-sans font-bold text-[#FFFDD0] leading-snug cursor-pointer group-hover:text-[#FF694F] transition-colors line-clamp-3 mb-2"
        >
          {sanitizeText(story.title)}
        </h4>

        <div className="flex items-center gap-3 text-xs font-mono text-[#FFFDD0]/40">
          <button
            onClick={() => onSelectStory(story)}
            className="hover:text-[#FF694F] transition-colors"
          >
            Read →
          </button>
          {onToggleSave && (
            <button
              onClick={() => onToggleSave(story)}
              aria-label="Save story"
              className="hover:text-[#FF694F] transition-colors"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill={savedState ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {hasImage && (
        <div 
          onClick={() => onSelectStory(story)}
          className="editorial-thumb-box shrink-0 cursor-pointer bg-[#385227]/40 relative"
        >
          <img
            src={activeSrc}
            alt={story.title}
            onError={handleImageError}
            className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500 ease-out"
          />
        </div>
      )}
    </article>
  );
};

const CompactTextDispatch: React.FC<{
  index: number;
  story: any;
  onSelectStory: (story: any) => void;
  onToggleSave?: (story: any) => void;
  isSaved?: (story: any) => boolean;
}> = ({ index, story, onSelectStory, onToggleSave, isSaved }) => {
  const displaySource = cleanSource(story.source);
  const displayReadTime = computeReadTime(story);
  const savedState = isSaved ? isSaved(story) : false;

  return (
    <article className="group flex flex-col justify-between pt-3">
      <div>
        <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-widest text-[#FFFDD0]/50 mb-2">
          <span className="font-bold text-[#FF694F]">0{index}</span>
          <span>·</span>
          <span className="font-semibold text-[#FFFDD0]/75">{displaySource}</span>
          {displayReadTime && (
            <>
              <span>·</span>
              <span>{displayReadTime}</span>
            </>
          )}
        </div>

        <h5
          onClick={() => onSelectStory(story)}
          className="text-sm sm:text-base font-sans font-bold text-[#FFFDD0] leading-snug cursor-pointer group-hover:text-[#FF694F] transition-colors line-clamp-3"
        >
          {sanitizeText(story.title)}
        </h5>
      </div>

      <div className="mt-4 flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-[#FFFDD0]/40">
        <button
          onClick={() => onSelectStory(story)}
          className="hover:text-[#FFFDD0] transition-colors flex items-center gap-1"
        >
          <span>READ</span>
          <span>→</span>
        </button>

        {onToggleSave && (
          <button
            onClick={() => onToggleSave(story)}
            aria-label="Save story"
            className="hover:text-[#FF694F] transition-colors"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill={savedState ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
            </svg>
          </button>
        )}
      </div>
    </article>
  );
};
