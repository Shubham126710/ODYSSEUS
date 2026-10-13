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

interface EditorialStoryGridProps {
  stories: any[];
  onSelectStory: (story: any) => void;
  onToggleSave?: (story: any) => void;
  isSaved?: (story: any) => boolean;
}

export const EditorialStoryGrid: React.FC<EditorialStoryGridProps> = ({
  stories,
  onSelectStory,
  onToggleSave,
  isSaved,
}) => {
  if (!stories || stories.length === 0) return null;

  // Asymmetrical editorial roles:
  // story 0: primary feature
  // stories 1 & 2: medium image-led side stories
  // stories 3, 4, 5: compact text dispatches
  const leadFeature = stories[0];
  const secondaryStories = stories.slice(1, 3);
  const textDispatches = stories.slice(3, 6);

  return (
    <section id="dispatch" aria-label="The Daily Dispatch" className="w-full mt-12 mb-16 scroll-mt-24">
      {/* Section Header with Experimental Index (Reference C + Reference A) */}
      <div className="border-b border-[#FFFDD0]/15 pb-4 mb-8">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div className="flex items-baseline gap-3">
            <span className="font-mono text-xl sm:text-2xl font-bold text-[#FF6B4A]">
              01 /
            </span>
            <h2 className="text-xl sm:text-3xl font-sans font-black tracking-tight text-[#FFFDD0] uppercase">
              THE DAILY DISPATCH
            </h2>
          </div>
          <div className="font-mono text-[10px] sm:text-xs uppercase tracking-widest text-[#FFFDD0]/50">
            ESSENTIAL READING · {stories.length} DISPATCHES
          </div>
        </div>
      </div>

      {/* Asymmetrical Top Stage: Primary Lead + 2 Secondary Cards */}
      <div className="editorial-dispatch-grid w-full items-start">
        {/* Primary Lead Feature */}
        {leadFeature && (
          <div className="editorial-dispatch-left">
            <PrimaryFeatureCard
              story={leadFeature}
              onSelectStory={onSelectStory}
              onToggleSave={onToggleSave}
              isSaved={isSaved}
            />
          </div>
        )}

        {/* Secondary Medium Image-Led Stories */}
        {secondaryStories.length > 0 && (
          <div className="editorial-dispatch-right">
            {secondaryStories.map((story) => (
              <MediumStoryCard
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

      {/* Bottom Horizontal Stage: 3 Compact Text Dispatches */}
      {textDispatches.length > 0 && (
        <div className="mt-10 pt-8 border-t border-[#FFFDD0]/15">
          <div className="font-mono text-[10px] sm:text-xs uppercase tracking-widest text-[#FFFDD0]/50 mb-6 flex items-center gap-2">
            <span className="w-2 h-px bg-[#FFFDD0]/30" />
            <span>MORE STORIES FROM THE DESK</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {textDispatches.map((story, idx) => (
              <CompactDispatchCard
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
    </section>
  );
};

const PrimaryFeatureCard: React.FC<{
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
  const displayExcerpt = cleanExcerpt(story.excerpt || story.content || '', 200);
  const savedState = isSaved ? isSaved(story) : false;

  return (
    <article className="group flex flex-col justify-between h-full bg-[#385227]/35 border border-[#FFFDD0]/15 rounded-2xl overflow-hidden p-6 sm:p-7 transition-all duration-300 hover:border-[#FFFDD0]/35">
      <div>
        {/* Large Constrained Image Box */}
        {hasImage && (
          <div 
            onClick={() => onSelectStory(story)}
            className="editorial-img-box mb-5 cursor-pointer bg-black/20"
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
        <div className="flex items-center gap-2 font-mono text-[10px] sm:text-xs uppercase tracking-widest text-[#FFFDD0]/60 mb-3">
          <span className="font-bold text-[#FF6B4A]">{displayCategory || 'REPORT'}</span>
          <span>/</span>
          <span className="font-semibold text-[#FFFDD0]">{displaySource}</span>
          {displayReadTime && (
            <>
              <span>·</span>
              <span>{displayReadTime}</span>
            </>
          )}
        </div>

        {/* Headline */}
        <h3
          onClick={() => onSelectStory(story)}
          className="text-xl sm:text-2xl md:text-3xl font-sans font-bold text-[#FFFDD0] leading-snug cursor-pointer hover:text-[#FFFDD0]/90 transition-colors"
        >
          <LeadHeadline title={story.title} />
        </h3>

        {/* Excerpt */}
        {displayExcerpt && (
          <p className="mt-3 text-xs sm:text-sm text-[#FFFDD0]/75 font-sans leading-relaxed line-clamp-3">
            {displayExcerpt}
          </p>
        )}
      </div>

      {/* Card Actions */}
      <div className="pt-5 mt-5 border-t border-[#FFFDD0]/10 flex items-center justify-between">
        <button
          onClick={() => onSelectStory(story)}
          className="inline-flex items-center gap-2 text-xs font-mono font-bold text-[#FFFDD0] hover:text-[#FF6B4A] transition-colors"
        >
          <span>READ STORY</span>
          <span className="text-sm text-[#FF6B4A]">→</span>
        </button>

        {onToggleSave && (
          <button
            onClick={() => onToggleSave(story)}
            aria-label={savedState ? "Remove from saved" : "Save story"}
            className={`p-2 rounded-full border transition-colors ${
              savedState
                ? 'border-[#FF6B4A] bg-[#FF6B4A]/20 text-[#FF6B4A]'
                : 'border-[#FFFDD0]/20 text-[#FFFDD0]/60 hover:text-[#FFFDD0] hover:border-[#FFFDD0]/40'
            }`}
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

const MediumStoryCard: React.FC<{
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
    <article className="group bg-[#385227]/30 border border-[#FFFDD0]/15 rounded-2xl p-4 sm:p-5 flex flex-row gap-4 items-center justify-between hover:border-[#FFFDD0]/35 transition-all">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 font-mono text-[9px] sm:text-[10px] uppercase tracking-widest text-[#FFFDD0]/60 mb-2">
          <span className="font-bold text-[#FFFDD0]">{displaySource}</span>
          {displayReadTime && (
            <>
              <span>·</span>
              <span>{displayReadTime}</span>
            </>
          )}
        </div>

        <h4 
          onClick={() => onSelectStory(story)}
          className="text-sm sm:text-base font-sans font-bold text-[#FFFDD0] leading-snug cursor-pointer group-hover:text-[#FFFDD0]/90 transition-colors line-clamp-2"
        >
          {sanitizeText(story.title)}
        </h4>

        <div className="mt-3 flex items-center gap-3">
          <button
            onClick={() => onSelectStory(story)}
            className="text-[11px] font-mono text-[#FFFDD0]/80 group-hover:text-[#FF6B4A] transition-colors flex items-center gap-1 font-semibold"
          >
            <span>READ</span>
            <span className="text-[#FF6B4A]">→</span>
          </button>
          {onToggleSave && (
            <button
              onClick={() => onToggleSave(story)}
              aria-label="Save story"
              className="text-[#FFFDD0]/40 hover:text-[#FF6B4A] transition-colors text-xs"
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
          className="editorial-thumb-box cursor-pointer bg-black/20"
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
};

const CompactDispatchCard: React.FC<{
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
    <article className="group bg-[#385227]/25 border border-[#FFFDD0]/10 rounded-xl p-4 flex flex-col justify-between hover:border-[#FFFDD0]/30 transition-all">
      <div>
        <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-widest text-[#FFFDD0]/50 mb-2">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-[#FF6B4A]">{String(index).padStart(2, '0')}</span>
            <span>·</span>
            <span className="font-semibold text-[#FFFDD0]/80">{displaySource}</span>
          </div>
          {displayReadTime && <span>{displayReadTime}</span>}
        </div>

        <h5
          onClick={() => onSelectStory(story)}
          className="text-sm sm:text-base font-sans font-semibold text-[#FFFDD0] leading-snug cursor-pointer group-hover:text-[#FF6B4A] transition-colors line-clamp-3"
        >
          {sanitizeText(story.title)}
        </h5>
      </div>

      <div className="mt-4 pt-3 border-t border-[#FFFDD0]/10 flex items-center justify-between">
        <button
          onClick={() => onSelectStory(story)}
          className="text-[10px] font-mono uppercase tracking-wider text-[#FFFDD0]/70 group-hover:text-[#FFFDD0] flex items-center gap-1"
        >
          <span>READ DISPATCH</span>
          <span className="text-[#FF6B4A]">→</span>
        </button>

        {onToggleSave && (
          <button
            onClick={() => onToggleSave(story)}
            aria-label="Save story"
            className="text-[#FFFDD0]/40 hover:text-[#FF6B4A] transition-colors"
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
