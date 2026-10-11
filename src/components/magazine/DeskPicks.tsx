import React from 'react';
import { StoryCard } from '../StoryCard';

interface DeskPicksProps {
  stories: any[];
  onSelectStory: (story: any) => void;
  onToggleSave?: (story: any) => void;
  isSaved?: (story: any) => boolean;
}

export const DeskPicks: React.FC<DeskPicksProps> = ({
  stories,
  onSelectStory,
  onToggleSave,
  isSaved,
}) => {
  if (!stories || stories.length === 0) return null;

  return (
    <section 
      id="hub-desk" 
      className="scroll-mt-20 space-y-8 pt-6 pb-12 border-b border-[#FFFDD0]/12"
    >
      {/* Editorial Header */}
      <div className="relative pt-6 pb-2 border-b border-[#FFFDD0]/15">
        <span 
          aria-hidden="true"
          className="absolute -top-10 left-0 text-8xl sm:text-9xl font-black text-white/[0.03] select-none pointer-events-none"
        >
          DESK
        </span>

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.25em] text-[#EA580C] font-bold">
              <span>✦ CURATORIAL FOLIO</span>
              <span>—</span>
              <span>SPECIAL SELECTION</span>
            </div>
            <h2 className="font-sans font-black text-2xl sm:text-3xl lg:text-4xl text-[#FFFDD0] tracking-tight uppercase mt-0.5">
              From the Odysseus Desk
            </h2>
            <p className="font-serif italic text-xs sm:text-sm text-[#FFFDD0]/70 mt-1 max-w-lg">
              &ldquo;Stories worth your time &mdash; hand-selected across diverse categories, chosen for lasting intellectual resonance.&rdquo;
            </p>
          </div>

          <div className="text-[10px] font-mono text-[#FFFDD0]/50 uppercase tracking-widest">
            <span>3 ESSENTIAL DISPATCHES</span>
          </div>
        </div>
      </div>

      {/* 3 Curated Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        {stories.slice(0, 3).map((story, idx) => (
          <div 
            key={story.id || idx}
            className="flex flex-col h-full cursor-pointer relative"
            onClick={() => onSelectStory(story)}
          >
            {/* Top Folio Number Stamp */}
            <div className="flex items-center justify-between text-[9px] font-mono uppercase tracking-[0.2em] text-[#FFFDD0]/50 pb-2 border-b border-[#FFFDD0]/10 mb-2">
              <span className="text-[#EA580C] font-bold">FOLIO CHOICE • 0{idx + 1}</span>
              <span>P. {idx + 4}</span>
            </div>

            <StoryCard
              {...story}
              variant="standard"
              aspectRatio="16/10"
              isSaved={isSaved ? isSaved(story) : false}
              onToggleSave={onToggleSave ? () => onToggleSave(story) : undefined}
            />
          </div>
        ))}
      </div>
    </section>
  );
};
