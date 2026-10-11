"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useFeedFetcher, Story } from '@/hooks/useFeedFetcher';
import { useProfile } from '@/hooks/useProfile';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { profile } = useProfile();
  const { stories } = useFeedFetcher(profile?.id);

  // Filter stories by search query
  const q = query.toLowerCase().trim();
  const results = q.length > 1
    ? stories.filter(s =>
        s.title.toLowerCase().includes(q) ||
        s.excerpt.toLowerCase().includes(q) ||
        s.source.toLowerCase().includes(q) ||
        (s.author && s.author.toLowerCase().includes(q)) ||
        s.category.toLowerCase().includes(q) ||
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
            className="fixed inset-0 z-60 bg-black/60 backdrop-blur-md"
          />

          {/* Search Panel */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed top-0 left-0 right-0 z-70 pt-8 px-4"
          >
            <div className="max-w-[580px] mx-auto bg-white rounded-2xl border border-stone-200/90 shadow-2xl overflow-hidden">
              {/* Search Input Row */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-stone-100">
                <svg className="w-5 h-5 shrink-0 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search articles, sources, topics..."
                  className="flex-1 bg-transparent text-base font-sans font-medium text-stone-900 placeholder:text-stone-400 outline-none border-none"
                />
                <button
                  onClick={onClose}
                  className="text-[10px] font-mono font-bold uppercase tracking-widest px-2.5 py-1 rounded-md text-stone-400 hover:text-stone-700 bg-stone-100 transition-colors"
                >
                  ESC
                </button>
              </div>

              {/* Results Area */}
              <div className="max-h-[55vh] overflow-y-auto">
                {query.trim().length > 1 && results.length === 0 && (
                  <div className="py-12 px-5 text-center">
                    <p className="text-sm font-sans text-stone-400">No stories found for &ldquo;{query}&rdquo;</p>
                  </div>
                )}

                {results.length > 0 && (
                  <div className="py-2">
                    <p className="px-5 py-2 text-[10px] font-mono font-bold uppercase tracking-widest text-stone-400">
                      {results.length} result{results.length !== 1 ? 's' : ''}
                    </p>
                    {results.map((story) => (
                      <SearchResultItem key={story.id} story={story} onClose={onClose} />
                    ))}
                  </div>
                )}

                {query.trim().length <= 1 && (
                  <div className="py-12 px-5 text-center">
                    <p className="text-sm font-sans text-stone-400">Type to search your reading feed</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

/** Individual result row */
function SearchResultItem({ story, onClose }: { story: Story; onClose: () => void }) {
  return (
    <Link
      href={`/story/${encodeURIComponent(String(story.id))}?url=${encodeURIComponent(story.link)}&title=${encodeURIComponent(story.title)}&source=${encodeURIComponent(story.source)}&date=${encodeURIComponent(story.date)}&imageUrl=${encodeURIComponent(story.imageUrl || '')}`}
      onClick={onClose}
      className="flex items-center gap-3.5 px-5 py-3 hover:bg-stone-50 transition-colors group text-decoration-none"
    >
      {/* Thumbnail */}
      {story.imageUrl ? (
        <div className="w-11 h-11 rounded-lg overflow-hidden shrink-0 bg-stone-100 border border-stone-200/60">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={story.imageUrl} alt="" className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="w-11 h-11 rounded-lg shrink-0 flex items-center justify-center bg-stone-100 border border-stone-200/60 font-serif font-black text-sm text-stone-400">
          {story.source.charAt(0)}
        </div>
      )}

      {/* Title + meta */}
      <div className="flex-1 min-w-0">
        <h4 className="font-serif font-bold text-sm text-stone-900 group-hover:text-[#EA580C] truncate transition-colors">
          {story.title}
        </h4>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#EA580C]">
            {story.source}
          </span>
          <span className="text-stone-300">•</span>
          <span className="text-[10px] font-mono text-stone-400 uppercase tracking-wider">
            {story.readTime}
          </span>
        </div>
      </div>

      <span className="text-stone-300 group-hover:text-[#EA580C] text-sm transition-colors">
        →
      </span>
    </Link>
  );
}
