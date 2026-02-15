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
  const results = query.trim().length > 1
    ? stories.filter(s =>
        s.title.toLowerCase().includes(query.toLowerCase()) ||
        s.excerpt.toLowerCase().includes(query.toLowerCase()) ||
        s.source.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 10)
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
            style={{
              position: 'fixed', inset: 0, zIndex: 60,
              backgroundColor: 'rgba(30,50,30,0.6)',
              backdropFilter: 'blur(8px)',
            }}
          />

          {/* Search Panel */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, zIndex: 70,
              paddingTop: 24, paddingLeft: 16, paddingRight: 16,
            }}
          >
            <div style={{
              maxWidth: 540, margin: '0 auto',
              backgroundColor: '#FEFDF5',
              borderRadius: 16,
              border: '1px solid rgba(93,130,70,0.15)',
              boxShadow: '0 25px 60px rgba(0,0,0,0.15)',
              overflow: 'hidden',
            }}>
              {/* Search Input Row */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '16px 20px',
                borderBottom: '1px solid rgba(93,130,70,0.1)',
              }}>
                <svg style={{ width: 20, height: 20, flexShrink: 0, color: 'rgba(93,130,70,0.4)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search stories, sources..."
                  style={{
                    flex: 1, backgroundColor: 'transparent',
                    fontSize: 16, fontWeight: 500, color: '#5D8246',
                    outline: 'none', border: 'none',
                  }}
                />
                <button
                  onClick={onClose}
                  style={{
                    fontSize: 10, fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: '0.1em',
                    padding: '4px 10px', borderRadius: 6,
                    color: 'rgba(93,130,70,0.4)',
                    backgroundColor: 'rgba(93,130,70,0.06)',
                    border: 'none', cursor: 'pointer',
                  }}
                >
                  ESC
                </button>
              </div>

              {/* Results Area */}
              <div style={{ maxHeight: '55vh', overflowY: 'auto' }}>
                {query.trim().length > 1 && results.length === 0 && (
                  <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                    <p style={{ color: 'rgba(93,130,70,0.4)', fontWeight: 500, fontSize: 14 }}>No stories found for &ldquo;{query}&rdquo;</p>
                  </div>
                )}

                {results.length > 0 && (
                  <div style={{ padding: '4px 0' }}>
                    <p style={{
                      padding: '12px 20px 8px',
                      fontSize: 10, fontWeight: 700,
                      textTransform: 'uppercase', letterSpacing: '0.12em',
                      color: 'rgba(93,130,70,0.35)',
                    }}>
                      {results.length} result{results.length !== 1 ? 's' : ''}
                    </p>
                    {results.map((story) => (
                      <SearchResultItem key={story.id} story={story} onClose={onClose} />
                    ))}
                  </div>
                )}

                {query.trim().length <= 1 && (
                  <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                    <p style={{ fontWeight: 500, fontSize: 14, color: 'rgba(93,130,70,0.3)' }}>Type to search your feed</p>
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

/** Individual result row — extracted to handle hover state cleanly */
function SearchResultItem({ story, onClose }: { story: Story; onClose: () => void }) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      href={`/story/${encodeURIComponent(String(story.id))}?url=${encodeURIComponent(story.link)}&title=${encodeURIComponent(story.title)}&source=${encodeURIComponent(story.source)}&date=${encodeURIComponent(story.date)}&imageUrl=${encodeURIComponent(story.imageUrl || '')}`}
      onClick={onClose}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 20px',
        backgroundColor: hovered ? 'rgba(93,130,70,0.05)' : 'transparent',
        textDecoration: 'none',
        transition: 'background-color 0.15s',
      }}
    >
      {/* Thumbnail / Initial */}
      {story.imageUrl ? (
        <div style={{
          width: 44, height: 44, borderRadius: 10,
          overflow: 'hidden', flexShrink: 0,
          backgroundColor: 'rgba(93,130,70,0.05)',
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={story.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        </div>
      ) : (
        <div style={{
          width: 44, height: 44, borderRadius: 10,
          flexShrink: 0, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          backgroundColor: 'rgba(93,130,70,0.06)',
        }}>
          <span style={{ fontSize: 16, fontWeight: 900, color: 'rgba(93,130,70,0.2)' }}>
            {story.source.charAt(0)}
          </span>
        </div>
      )}

      {/* Title + meta */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <h4 style={{
          fontFamily: 'serif', fontWeight: 700, fontSize: 14,
          lineHeight: 1.35, color: '#3d5a2e',
          overflow: 'hidden', textOverflow: 'ellipsis',
          whiteSpace: 'nowrap', margin: 0,
        }}>
          {story.title}
        </h4>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
          <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#FF6B4A' }}>
            {story.source}
          </span>
          <span style={{ color: 'rgba(93,130,70,0.2)' }}>·</span>
          <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(93,130,70,0.4)' }}>
            {story.readTime}
          </span>
        </div>
      </div>

      {/* Small chevron */}
      <svg style={{ width: 14, height: 14, flexShrink: 0, color: hovered ? '#FF6B4A' : 'rgba(93,130,70,0.15)', transition: 'color 0.15s' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  );
}
