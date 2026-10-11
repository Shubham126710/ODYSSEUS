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
      new URL(url);
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
          source: data.article.siteName || new URL(url).hostname.replace('www.', ''),
          readTime: data.article.readTime || `${Math.ceil((data.article.wordCount || 500) / 220)} min read`,
          date: 'Imported Just Now',
          wordCount: data.article.wordCount,
          isImported: true,
        };
        setExtractedArticle(article);
      } else {
        setError(data.error || 'Could not extract clean article text from this URL. Please verify the link is accessible.');
      }
    } catch (err: any) {
      setError('Extraction timed out or was blocked by the host server. Try another article.');
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
    if (extractedArticle) {
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
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 md:p-6 bg-black/75 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="relative w-full max-w-xl bg-juice-cream rounded-3xl md:rounded-[32px] border border-juice-green/20 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-juice-green/10 flex items-center justify-between bg-juice-green/5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-juice-orange text-white flex items-center justify-center font-serif font-bold text-sm shadow-sm">
                ✦
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-juice-green/60 block">
                  Instapaper & Pocket Style
                </span>
                <h3 className="font-serif text-base md:text-lg font-bold text-juice-green">
                  Import Custom Article
                </h3>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-juice-green/40 hover:text-juice-green hover:bg-juice-green/10 transition-colors"
              title="Close"
            >
              ✕
            </button>
          </div>

          {/* Body */}
          <div className="p-6 md:p-8 overflow-y-auto flex-1 font-sans space-y-6">
            <div>
              <p className="text-xs md:text-sm text-juice-green/75 leading-relaxed">
                Paste any article URL from the web. Odysseus strips out author bios, social shares, newsletter popups, ads, and sidebars, extracting <strong className="font-bold text-juice-green">pure story text</strong> into our luxury reading chamber.
              </p>
            </div>

            {/* Input Form */}
            <form onSubmit={handleExtract} className="space-y-3">
              <div className="relative flex items-center">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/longform-article..."
                  className="w-full bg-white border border-juice-green/20 focus:border-juice-orange rounded-2xl px-4 py-3.5 text-sm text-juice-green placeholder:text-juice-green/30 focus:outline-none transition-all shadow-inner pr-28"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={isLoading || !url.trim()}
                  className="absolute right-1.5 top-1.5 bottom-1.5 px-4 rounded-xl bg-juice-orange hover:bg-orange-600 text-white font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xs flex items-center gap-1.5"
                >
                  {isLoading ? (
                    <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    'Purify'
                  )}
                </button>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 leading-snug">
                  {error}
                </div>
              )}
            </form>

            {/* Samples */}
            {!extractedArticle && !isLoading && (
              <div className="pt-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-juice-green/50 block mb-2 font-bold">
                  Try Sample Articles:
                </span>
                <div className="flex flex-col gap-1.5 text-xs">
                  <button
                    onClick={() => setSampleUrl('https://paulgraham.com/foundermode.html')}
                    className="text-left px-3 py-2 rounded-xl bg-white/70 hover:bg-white border border-juice-green/10 text-juice-green/80 hover:text-juice-orange transition-colors flex items-center justify-between"
                  >
                    <span className="font-serif">Paul Graham • Founder Mode</span>
                    <span className="text-[10px] font-mono text-juice-green/40">Essay</span>
                  </button>
                  <button
                    onClick={() => setSampleUrl('https://ciechanow.ski/mechanical-watch/')}
                    className="text-left px-3 py-2 rounded-xl bg-white/70 hover:bg-white border border-juice-green/10 text-juice-green/80 hover:text-juice-orange transition-colors flex items-center justify-between"
                  >
                    <span className="font-serif">Bartosz Ciechanowski • Mechanical Watch</span>
                    <span className="text-[10px] font-mono text-juice-green/40">Visual Engineering</span>
                  </button>
                </div>
              </div>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="py-8 text-center space-y-3">
                <div className="inline-block w-8 h-8 border-3 border-juice-orange/20 border-t-juice-orange rounded-full animate-spin" />
                <p className="text-xs font-mono uppercase tracking-widest text-juice-green/60">
                  Purging noise, ads, bylines & sidebars...
                </p>
              </div>
            )}

            {/* Extracted Preview Card */}
            {extractedArticle && !isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5 rounded-2xl bg-white border border-juice-green/15 shadow-sm space-y-4"
              >
                <div className="flex items-center justify-between text-[10px] font-mono text-juice-green/60 uppercase tracking-widest">
                  <span className="font-bold text-juice-orange">✓ Pure Text Extracted</span>
                  <span>{extractedArticle.readTime} • {extractedArticle.wordCount} words</span>
                </div>

                <div>
                  <h4 className="font-serif text-lg font-bold text-juice-green leading-snug">
                    {extractedArticle.title}
                  </h4>
                  <p className="text-xs text-juice-green/70 mt-1 line-clamp-3 leading-relaxed">
                    {extractedArticle.excerpt}
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-juice-green/10">
                  <button
                    onClick={handleOpenReader}
                    className="flex-1 py-2.5 rounded-xl bg-juice-green hover:bg-[#4b6a38] text-white font-serif font-bold text-xs uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>Read In Zen Chamber</span>
                    <span>→</span>
                  </button>

                  <button
                    onClick={handleSaveToLibrary}
                    disabled={isSaved}
                    className={`px-4 py-2.5 rounded-xl border font-bold text-xs uppercase tracking-wider transition-all ${
                      isSaved
                        ? 'bg-juice-orange/10 border-juice-orange text-juice-orange'
                        : 'bg-white hover:bg-juice-green/5 border-juice-green/20 text-juice-green'
                    }`}
                  >
                    {isSaved ? '✓ Saved' : 'Save to Library'}
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-juice-green/10 bg-juice-green/5 flex items-center justify-between text-[11px] text-juice-green/60">
            <span>Clean Prose Isolation Protocol</span>
            <span className="font-mono text-juice-orange font-bold">100% Distraction Free</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
