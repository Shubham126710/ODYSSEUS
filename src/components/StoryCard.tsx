import React from 'react';
import { EditorialMonogramPoster } from './EditorialMonogramPoster';
import { decodeHtmlEntities } from '@/lib/textUtils';
import { EditorialHeadline } from '@/lib/editorialTypography';

export interface StoryCardProps {
  id?: string;
  title: string;
  excerpt: string;
  source: string;
  date: string;
  readTime: string;
  imageUrl?: string | null;
  category: string;
  onToggleSave?: () => void;
  isSaved?: boolean;
  onShare?: () => void;
  variant?: 'standard' | 'tall' | 'compact' | 'horizontal';
  showExcerpt?: boolean;
  aspectRatio?: '16/10' | '4/5' | 'square';
  className?: string;
}

export const StoryCard: React.FC<StoryCardProps> = ({
  title,
  excerpt,
  source,
  date,
  readTime,
  imageUrl,
  category,
  onToggleSave,
  isSaved,
  onShare,
  variant = 'standard',
  showExcerpt = true,
  aspectRatio,
  className = "",
}) => {
  const [useProxy, setUseProxy] = React.useState(false);
  const [imageFailed, setImageFailed] = React.useState(!imageUrl);

  const handleImageError = () => {
    if (!useProxy && imageUrl && (imageUrl.startsWith('http://') || imageUrl.startsWith('https://'))) {
      setUseProxy(true);
    } else {
      setImageFailed(true);
    }
  };

  const activeSrc = useProxy && imageUrl 
    ? `/api/image-proxy?url=${encodeURIComponent(imageUrl)}` 
    : imageUrl;

  // Determine aspect ratio class
  const imageAspectClass = aspectRatio === '4/5' || variant === 'tall'
    ? 'aspect-[4/5]'
    : aspectRatio === 'square'
    ? 'aspect-square'
    : 'aspect-[16/10]';

  // Compact / Horizontal Variant
  if (variant === 'compact' || variant === 'horizontal') {
    return (
      <article 
        className={`group relative flex gap-4 items-start p-3 bg-white/[0.02] hover:bg-white/[0.05] border border-[#FFFDD0]/10 hover:border-[#FFFDD0]/25 rounded-2xl transition-all duration-300 ${className}`}
      >
        {/* Thumbnail */}
        <div className="relative w-24 h-24 sm:w-28 sm:h-28 shrink-0 overflow-hidden bg-[#1E2E20] border border-[#FFFDD0]/10 rounded-xl sm:rounded-2xl">
          {!imageFailed && activeSrc ? (
            <div className="relative w-full h-full">
              <img 
                src={activeSrc} 
                alt={title} 
                onError={handleImageError}
                loading="lazy"
                className="w-full h-full object-cover rounded-xl sm:rounded-2xl transition-transform duration-700 ease-out group-hover:scale-105"
              />
              {/* Subtle green duotone/tint overlay, removed on hover */}
              <div className="absolute inset-0 bg-[#243826]/35 mix-blend-multiply group-hover:opacity-0 transition-opacity duration-500 pointer-events-none" />
            </div>
          ) : (
            <EditorialMonogramPoster 
              source={source} 
              category={category} 
              title={title} 
              className="w-full h-full" 
            />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch py-0.5">
          <div className="space-y-1">
            {/* Meta */}
            <div className="flex items-center gap-2 text-[9px] font-mono uppercase tracking-[0.2em] text-[#FFFDD0]/60">
              <span className="text-[#FF6B4A] font-bold group-hover:text-[#FF8A6E] transition-colors">{category}</span>
              <span>•</span>
              <span className="truncate">{source}</span>
            </div>

            {/* Headline */}
            <h4 className="font-sans font-bold text-sm leading-snug text-[#FFFDD0] group-hover:text-white transition-colors duration-200 line-clamp-2">
              <EditorialHeadline title={decodeHtmlEntities(title)} />
            </h4>
          </div>

          <div className="flex items-center justify-between text-[9px] font-mono uppercase tracking-wider text-[#FFFDD0]/50 pt-2 border-t border-[#FFFDD0]/10 mt-2">
            <span>{readTime}</span>
            <span className="text-[#FF6B4A] font-bold group-hover:translate-x-1 transition-transform">
              READ →
            </span>
          </div>
        </div>
      </article>
    );
  }

  // Standard & Tall Magazine Card
  return (
    <article 
      className={`group relative flex flex-col h-full bg-white/[0.02] hover:bg-white/[0.05] border border-[#FFFDD0]/12 hover:border-[#FFFDD0]/30 rounded-2xl overflow-hidden transition-all duration-300 ${className}`}
    >
      {/* Magazine Image Frame */}
      <div className={`relative w-full ${imageAspectClass} overflow-hidden bg-[#1E2E20] shrink-0 border-b border-[#FFFDD0]/10 rounded-t-2xl`}>
        {!imageFailed && activeSrc ? (
          <div className="relative w-full h-full">
            <img 
              src={activeSrc} 
              alt={title} 
              onError={handleImageError}
              loading="lazy"
              className="w-full h-full object-cover rounded-t-2xl transition-transform duration-700 ease-out group-hover:scale-105"
            />
            {/* Subtle green duotone tint overlay for cohesion across publishers, removed on hover */}
            <div className="absolute inset-0 bg-[#243826]/35 mix-blend-multiply group-hover:opacity-0 transition-opacity duration-500 pointer-events-none" />
          </div>
        ) : (
          <EditorialMonogramPoster 
            source={source} 
            category={category} 
            title={title} 
            className="w-full h-full" 
          />
        )}
        
        {/* Category Label (Small, top-left) */}
        <div className="absolute top-2.5 left-2.5 bg-[#1E2E20]/90 backdrop-blur-xs px-2.5 py-0.5 rounded-full text-[8px] sm:text-[9px] font-mono font-bold uppercase tracking-[0.2em] text-[#FF6B4A] border border-[#FFFDD0]/20">
          {category}
        </div>
      </div>

      {/* Editorial Content */}
      <div className="p-4 sm:p-5 flex flex-col flex-grow justify-between space-y-3">
        <div className="space-y-2">
          {/* Metadata Row: SOURCE · 4 MIN */}
          <div className="flex items-center justify-between text-[9px] font-mono uppercase tracking-[0.2em] text-[#FFFDD0]/60">
            <span className="font-bold text-[#FF6B4A] truncate max-w-[140px] group-hover:text-[#FF8A6E] transition-colors">
              {source}
            </span>
            <span className="text-[#FFFDD0]/50">{readTime}</span>
          </div>

          {/* Headline */}
          <h3 className="font-sans font-bold text-base sm:text-lg leading-snug text-[#FFFDD0] group-hover:text-white transition-colors duration-200 line-clamp-3 tracking-tight">
            <EditorialHeadline title={decodeHtmlEntities(title)} />
          </h3>

          {/* Summary / Excerpt */}
          {showExcerpt && excerpt && (
            <p className="text-xs text-[#FFFDD0]/75 font-sans leading-relaxed line-clamp-2 pt-0.5">
              {decodeHtmlEntities(excerpt)}
            </p>
          )}
        </div>

        {/* Footer Meta & Read Action */}
        <div className="pt-3 border-t border-[#FFFDD0]/10 flex items-center justify-between mt-auto text-[10px] font-mono uppercase tracking-widest text-[#FFFDD0]/60">
          <span className="text-[9px] text-[#FFFDD0]/45">{date}</span>

          <div className="flex items-center gap-3">
            {/* Save Button */}
            {onToggleSave && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSave();
                }}
                className={`transition-colors p-1 hover:text-[#FF6B4A] ${isSaved ? 'text-[#FF6B4A]' : 'text-[#FFFDD0]/40'}`}
                title={isSaved ? "Saved to Library" : "Save for Later"}
                aria-label={isSaved ? "Saved to Library" : "Save for Later"}
              >
                <svg className="w-3.5 h-3.5" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </button>
            )}

            {/* Read Arrow */}
            <span className="text-[#FFFDD0] group-hover:text-[#FF6B4A] font-bold flex items-center gap-1 transition-colors">
              <span>READ</span>
              <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
            </span>
          </div>
        </div>
      </div>
    </article>
  );
};
