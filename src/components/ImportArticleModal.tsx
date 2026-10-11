"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';

interface ImportArticleModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  onReadArticle: (article: any) => void;
  onSavedSuccess?: () => void;
}

export const ImportArticleModal: React.FC<ImportArticleModalProps> = ({
  isOpen,
  onClose,
  userId,
  onReadArticle,
  onSavedSuccess,
}) => {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractedArticle, setExtractedArticle] = useState<any | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  if (!isOpen) return null;

  const handleExtract = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!url.trim()) return;

    try {
      new URL(url.trim());
    } catch {
      setError('Please enter a valid web URL starting with https://');
      return;
    }

    setIsLoading(true);
    setError(null);
    setExtractedArticle(null);
    setIsSaved(false);

    try {
      const res = await fetch(`/api/read-mode?url=${encodeURIComponent(url.trim())}&t=${Date.now()}`);
      const data = await res.json();

      if (data.success && data.article?.content) {
        const article = {
          title: data.article.title || 'Imported Story',
          content: data.article.content,
          excerpt: data.article.textContent?.slice(0, 240) + '...',
          link: url.trim(),
          source: data.article.siteName || new URL(url.trim()).hostname.replace('www.', ''),
          readTime: data.article.readTime || `${Math.ceil((data.article.wordCount || 500) / 220)} min read`,
          date: 'Imported Just Now',
          wordCount: data.article.wordCount,
          isImported: true,
        };
        setExtractedArticle(article);
      } else {
        setError(data.error || 'Could not extract clean text from this URL. Verify the link is accessible.');
      }
    } catch {
      setError('Extraction timed out or was blocked by the host server. Try another link.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveToLibrary = async () => {
    if (!extractedArticle || !userId) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      await fetch('/api/read-later', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || ''}`,
        },
        body: JSON.stringify({
          userId,
          url: extractedArticle.link,
          title: extractedArticle.title,
          excerpt: extractedArticle.excerpt,
          source_name: extractedArticle.source,
          content: extractedArticle.content,
        }),
      });
      setIsSaved(true);
      if (onSavedSuccess) onSavedSuccess();
    } catch {
      // ignore
    }
  };

  const handleOpenReader = () => {
    if (!extractedArticle) return;
    onReadArticle(extractedArticle);
    onClose();
  };

  const setSampleUrl = (sample: string) => {
    setUrl(sample);
    setError(null);
  };

  return (
    <AnimatePresence>
      <div 
        style={{ zIndex: 9999 }}
        className="fixed inset-0 z-modal flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          style={{ backgroundColor: '#FAF7EE', color: '#131E15' }}
          className="relative w-full max-w-xl rounded-3xl border border-[#131E15]/15 shadow-2xl overflow-hidden flex flex-col max-h-[90dvh]"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center font-serif font-bold text-base shadow-xs">
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
              className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors font-mono text-sm"
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

            {/* Input Form with Separate Clean Button */}
            <form onSubmit={handleExtract} className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-2.5">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/essay-or-article..."
                  className="flex-1 bg-stone-50 border border-stone-300 focus:border-amber-600 focus:bg-white rounded-xl px-4 py-3 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none transition-all"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={isLoading || !url.trim()}
                  className="px-6 py-3 rounded-xl bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white font-mono font-bold text-xs uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-2 shrink-0"
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
                  Try Sample Longform Articles:
                </span>
                <div className="flex flex-col gap-2 text-xs">
                  <button
                    onClick={() => setSampleUrl('https://paulgraham.com/foundermode.html')}
                    className="text-left px-3.5 py-2.5 rounded-xl bg-stone-50 hover:bg-amber-50/50 border border-stone-200/80 hover:border-amber-200 text-stone-700 hover:text-amber-800 transition-all flex items-center justify-between"
                  >
                    <span className="font-serif font-bold">Paul Graham • Founder Mode</span>
                    <span className="text-[10px] font-mono text-stone-400">Essay</span>
                  </button>
                  <button
                    onClick={() => setSampleUrl('https://ciechanow.ski/mechanical-watch/')}
                    className="text-left px-3.5 py-2.5 rounded-xl bg-stone-50 hover:bg-amber-50/50 border border-stone-200/80 hover:border-amber-200 text-stone-700 hover:text-amber-800 transition-all flex items-center justify-between"
                  >
                    <span className="font-serif font-bold">Bartosz Ciechanowski • Mechanical Watch</span>
                    <span className="text-[10px] font-mono text-stone-400">Engineering</span>
                  </button>
                </div>
              </div>
            )}

            {/* Loading Animation */}
            {isLoading && (
              <div className="py-8 text-center space-y-3">
                <div className="inline-block w-8 h-8 border-3 border-amber-500/20 border-t-amber-600 rounded-full animate-spin" />
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
                className="p-5 rounded-2xl bg-stone-50 border border-stone-200 space-y-4"
              >
                <div className="flex items-center justify-between text-[10px] font-mono text-stone-400 uppercase tracking-widest">
                  <span className="font-bold text-amber-700">{extractedArticle.source}</span>
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
                    className="px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-mono font-bold text-xs uppercase tracking-wider transition-all shadow-sm"
                  >
                    Read in Chamber →
                  </button>

                  {userId && (
                    <button
                      onClick={handleSaveToLibrary}
                      disabled={isSaved}
                      className={`px-4 py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all border ${
                        isSaved
                          ? 'bg-amber-50 text-amber-700 border-amber-300'
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
          <div className="px-6 py-3.5 border-t border-stone-100 bg-stone-50/50 flex items-center justify-between text-[10px] font-mono text-stone-400 uppercase tracking-wider">
            <span>Isolated Clean Prose</span>
            <span className="text-amber-700 font-bold">100% Distraction Free</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
