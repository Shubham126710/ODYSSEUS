"use client";

import React from 'react';
import { sanitizeText } from '@/lib/textUtils';

interface OrangeMomentBandProps {
  story?: any;
  onSelectStory: (story: any) => void;
}

export const OrangeMomentBand: React.FC<OrangeMomentBandProps> = ({
  story,
  onSelectStory,
}) => {
  const quoteText = story?.title
    ? sanitizeText(story.title)
    : "Curated slow journalism. Pure stories, zero clutter.";

  return (
    <section aria-label="Featured Pull-Quote" className="w-full bg-juice-orange text-juice-cream py-16 sm:py-24 border-y border-juice-cream/20 select-none">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
        
        {/* Tiny Mono Header */}
        <span className="font-mono text-[10px] sm:text-xs uppercase tracking-widest text-juice-cream/80 font-bold block">
          ✦ THE ODYSSEUS WIRE • EDITORIAL MOMENT
        </span>

        {/* Large Display Type Quote (No small body text) */}
        <blockquote 
          onClick={() => story && onSelectStory(story)}
          className="font-sans font-black text-2xl sm:text-4xl md:text-5xl lg:text-6xl tracking-tight leading-tight max-w-4xl mx-auto cursor-pointer transition-opacity hover:opacity-95"
        >
          &ldquo;{quoteText}&rdquo;
        </blockquote>

        {/* Action Link */}
        {story && (
          <div className="pt-2">
            <button
              type="button"
              onClick={() => onSelectStory(story)}
              className="text-juice-cream hover:underline underline-offset-8 font-mono text-xs uppercase tracking-widest font-bold inline-flex items-center gap-1.5 group cursor-pointer"
            >
              <span>Read Full Dispatch</span>
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </button>
          </div>
        )}

      </div>
    </section>
  );
};
