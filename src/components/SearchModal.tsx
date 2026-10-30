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
      setTimeout(() => inputRef.current?.focus(), 100);
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
            className="fixed inset-0 bg-black/60 backdrop-blur-md"
          />

          {/* Search Panel Container */}
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.99 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            style={{ zIndex: 9999 }}
            className="fixed top-0 left-0 right-0 pt-8 sm:pt-14 px-4 flex justify-center pointer-events-none"
          >
            <div 
              style={{ backgroundColor: '#1E2D18', color: '#FFFDD0', maxWidth: '640px', width: '100%' }}
              className="rounded-2xl sm:rounded-3xl border border-[#FFFDD0]/15 shadow-2xl overflow-hidden pointer-events-auto flex flex-col max-h-[82vh]"
            >
              {/* Top Folio Label */}
              <div className="px-6 pt-4 pb-2.5 border-b border-[#FFFDD0]/10 flex items-center justify-between bg-[#162211]/80">
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#FFFDD0]/70 font-bold flex items-center gap-2">
                  <span className="text-[#FF6B4A]">✦</span>
                  <span>ODYSSEUS ARCHIVE</span>
                </span>
                <span className="font-mono text-[10px] uppercase tracking-wider text-[#FFFDD0]/50">
                  {stories.length} Dispatches Indexed
                </span>
              </div>

              {/* Search Input Row */}
              <div className="flex items-center gap-3 px-6 py-4 border-b border-[#FFFDD0]/10 bg-[#1E2D18]">
                <svg className="w-5 h-5 shrink-0 text-[#FFFDD0]/60" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
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
                  className="flex-1 bg-transparent text-base sm:text-lg font-serif text-[#FFFDD0] placeholder:font-sans placeholder:text-[#FFFDD0]/40 placeholder:text-sm sm:placeholder:text-base border-0 outline-none ring-0 focus:outline-none focus:ring-0 focus:border-0 p-0"
                />

                {query && (
                  <button
                    onClick={() => setQuery('')}
                    className="text-xs font-mono text-[#FFFDD0]/60 hover:text-[#FFFDD0] px-2 py-1 rounded-md transition-colors cursor-pointer"
                  >
                    Clear
                  </button>
                )}

                <kbd className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-[#FFFDD0]/90 border border-white/15 select-none">
                  ESC
                </kbd>
              </div>

              {/* Results & Suggestions Body */}
              <div className="overflow-y-auto flex-1 p-3 sm:p-4">
                {/* Initial Suggestion Pills */}
                {query.trim().length <= 1 && (
                  <div className="py-8 px-6 text-center space-y-5">
                    <div>
                      <p className="font-serif font-bold text-xl text-[#FFFDD0]">
                        Explore the Entire Broadside
                      </p>
                      <p className="text-xs text-[#FFFDD0]/70 mt-1.5 max-w-md mx-auto leading-relaxed">
                        Search across real-time dispatches from Wired, The Verge, Dezeen, Quanta, BBC, and all curated desks.
                      </p>
                    </div>

                    <div className="pt-2">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#FFFDD0]/60 block mb-3">
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
                            style={{ backgroundColor: 'rgba(255, 253, 208, 0.08)' }}
                            className="px-3.5 py-1.5 rounded-lg text-[#FFFDD0] hover:text-[#FF6B4A] hover:bg-white/15 font-mono text-xs font-semibold tracking-wider transition-all cursor-pointer border border-[#FFFDD0]/10 hover:border-[#FF6B4A]/40"
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
                    <p className="font-serif font-bold text-base text-[#FFFDD0]">
                      No dispatches found for &ldquo;{query}&rdquo;
                    </p>
                    <p className="text-xs font-mono text-[#FFFDD0]/60">
                      Try searching by source (e.g. &ldquo;BBC&rdquo;, &ldquo;Wired&rdquo;) or general subject.
                    </p>
                  </div>
                )}

                {/* Result Rows */}
                {results.length > 0 && (
                  <div className="py-1 space-y-1">
                    <div className="px-4 py-2 flex items-center justify-between border-b border-[#FFFDD0]/10 mb-1">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#FFFDD0]/60">
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
              <div className="px-6 py-3 border-t border-[#FFFDD0]/10 bg-[#162211]/80 flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-[#FFFDD0]/60">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B4A]" />
                  <span>Curated Salon Archive</span>
                </span>
                <span className="text-[#FFFDD0]/60">
                  ↵ Enter to read
                </span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

/** Individual result row with rounded thumbnail and luxury typography */
function SearchResultRow({ story, onSelect }: { story: Story; onSelect: () => void }) {
  const displaySource = cleanSource(story.source);
  const displayCategory = cleanCategory(story.category);
  const displayReadTime = computeReadTime(story);
  const upgradedImg = story.imageUrl ? upgradeThumbnailResolution(story.imageUrl) : null;

  return (
    <div
      onClick={onSelect}
      className="flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl hover:bg-white/10 transition-colors group cursor-pointer"
    >
      {/* Rounded Thumbnail */}
      {upgradedImg ? (
        <div className="w-13 h-13 rounded-xl overflow-hidden shrink-0 bg-black/20">
          <img 
            src={upgradedImg} 
            alt={story.title} 
            className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition-transform duration-300" 
          />
        </div>
      ) : (
        <div className="w-13 h-13 rounded-xl shrink-0 flex items-center justify-center bg-[#5D8246]/20 font-serif font-black text-lg text-[#FFFDD0]">
          {displaySource.charAt(0)}
        </div>
      )}

      {/* Title + Metadata */}
      <div className="flex-1 min-w-0">
        <h4 className="font-serif font-bold text-sm sm:text-base text-[#FFFDD0] group-hover:text-[#FF6B4A] line-clamp-1 leading-snug transition-colors">
          {capitalizeFirstLetter(sanitizeText(story.title))}
        </h4>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#FF6B4A]">
            {displaySource}
          </span>
          {displayCategory && (
            <>
              <span className="text-white/20 font-mono text-xs">•</span>
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#FFFDD0]/60">
                {displayCategory}
              </span>
            </>
          )}
          {displayReadTime && (
            <>
              <span className="text-white/20 font-mono text-xs">•</span>
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#FFFDD0]/40">
                {displayReadTime}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Arrow Indicator */}
      <span className="text-base text-[#FFFDD0]/40 group-hover:text-[#FF6B4A] group-hover:translate-x-1 transition-all shrink-0">
        →
      </span>
    </div>
  );
}
