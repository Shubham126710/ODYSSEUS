import React from 'react';
import Link from 'next/link';
import { StoryCard } from '../StoryCard';

interface CategorySectionProps {
  sectionNumber: string;
  sectionId: string;
  title: string;
  stories: any[];
  seeAllHref: string;
  onSelectStory: (story: any) => void;
  onToggleSave?: (story: any) => void;
  isSaved?: (story: any) => boolean;
}

export const CategorySection: React.FC<CategorySectionProps> = ({
  sectionNumber,
  sectionId,
  title,
  stories,
  seeAllHref,
  onSelectStory,
  onToggleSave,
  isSaved,
}) => {
  // Gracefully hide if no stories exist in this category
  if (!stories || stories.length === 0) return null;

  const leadCard = stories[0];
  const remainingCards = stories.slice(1, 4);

  return (
    <section 
      id={sectionId} 
      className="scroll-mt-20 space-y-6 pt-4 pb-10 border-b border-[#FFFDD0]/12"
    >
      {/* Numbered Section Divider with Ghost Watermark */}
      <div className="relative pt-6 pb-2 border-b border-[#FFFDD0]/15">
        {/* Ghost watermark numeral */}
        <span 
          aria-hidden="true"
          className="absolute -top-10 left-0 text-8xl sm:text-9xl font-black text-white/[0.03] select-none pointer-events-none"
        >
          {sectionNumber}
        </span>

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.25em] text-[#EA580C] font-bold">
              <span>SECTION {sectionNumber}</span>
              <span>—</span>
              <span>DESK ARCHIVE</span>
            </div>
            <div className="flex items-baseline gap-3 mt-0.5">
              <h2 className="font-sans font-black text-2xl sm:text-3xl lg:text-4xl text-[#FFFDD0] tracking-tight uppercase">
                {title}
              </h2>
              <span className="font-mono text-xs text-[#FFFDD0]/50 tracking-wider">
                ({stories.length} {stories.length === 1 ? 'DISPATCH' : 'DISPATCHES'})
              </span>
            </div>
          </div>

          <Link
            href={seeAllHref}
            className="group inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-[#FFFDD0]/70 hover:text-[#EA580C] transition-colors"
          >
            <span>SEE ALL</span>
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </Link>
        </div>
      </div>

      {/* Varied Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
        {/* Primary Feature in Category (7 cols on md) */}
        {leadCard && (
          <div 
            className={`${remainingCards.length > 0 ? 'md:col-span-7' : 'md:col-span-12'} cursor-pointer`}
            onClick={() => onSelectStory(leadCard)}
          >
            <StoryCard
              {...leadCard}
              variant="standard"
              aspectRatio="16/10"
              isSaved={isSaved ? isSaved(leadCard) : false}
              onToggleSave={onToggleSave ? () => onToggleSave(leadCard) : undefined}
            />
          </div>
        )}

        {/* Secondary Cards in Category (5 cols on md) */}
        {remainingCards.length > 0 && (
          <div className="md:col-span-5 flex flex-col justify-between gap-4">
            {remainingCards.map((story, i) => (
              <div 
                key={story.id || i}
                className="flex-1 cursor-pointer"
                onClick={() => onSelectStory(story)}
              >
                <StoryCard
                  {...story}
                  variant="compact"
                  showExcerpt={false}
                  isSaved={isSaved ? isSaved(story) : false}
                  onToggleSave={onToggleSave ? () => onToggleSave(story) : undefined}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
