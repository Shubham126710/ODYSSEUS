"use client";

import React, { useMemo } from 'react';

interface EditorialMastheadProps {
  userName?: string;
  issueNumber?: string;
  dateStr?: string;
}

export const EditorialMasthead: React.FC<EditorialMastheadProps> = ({
  userName,
  issueNumber = "VOL. IV — NO. 108",
  dateStr,
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
    <header className="w-full pt-6 pb-8 border-b border-[#FFFDD0]/15">
      {/* Top Dateline / Folio Bar */}
      <div className="flex flex-wrap items-center justify-between gap-y-2 text-[10px] sm:text-xs font-mono uppercase tracking-widest text-[#FFFDD0]/60 pb-4 border-b border-[#FFFDD0]/10">
        <div className="flex items-center gap-3">
          <span className="font-bold text-[#FFFDD0]">THE ODYSSEUS JOURNAL</span>
          <span className="text-[#FFFDD0]/30 hidden sm:inline">|</span>
          <span className="text-[#FFFDD0]/50 hidden sm:inline">{issueNumber}</span>
        </div>
        <div className="text-center font-mono tracking-widest text-[#FFFDD0]/70 text-[10px] sm:text-xs">
          {formattedDate}
        </div>
        <div className="flex items-center gap-2 text-[10px] sm:text-xs">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#FF6B4A]" />
          <span className="text-[#FFFDD0]/80">CURATED SLOW JOURNALISM</span>
        </div>
      </div>

      {/* Confident Offscreen Canvas-inspired Display Hero Typography */}
      <div className="pt-6 sm:pt-8 pb-2">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="max-w-3xl">
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-sans font-black tracking-tight text-[#FFFDD0] leading-[1.05]">
              A WORLD OF <span className="font-serif italic font-normal text-[#FFFDD0] underline decoration-[#FF6B4A]/50 decoration-2 underline-offset-4">STORIES</span>,
              <br />
              WORTH YOUR TIME.
            </h1>
            <p className="mt-3 text-xs sm:text-sm text-[#FFFDD0]/75 font-sans max-w-xl leading-relaxed">
              Curated dispatches from independent journalism across the globe. Selected for depth, perspective, and lasting relevance.
            </p>
          </div>

          {userName && (
            <div className="text-left md:text-right font-mono text-[11px] sm:text-xs text-[#FFFDD0]/60 uppercase tracking-widest border-t md:border-t-0 border-[#FFFDD0]/10 pt-2 md:pt-0">
              <span>EDITION PREPARED FOR </span>
              <strong className="text-[#FFFDD0] font-bold block sm:inline md:block">{userName}</strong>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
