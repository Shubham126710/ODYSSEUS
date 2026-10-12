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
          className="fixed inset-0 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 15 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            style={{ backgroundColor: '#FAF9F6', color: '#141518' }}
            className="relative w-full max-w-xl rounded-2xl sm:rounded-3xl border border-stone-200/90 shadow-2xl overflow-hidden flex flex-col max-h-[90dvh]"
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-stone-100 flex items-center justify-between bg-stone-50/70">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-[#EA580C] flex items-center justify-center font-serif font-bold text-base shadow-2xs">
                  ✦
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-stone-400 block font-bold">
                    CLEAN READER PROTOCOL
                  </span>
                  <h3 className="font-serif text-lg font-bold text-stone-900">
                    Import Web Article
                  </h3>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors font-mono text-sm cursor-pointer"
                title="Close"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="p-6 sm:p-7 overflow-y-auto flex-1 font-sans space-y-6">
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                Paste any article link from the web. Odysseus strips out ads, trackers, social widgets, and clutter, isolating pure story text into our focused reading chamber.
              </p>

              {/* Input Form with Clean Side-by-Side Button */}
              <form onSubmit={handleExtract} className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com/essay-or-article..."
                    className="flex-1 bg-white border border-stone-300 focus:border-[#EA580C] focus:bg-white rounded-xl px-4 py-3 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none transition-all shadow-2xs"
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={isLoading || !url.trim()}
                    className="px-6 py-3 rounded-xl bg-[#EA580C] hover:bg-[#C2410C] disabled:opacity-50 text-white font-mono font-bold text-xs uppercase tracking-wider transition-all shadow-xs flex items-center justify-center gap-2 shrink-0 cursor-pointer"
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
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 leading-snug">
                    {error}
                  </div>
                )}
              </form>

              {/* Sample Links */}
              {!extractedArticle && !isLoading && (
                <div className="pt-1">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-stone-400 block mb-2.5 font-bold">
                    TRY SAMPLE LONGFORM ARTICLES:
                  </span>
                  <div className="flex flex-col gap-2 text-xs">
                    <button
                      onClick={() => setSampleUrl('https://paulgraham.com/foundermode.html')}
                      className="text-left px-4 py-3 rounded-xl bg-white hover:bg-stone-50 border border-stone-200/90 hover:border-[#EA580C] text-stone-800 transition-all flex items-center justify-between group shadow-2xs cursor-pointer"
                    >
                      <span className="font-serif font-bold text-stone-900 group-hover:text-[#EA580C] transition-colors">
                        Paul Graham • Founder Mode
                      </span>
                      <span className="text-[10px] font-mono text-stone-400 uppercase tracking-wider">
                        Essay
                      </span>
                    </button>
                    <button
                      onClick={() => setSampleUrl('https://ciechanow.ski/mechanical-watch/')}
                      className="text-left px-4 py-3 rounded-xl bg-white hover:bg-stone-50 border border-stone-200/90 hover:border-[#EA580C] text-stone-800 transition-all flex items-center justify-between group shadow-2xs cursor-pointer"
                    >
                      <span className="font-serif font-bold text-stone-900 group-hover:text-[#EA580C] transition-colors">
                        Bartosz Ciechanowski • Mechanical Watch
                      </span>
                      <span className="text-[10px] font-mono text-stone-400 uppercase tracking-wider">
                        Engineering
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {/* Loading Animation */}
              {isLoading && (
                <div className="py-8 text-center space-y-3">
                  <div className="inline-block w-8 h-8 border-3 border-[#EA580C]/20 border-t-[#EA580C] rounded-full animate-spin" />
                  <p className="text-xs font-mono uppercase tracking-widest text-stone-500">
                    Parsing DOM & Purifying clean prose...
                  </p>
                </div>
              )}

              {/* Extracted Preview Card */}
              {extractedArticle && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-5 rounded-2xl bg-white border border-stone-200/90 space-y-4 shadow-xs"
                >
                  <div className="flex items-center justify-between text-[10px] font-mono text-stone-400 uppercase tracking-widest">
                    <span className="font-bold text-[#EA580C]">{extractedArticle.source}</span>
                    <span>{extractedArticle.readTime}</span>
                  </div>

                  <div>
                    <h4 className="font-serif text-lg font-bold text-stone-900 leading-snug">
                      {extractedArticle.title}
                    </h4>
                    <p className="text-xs text-stone-600 line-clamp-3 mt-2 leading-relaxed">
                      {extractedArticle.excerpt}
                    </p>
                  </div>

                  <div className="pt-2 flex flex-wrap gap-2.5">
                    <button
                      onClick={handleOpenReader}
                      className="px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-mono font-bold text-xs uppercase tracking-wider transition-all shadow-xs cursor-pointer"
                    >
                      Read in Chamber →
                    </button>

                    {userId && (
                      <button
                        onClick={handleSaveToLibrary}
                        disabled={isSaved}
                        className={`px-4 py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all border cursor-pointer ${
                          isSaved
                            ? 'bg-amber-50 text-[#EA580C] border-amber-300'
                            : 'bg-white hover:bg-stone-100 text-stone-700 border-stone-300'
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
            <div className="px-6 py-3.5 border-t border-stone-100 bg-stone-50/70 flex items-center justify-between text-[10px] font-mono text-stone-400 uppercase tracking-wider">
              <span>Isolated Clean Prose</span>
              <span className="text-[#EA580C] font-bold">100% Distraction Free</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
