import React from 'react';
import { decodeHtmlEntities } from '@/lib/textUtils';
import { EditorialHeadline } from '@/lib/editorialTypography';

interface FeatureBreakProps {
  story: any;
  onSelectStory: (story: any) => void;
  onToggleSave?: (story: any) => void;
  isSaved?: (story: any) => boolean;
}

export const FeatureBreak: React.FC<FeatureBreakProps> = ({
  story,
  onSelectStory,
  onToggleSave,
  isSaved,
}) => {
  if (!story) return null;

  return (
    <div 
      onClick={() => onSelectStory(story)}
      className="w-full my-8 bg-[#172318] border border-[#FFFDD0]/15 relative overflow-hidden group cursor-pointer"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[380px] lg:min-h-[440px]">
        
        {/* Left Column: Full Editorial Feature Typography */}
        <div className="lg:col-span-7 p-6 sm:p-10 lg:p-12 flex flex-col justify-between space-y-6 relative z-10">
          <div className="space-y-4">
            {/* Category / Folio Stamp */}
            <div className="flex items-center gap-3">
              <span className="bg-[#EA580C] text-white px-2.5 py-0.5 text-[9px] font-mono font-bold uppercase tracking-[0.25em]">
                FEATURE ESSAY
              </span>
              <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-[#FFFDD0]/60">
                {story.category}
              </span>
            </div>

            {/* Massive Headline */}
            <h3 className="font-sans font-black text-2xl sm:text-3xl md:text-4xl lg:text-5xl leading-[1.08] tracking-tight text-[#FFFDD0] group-hover:text-white transition-colors duration-200">
              <EditorialHeadline title={decodeHtmlEntities(story.title)} />
            </h3>

            {/* Excerpt */}
            {story.excerpt && (
              <p className="text-sm sm:text-base text-[#FFFDD0]/75 font-sans leading-relaxed line-clamp-3 max-w-xl">
                {decodeHtmlEntities(story.excerpt)}
              </p>
            )}
          </div>

          {/* Footer Metadata & CTA */}
          <div className="pt-4 border-t border-[#FFFDD0]/15 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-[0.2em] text-[#FFFDD0]/60">
              <span className="font-bold text-[#EA580C]">{story.source}</span>
              <span>•</span>
              <span>{story.date}</span>
              <span>•</span>
              <span>{story.readTime || '6 MIN READ'}</span>
            </div>

            <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-[#FFFDD0] group-hover:text-[#EA580C] font-bold transition-colors">
              <span>READ FULL FEATURE</span>
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </div>
          </div>
        </div>

        {/* Right Column: Full-Height Visual Frame */}
        <div className="lg:col-span-5 relative min-h-[240px] lg:min-h-full overflow-hidden bg-[#1E2E20] border-t lg:border-t-0 lg:border-l border-[#FFFDD0]/15">
          {story.imageUrl ? (
            <div className="relative w-full h-full">
              <img
                src={story.imageUrl}
                alt={story.title}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />
              {/* Subtle green duotone/tint overlay, removed on hover */}
              <div className="absolute inset-0 bg-[#243826]/35 mix-blend-multiply group-hover:opacity-0 transition-opacity duration-500 pointer-events-none" />
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-[#172318] p-8 text-center text-[#FFFDD0]/40 font-mono text-xs uppercase tracking-widest">
              <span>[ ODYSSEUS ARCHIVE FEATURE ]</span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
