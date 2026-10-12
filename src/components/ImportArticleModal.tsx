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
        className="fixed inset-0 flex items-center justify-center p-4 sm:p-6 bg-black/65 backdrop-blur-md"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          style={{ backgroundColor: '#FFFDD0', color: '#2F4522' }}
          className="relative w-full max-w-xl rounded-2xl sm:rounded-3xl border border-[#5D8246]/25 shadow-2xl overflow-hidden flex flex-col max-h-[90dvh]"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-[#5D8246]/15 flex items-center justify-between bg-[#5D8246]/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#5D8246]/10 text-[#FF6B4A] flex items-center justify-center border border-[#5D8246]/20 shadow-xs">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#FF6B4A">
                  <path d="M12 0L14.8 9.2L24 12L14.8 14.8L12 24L9.2 14.8L0 12L9.2 9.2L12 0Z" />
                </svg>
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#5D8246]/70 block font-bold">
                  CLEAN READER PROTOCOL
                </span>
                <h3 className="font-sans font-black text-xl text-[#2F4522] tracking-tight">
                  Import Web Article
                </h3>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-[#5D8246]/60 hover:text-[#FFFDD0] hover:bg-[#FF6B4A] transition-colors font-mono text-sm shadow-xs cursor-pointer"
              title="Close"
            >
              ✕
            </button>
          </div>

          {/* Body */}
          <div className="p-6 sm:p-7 overflow-y-auto flex-1 font-sans space-y-6">
            <p className="text-xs sm:text-sm text-[#2F4522]/80 leading-relaxed">
              Paste any article link from the web. Odysseus strips out ads, trackers, social widgets, and clutter, isolating pure story text into our focused reading chamber.
            </p>

            {/* Input Form with Distinctive Orange CTA */}
            <form onSubmit={handleExtract} className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-2.5">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/essay-or-article..."
                  style={{ outline: 'none' }}
                  className="flex-1 bg-white border border-[#5D8246]/30 focus:border-[#FF6B4A] rounded-xl px-4 py-3 text-sm text-[#2F4522] placeholder:text-[#5D8246]/40 focus:outline-none focus:ring-0 transition-all shadow-xs"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={isLoading || !url.trim()}
                  className="px-6 py-3 rounded-xl bg-[#FF6B4A] hover:bg-[#FF6B4A]/90 disabled:opacity-50 text-[#FFFDD0] font-mono font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-98 flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-[#FFFDD0]/30 border-t-[#FFFDD0] rounded-full animate-spin" />
                      <span>Purifying...</span>
                    </>
                  ) : (
                    <span>Purify Prose →</span>
                  )}
                </button>
              </div>

              {error && (
                <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-700 leading-snug font-sans">
                  {error}
                </div>
              )}
            </form>

            {/* Sample Links */}
            {!extractedArticle && !isLoading && (
              <div className="pt-1">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#5D8246]/70 block mb-2.5 font-bold">
                  TRY SAMPLE LONGFORM ARTICLES:
                </span>
                <div className="flex flex-col gap-2.5 text-xs">
                  <button
                    onClick={() => setSampleUrl('https://paulgraham.com/foundermode.html')}
                    className="text-left px-4 py-3 rounded-xl bg-white/70 hover:bg-white border border-[#5D8246]/20 hover:border-[#FF6B4A] text-[#2F4522] transition-all flex items-center justify-between group shadow-2xs cursor-pointer"
                  >
                    <span className="font-sans font-bold group-hover:text-[#FF6B4A] transition-colors">
                      Paul Graham • Founder Mode
                    </span>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#FF6B4A] bg-[#5D8246]/10 px-2.5 py-0.5 rounded-full">
                      Essay
                    </span>
                  </button>
                  <button
                    onClick={() => setSampleUrl('https://ciechanow.ski/mechanical-watch/')}
                    className="text-left px-4 py-3 rounded-xl bg-white/70 hover:bg-white border border-[#5D8246]/20 hover:border-[#FF6B4A] text-[#2F4522] transition-all flex items-center justify-between group shadow-2xs cursor-pointer"
                  >
                    <span className="font-sans font-bold group-hover:text-[#FF6B4A] transition-colors">
                      Bartosz Ciechanowski • Mechanical Watch
                    </span>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#FF6B4A] bg-[#5D8246]/10 px-2.5 py-0.5 rounded-full">
                      Engineering
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="py-8 text-center space-y-3">
                <div className="inline-block w-8 h-8 border-3 border-[#5D8246]/20 border-t-[#FF6B4A] rounded-full animate-spin" />
                <p className="text-xs font-mono uppercase tracking-widest text-[#5D8246]/80 font-bold">
                  Parsing DOM & Purifying clean prose...
                </p>
              </div>
            )}

            {/* Extracted Preview Card */}
            {extractedArticle && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5 rounded-2xl bg-white/90 border border-[#5D8246]/25 space-y-4 shadow-sm"
              >
                <div className="flex items-center justify-between text-[10px] font-mono text-[#5D8246]/70 uppercase tracking-widest">
                  <span className="font-bold text-[#FF6B4A]">{extractedArticle.source}</span>
                  <span>{extractedArticle.readTime}</span>
                </div>

                <div>
                  <h4 className="font-sans font-bold text-lg text-[#2F4522] leading-snug">
                    {extractedArticle.title}
                  </h4>
                  <p className="text-xs text-[#2F4522]/80 line-clamp-3 mt-2 leading-relaxed">
                    {extractedArticle.excerpt}
                  </p>
                </div>

                <div className="pt-2 flex flex-wrap gap-2.5">
                  <button
                    onClick={handleOpenReader}
                    className="px-5 py-2.5 rounded-xl bg-[#FF6B4A] hover:bg-[#FF6B4A]/90 text-[#FFFDD0] font-mono font-bold text-xs uppercase tracking-wider transition-all shadow-sm cursor-pointer"
                  >
                    Read in Chamber →
                  </button>

                  {userId && (
                    <button
                      onClick={handleSaveToLibrary}
                      disabled={isSaved}
                      className={`px-4 py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all border cursor-pointer ${
                        isSaved
                          ? 'bg-[#5D8246]/20 text-[#2F4522] border-[#5D8246]/40'
                          : 'bg-white hover:bg-[#5D8246]/10 text-[#2F4522] border-[#5D8246]/30'
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
          <div className="px-6 py-3.5 border-t border-[#5D8246]/15 bg-[#5D8246]/5 flex items-center justify-between text-[10px] font-mono text-[#5D8246]/60 uppercase tracking-widest font-bold">
            <span>Isolated Clean Prose</span>
            <span className="text-[#FF6B4A]">100% Distraction Free</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
