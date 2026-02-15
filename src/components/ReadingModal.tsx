"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DOMPurify from 'isomorphic-dompurify';

// Helper to calculate read time
const calculateReadTime = (text: string) => {
  const wordsPerMinute = 130;
  const words = text.trim().split(/\s+/).length;
  const minutes = Math.ceil(words / wordsPerMinute);
  return `${minutes} min`;
};

interface ReadingModalProps {
  isOpen: boolean;
  onClose: () => void;
  article: any;
}

export const ReadingModal = ({ isOpen, onClose, article }: ReadingModalProps) => {
  const [fullContent, setFullContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState(false);

  const fetchContent = () => {
    if (article?.link) {
      setFullContent(null);
      setFetchError(false);
      setIsLoading(true);
      
      // Attempt to fetch full content
      fetch(`/api/read-mode?url=${encodeURIComponent(article.link)}&t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Pragma': 'no-cache',
          'Cache-Control': 'no-cache'
        }
      })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.article?.content) {
            setFullContent(data.article.content);
          } else {
            setFetchError(true);
          }
        })
        .catch(err => {
          console.error('Failed to load full content', err);
          setFetchError(true);
        })
        .finally(() => setIsLoading(false));
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchContent();
    }
  }, [isOpen, article]);

  if (!article) return null;

  // Use full content if available, otherwise fallback to RSS content
  const rawContent = fullContent || article.content || article['content:encoded'] || article.description || article.excerpt || '';
  const sanitizedContent = DOMPurify.sanitize(rawContent);
  const isContentShort = !fullContent && rawContent.length < 500; // Only consider it short if we don't have full content

  // Calculate dynamic read time based on the actual content we are showing
  const dynamicReadTime = fullContent ? calculateReadTime(fullContent) : article.readTime;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-juice-green/90 backdrop-blur-md z-[80]"
          />
          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 top-4 md:top-10 md:inset-x-8 md:bottom-4 bg-[#111827] text-white rounded-t-3xl md:rounded-3xl shadow-2xl z-[90] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10 bg-[#111827] z-10">
              <div className="flex items-center gap-3">
                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                </button>
                <span className="font-mono text-xs font-bold uppercase tracking-widest text-white/60">{article.source}</span>
                {isLoading && (
                  <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-juice-orange animate-pulse">
                    <span className="w-2 h-2 bg-juice-orange rounded-full"></span>
                    Fetching Full Story...
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <a href={article.link} target="_blank" rel="noopener noreferrer" className="px-4 py-2 rounded-full border border-white/20 text-xs font-bold uppercase tracking-widest text-white hover:bg-white hover:text-[#111827] transition-colors">
                  Visit Original
                </a>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8 md:p-16 max-w-3xl mx-auto w-full">
              {/* Article Header */}
              <header className="mb-12 text-center">
                <div className="flex items-center justify-center gap-3 text-white/60 font-mono text-xs uppercase tracking-widest mb-6">
                  <span>{article.source}</span>
                  <span>•</span>
                  <span>{article.date}</span>
                  <span>•</span>
                  <span>{dynamicReadTime}</span>
                </div>
                
                <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-8 leading-tight">
                  {article.title}
                </h1>

                {/* Author (if available) */}
                {article.author && (
                  <div className="flex items-center justify-center gap-2 text-white/80 font-medium mb-8">
                    <span>By {article.author}</span>
                  </div>
                )}
              </header>
              
              {/* Hero Image */}
              {(article.imageUrl || article.enclosure?.url) && (
                <figure className="mb-12">
                  <img 
                    src={article.imageUrl || article.enclosure?.url} 
                    alt="" 
                    className="w-full h-auto max-h-[600px] object-cover rounded-2xl shadow-lg bg-white/5" 
                  />
                </figure>
              )}

              {/* Error State */}
              {fetchError && isContentShort && !isLoading && (
                <div className="mb-8 p-4 bg-red-900/20 border border-red-500/30 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3 text-red-400">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    <span className="text-sm font-medium">Could not fetch full article content.</span>
                  </div>
                  <button 
                    onClick={fetchContent}
                    className="px-4 py-2 bg-red-500/10 text-red-400 text-xs font-bold uppercase tracking-widest rounded-lg border border-red-500/20 hover:bg-red-500/20 transition-colors"
                  >
                    Retry
                  </button>
                </div>
              )}

              <style jsx global>{`
                  .prose { color: #e5e5e5 !important; max-width: 65ch; margin: 0 auto; }
                  .prose h1, .prose h2, .prose h3, .prose h4, .prose h5, .prose h6 { color: #ffffff !important; font-weight: 700; margin-top: 2em; margin-bottom: 1em; line-height: 1.3; }
                  .prose p { color: #d4d4d4 !important; font-weight: 400; margin-bottom: 1.5em; line-height: 1.8; font-size: 1.125rem; }
                  .prose strong, .prose b { color: #ffffff !important; font-weight: 700; }
                  .prose ul, .prose ol { color: #d4d4d4 !important; margin-bottom: 1.5em; padding-left: 1.5em; }
                  .prose li { color: #d4d4d4 !important; margin-bottom: 0.5em; }
                  .prose a { color: #E85D04 !important; text-decoration: none; font-weight: 600; }
                  .prose a:hover { text-decoration: underline; }
                  .prose blockquote { color: #a3a3a3 !important; border-left: 4px solid #E85D04 !important; padding-left: 1em; margin-left: 0; font-style: italic; opacity: 0.9; }
                  .prose img { margin: 2rem auto; border-radius: 1rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.5); max-width: 100%; height: auto; }
                  .prose code { color: #e5e5e5 !important; background-color: rgba(255, 255, 255, 0.1); padding: 0.2em 0.4em; border-radius: 0.25em; font-size: 0.9em; }
                  .prose pre { background-color: #000000 !important; color: #e5e5e5 !important; padding: 1em; border-radius: 0.5rem; overflow-x: auto; border: 1px solid rgba(255,255,255,0.1); }
              `}</style>
              <div 
                className={`prose prose-lg md:prose-xl prose-invert mx-auto 
                  ${isLoading ? 'opacity-50 blur-sm transition-all duration-500' : 'opacity-100 blur-0'}`}
                dangerouslySetInnerHTML={{ __html: sanitizedContent }}
              />

              {/* Show "Read More" if content is short (likely just a summary) */}
              {isContentShort && !isLoading && (
                <div className="flex flex-col items-center justify-center p-8 bg-white/5 rounded-2xl border border-white/10 text-center">
                  <p className="text-white/60 font-medium mb-4">This is a preview. Read the full story on the original site.</p>
                  <a 
                    href={article.link} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="px-8 py-3 bg-juice-orange text-juice-cream font-bold uppercase tracking-widest rounded-full hover:scale-105 transition-transform shadow-lg"
                  >
                    Read Full Article
                  </a>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
