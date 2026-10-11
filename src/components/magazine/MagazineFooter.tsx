import React from 'react';
import Link from 'next/link';
import { StaticOrangeCompass } from '../StaticOrangeCompass';

export const MagazineFooter: React.FC = () => {
  return (
    <footer 
      id="hub-colophon" 
      className="scroll-mt-20 w-full bg-[#162417] text-[#FFFDD0] border-t border-[#FFFDD0]/20 py-16 px-6 sm:px-12 select-none"
    >
      <div className="max-w-[1440px] mx-auto space-y-12">
        
        {/* Top Folio Rule */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#FFFDD0]/15 pb-6 text-[10px] font-mono uppercase tracking-[0.25em] text-[#FFFDD0]/60">
          <div className="flex items-center gap-2.5">
            <StaticOrangeCompass className="w-5 h-5 shrink-0" />
            <span className="font-bold text-[#FFFDD0]">THE ODYSSEUS JOURNAL</span>
            <span className="text-[#EA580C]">•</span>
            <span>END OF TODAY&apos;S EDITION</span>
          </div>

          <div className="flex items-center gap-4 text-[9px] text-[#FFFDD0]/40">
            <span>PRINT CODE: ODY-2026-IV</span>
            <span>•</span>
            <span>ALL RIGHTS RESERVED</span>
          </div>
        </div>

        {/* Central Editorial Tagline & Colophon Typography */}
        <div className="max-w-3xl space-y-4">
          <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#EA580C] font-bold block">
            THE EDITORIAL MISSION
          </span>
          <p className="font-serif italic text-2xl sm:text-3xl md:text-4xl text-[#FFFDD0] leading-snug tracking-tight">
            &ldquo;Curated slow journalism. Pure stories, zero clutter.&rdquo;
          </p>
          <p className="font-sans text-xs sm:text-sm text-[#FFFDD0]/70 leading-relaxed max-w-xl">
            Odysseus gathers the finest longform prose, investigative journalism, and intellectual essays from the world&apos;s most respected independent periodicals.
          </p>
        </div>

        {/* Bottom Registration & Minimal Links Bar */}
        <div className="pt-8 border-t border-[#FFFDD0]/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 text-xs font-mono uppercase tracking-wider text-[#FFFDD0]/60">
          <div className="flex items-center gap-6">
            <Link href="/saved" className="hover:text-[#EA580C] transition-colors">
              Library
            </Link>
            <Link href="/profile" className="hover:text-[#EA580C] transition-colors">
              Traveler Dossier
            </Link>
            <Link href="/settings" className="hover:text-[#EA580C] transition-colors">
              Preferences
            </Link>
            <a 
              href="mailto:shubham360upadhyay@gmail.com" 
              className="hover:text-[#EA580C] transition-colors"
            >
              Contact
            </a>
          </div>

          <div className="flex items-center gap-3 text-[10px] font-mono text-[#FFFDD0]/40">
            <span>+</span>
            <span>SHUBHAM UPADHYAY</span>
            <span>+</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
