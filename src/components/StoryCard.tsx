import React from 'react';
import { EditorialMonogramPoster } from './EditorialMonogramPoster';
import { decodeHtmlEntities } from '@/lib/textUtils';

interface StoryCardProps {
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

  return (
    <div className="group relative flex flex-col h-full bg-[#FAF7EE] text-[#131E15] border border-white/20 hover:border-[#EA580C] rounded-2xl overflow-hidden shadow-md hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
      
      {/* Visual Header */}
      <div className="relative w-full aspect-[16/10] overflow-hidden bg-stone-200 shrink-0">
        {!imageFailed && activeSrc ? (
          <img 
            src={activeSrc} 
            alt={title} 
            onError={handleImageError}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <EditorialMonogramPoster 
            source={source} 
            category={category} 
            title={title} 
            className="w-full h-full" 
          />
        )}
        
        {/* Category Badge */}
        <div className="absolute top-3 left-3 bg-[#131E15]/90 text-white backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider shadow-xs border border-white/10">
          {category}
        </div>
      </div>

      {/* Content Section */}
      <div className="p-5 flex flex-col flex-grow justify-between space-y-3">
        
        <div className="space-y-2">
          {/* Publisher Meta Row */}
          <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider">
            <span className="font-bold text-[#EA580C] truncate max-w-[140px]">{source}</span>
            <span className="text-stone-500">{date}</span>
          </div>

          {/* Title */}
          <h3 className="font-serif text-lg font-bold leading-snug text-[#131E15] group-hover:text-[#EA580C] transition-colors duration-200 line-clamp-2">
            {decodeHtmlEntities(title)}
          </h3>

          {/* Excerpt */}
          <p className="text-xs text-[#37493A] leading-relaxed line-clamp-2 font-sans">
            {decodeHtmlEntities(excerpt)}
          </p>
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-stone-200/80 flex items-center justify-between mt-auto">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#131E15] group-hover:text-[#EA580C] transition-colors flex items-center gap-1.5">
            <span>Read Story</span>
            <span className="text-sm font-sans transition-transform group-hover:translate-x-0.5">→</span>
          </span>
          
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-stone-500 tracking-wider mr-1">
              {readTime}
            </span>

            {/* Bookmark button */}
            <button 
              className={`p-1.5 rounded-full hover:bg-stone-100 transition-colors ${isSaved ? 'text-amber-600' : 'text-stone-400 hover:text-stone-700'}`} 
              aria-label="Save story"
              title={isSaved ? "Saved to Library" : "Save for later"}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleSave?.();
              }}
            >
              <svg className="w-4 h-4" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </button>

            {/* Share button */}
            <button 
              className="p-1.5 rounded-full hover:bg-stone-100 transition-colors text-stone-400 hover:text-stone-700" 
              aria-label="Share story"
              title="Share story"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onShare?.();
              }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
