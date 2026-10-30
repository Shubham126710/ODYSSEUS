"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';

interface ImportArticleModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  onReadArticle?: (article: any) => void;
}

export const ImportArticleModal: React.FC<ImportArticleModalProps> = ({
  isOpen,
  onClose,
  userId,
  onReadArticle,
}) => {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractedArticle, setExtractedArticle] = useState<any | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  // Close on Escape
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleExtract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    try {
      new URL(url);
    } catch {
      setError('Please provide a valid web address starting with https://');
      return;
    }

    setIsLoading(true);
    setError(null);
    setExtractedArticle(null);
    setIsSaved(false);

    try {
      const res = await fetch(`/api/read-mode?url=${encodeURIComponent(url.trim())}&t=${Date.now()}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to extract clean prose from link.');
      }

      setExtractedArticle({
        title: data.article.title || 'Extracted Story',
        content: data.article.content,
        textContent: data.article.textContent,
        excerpt: data.article.textContent ? data.article.textContent.slice(0, 240) + '...' : '',
        byline: data.article.byline,
        siteName: data.article.siteName,
        source: data.article.siteName || new URL(url).hostname.replace('www.', ''),
        readTime: data.article.readTime || `${Math.ceil((data.article.wordCount || 500) / 220)} min read`,
        wordCount: data.article.wordCount,
        link: url.trim(),
        date: 'Imported Dispatch',
        isImported: true,
      });
    } catch (err: any) {
      setError(err.message || 'Article extraction failed. The host website may block automated readers.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveToLibrary = async () => {
    if (!userId || !extractedArticle) return;
    try {
      await supabase.from('saved_stories').insert({
        user_id: userId,
        title: extractedArticle.title,
        url: extractedArticle.link,
        source: extractedArticle.source,
        excerpt: extractedArticle.excerpt,
        content: extractedArticle.content,
        read_time: extractedArticle.readTime,
      });
      setIsSaved(true);
    } catch {
      setError('Failed to bookmark into library.');
    }
  };

  const handleOpenReader = () => {
    if (extractedArticle && onReadArticle) {
      onReadArticle(extractedArticle);
      onClose();
    }
  };

  const setSampleUrl = (sample: string) => {
    setUrl(sample);
    setError(null);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          style={{ zIndex: 9999 }}
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
          className="fixed inset-0 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md cursor-pointer"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 12 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            style={{ backgroundColor: '#1E2D18', color: '#FFFDD0', maxWidth: '580px', width: '100%' }}
            className="relative rounded-2xl sm:rounded-3xl border border-[#FFFDD0]/15 shadow-2xl overflow-hidden flex flex-col max-h-[90dvh] cursor-default"
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-[#FFFDD0]/10 flex items-center justify-between bg-[#162211]/80">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#5D8246]/25 text-[#FF6B4A] flex items-center justify-center font-serif font-bold text-base">
                  ✦
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#FFFDD0]/60 block font-bold">
                    PROSE PURIFICATION
                  </span>
                  <h3 className="font-serif text-lg font-bold text-[#FFFDD0]">
                    Import Web Article
                  </h3>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#FFFDD0]/50 hover:text-[#FFFDD0] hover:bg-white/10 transition-colors font-mono text-sm cursor-pointer"
                title="Close"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="p-6 sm:p-7 overflow-y-auto flex-1 font-sans space-y-6">
              <p className="text-xs sm:text-sm text-[#FFFDD0]/75 leading-relaxed">
                Paste any article URL from the web. Odysseus strips out ad networks, tracker telemetry, and social sidebars, isolating pure narrative prose into our quiet reading chamber.
              </p>

              {/* Input Form with Clean Side-by-Side Button */}
              <form onSubmit={handleExtract} className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com/essay-or-article..."
                    className="flex-1 bg-[#162211] border border-[#FFFDD0]/20 focus:border-[#FF6B4A] rounded-xl px-4 py-3 text-sm text-[#FFFDD0] placeholder:text-[#FFFDD0]/40 focus:outline-none transition-all shadow-2xs"
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={isLoading || !url.trim()}
                    style={{
                      backgroundColor: url.trim() ? '#FF6B4A' : 'rgba(255, 107, 74, 0.45)',
                      color: '#FFFDD0',
                    }}
                    className="px-5 py-3 rounded-xl font-mono font-bold text-xs uppercase tracking-wider transition-all shadow-xs flex items-center justify-center gap-2 shrink-0 cursor-pointer hover:opacity-90 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Purifying...</span>
                      </>
                    ) : (
                      <span>Purify Prose →</span>
                    )}
                  </button>
                </div>

                {error && (
                  <div className="p-3 rounded-xl bg-red-900/40 border border-red-500/40 text-xs text-red-200 leading-snug">
                    {error}
                  </div>
                )}
              </form>

              {/* Sample Links */}
              {!extractedArticle && !isLoading && (
                <div className="pt-1">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#FFFDD0]/60 block mb-2.5 font-bold">
                    SAMPLE LONGFORM DISPATCHES:
                  </span>
                  <div className="flex flex-col gap-2 text-xs">
                    <button
                      onClick={() => setSampleUrl('https://paulgraham.com/foundermode.html')}
                      style={{ backgroundColor: 'rgba(255, 253, 208, 0.08)' }}
                      className="text-left px-4 py-3 rounded-xl text-[#FFFDD0] border border-[#FFFDD0]/10 hover:border-[#FF6B4A]/40 hover:bg-white/10 transition-all flex items-center justify-between group cursor-pointer"
                    >
                      <span className="font-serif font-bold text-[#FFFDD0] group-hover:text-[#FF6B4A] transition-colors">
                        Paul Graham • Founder Mode
                      </span>
                      <span className="text-[10px] font-mono text-[#FFFDD0]/60 group-hover:text-[#FF6B4A] uppercase tracking-wider">
                        Essay ↗
                      </span>
                    </button>
                    <button
                      onClick={() => setSampleUrl('https://ciechanow.ski/mechanical-watch/')}
                      style={{ backgroundColor: 'rgba(255, 253, 208, 0.08)' }}
                      className="text-left px-4 py-3 rounded-xl text-[#FFFDD0] border border-[#FFFDD0]/10 hover:border-[#FF6B4A]/40 hover:bg-white/10 transition-all flex items-center justify-between group cursor-pointer"
                    >
                      <span className="font-serif font-bold text-[#FFFDD0] group-hover:text-[#FF6B4A] transition-colors">
                        Bartosz Ciechanowski • Mechanical Watch
                      </span>
                      <span className="text-[10px] font-mono text-[#FFFDD0]/60 group-hover:text-[#FF6B4A] uppercase tracking-wider">
                        Engineering ↗
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {/* Loading Animation */}
              {isLoading && (
                <div className="py-8 text-center space-y-3">
                  <div className="inline-block w-7 h-7 border-2 border-[#FF6B4A]/30 border-t-[#FF6B4A] rounded-full animate-spin" />
                  <p className="text-xs font-mono uppercase tracking-widest text-[#FFFDD0]/60">
                    Purifying DOM & Isolating Clean Prose...
                  </p>
                </div>
              )}

              {/* Extracted Preview Card */}
              {extractedArticle && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-5 rounded-2xl bg-[#162211] border border-[#FFFDD0]/15 space-y-4 shadow-xs"
                >
                  <div className="flex items-center justify-between text-[10px] font-mono text-[#FFFDD0]/60 uppercase tracking-widest">
                    <span className="font-bold text-[#FF6B4A]">{extractedArticle.source}</span>
                    <span>{extractedArticle.readTime}</span>
                  </div>

                  <div>
                    <h4 className="font-serif text-lg font-bold text-[#FFFDD0] leading-snug">
                      {extractedArticle.title}
                    </h4>
                    <p className="text-xs text-[#FFFDD0]/75 line-clamp-3 mt-2 leading-relaxed">
                      {extractedArticle.excerpt}
                    </p>
                  </div>

                  <div className="pt-2 flex flex-wrap gap-2.5">
                    <button
                      onClick={handleOpenReader}
                      style={{ backgroundColor: '#FF6B4A', color: '#FFFDD0' }}
                      className="px-5 py-2.5 rounded-xl font-mono font-bold text-xs uppercase tracking-wider transition-all shadow-xs cursor-pointer hover:opacity-90"
                    >
                      Read in Chamber →
                    </button>

                    {userId && (
                      <button
                        onClick={handleSaveToLibrary}
                        disabled={isSaved}
                        className={`px-4 py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
                          isSaved
                            ? 'bg-[#5D8246]/30 text-[#FFFDD0]'
                            : 'bg-white/10 hover:bg-white/15 text-[#FFFDD0]'
                        }`}
                      >
                        {isSaved ? '✓ Saved to Library' : 'Save for Later'}
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Footer Bar */}
            <div className="px-6 py-3 border-t border-[#FFFDD0]/10 bg-[#162211]/80 flex items-center justify-between text-[10px] font-mono text-[#FFFDD0]/60 uppercase tracking-wider">
              <span>Pure Narrative Prose</span>
              <span className="text-[#FF6B4A] font-bold">Zero Tracking Pixels</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
