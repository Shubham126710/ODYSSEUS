import React from 'react';
import { StaticOrangeCompass } from './StaticOrangeCompass';

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
  onShare
}) => {
  return (
    <div className="group relative flex flex-col h-full bg-juice-cream text-juice-green border border-juice-green/10 hover:border-juice-orange/50 transition-all duration-300 rounded-xl overflow-hidden hover:shadow-xl hover:shadow-juice-green/5">
      
      {/* Image Section (Conditional) */}
      {imageUrl && (
        <div className="relative h-36 sm:h-48 w-full overflow-hidden">
          <img 
            src={imageUrl} 
            alt={title} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute top-3 left-3 md:top-4 md:left-4 bg-juice-cream/90 backdrop-blur-sm px-2.5 md:px-3 py-1 rounded-full text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-juice-green">
            {category}
          </div>
        </div>
      )}

      {/* Content Section */}
      <div className="p-4 md:p-6 flex flex-col flex-grow space-y-3 md:space-y-4">
        
        {/* Meta Header */}
        <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-juice-green/60">
          <div className="flex items-center gap-2">
            <span className="font-bold text-juice-orange">{source}</span>
            <span>•</span>
            <span>{date}</span>
          </div>
        </div>

        {/* Title */}
        <h3 className="font-serif text-lg sm:text-xl md:text-2xl font-bold leading-tight text-juice-green group-hover:text-juice-orange transition-colors duration-300">
          {title}
        </h3>

        {/* Excerpt */}
        <p className="text-xs sm:text-sm leading-relaxed text-juice-green/80 line-clamp-2 sm:line-clamp-3">
          {excerpt}
        </p>

        {/* Footer Actions */}
        <div className="pt-4 mt-auto flex items-center justify-between border-t border-juice-green/10 text-juice-green">
          <button className="text-xs font-bold uppercase tracking-widest hover:text-juice-orange transition-colors flex items-center gap-2">
            Read Story <span className="text-lg">→</span>
          </button>
          
          <div className="flex gap-3">
             <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-juice-green/60 mr-2">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                {readTime}
             </div>
            <button 
              className={`p-2 hover:bg-juice-green/5 rounded-full transition-colors ${isSaved ? 'text-juice-orange' : 'text-juice-green/60'}`} 
              aria-label="Save"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleSave?.();
              }}
            >
              <svg className="w-4 h-4" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </button>
            <button 
              className="p-2 hover:bg-juice-green/5 rounded-full transition-colors text-juice-green/60" 
              aria-label="Share"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onShare?.();
              }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
