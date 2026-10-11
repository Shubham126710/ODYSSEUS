"use client";

import React, { useState } from 'react';
import { LeadHeadline } from '@/lib/editorialTypography';
import { sanitizeText } from '@/lib/textUtils';

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
  const [imageError, setImageError] = useState(!story?.imageUrl);

  if (!story) return null;

  const handleImageError = () => {
    if (!useProxy && story.imageUrl) {
      setUseProxy(true);
    } else {
      setImageError(true);
    }
  };

  const activeSrc = useProxy && story.imageUrl
    ? `/api/image-proxy?url=${encodeURIComponent(story.imageUrl)}`
    : story.imageUrl;

  const hasImage = !imageError && !!activeSrc;

  return (
    <section aria-label="Lead Story" className="w-full">
      {hasImage ? (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column ~60%: Metadata, Biggest Headline, Summary, Read Link */}
          <div className="md:col-span-7 flex flex-col justify-center order-1 md:order-1">
            {/* Metadata (Tiny Mono) */}
            <div className="font-mono text-[10px] sm:text-xs uppercase tracking-widest text-juice-cream/60 flex items-center gap-2">
              <span className="font-bold text-juice-cream/80">{story.category || 'General'}</span>
              <span>•</span>
              <span>{story.source}</span>
              <span>•</span>
              <span>{story.readTime || '4 min'}</span>
            </div>

            {/* Huge Display Headline (The biggest type on the page) */}
            <h2 
              onClick={() => onSelectStory(story)}
              className="cursor-pointer font-sans font-black text-3xl sm:text-5xl lg:text-6xl text-juice-cream tracking-tighter leading-[0.95] mt-3 mb-4 group"
            >
              <LeadHeadline 
                title={story.title} 
                className="group-hover:underline underline-offset-8 decoration-juice-cream/40 transition-all"
              />
            </h2>

            {/* Mobile Image Placement (Appears below headline on mobile, above summary) */}
            <div 
              onClick={() => onSelectStory(story)}
              className="md:hidden w-full aspect-[16/10] overflow-hidden my-4 cursor-pointer"
            >
              <img 
                src={activeSrc} 
                alt={story.title} 
                onError={handleImageError}
                className="w-full h-full object-cover" 
              />
            </div>

            {/* 2-Line Summary */}
            <p className="text-base sm:text-lg text-juice-cream/80 line-clamp-2 leading-relaxed mb-6 font-normal">
              {sanitizeText(story.excerpt)}
            </p>

            {/* "Read story →" CTA in Orange */}
            <div className="flex items-center gap-6">
              <button
                type="button"
                onClick={() => onSelectStory(story)}
                className="text-juice-orange hover:text-juice-orange/90 font-bold text-sm tracking-wide uppercase inline-flex items-center gap-1.5 transition-transform group cursor-pointer"
              >
                <span>Read story</span>
                <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
              </button>

              {onToggleSave && (
                <button
                  type="button"
                  onClick={() => onToggleSave(story)}
                  className="text-juice-cream/50 hover:text-juice-cream text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer"
                >
                  {isSaved?.(story) ? 'Saved ✓' : 'Save +'}
                </button>
              )}
            </div>
          </div>

          {/* Right Column ~40%: Desktop Single Capped Image */}
          <div className="hidden md:block md:col-span-5 order-2">
            <div 
              onClick={() => onSelectStory(story)}
              className="w-full aspect-[16/10] max-h-[340px] overflow-hidden cursor-pointer"
            >
              <img 
                src={activeSrc} 
                alt={story.title} 
                onError={handleImageError}
                className="w-full h-full object-cover" 
              />
            </div>
          </div>

        </div>
      ) : (
        /* If no image: Typography carries the entire section */
        <div className="max-w-3xl flex flex-col justify-center">
          <div className="font-mono text-[10px] sm:text-xs uppercase tracking-widest text-juice-cream/60 flex items-center gap-2">
            <span className="font-bold text-juice-cream/80">{story.category || 'General'}</span>
            <span>•</span>
            <span>{story.source}</span>
            <span>•</span>
            <span>{story.readTime || '4 min'}</span>
          </div>

          <h2 
            onClick={() => onSelectStory(story)}
            className="cursor-pointer font-sans font-black text-3xl sm:text-5xl lg:text-6xl text-juice-cream tracking-tighter leading-[0.95] mt-3 mb-4 group"
          >
            <LeadHeadline 
              title={story.title} 
              className="group-hover:underline underline-offset-8 decoration-juice-cream/40 transition-all"
            />
          </h2>

          <p className="text-base sm:text-lg text-juice-cream/80 line-clamp-2 leading-relaxed mb-6 font-normal">
            {sanitizeText(story.excerpt)}
          </p>

          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => onSelectStory(story)}
              className="text-juice-orange hover:text-juice-orange/90 font-bold text-sm tracking-wide uppercase inline-flex items-center gap-1.5 transition-transform group cursor-pointer"
            >
              <span>Read story</span>
              <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
            </button>

            {onToggleSave && (
              <button
                type="button"
                onClick={() => onToggleSave(story)}
                className="text-juice-cream/50 hover:text-juice-cream text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer"
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
