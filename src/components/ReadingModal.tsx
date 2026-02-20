"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DOMPurify from 'isomorphic-dompurify';

const calculateReadTime = (text: string) => {
  const words = text.trim().split(/\s+/).length;
  return `${Math.ceil(words / 130)} min`;
};

interface ReadingModalProps {
  isOpen: boolean;
  onClose: () => void;
  article: any;
  onSave?: (article: any) => void;
}

export const ReadingModal = ({ isOpen, onClose, article, onSave }: ReadingModalProps) => {
  const [fullContent, setFullContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  // previewOnly = API failed AND no rich RSS content — graceful fallback
  const [previewOnly, setPreviewOnly] = useState(false);

  const fetchContent = async () => {
    if (!article?.link) return;

    setFullContent(null);
    setPreviewOnly(false);
    setIsLoading(true);

    try {
      const res = await fetch(`/api/read-mode?url=${encodeURIComponent(article.link)}&t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Pragma': 'no-cache', 'Cache-Control': 'no-cache' },
      });
      const data = await res.json();

      if (data.success && data.article?.content) {
        setFullContent(data.article.content);
        setIsLoading(false);
        return;
      }
    } catch { /* fall through */ }

    // API failed — try rich RSS content (content:encoded is often the full article)
    const rssContent = article['content:encoded'] || article.contentEncoded || article.content;
    if (rssContent && rssContent.replace(/<[^>]*>/g, '').trim().length > 250) {
      setFullContent(rssContent);
    } else {
      // Only a teaser available — show graceful preview mode
      setPreviewOnly(true);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    if (isOpen && article) {
      fetchContent();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, article?.link]);

  if (!article) return null;

  const bodyContent = fullContent || article.content || article.description || article.excerpt || '';
  const sanitized = DOMPurify.sanitize(bodyContent, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ['script', 'style', 'iframe', 'form', 'input', 'button'],
  });
  const readTime = fullContent ? calculateReadTime(bodyContent) : article.readTime;

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
            className="fixed inset-0 bg-juice-green/90 backdrop-blur-md z-[80]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 80 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 80 }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            className="fixed inset-0 top-4 md:top-10 md:inset-x-8 md:bottom-4 bg-[#0f1117] text-white rounded-t-3xl md:rounded-3xl shadow-2xl z-[90] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 md:px-8 md:py-5 border-b border-white/10 bg-[#0f1117] z-10 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors shrink-0"
                  aria-label="Close"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M19 12H5M12 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-white/50 truncate">
                  {article.source}
                </span>
                {isLoading && (
                  <span className="hidden sm:flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-juice-orange animate-pulse">
                    <span className="w-1.5 h-1.5 bg-juice-orange rounded-full" />
                    Loading…
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0 ml-2">
                {onSave && (
                  <button
                    onClick={() => onSave(article)}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/60 hover:text-juice-orange"
                    aria-label="Save"
                  >
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                  </button>
                )}
                <a
                  href={article.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-full border border-white/20 text-[10px] font-bold uppercase tracking-widest text-white/80 hover:bg-white hover:text-[#0f1117] transition-colors"
                >
                  Original
                </a>
              </div>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-2xl mx-auto px-5 py-10 md:px-0 md:py-16 pb-24">

                {/* Title & meta */}
                <header className="mb-10 text-center">
                  <div className="flex items-center justify-center gap-2 text-white/40 font-mono text-[10px] uppercase tracking-widest mb-5">
                    <span>{article.source}</span>
                    <span>•</span>
                    <span>{article.date}</span>
                    {readTime && (<><span>•</span><span>{readTime} read</span></>)}
                  </div>
                  <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight mb-5">
                    {article.title}
                  </h1>
                  {article.author && (
                    <p className="text-white/50 text-sm font-medium">By {article.author}</p>
                  )}
                </header>

                {/* Hero image */}
                {(article.imageUrl || article.enclosure?.url) && (
                  <figure className="mb-10 rounded-2xl overflow-hidden">
                    <img
                      src={article.imageUrl || article.enclosure?.url}
                      alt=""
                      className="w-full h-auto max-h-[480px] object-cover"
                    />
                  </figure>
                )}

                {/* Content area */}
                {isLoading ? (
                  <div className="space-y-4 animate-pulse opacity-40">
                    {[100, 90, 80, 95, 70, 85].map((w, i) => (
                      <div key={i} className="h-4 bg-white/20 rounded" style={{ width: `${w}%` }} />
                    ))}
                  </div>
                ) : previewOnly ? (
                  /* Graceful preview — no error, just a nice CTA */
                  <div className="space-y-8">
                    {bodyContent && (
                      <p className="text-white/70 text-lg leading-relaxed font-serif">
                        {bodyContent.replace(/<[^>]*>/g, '').trim()}
                      </p>
                    )}
                    <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
                      <div className="p-8 text-center space-y-5">
                        <div className="w-12 h-12 rounded-full bg-juice-orange/15 flex items-center justify-center mx-auto">
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-juice-orange">
                            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                            <polyline points="15 3 21 3 21 9" />
                            <line x1="10" y1="14" x2="21" y2="3" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-white/50 text-sm mb-1">Full article on</p>
                          <p className="text-white font-bold text-lg">{article.source}</p>
                        </div>
                        <a
                          href={article.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block px-8 py-3.5 bg-juice-orange text-white font-bold text-sm uppercase tracking-widest rounded-full hover:scale-105 active:scale-95 transition-transform shadow-lg shadow-juice-orange/20"
                        >
                          Read Full Article →
                        </a>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Full / rich content */
                  <>
                    <style jsx global>{`
                      .rm-prose { color: #d4d4d4; font-family: Georgia, 'Times New Roman', serif; }
                      .rm-prose h1,.rm-prose h2,.rm-prose h3,.rm-prose h4 { color: #fff; font-weight: 700; margin: 1.8em 0 0.7em; line-height: 1.25; }
                      .rm-prose h1 { font-size: 1.9rem; }
                      .rm-prose h2 { font-size: 1.45rem; }
                      .rm-prose h3 { font-size: 1.2rem; }
                      .rm-prose p { margin-bottom: 1.4em; line-height: 1.85; font-size: 1.1rem; }
                      .rm-prose strong,.rm-prose b { color: #fff; font-weight: 700; }
                      .rm-prose em,.rm-prose i { font-style: italic; }
                      .rm-prose a { color: #f97316; text-decoration: none; font-weight: 600; }
                      .rm-prose a:hover { text-decoration: underline; }
                      .rm-prose blockquote { border-left: 3px solid #f97316; padding-left: 1.2em; margin: 1.5em 0; color: #a3a3a3; font-style: italic; }
                      .rm-prose ul,.rm-prose ol { padding-left: 1.5em; margin-bottom: 1.4em; }
                      .rm-prose li { margin-bottom: 0.4em; line-height: 1.7; }
                      .rm-prose img { max-width: 100%; height: auto; border-radius: 0.75rem; margin: 2rem auto; display: block; }
                      .rm-prose figure { margin: 2rem 0; }
                      .rm-prose figcaption { text-align: center; font-size: 0.8rem; color: #6b7280; margin-top: 0.5rem; font-style: italic; font-family: system-ui, sans-serif; }
                      .rm-prose hr { border: none; border-top: 1px solid rgba(255,255,255,0.1); margin: 2rem 0; }
                      .rm-prose code { background: rgba(255,255,255,0.08); padding: 0.15em 0.4em; border-radius: 0.25em; font-size: 0.85em; font-family: monospace; }
                      .rm-prose pre { background: #000; border: 1px solid rgba(255,255,255,0.1); padding: 1em; border-radius: 0.5rem; overflow-x: auto; }
                    `}</style>

                    <div
                      className="rm-prose"
                      dangerouslySetInnerHTML={{ __html: sanitized }}
                    />

                    {/* Nudge to read more when content is a short RSS teaser */}
                    {!fullContent && bodyContent.length < 600 && (
                      <div className="mt-10 pt-8 border-t border-white/10 flex flex-col items-center gap-4 text-center">
                        <p className="text-white/40 text-sm">Continue reading on {article.source}</p>
                        <a
                          href={article.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-7 py-3 bg-juice-orange text-white font-bold text-sm uppercase tracking-widest rounded-full hover:scale-105 transition-transform"
                        >
                          Read Full Article →
                        </a>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
