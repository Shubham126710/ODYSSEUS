"use client";

import React, { useMemo } from 'react';

interface EditorialTypographyHeroProps {
  dateStr?: string;
  issueNumber?: string;
}

export const EditorialTypographyHero: React.FC<EditorialTypographyHeroProps> = ({
  dateStr,
  issueNumber = "VOL. IV — NO. 108",
}) => {
  const formattedDate = useMemo(() => {
    if (dateStr) return dateStr;
    const now = new Date();
    return now.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).toUpperCase();
  }, [dateStr]);

  return (
    <section 
      aria-label="Editorial Masthead"
      className="w-full pt-8 sm:pt-12 md:pt-14 pb-8 sm:pb-12 border-b border-[#FFFDD0]/15"
    >
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10">
        
        {/* Eyebrow & Issue Dateline */}
        <div className="flex flex-wrap items-center justify-between gap-y-2 text-[10px] sm:text-xs font-mono uppercase tracking-widest text-[#FFFDD0]/60 pb-5 sm:pb-8">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-[#FF694F]" />
            <span className="font-bold text-[#FFFDD0]">THE ODYSSEUS JOURNAL</span>
            <span className="text-[#FFFDD0]/30">/</span>
            <span className="text-[#FFFDD0]/70">YOUR DAILY EDITION</span>
          </div>

          <div className="flex items-center gap-3 text-[10px] sm:text-xs">
            <span className="text-[#FFFDD0]/60">{formattedDate}</span>
            <span className="text-[#FFFDD0]/30 hidden sm:inline">·</span>
            <span className="text-[#FFFDD0]/40 hidden sm:inline">{issueNumber}</span>
          </div>
        </div>

        {/* Oversized Offscreen Canvas-Style Display Headline */}
        <div className="py-2 sm:py-4">
          <h1 
            style={{ 
              fontSize: 'clamp(3.2rem, 8.8vw, 9.2rem)',
              lineHeight: 0.92,
              letterSpacing: '-0.04em'
            }}
            className="font-sans font-black uppercase text-[#FFFDD0] select-none break-words"
          >
            STORIES{' '}
            <span className="font-serif italic font-normal tracking-normal text-[#FFFDD0]">
              WORTH
            </span>{' '}
            YOUR TIME.
          </h1>

          {/* Short Supporting Copy & Edition Descriptor */}
          <div className="mt-5 sm:mt-8 pt-4 sm:pt-6 border-t border-[#FFFDD0]/10 flex flex-col md:flex-row md:items-baseline justify-between gap-4">
            <p className="text-sm sm:text-base md:text-lg text-[#FFFDD0]/80 font-sans max-w-2xl leading-relaxed">
              Independent journalism, thoughtfully gathered. Selected for depth, perspective, and lasting relevance.
            </p>

            <span className="font-mono text-[10px] sm:text-xs uppercase tracking-widest text-[#FFFDD0]/50 whitespace-nowrap">
              SLOW JOURNALISM FOR THE CURIOUS MIND
            </span>
          </div>
        </div>

      </div>
    </section>
  );
};
