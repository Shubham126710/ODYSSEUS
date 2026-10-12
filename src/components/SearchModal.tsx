"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFeedFetcher, Story } from '@/hooks/useFeedFetcher';
import { useProfile } from '@/hooks/useProfile';
import { 
  cleanSource, 
  cleanCategory, 
  computeReadTime, 
  sanitizeText, 
  capitalizeFirstLetter,
  upgradeThumbnailResolution 
} from '@/lib/textUtils';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectStory?: (story: any) => void;
}

const SUGGESTED_QUERIES = ['Tech', 'Design', 'Culture', 'Science', 'Sports', 'AI', 'Architecture'];

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose, onSelectStory }) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { profile } = useProfile();
  const { stories } = useFeedFetcher(profile?.id);

  // Filter stories by search query
  const q = query.toLowerCase().trim();
  const results = q.length > 1
    ? stories.filter(s =>
        (s.title && s.title.toLowerCase().includes(q)) ||
        (s.excerpt && s.excerpt.toLowerCase().includes(q)) ||
        (s.source && s.source.toLowerCase().includes(q)) ||
        (s.author && s.author.toLowerCase().includes(q)) ||
        (s.category && s.category.toLowerCase().includes(q)) ||
        (s.content && s.content.toLowerCase().includes(q))
      ).slice(0, 15)
    : [];

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 120);
    }
  }, [isOpen]);

  // Reset query when modal opens
  const prevOpen = useRef(false);
  useEffect(() => {
    if (isOpen && !prevOpen.current) {
      setTimeout(() => setQuery(''), 0);
    }
    prevOpen.current = isOpen;
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSelect = (story: Story) => {
    if (onSelectStory) {
      onSelectStory(story);
    } else {
      window.location.href = `/story/${encodeURIComponent(String(story.id))}?url=${encodeURIComponent(story.link)}&title=${encodeURIComponent(story.title)}&source=${encodeURIComponent(story.source)}&date=${encodeURIComponent(story.date)}&imageUrl=${encodeURIComponent(story.imageUrl || '')}`;
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ zIndex: 9998 }}
            className="fixed inset-0 bg-black/65 backdrop-blur-md"
          />

          {/* Search Panel Container */}
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.98 }}
            transition={{ type: "spring", damping: 26, stiffness: 320 }}
            style={{ zIndex: 9999 }}
            className="fixed top-0 left-0 right-0 pt-8 sm:pt-14 px-4 flex justify-center pointer-events-none"
          >
            <div 
              style={{ backgroundColor: '#FFFDD0', color: '#2F4522' }}
              className="w-full max-w-2xl rounded-2xl sm:rounded-3xl border border-[#5D8246]/25 shadow-2xl overflow-hidden pointer-events-auto flex flex-col max-h-[82vh]"
            >
              {/* Top Folio Label */}
              <div className="px-6 pt-4 pb-2 border-b border-[#5D8246]/10 flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#5D8246]/70 font-bold flex items-center gap-1.5">
                  <span className="text-[#FF6B4A]">✦</span>
                  <span>ODYSSEUS ARCHIVE SEARCH</span>
                </span>
                <span className="font-mono text-[10px] uppercase tracking-wider text-[#5D8246]/50">
                  {stories.length} Dispatches Indexed
                </span>
              </div>

              {/* Search Input Row — strict zero blue outline, warm magazine styling */}
              <div className="flex items-center gap-3 px-6 py-4 border-b border-[#5D8246]/15 bg-[#FFFDD0]">
                <svg className="w-5 h-5 shrink-0 text-[#5D8246]" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="7" />
                  <path strokeLinecap="round" d="M21 21l-5-5" />
                </svg>
                
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search dispatches, publications, topics..."
                  style={{ outline: 'none', boxShadow: 'none' }}
                  className="flex-1 bg-transparent text-base sm:text-lg font-sans font-bold text-[#2F4522] placeholder:text-[#5D8246]/40 border-0 outline-none ring-0 focus:outline-none focus:ring-0 focus:border-0 p-0"
                />

                {query && (
                  <button
                    onClick={() => setQuery('')}
                    className="text-xs font-mono text-[#5D8246]/50 hover:text-[#5D8246] px-2 py-1 rounded-md transition-colors"
                  >
                    Clear
                  </button>
                )}

                <button
                  onClick={onClose}
                  className="text-[10px] font-mono font-bold uppercase tracking-widest px-3 py-1.5 rounded-full text-[#5D8246] hover:text-[#FFFDD0] bg-[#5D8246]/10 hover:bg-[#FF6B4A] transition-all cursor-pointer shadow-xs"
                >
                  ESC
                </button>
              </div>

              {/* Results & Suggestions Body */}
              <div className="overflow-y-auto flex-1 p-2 sm:p-3">
                {/* Initial Suggestion Pills */}
                {query.trim().length <= 1 && (
                  <div className="py-8 px-6 text-center space-y-5">
                    <div>
                      <p className="font-sans font-black text-xl text-[#2F4522]">
                        Explore the Entire Broadside
                      </p>
                      <p className="text-xs text-[#5D8246]/70 mt-1 max-w-md mx-auto leading-relaxed">
                        Search across real-time feeds from Wired, The Verge, Dezeen, Quanta, BBC, and all curated salon desks.
                      </p>
                    </div>

                    <div className="pt-2">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#5D8246]/60 block mb-2.5">
                        SUGGESTED DISPATCHES:
                      </span>
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        {SUGGESTED_QUERIES.map((tag) => (
                          <button
                            key={tag}
                            onClick={() => {
                              setQuery(tag);
                              inputRef.current?.focus();
                            }}
                            className="px-3.5 py-1.5 rounded-full bg-[#5D8246]/10 hover:bg-[#FF6B4A] text-[#2F4522] hover:text-[#FFFDD0] font-mono text-xs font-bold uppercase tracking-wider transition-colors border border-[#5D8246]/15"
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* No Results */}
                {query.trim().length > 1 && results.length === 0 && (
                  <div className="py-12 px-6 text-center space-y-2">
                    <p className="font-sans font-bold text-base text-[#2F4522]">
                      No dispatches found for &ldquo;{query}&rdquo;
                    </p>
                    <p className="text-xs font-mono text-[#5D8246]/60">
                      Try searching by source (e.g. &ldquo;BBC&rdquo;, &ldquo;Wired&rdquo;) or general subject.
                    </p>
                  </div>
                )}

                {/* Result Rows */}
                {results.length > 0 && (
                  <div className="py-1 space-y-1">
                    <div className="px-4 py-2 flex items-center justify-between border-b border-[#5D8246]/10 mb-1">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#5D8246]/70">
                        [{results.length} DISPATCHES FOUND]
                      </span>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[#FF6B4A] font-bold">
                        SELECT TO READ
                      </span>
                    </div>

                    {results.map((story) => (
                      <SearchResultRow 
                        key={story.id || story.link} 
                        story={story} 
                        onSelect={() => handleSelect(story)} 
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Bottom Folio Footer */}
              <div className="px-6 py-3 border-t border-[#5D8246]/15 bg-[#5D8246]/5 flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-[#5D8246]/60">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B4A]" />
                  <span>Interactive Salon Archive</span>
                </span>
                <span className="font-bold text-[#FF6B4A]">
                  ↵ Press Enter to Open
                </span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

/** Individual result row with rounded thumbnail and magazine typography */
function SearchResultRow({ story, onSelect }: { story: Story; onSelect: () => void }) {
  const displaySource = cleanSource(story.source);
  const displayCategory = cleanCategory(story.category);
  const displayReadTime = computeReadTime(story);
  const upgradedImg = story.imageUrl ? upgradeThumbnailResolution(story.imageUrl) : null;

  return (
    <div
      onClick={onSelect}
      className="flex items-center gap-3.5 px-4 py-3 rounded-xl sm:rounded-2xl hover:bg-[#5D8246]/10 transition-colors group cursor-pointer"
    >
      {/* Rounded Thumbnail */}
      {upgradedImg ? (
        <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-[#5D8246]/10 border border-[#5D8246]/20 shadow-xs">
          <img 
            src={upgradedImg} 
            alt={story.title} 
            className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition-transform duration-300" 
          />
        </div>
      ) : (
        <div className="w-14 h-14 rounded-xl shrink-0 flex items-center justify-center bg-[#5D8246]/15 border border-[#5D8246]/20 font-serif font-black text-lg text-[#5D8246]">
          {displaySource.charAt(0)}
        </div>
      )}

      {/* Title + Metadata */}
      <div className="flex-1 min-w-0">
        <h4 className="font-sans font-bold text-sm sm:text-base text-[#2F4522] group-hover:text-[#FF6B4A] line-clamp-1 leading-snug transition-colors">
          {capitalizeFirstLetter(sanitizeText(story.title))}
        </h4>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#FF6B4A]">
            {displaySource}
          </span>
          {displayCategory && (
            <>
              <span className="text-[#5D8246]/30 font-mono text-xs">•</span>
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#5D8246]/70">
                {displayCategory}
              </span>
            </>
          )}
          {displayReadTime && (
            <>
              <span className="text-[#5D8246]/30 font-mono text-xs">•</span>
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#5D8246]/50">
                {displayReadTime}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Arrow Indicator */}
      <span className="text-base text-[#5D8246]/40 group-hover:text-[#FF6B4A] group-hover:translate-x-1 transition-all shrink-0">
        →
      </span>
    </div>
  );
}
