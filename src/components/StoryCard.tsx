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
    <div className="group relative flex flex-col h-full bg-[#FCFAF7] text-[#181715] border border-[#E0D9CC] hover:border-[#8C8275] rounded-2xl overflow-hidden shadow-[0_2px_8px_rgba(40,30,20,0.03)] hover:shadow-[0_12px_28px_rgba(40,30,20,0.08)] hover:-translate-y-1 transition-all duration-300">
      
      {/* Visual Header with Archival Frame */}
      <div className="relative w-full aspect-[16/10] overflow-hidden bg-[#ECE7DC] shrink-0 border-b border-[#E8E2D5]">
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
        
        {/* Tactile Letterpress Category Badge */}
        <div className="absolute top-3 left-3 bg-[#FCFAF7]/95 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider text-[#2C241E] shadow-2xs border border-[#D5CEBF] flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#EA580C]" />
          <span>{category}</span>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-5 flex flex-col flex-grow justify-between space-y-3.5">
        
        <div className="space-y-2">
          {/* Publisher Meta Row */}
          <div className="flex items-center justify-between text-[11px] font-mono text-[#8C8275] uppercase tracking-wider">
            <span className="font-bold text-[#8A5A1C] truncate max-w-[140px]">{source}</span>
            <span>{date}</span>
          </div>

          {/* Title */}
          <h3 className="font-serif text-lg font-bold leading-snug text-[#181715] group-hover:text-[#EA580C] transition-colors duration-200 line-clamp-2 tracking-tight">
            {decodeHtmlEntities(title)}
          </h3>

          {/* Excerpt */}
          <p className="text-xs text-[#554D42] leading-relaxed line-clamp-2 font-sans">
            {decodeHtmlEntities(excerpt)}
          </p>
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-[#EAE4D7] flex items-center justify-between mt-auto">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#181715] group-hover:text-[#EA580C] transition-colors flex items-center gap-1.5">
            <span>Read Story</span>
            <span className="text-sm font-sans transition-transform group-hover:translate-x-0.5">→</span>
          </span>
          
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-[#8C8275] tracking-wider mr-1">
              {readTime}
            </span>

            {/* Bookmark button */}
            <button 
              className={`p-1.5 rounded-full hover:bg-[#EFECE3] transition-colors ${isSaved ? 'text-[#EA580C]' : 'text-[#8C8275] hover:text-[#181715]'}`} 
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
              className="p-1.5 rounded-full hover:bg-[#EFECE3] transition-colors text-[#8C8275] hover:text-[#181715]" 
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
