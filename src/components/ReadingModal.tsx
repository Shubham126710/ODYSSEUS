"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DOMPurify from 'isomorphic-dompurify';

const calculateReadTime = (text: string) => {
  const words = text.trim().split(/\s+/).length;
  return `${Math.ceil(words / 130)} min`;
};

/** Lightweight markdown → HTML for client-side parsing. */
function markdownToHtml(md: string): string {
  return md
    .replace(/^#{6}\s(.+)$/gm, '<h6>$1</h6>')
    .replace(/^#{5}\s(.+)$/gm, '<h5>$1</h5>')
    .replace(/^#{4}\s(.+)$/gm, '<h4>$1</h4>')
    .replace(/^###\s(.+)$/gm, '<h3>$1</h3>')
    .replace(/^##\s(.+)$/gm, '<h2>$1</h2>')
    .replace(/^#\s(.+)$/gm, '<h1>$1</h1>')
    .replace(/^(.+)\n={3,}$/gm, '<h1>$1</h1>')
    .replace(/^(.+)\n-{3,}$/gm, '<h2>$1</h2>')
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">')
    .replace(/^>\s(.+)$/gm, '<blockquote>$1</blockquote>')
    .replace(/^---+$/gm, '<hr>')
    .split(/\n{2,}/)
    .map(block => {
      block = block.trim();
      if (!block) return '';
      if (/^<(h[1-6]|ul|ol|li|blockquote|hr|img|figure|div)/.test(block)) return block;
      return `<p>${block.replace(/\n/g, '<br>')}</p>`;
    })
    .filter(Boolean)
    .join('\n');
}

interface ReadingModalProps {
  isOpen: boolean;
  onClose: () => void;
  article: any;
  onSave?: (article: any) => void;
}

export const ReadingModal = ({ isOpen, onClose, article, onSave }: ReadingModalProps) => {
  const [fullContent, setFullContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [previewOnly, setPreviewOnly] = useState(false);
  
  // New features state
  const [theme, setTheme] = useState<'dark' | 'sepia' | 'light'>('dark');
  const [fontSize, setFontSize] = useState<number>(18);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const contentRef = useRef<HTMLDivElement>(null);
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);

  const fetchContent = async () => {
    if (!article?.link) return;

    setFullContent(null);
    setPreviewOnly(false);
    setIsLoading(true);

    try {
      // CREATIVE SOLUTION: Try client-side fetch via Jina AI first to bypass Vercel server IP blocking
      const jinaRes = await fetch(`https://r.jina.ai/${encodeURIComponent(article.link)}`, {
        headers: { 'Accept': 'application/json' }
      });
      if (jinaRes.ok) {
        const jinaData = await jinaRes.json();
        if (jinaData.code === 200 && jinaData.data?.content && jinaData.data.content.length > 500) {
          setFullContent(markdownToHtml(jinaData.data.content));
          setIsLoading(false);
          return;
        }
      }
    } catch { /* fall through */ }

    try {
      // CREATIVE SOLUTION 2: Try client-side proxy to bypass server IP block
      const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(article.link)}`;
      const res = await fetch(proxyUrl);
      if (res.ok) {
        const html = await res.text();
        if (html.length > 1000) {
          // Dynamic import of Readability to avoid bundle size bloat
          const { Readability } = await import('@mozilla/readability');
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, 'text/html');
          
          // Cleanup common annoying elements before parsing
          const removeSelectors = ['script', 'style', 'nav', 'footer', 'aside', '.ads', '.cookie-banner'];
          removeSelectors.forEach(sel => {
            doc.querySelectorAll(sel).forEach(el => el.remove());
          });

          const reader = new Readability(doc, { keepClasses: false });
          const parsed = reader.parse();
          
          if (parsed && parsed.content && parsed.content.length > 500) {
            setFullContent(parsed.content);
            setIsLoading(false);
            return;
          }
        }
      }
    } catch { /* fall through */ }

    try {
      // Fallback 3: Our server API (which might be blocked by the site or Jina rate limits)
      const res = await fetch(`/api/read-mode?url=${encodeURIComponent(article.link)}&t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Pragma': 'no-cache', 'Cache-Control': 'no-cache' },
      });
      const data = await res.json();

      if (data.success && data.article?.content && data.article.content.length > 500) {
        setFullContent(data.article.content);
        setIsLoading(false);
        return;
      }
    } catch { /* fall through */ }

    // API failed — try rich RSS content
    const rssContent = article['content:encoded'] || article.contentEncoded || article.content;
    if (rssContent && rssContent.replace(/<[^>]*>/g, '').trim().length > 250) {
      setFullContent(rssContent);
    } else {
      setPreviewOnly(true);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    if (isOpen && article) {
      fetchContent();
      setScrollProgress(0);
    } else {
      stopSpeaking();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, article?.link]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const progress = (scrollTop / (scrollHeight - clientHeight)) * 100;
    setScrollProgress(progress);
  };

  const toggleSpeak = () => {
    if (!('speechSynthesis' in window)) return;
    
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    } else {
      const textToRead = contentRef.current?.innerText || fullContent?.replace(/<[^>]*>/g, '') || article?.description || article?.title;
      if (!textToRead) return;
      
      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.rate = 0.95;
      utterance.onend = () => setIsPlaying(false);
      speechSynthesisRef.current = utterance;
      window.speechSynthesis.speak(utterance);
      setIsPlaying(true);
    }
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
  };

  if (!article) return null;

  const bodyContent = fullContent || article.content || article.description || article.excerpt || '';
  const sanitized = DOMPurify.sanitize(bodyContent, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ['script', 'style', 'iframe', 'form', 'input', 'button'],
  });
  const readTime = fullContent ? calculateReadTime(bodyContent) : article.readTime;

  // Theme styling
  const themeStyles = {
    dark: { bg: '#0f1117', text: '#e5e7eb', header: '#1f2937', accent: '#FF6B4A', border: 'rgba(255,255,255,0.1)' },
    sepia: { bg: '#f4ecd8', text: '#433422', header: '#e8dfc7', accent: '#b46014', border: 'rgba(67,52,34,0.1)' },
    light: { bg: '#ffffff', text: '#111827', header: '#f3f4f6', accent: '#5D8246', border: 'rgba(0,0,0,0.1)' },
  };
  const currentTheme = themeStyles[theme];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { stopSpeaking(); onClose(); }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[80]"
          />

          <motion.div
            initial={{ opacity: 0, y: 80 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 80 }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            style={{ backgroundColor: currentTheme.bg, color: currentTheme.text }}
            className="fixed inset-0 top-4 md:top-10 md:inset-x-8 md:bottom-4 rounded-t-3xl md:rounded-3xl shadow-2xl z-[90] overflow-hidden flex flex-col transition-colors duration-500"
          >
            {/* Top Progress Bar */}
            <div className="absolute top-0 left-0 right-0 h-1 z-50 bg-black/5">
              <div 
                className="h-full transition-all duration-150" 
                style={{ width: `${scrollProgress}%`, backgroundColor: currentTheme.accent }}
              />
            </div>

            {/* Header / Toolbar */}
            <div 
              className="flex items-center justify-between px-4 py-3 md:px-6 md:py-4 z-10 shrink-0 transition-colors duration-500"
              style={{ backgroundColor: currentTheme.bg, borderBottom: `1px solid ${currentTheme.border}` }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <button onClick={() => { stopSpeaking(); onClose(); }} className="p-2 rounded-full hover:bg-black/5 transition-colors shrink-0">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                </button>
                <span className="font-mono text-[10px] md:text-xs font-bold uppercase tracking-widest opacity-60 truncate">
                  {article.source}
                </span>
                {isLoading && (
                  <span className="hidden sm:flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest animate-pulse" style={{ color: currentTheme.accent }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: currentTheme.accent }} /> Fetching
                  </span>
                )}
              </div>

              {/* Reader Controls */}
              <div className="flex items-center gap-1 md:gap-3 shrink-0 ml-2">
                
                {/* TTS Play/Pause */}
                <button onClick={toggleSpeak} className="p-2 rounded-full hover:bg-black/5 transition-colors opacity-70 hover:opacity-100" title="Read Aloud">
                  {isPlaying ? (
                    <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                  ) : (
                    <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                  )}
                </button>

                <div className="w-px h-5 mx-1" style={{ backgroundColor: currentTheme.border }} />

                {/* Font Size */}
                <div className="flex items-center hidden sm:flex">
                  <button onClick={() => setFontSize(Math.max(14, fontSize - 2))} className="p-2 rounded-full hover:bg-black/5 transition-colors font-serif font-bold text-sm opacity-70 hover:opacity-100">A-</button>
                  <button onClick={() => setFontSize(Math.min(28, fontSize + 2))} className="p-2 rounded-full hover:bg-black/5 transition-colors font-serif font-bold text-lg opacity-70 hover:opacity-100">A+</button>
                </div>

                <div className="w-px h-5 mx-1 hidden sm:block" style={{ backgroundColor: currentTheme.border }} />

                {/* Theme Toggle */}
                <div className="flex items-center gap-1 bg-black/5 p-1 rounded-full">
                  <button onClick={() => setTheme('light')} className={`w-6 h-6 rounded-full border border-black/10 transition-transform ${theme === 'light' ? 'scale-110 ring-2 ring-offset-1 ring-gray-400' : 'hover:scale-105'}`} style={{ backgroundColor: '#ffffff' }} />
                  <button onClick={() => setTheme('sepia')} className={`w-6 h-6 rounded-full border border-black/10 transition-transform ${theme === 'sepia' ? 'scale-110 ring-2 ring-offset-1 ring-[#b46014]' : 'hover:scale-105'}`} style={{ backgroundColor: '#f4ecd8' }} />
                  <button onClick={() => setTheme('dark')} className={`w-6 h-6 rounded-full border border-white/10 transition-transform ${theme === 'dark' ? 'scale-110 ring-2 ring-offset-1 ring-gray-500' : 'hover:scale-105'}`} style={{ backgroundColor: '#0f1117' }} />
                </div>

                <div className="w-px h-5 mx-1" style={{ backgroundColor: currentTheme.border }} />

                {onSave && (
                  <button onClick={() => onSave(article)} className="p-2 rounded-full hover:bg-black/5 transition-colors opacity-70 hover:opacity-100" title="Save">
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                  </button>
                )}
                <a href={article.link} target="_blank" rel="noopener noreferrer" className="ml-1 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-colors hover:opacity-80" style={{ backgroundColor: currentTheme.accent, color: theme === 'sepia' ? '#fff' : '#fff' }}>
                  Original
                </a>
              </div>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto scroll-smooth" onScroll={handleScroll}>
              <div className="max-w-2xl mx-auto px-5 py-8 md:px-0 md:py-16 pb-24" ref={contentRef}>

                {/* Title & meta */}
                <header className="mb-10 text-center">
                  <div className="flex items-center justify-center gap-2 font-mono text-[10px] uppercase tracking-widest mb-5 opacity-60">
                    <span>{article.source}</span>
                    <span>•</span>
                    <span>{article.date}</span>
                    {readTime && (<><span>•</span><span>{readTime} read</span></>)}
                  </div>
                  <h1 className="font-serif font-bold leading-tight mb-5" style={{ fontSize: `${fontSize * 2.2}px` }}>
                    {article.title}
                  </h1>
                  {article.author && (
                    <p className="text-sm font-medium opacity-70">By {article.author}</p>
                  )}
                </header>

                {/* Hero image */}
                {(article.imageUrl || article.enclosure?.url) && (
                  <figure className="mb-12 rounded-2xl overflow-hidden shadow-xl" style={{ border: `1px solid ${currentTheme.border}` }}>
                    <img src={article.imageUrl || article.enclosure?.url} alt="" className="w-full h-auto max-h-[500px] object-cover" />
                  </figure>
                )}

                {/* Content area */}
                {isLoading ? (
                  <div className="space-y-5 animate-pulse opacity-40 mt-8">
                    {[100, 90, 80, 95, 70, 85].map((w, i) => (
                      <div key={i} className="h-4 rounded" style={{ width: `${w}%`, backgroundColor: currentTheme.text }} />
                    ))}
                  </div>
                ) : previewOnly ? (
                  <div className="space-y-8 mt-8">
                    {bodyContent && (
                      <p className="font-serif opacity-80" style={{ fontSize: `${fontSize}px`, lineHeight: 1.8 }}>
                        {bodyContent.replace(/<[^>]*>/g, '').trim()}
                      </p>
                    )}
                    <div className="rounded-2xl overflow-hidden shadow-lg" style={{ border: `1px solid ${currentTheme.border}`, backgroundColor: currentTheme.header }}>
                      <div className="p-8 text-center space-y-5">
                        <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto" style={{ backgroundColor: `${currentTheme.accent}20` }}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: currentTheme.accent }}>
                            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                            <polyline points="15 3 21 3 21 9" />
                            <line x1="10" y1="14" x2="21" y2="3" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm mb-1 opacity-60">Full article available on</p>
                          <p className="font-bold text-xl">{article.source}</p>
                        </div>
                        <a href={article.link} target="_blank" rel="noopener noreferrer" className="inline-block px-8 py-3.5 text-white font-bold text-sm uppercase tracking-widest rounded-full hover:scale-105 active:scale-95 transition-transform shadow-lg" style={{ backgroundColor: currentTheme.accent }}>
                          Read Full Article →
                        </a>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <style jsx global>{`
                      .rm-prose { font-family: Georgia, 'Times New Roman', serif; }
                      .rm-prose h1,.rm-prose h2,.rm-prose h3,.rm-prose h4 { font-weight: 700; margin: 2em 0 1em; line-height: 1.3; color: inherit; }
                      .rm-prose h1 { font-size: 1.8em; }
                      .rm-prose h2 { font-size: 1.5em; }
                      .rm-prose h3 { font-size: 1.25em; }
                      .rm-prose p { margin-bottom: 1.5em; line-height: 1.9; }
                      .rm-prose strong,.rm-prose b { font-weight: 700; color: inherit; }
                      .rm-prose em,.rm-prose i { font-style: italic; }
                      .rm-prose a { color: ${currentTheme.accent}; text-decoration: none; font-weight: 600; border-bottom: 1px solid transparent; transition: border-color 0.2s; }
                      .rm-prose a:hover { border-color: ${currentTheme.accent}; }
                      .rm-prose blockquote { border-left: 4px solid ${currentTheme.accent}; padding-left: 1.5em; margin: 2em 0; font-style: italic; opacity: 0.85; }
                      .rm-prose ul,.rm-prose ol { padding-left: 1.5em; margin-bottom: 1.5em; line-height: 1.8; }
                      .rm-prose li { margin-bottom: 0.5em; }
                      .rm-prose img { max-width: 100%; height: auto; border-radius: 0.75rem; margin: 2.5rem auto; display: block; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
                      .rm-prose figure { margin: 2.5rem 0; }
                      .rm-prose figcaption { text-align: center; font-size: 0.85em; opacity: 0.7; margin-top: 0.75rem; font-style: italic; font-family: system-ui, sans-serif; }
                      .rm-prose hr { border: none; border-top: 1px solid ${currentTheme.border}; margin: 2.5rem 0; }
                      .rm-prose code { background: ${currentTheme.header}; padding: 0.2em 0.4em; border-radius: 0.25em; font-size: 0.85em; font-family: ui-monospace, monospace; border: 1px solid ${currentTheme.border}; }
                      .rm-prose pre { background: ${currentTheme.header}; border: 1px solid ${currentTheme.border}; padding: 1.25em; border-radius: 0.75rem; overflow-x: auto; margin: 1.5em 0; }
                      .rm-prose pre code { background: transparent; border: none; padding: 0; }
                    `}</style>

                    <div
                      className="rm-prose transition-all duration-300"
                      style={{ fontSize: `${fontSize}px` }}
                      dangerouslySetInnerHTML={{ __html: sanitized }}
                    />

                    {!fullContent && bodyContent.length < 600 && (
                      <div className="mt-12 pt-8 flex flex-col items-center gap-4 text-center" style={{ borderTop: `1px solid ${currentTheme.border}` }}>
                        <p className="text-sm opacity-60">Continue reading on {article.source}</p>
                        <a href={article.link} target="_blank" rel="noopener noreferrer" className="px-7 py-3 text-white font-bold text-sm uppercase tracking-widest rounded-full hover:scale-105 transition-transform" style={{ backgroundColor: currentTheme.accent }}>
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
