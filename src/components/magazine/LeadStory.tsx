import React from 'react';
import { decodeHtmlEntities } from '@/lib/textUtils';
import { EditorialHeadline, EditorialDropCapText } from '@/lib/editorialTypography';
import { EditorialMonogramPoster } from '../EditorialMonogramPoster';

interface LeadStoryProps {
  featuredStory: any;
  sideStories: any[];
  onSelectStory: (story: any) => void;
  onToggleSave?: (story: any) => void;
  isSaved?: (story: any) => boolean;
}

export const LeadStory: React.FC<LeadStoryProps> = ({
  featuredStory,
  sideStories,
  onSelectStory,
  onToggleSave,
  isSaved,
}) => {
  const [useProxy, setUseProxy] = React.useState(false);
  const [imageFailed, setImageFailed] = React.useState(!featuredStory?.imageUrl);

  if (!featuredStory) return null;

  const handleImageError = () => {
    if (!useProxy && featuredStory.imageUrl) {
      setUseProxy(true);
    } else {
      setImageFailed(true);
    }
  };

  const activeSrc = useProxy && featuredStory.imageUrl
    ? `/api/image-proxy?url=${encodeURIComponent(featuredStory.imageUrl)}`
    : featuredStory.imageUrl;

  return (
    <section 
      aria-label="Lead Story and Highlights"
      className="w-full pb-8 pt-2"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        
        {/* LEFT COLUMN (~60%): DOMINANT LEAD STORY */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-5 group cursor-pointer" onClick={() => onSelectStory(featuredStory)}>
          
          {/* Main Hero Visual Frame (Aspect 16:10 with Green Duotone Overlay) */}
          <div className="relative w-full aspect-[16/10] overflow-hidden bg-[#1E2E20] border border-[#FFFDD0]/15">
            {!imageFailed && activeSrc ? (
              <div className="relative w-full h-full">
                <img
                  src={activeSrc}
                  alt={featuredStory.title}
                  onError={handleImageError}
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-103"
                />
                {/* Subtle green duotone overlay for cohesion across publishers, removed on hover */}
                <div className="absolute inset-0 bg-[#243826]/35 mix-blend-multiply group-hover:opacity-0 transition-opacity duration-500 pointer-events-none" />
              </div>
            ) : (
              <EditorialMonogramPoster
                source={featuredStory.source}
                category={featuredStory.category}
                title={featuredStory.title}
                className="w-full h-full"
              />
            )}

            {/* Category Stamp Badge */}
            <div className="absolute top-3 left-3 bg-[#1C2A1A]/90 backdrop-blur-xs px-2.5 py-1 text-[9px] font-mono font-bold uppercase tracking-[0.25em] text-[#EA580C] border border-[#FFFDD0]/25 shadow-sm">
              LEAD COVER • {featuredStory.category}
            </div>
          </div>

          {/* Lead Meta Folio */}
          <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-[0.25em] text-[#FFFDD0]/65 pt-1">
            <span className="font-bold text-[#EA580C] tracking-widest">{featuredStory.source}</span>
            <span>•</span>
            <span>{featuredStory.readTime || '5 MIN READ'}</span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline text-[#FFFDD0]/45">{featuredStory.date}</span>
          </div>

          {/* Massive Headline */}
          <h2 className="font-sans font-black text-3xl sm:text-4xl md:text-5xl lg:text-[2.75rem] leading-[1.06] tracking-tight text-[#FFFDD0] group-hover:text-white transition-colors duration-200">
            <EditorialHeadline title={decodeHtmlEntities(featuredStory.title)} />
          </h2>

          {/* Excerpt with Classic Magazine Drop Cap */}
          {featuredStory.excerpt && (
            <div className="pt-1">
              <EditorialDropCapText text={decodeHtmlEntities(featuredStory.excerpt)} />
            </div>
          )}

          {/* Read CTA + Save Button */}
          <div className="pt-3 flex items-center gap-4">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelectStory(featuredStory);
              }}
              className="px-6 py-2.5 bg-[#EA580C] hover:bg-[#C2410C] text-white font-mono font-bold text-xs uppercase tracking-wider transition-all duration-200 shadow-md flex items-center gap-2 group-hover:scale-102"
            >
              <span>READ STORY</span>
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </button>

            {onToggleSave && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSave(featuredStory);
                }}
                className={`p-2.5 border transition-all ${
                  isSaved && isSaved(featuredStory)
                    ? 'border-[#EA580C] text-[#EA580C] bg-[#EA580C]/10'
                    : 'border-[#FFFDD0]/20 text-[#FFFDD0]/60 hover:text-[#EA580C] hover:border-[#EA580C]'
                }`}
                title="Save for Later"
                aria-label="Save for Later"
              >
                <svg className="w-4 h-4" fill={isSaved && isSaved(featuredStory) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN (~40%): 2-3 SMALLER STACKED STORIES SEPARATED BY HAIRLINES */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col divide-y divide-[#FFFDD0]/12 border-t lg:border-t-0 border-[#FFFDD0]/12 pt-6 lg:pt-0">
          <div className="pb-3 mb-1">
            <span className="font-mono text-[9px] font-bold uppercase tracking-[0.25em] text-[#EA580C] block">
              EDITION HIGHLIGHTS • TOP DISPATCHES
            </span>
          </div>

          {sideStories.slice(0, 3).map((story, idx) => (
            <article 
              key={story.id || idx}
              onClick={() => onSelectStory(story)}
              className="group py-5 first:pt-2 last:pb-2 cursor-pointer flex gap-4 items-start transition-colors"
            >
              {/* Thumbnail with duotone overlay */}
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 shrink-0 overflow-hidden bg-[#1E2E20] border border-[#FFFDD0]/10">
                {story.imageUrl ? (
                  <div className="relative w-full h-full">
                    <img 
                      src={story.imageUrl} 
                      alt={story.title} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy" 
                    />
                    <div className="absolute inset-0 bg-[#243826]/35 mix-blend-multiply group-hover:opacity-0 transition-opacity duration-500 pointer-events-none" />
                  </div>
                ) : (
                  <EditorialMonogramPoster 
                    source={story.source} 
                    category={story.category} 
                    title={story.title} 
                    className="w-full h-full" 
                  />
                )}
              </div>

              {/* Text content */}
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-center gap-2 text-[9px] font-mono uppercase tracking-[0.2em] text-[#FFFDD0]/60">
                  <span className="text-[#EA580C] font-bold">{story.category}</span>
                  <span>•</span>
                  <span className="truncate">{story.source}</span>
                </div>

                <h3 className="font-sans font-bold text-sm sm:text-base leading-snug text-[#FFFDD0] group-hover:text-white transition-colors duration-200 line-clamp-2">
                  <EditorialHeadline title={decodeHtmlEntities(story.title)} />
                </h3>

                <div className="flex items-center justify-between text-[9px] font-mono uppercase tracking-wider text-[#FFFDD0]/50 pt-1">
                  <span>{story.readTime || '3 MIN'}</span>
                  <span className="text-[#EA580C] font-bold group-hover:translate-x-1 transition-transform">
                    READ →
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>

      </div>
    </section>
  );
};
