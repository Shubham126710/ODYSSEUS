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
            className="fixed inset-0 top-4 md:top-10 md:inset-x-8 md:bottom-4 bg-juice-cream rounded-t-3xl md:rounded-3xl shadow-2xl z-[90] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-juice-green/10 bg-juice-cream z-10">
              <div className="flex items-center gap-3">
                <button onClick={onClose} className="p-2 hover:bg-juice-green/10 rounded-full transition-colors">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-juice-green"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                </button>
                <span className="font-mono text-xs font-bold uppercase tracking-widest text-juice-green/60">{article.source}</span>
                {isLoading && (
                  <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-juice-orange animate-pulse">
                    <span className="w-2 h-2 bg-juice-orange rounded-full"></span>
                    Fetching Full Story...
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <a href={article.link} target="_blank" rel="noopener noreferrer" className="px-4 py-2 rounded-full border border-juice-green/20 text-xs font-bold uppercase tracking-widest text-juice-green hover:bg-juice-green hover:text-juice-cream transition-colors">
                  Visit Original
                </a>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8 md:p-16 max-w-3xl mx-auto w-full">
              {/* Article Header */}
              <header className="mb-12 text-center">
                <div className="flex items-center justify-center gap-3 text-juice-green/60 font-mono text-xs uppercase tracking-widest mb-6">
                  <span>{article.source}</span>
                  <span>•</span>
                  <span>{article.date}</span>
                  <span>•</span>
                  <span>{dynamicReadTime}</span>
                </div>
                
                <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-juice-green mb-8 leading-tight">
                  {article.title}
                </h1>

                {/* Author (if available) */}
                {article.author && (
                  <div className="flex items-center justify-center gap-2 text-juice-green/80 font-medium mb-8">
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
                    className="w-full h-auto max-h-[600px] object-cover rounded-2xl shadow-lg" 
                  />
                </figure>
              )}

              {/* Error State */}
              {fetchError && isContentShort && !isLoading && (
                <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3 text-red-600">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    <span className="text-sm font-medium">Could not fetch full article content.</span>
                  </div>
                  <button 
                    onClick={fetchContent}
                    className="px-4 py-2 bg-white text-red-600 text-xs font-bold uppercase tracking-widest rounded-lg border border-red-100 hover:bg-red-50 transition-colors"
                  >
                    Retry
                  </button>
                </div>
              )}

              <div 
                className={`prose prose-lg md:prose-xl prose-stone mx-auto 
                  prose-headings:font-serif prose-headings:font-bold prose-headings:text-juice-green 
                  prose-p:text-juice-green/80 prose-p:leading-loose prose-p:mb-6
                  prose-a:text-juice-orange prose-a:no-underline hover:prose-a:underline
                  prose-img:rounded-xl prose-img:shadow-md prose-img:my-8
                  prose-blockquote:border-l-4 prose-blockquote:border-juice-orange prose-blockquote:pl-6 prose-blockquote:italic prose-blockquote:text-juice-green/70
                  mb-12 ${isLoading ? 'opacity-50 blur-sm transition-all duration-500' : 'opacity-100 blur-0'}`}
                dangerouslySetInnerHTML={{ __html: sanitizedContent }}
              />

              {/* Show "Read More" if content is short (likely just a summary) */}
              {isContentShort && !isLoading && (
                <div className="flex flex-col items-center justify-center p-8 bg-juice-green/5 rounded-2xl border border-juice-green/10 text-center">
                  <p className="text-juice-green/60 font-medium mb-4">This is a preview. Read the full story on the original site.</p>
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
