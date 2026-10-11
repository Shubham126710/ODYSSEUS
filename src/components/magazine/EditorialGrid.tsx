import React from 'react';
import { StoryCard } from '../StoryCard';
import { decodeHtmlEntities } from '@/lib/textUtils';
import { EditorialHeadline } from '@/lib/editorialTypography';

interface EditorialGridProps {
  stories: any[];
  inBriefStories: any[];
  onSelectStory: (story: any) => void;
  onToggleSave?: (story: any) => void;
  isSaved?: (story: any) => boolean;
}

export const EditorialGrid: React.FC<EditorialGridProps> = ({
  stories,
  inBriefStories,
  onSelectStory,
  onToggleSave,
  isSaved,
}) => {
  if (!stories || stories.length === 0) return null;

  // Asymmetric breakdown
  const leadFeature = stories[0];
  const mediumStory1 = stories[1];
  const mediumStory2 = stories[2];
  const compactStory1 = stories[3];
  const compactStory2 = stories[4];
  const compactStory3 = stories[5];

  return (
    <section id="hub-dispatch" className="scroll-mt-20 space-y-8 pt-4 pb-10 border-b border-[#FFFDD0]/12">
      
      {/* SECTION DIVIDER: 01 / THE DISPATCH with Oversized Ghost Typography */}
      <div className="relative pt-6 pb-2 border-b border-[#FFFDD0]/15">
        {/* Ghost watermark numeral behind header */}
        <span 
          aria-hidden="true"
          className="absolute -top-10 left-0 text-8xl sm:text-9xl font-black text-white/[0.03] select-none pointer-events-none"
        >
          01
        </span>

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.25em] text-[#EA580C] font-bold">
              <span>SECTION 01</span>
              <span>—</span>
              <span>THE DAILY DISPATCH</span>
            </div>
            <h2 className="font-sans font-black text-2xl sm:text-4xl text-[#FFFDD0] tracking-tight uppercase mt-0.5">
              The Dispatch
            </h2>
          </div>
          
          <div className="text-[10px] font-mono text-[#FFFDD0]/50 uppercase tracking-widest">
            <span>CURATED ESSENTIALS • {stories.length + inBriefStories.length} STORIES</span>
          </div>
        </div>
      </div>

      {/* ASYMMETRIC GRID WITH VERTICAL "IN BRIEF" RAIL */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        
        {/* MAIN EDITORIAL COMPOSITION (8 cols on lg) */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-6">
          
          {/* Top Row: One Tall Feature + Two Stacked Mediums */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* Lead Feature of the Dispatch (7 cols on md) */}
            {leadFeature && (
              <div 
                className="md:col-span-7 cursor-pointer"
                onClick={() => onSelectStory(leadFeature)}
              >
                <StoryCard 
                  {...leadFeature}
                  variant="tall"
                  aspectRatio="4/5"
                  isSaved={isSaved ? isSaved(leadFeature) : false}
                  onToggleSave={onToggleSave ? () => onToggleSave(leadFeature) : undefined}
                />
              </div>
            )}

            {/* Two Medium Stories (5 cols on md) */}
            <div className="md:col-span-5 flex flex-col gap-6">
              {mediumStory1 && (
                <div 
                  className="flex-1 cursor-pointer"
                  onClick={() => onSelectStory(mediumStory1)}
                >
                  <StoryCard 
                    {...mediumStory1}
                    variant="standard"
                    aspectRatio="16/10"
                    isSaved={isSaved ? isSaved(mediumStory1) : false}
                    onToggleSave={onToggleSave ? () => onToggleSave(mediumStory1) : undefined}
                  />
                </div>
              )}

              {mediumStory2 && (
                <div 
                  className="flex-1 cursor-pointer"
                  onClick={() => onSelectStory(mediumStory2)}
                >
                  <StoryCard 
                    {...mediumStory2}
                    variant="compact"
                    isSaved={isSaved ? isSaved(mediumStory2) : false}
                    onToggleSave={onToggleSave ? () => onToggleSave(mediumStory2) : undefined}
                  />
                </div>
              )}
            </div>

          </div>

          {/* Bottom Row: 3 Compact Cards */}
          {(compactStory1 || compactStory2 || compactStory3) && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              {[compactStory1, compactStory2, compactStory3].filter(Boolean).map((story, i) => (
                <div 
                  key={story.id || i}
                  className="cursor-pointer"
                  onClick={() => onSelectStory(story)}
                >
                  <StoryCard 
                    {...story}
                    variant="standard"
                    aspectRatio="16/10"
                    showExcerpt={false}
                    isSaved={isSaved ? isSaved(story) : false}
                    onToggleSave={onToggleSave ? () => onToggleSave(story) : undefined}
                  />
                </div>
              ))}
            </div>
          )}

        </div>

        {/* VERTICAL "IN BRIEF" WIRE COLUMN (4 cols on lg, horizontal strip on mobile) */}
        <aside 
          aria-label="In Brief News Wire"
          className="lg:col-span-4 xl:col-span-3 bg-white/[0.02] border border-[#FFFDD0]/12 p-4 sm:p-5 flex flex-col space-y-4"
        >
          {/* In Brief Masthead Header */}
          <div className="border-b border-[#FFFDD0]/12 pb-3 flex items-center justify-between">
            <span className="font-mono text-[9px] font-bold uppercase tracking-[0.25em] text-[#EA580C]">
              ✦ IN BRIEF • WIRE
            </span>
            <span className="font-mono text-[9px] text-[#FFFDD0]/40 uppercase tracking-widest">
              DISPATCH
            </span>
          </div>

          {/* Mobile Horizontal Scroll Strip / Desktop Vertical Stack */}
          <div className="flex lg:flex-col gap-4 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 scrollbar-hide divide-y-0 lg:divide-y divide-[#FFFDD0]/10">
            {inBriefStories.slice(0, 6).map((item, idx) => (
              <article 
                key={item.id || idx}
                onClick={() => onSelectStory(item)}
                className="group min-w-[240px] lg:min-w-0 pt-3 first:pt-0 cursor-pointer text-left space-y-1.5"
              >
                <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-wider">
                  <span className="font-bold text-[#EA580C]">
                    {(idx + 1).toString().padStart(2, '0')}.
                  </span>
                  <span className="text-[#FFFDD0]/60 truncate">
                    {item.source}
                  </span>
                  <span className="text-white/20">•</span>
                  <span className="text-[#FFFDD0]/40">
                    {item.readTime || '2 min'}
                  </span>
                </div>

                <h4 className="font-sans font-bold text-xs sm:text-sm leading-snug text-[#FFFDD0] group-hover:text-white transition-colors duration-200 line-clamp-2">
                  <EditorialHeadline title={decodeHtmlEntities(item.title)} />
                </h4>
              </article>
            ))}
          </div>

          {/* In Brief Subfooter Notice */}
          <div className="pt-3 border-t border-[#FFFDD0]/10 text-[8px] font-mono text-[#FFFDD0]/40 uppercase tracking-wider text-center">
            Updated continuously from verified publications
          </div>
        </aside>

      </div>
    </section>
  );
};
