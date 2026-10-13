"use client";

import React, { useState } from 'react';
import { 
  sanitizeText, 
  cleanSource, 
  computeReadTime, 
  cleanExcerpt,
  isPlaceholderOrLogoUrl, 
  upgradeThumbnailResolution,
} from '@/lib/textUtils';

interface OdysseusDeskShelfProps {
  stories: any[];
  onSelectStory: (story: any) => void;
  onToggleSave?: (story: any) => void;
  isSaved?: (story: any) => boolean;
}

export const OdysseusDeskShelf: React.FC<OdysseusDeskShelfProps> = ({
  stories,
  onSelectStory,
  onToggleSave,
  isSaved,
}) => {
  if (!stories || stories.length === 0) return null;

  return (
    <section 
      id="desk"
      aria-label="From the Odysseus Desk"
      className="w-full py-16 bg-[#385227] text-[#FFFDD0] border-t border-[#FFFDD0]/15 scroll-mt-24"
    >
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="border-b border-[#FFFDD0]/15 pb-4 mb-8 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
          <div>
            <div className="font-mono text-[10px] sm:text-xs uppercase tracking-widest text-[#FF6B4A] font-bold mb-1">
              CURATED SELECTIONS
            </div>
            <h2 className="text-2xl sm:text-3xl font-sans font-black tracking-tight text-[#FFFDD0]">
              FROM THE ODYSSEUS DESK
            </h2>
          </div>
          <p className="font-serif italic text-sm text-[#FFFDD0]/70">
            Stories worth slowing down for.
          </p>
        </div>

        {/* 3 or 4 Column Discovery Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stories.slice(0, 4).map((story, idx) => (
            <DeskCard
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

const DeskCard: React.FC<{
  story: any;
  onSelectStory: (story: any) => void;
  onToggleSave?: (story: any) => void;
  isSaved?: (story: any) => boolean;
}> = ({ story, onSelectStory, onToggleSave, isSaved }) => {
  const [useProxy, setUseProxy] = useState(false);
  const rawImageUrl = story?.imageUrl ? upgradeThumbnailResolution(story.imageUrl) : null;
  const isBadInitialUrl = !rawImageUrl || isPlaceholderOrLogoUrl(rawImageUrl);
  const [imageError, setImageError] = useState(isBadInitialUrl);

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
    <article className="group bg-[#2A3E1E]/50 border border-[#FFFDD0]/10 rounded-2xl p-5 flex flex-col justify-between hover:border-[#FFFDD0]/30 transition-all">
      <div>
        {hasImage && (
          <div 
            onClick={() => onSelectStory(story)}
            className="w-full aspect-[16/10] overflow-hidden rounded-xl mb-4 cursor-pointer bg-black/20"
          >
            <img
              src={activeSrc}
              alt={story.title}
              onError={handleImageError}
              className="w-full h-full object-cover group-hover:scale-104 transition-transform duration-500 ease-out"
            />
          </div>
        )}

        <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-widest text-[#FFFDD0]/60 mb-2">
          <span className="font-bold text-[#FFFDD0]">{displaySource}</span>
          {displayReadTime && (
            <>
              <span>·</span>
              <span>{displayReadTime}</span>
            </>
          )}
        </div>

        <h3 
          onClick={() => onSelectStory(story)}
          className="text-sm sm:text-base font-sans font-bold text-[#FFFDD0] leading-snug cursor-pointer group-hover:text-[#FF6B4A] transition-colors line-clamp-3"
        >
          {sanitizeText(story.title)}
        </h3>
      </div>

      <div className="mt-4 pt-3 border-t border-[#FFFDD0]/10 flex items-center justify-between">
        <button
          onClick={() => onSelectStory(story)}
          className="text-[10px] font-mono uppercase tracking-wider text-[#FF6B4A] font-bold flex items-center gap-1"
        >
          <span>READ</span>
          <span>→</span>
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
    </article>
  );
};
