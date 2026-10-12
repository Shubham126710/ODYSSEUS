"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DOMPurify from 'isomorphic-dompurify';
import { decodeHtmlEntities, sanitizeText } from '@/lib/textUtils';
import { useProfile } from '@/hooks/useProfile';
import { getCurrentMultiplier, recordReadingProgress } from '@/lib/gamification';
import { sanitizeArticleProse } from '@/lib/cleanArticleExtraction';

export type ReaderTheme = 'paper' | 'olive' | 'dark';

interface ThemeConfig {
  name: ReaderTheme;
  bg: string;
  text: string;
  headerBg: string;
  border: string;
  subtle: string;
  buttonBg: string;
  buttonHoverBg: string;
  link: string;
  dotBg: string;
  dotBorder: string;
}

const THEMES: Record<ReaderTheme, ThemeConfig> = {
  paper: {
    name: 'paper',
    bg: '#FFFDD0',
    text: '#5D8246',
    headerBg: '#FFFDD0',
    border: 'rgba(93, 130, 70, 0.2)',
    subtle: 'rgba(93, 130, 70, 0.6)',
    buttonBg: 'rgba(93, 130, 70, 0.08)',
    buttonHoverBg: 'rgba(93, 130, 70, 0.15)',
    link: '#5D8246',
    dotBg: '#FFFDD0',
    dotBorder: 'rgba(93, 130, 70, 0.4)',
  },
  olive: {
    name: 'olive',
    bg: '#5D8246',
    text: '#FFFDD0',
    headerBg: '#5D8246',
    border: 'rgba(255, 253, 208, 0.2)',
    subtle: 'rgba(255, 253, 208, 0.65)',
    buttonBg: 'rgba(255, 253, 208, 0.12)',
    buttonHoverBg: 'rgba(255, 253, 208, 0.2)',
    link: '#FFFDD0',
    dotBg: '#5D8246',
    dotBorder: 'rgba(255, 253, 208, 0.4)',
  },
  dark: {
    name: 'dark',
    bg: '#111317',
    text: '#E5E7EB',
    headerBg: '#111317',
    border: 'rgba(255, 255, 255, 0.12)',
    subtle: 'rgba(255, 255, 255, 0.55)',
    buttonBg: 'rgba(255, 255, 255, 0.08)',
    buttonHoverBg: 'rgba(255, 255, 255, 0.16)',
    link: '#E5E7EB',
    dotBg: '#111317',
    dotBorder: 'rgba(255, 255, 255, 0.3)',
  },
};

const calculateReadTime = (text: string) => {
  const words = text.trim().split(/\s+/).length;
  return `${Math.ceil(words / 130)} MIN READ`;
};

/** Normalize image URL to compare hero and body images regardless of query params or protocols */
function normalizeImageUrl(url?: string | null): string {
  if (!url) return '';
  try {
    const u = new URL(url, 'https://example.com');
    return (u.hostname + u.pathname)
      .toLowerCase()
      .replace(/[-_](\d+x\d+)/, '')
      .replace(/\.(jpe?g|png|webp|avif)/, '');
  } catch {
    return String(url).split('?')[0].split('#')[0].toLowerCase();
  }
}

/** Deduplicate hero image: strip the first body image if it matches the hero image */
function deduplicateHeroImage(html: string, heroUrl?: string | null): string {
  if (!html || !heroUrl) return html;
  const normHero = normalizeImageUrl(heroUrl);
  if (!normHero || normHero.length < 5) return html;

  // Check first figure
  const firstFigureMatch = html.match(/<figure[^>]*>[\s\S]*?<img[^>]+src=["']([^"']+)["'][^>]*>[\s\S]*?<\/figure>/i);
  if (firstFigureMatch) {
    const src = firstFigureMatch[1];
    const normSrc = normalizeImageUrl(src);
    if (normSrc === normHero || normSrc.includes(normHero) || normHero.includes(normSrc)) {
      return html.replace(firstFigureMatch[0], '');
    }
  }

  // Check first standalone img
  const firstImgMatch = html.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/i);
  if (firstImgMatch) {
    const src = firstImgMatch[1];
    const normSrc = normalizeImageUrl(src);
    if (normSrc === normHero || normSrc.includes(normHero) || normHero.includes(normSrc)) {
      return html.replace(firstImgMatch[0], '');
    }
  }

  return html;
}

/** Lightweight markdown to HTML parser for Jina AI fallback */
function markdownToHtml(md: string): string {
  const cleanMd = md
    .replace(/^Title:\s*.*$/gim, '')
    .replace(/^URL Source:\s*.*$/gim, '')
    .replace(/^Markdown Content:\s*.*$/gim, '')
    .replace(/^\d{1,2}:\d{2}:\d{2}(?::\d{2})?$/gm, '')
    .replace(/^.*?(Disrupt doors open|exhibit your breakthrough|Book Exhibit Table|REGISTER NOW|at Disrupt is on).*?$/gim, '')
    .replace(/^(Close|Dismiss|Skip to content|Accept all cookies)$/gim, '')
    .replace(/Image \d+<\/a>[^<\n]*/gi, '');

  return cleanMd
    .replace(/^#{6}\s(.+)$/gm, '<h6>$1</h6>')
    .replace(/^#{5}\s(.+)$/gm, '<h5>$1</h5>')
    .replace(/^#{4}\s(.+)$/gm, '<h4>$1</h4>')
    .replace(/^###\s(.+)$/gm, '<h3>$1</h3>')
    .replace(/^##\s(.+)$/gm, '<h2>$1</h2>')
    .replace(/^#\s(.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/^>\s(.+)$/gm, '<blockquote>$1</blockquote>')
    .replace(/^---+$/gm, '<hr>')
    .split(/\n{2,}/)
    .map((block) => {
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

export const ReadingModal: React.FC<ReadingModalProps> = ({
  isOpen,
  onClose,
  article,
  onSave,
}) => {
  const [fullContent, setFullContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [previewOnly, setPreviewOnly] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [useProxy, setUseProxy] = useState(false);

  // Persistent theme: "paper" default, "olive" second, "dark" opt-in
  const [theme, setTheme] = useState<ReaderTheme>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('odysseus_reader_theme');
        if (saved === 'paper' || saved === 'olive' || saved === 'dark') {
          return saved;
        }
      } catch {}
    }
    return 'paper';
  });

  const handleThemeChange = (newTheme: ReaderTheme) => {
    setTheme(newTheme);
    try {
      localStorage.setItem('odysseus_reader_theme', newTheme);
    } catch {}
  };

  const [scrollProgress, setScrollProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [readSeconds, setReadSeconds] = useState(0);
  const [sessionCredited, setSessionCredited] = useState(false);
  const [isArticleSaved, setIsArticleSaved] = useState(false);

  const hasCreditedRef = useRef(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);

  const { profile } = useProfile();
  const currentTheme = THEMES[theme] || THEMES.paper;

  // Escape key listener to close reader
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        stopSpeaking();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll while modal is open
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Read seconds ticker
  useEffect(() => {
    if (!isOpen) {
      setReadSeconds(0);
      setSessionCredited(false);
      hasCreditedRef.current = false;
      return;
    }

    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && !document.hidden) {
        setReadSeconds((s) => s + 1);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen]);

  // Credit gamification progress
  useEffect(() => {
    if (isOpen && scrollProgress >= 85 && !hasCreditedRef.current && readSeconds >= 12) {
      hasCreditedRef.current = true;
      setSessionCredited(true);
      recordReadingProgress({
        userId: profile?.id,
        secondsRead: Math.max(readSeconds, 60),
        articleId: article?.link,
        articleTitle: article?.title,
      });
    }
  }, [isOpen, scrollProgress, readSeconds, profile?.id, article]);

  // Fetch full article content
  const fetchContent = useCallback(async () => {
    if (!article?.link) return;

    setFullContent(null);
    setPreviewOnly(false);
    setIsLoading(true);

    try {
      // 1. Odysseus Server Reader API
      const res = await fetch(`/api/read-mode?url=${encodeURIComponent(article.link)}&t=${Date.now()}`, {
        cache: 'no-store',
        headers: { Pragma: 'no-cache', 'Cache-Control': 'no-cache' },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.article?.content && data.article.content.length > 300) {
          const pureHtml = sanitizeArticleProse(data.article.content);
          setFullContent(pureHtml);
          setIsLoading(false);
          return;
        }
      }
    } catch {
      // Fall through to client fallback
    }

    try {
      // 2. Client-side fallback via Jina AI
      const jinaRes = await fetch(`https://r.jina.ai/${encodeURIComponent(article.link)}`, {
        headers: { Accept: 'application/json' },
      });
      if (jinaRes.ok) {
        const jinaData = await jinaRes.json();
        if (jinaData.code === 200 && jinaData.data?.content && jinaData.data.content.length > 500) {
          const pureHtml = sanitizeArticleProse(markdownToHtml(jinaData.data.content));
          setFullContent(pureHtml);
          setIsLoading(false);
          return;
        }
      }
    } catch {
      // Fall through
    }

    // 3. Fallback to RSS snippet preview
    const rssContent = article['content:encoded'] || article.contentEncoded || article.content;
    if (rssContent && rssContent.replace(/<[^>]*>/g, '').trim().length > 150) {
      setFullContent(sanitizeArticleProse(rssContent));
      setPreviewOnly(true);
    } else {
      setPreviewOnly(true);
    }

    setIsLoading(false);
  }, [article]);

  useEffect(() => {
    if (isOpen && article) {
      setImageError(false);
      setUseProxy(false);
      setIsArticleSaved(false);
      if (article.isImported && article.content) {
        setFullContent(sanitizeArticleProse(article.content));
        setIsLoading(false);
        setPreviewOnly(false);
      } else {
        fetchContent();
      }
      setScrollProgress(0);
    } else {
      stopSpeaking();
    }
  }, [isOpen, article, fetchContent]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const maxScroll = scrollHeight - clientHeight;
    const progress = maxScroll > 0 ? Math.min(100, Math.max(0, (scrollTop / maxScroll) * 100)) : 100;
    setScrollProgress(progress);
  };

  const toggleSpeak = () => {
    if (!('speechSynthesis' in window)) return;

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    } else {
      const textToRead =
        contentRef.current?.innerText ||
        fullContent?.replace(/<[^>]*>/g, '') ||
        article?.description ||
        article?.title;
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

  const handleSaveToggle = () => {
    setIsArticleSaved(!isArticleSaved);
    if (onSave) {
      onSave(article);
    }
  };

  const heroImageUrl = article?.imageUrl || article?.enclosure?.url;
  const activeHeroSrc = useProxy && heroImageUrl
    ? `/api/image-proxy?url=${encodeURIComponent(heroImageUrl)}`
    : heroImageUrl;

  const hasHeroImage = !imageError && !!activeHeroSrc;

  // Memoize body content and deduplicate hero image
  const bodyContent = useMemo(() => {
    if (!article) return '';
    const raw = fullContent || article.content || article.description || article.excerpt || '';
    return deduplicateHeroImage(raw, heroImageUrl);
  }, [fullContent, article, heroImageUrl]);

  const sanitizedBody = useMemo(() => {
    if (!bodyContent) return '';
    return DOMPurify.sanitize(bodyContent, {
      USE_PROFILES: { html: true },
      FORBID_TAGS: ['script', 'style', 'iframe', 'form', 'input', 'button'],
    });
  }, [bodyContent]);

  const readTimeLabel = useMemo(() => {
    if (!article) return '';
    return fullContent ? calculateReadTime(bodyContent) : (article.readTime || '3 MIN READ').toUpperCase();
  }, [fullContent, bodyContent, article]);

  if (!article) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop (clicking outside closes the reader) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              stopSpeaking();
              onClose();
            }}
            style={{ zIndex: 9998 }}
            className="fixed inset-0 bg-black/65 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ type: 'spring', damping: 28, stiffness: 240 }}
            style={{
              backgroundColor: currentTheme.bg,
              color: currentTheme.text,
              zIndex: 9999,
            }}
            className="fixed inset-0 md:top-4 md:bottom-4 md:inset-x-8 lg:inset-x-16 xl:inset-x-32 rounded-none md:rounded-2xl shadow-2xl overflow-hidden flex flex-col transition-colors duration-200"
          >
            {/* 2px Orange Reading Progress Line Fixed to the Very Top */}
            <div className="w-full h-[2px] bg-transparent absolute top-0 left-0 right-0 z-50 pointer-events-none">
              <div
                style={{
                  width: `${scrollProgress}%`,
                  height: '2px',
                  backgroundColor: '#FF6B4A',
                  transition: 'width 100ms ease-out',
                }}
              />
            </div>

            {/* Sticky Editorial Header (56-60px tall) */}
            <header
              style={{
                height: '58px',
                minHeight: '58px',
                backgroundColor: currentTheme.headerBg,
                borderBottom: `1px solid ${currentTheme.border}`,
              }}
              className="sticky top-0 z-40 w-full px-4 sm:px-6 flex items-center justify-between gap-3 shrink-0 select-none transition-colors duration-200"
            >
              {/* Left: Back button + "BACK" label (no duplicated source name) */}
              <button
                type="button"
                onClick={() => {
                  stopSpeaking();
                  onClose();
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  fontSize: '11px',
                  letterSpacing: '0.08em',
                  lineHeight: 1,
                  borderRadius: '999px',
                  overflow: 'visible',
                  border: `1px solid ${currentTheme.border}`,
                  backgroundColor: currentTheme.buttonBg,
                  color: currentTheme.text,
                }}
                className="font-mono uppercase font-bold cursor-pointer hover:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#FF6B4A]"
                title="Back (Esc)"
                aria-label="Back"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="shrink-0">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                <span>BACK</span>
              </button>

              {/* Right: Grouped controls: LISTEN, Theme Dots, SAVE, ORIGINAL ↗ */}
              <div className="flex items-center gap-[12px] shrink-0">
                
                {/* 1. LISTEN (icon + label) */}
                <button
                  type="button"
                  onClick={toggleSpeak}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    fontSize: '11px',
                    letterSpacing: '0.08em',
                    lineHeight: 1,
                    borderRadius: '999px',
                    overflow: 'visible',
                    border: `1px solid ${currentTheme.border}`,
                    backgroundColor: currentTheme.buttonBg,
                    color: currentTheme.text,
                  }}
                  className="font-mono uppercase font-bold cursor-pointer hover:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#FF6B4A]"
                  title={isPlaying ? 'Pause audio' : 'Listen to article'}
                  aria-label="Listen"
                >
                  {isPlaying ? (
                    <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24" className="shrink-0">
                      <rect x="6" y="4" width="4" height="16" />
                      <rect x="14" y="4" width="4" height="16" />
                    </svg>
                  ) : (
                    <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24" className="shrink-0">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                  )}
                  <span className="hidden sm:inline">{isPlaying ? 'PLAYING' : 'LISTEN'}</span>
                </button>

                {/* 2. Three Theme Dots (18px each, 10px gap, no overlapping) */}
                <div
                  className="inline-flex items-center gap-[10px] shrink-0"
                  role="group"
                  aria-label="Theme selector"
                >
                  {/* Paper Theme Dot (Cream #FFFDD0) */}
                  <button
                    type="button"
                    onClick={() => handleThemeChange('paper')}
                    aria-label="Paper theme"
                    title="Paper theme"
                    style={{
                      width: '18px',
                      height: '18px',
                      minWidth: '18px',
                      minHeight: '18px',
                      backgroundColor: THEMES.paper.dotBg,
                      border: `1px solid ${THEMES.paper.dotBorder}`,
                    }}
                    className={`rounded-full cursor-pointer transition-all shrink-0 ${
                      theme === 'paper'
                        ? 'ring-2 ring-offset-2 ring-[#5D8246]'
                        : 'opacity-70 hover:opacity-100 hover:scale-110'
                    }`}
                  />

                  {/* Olive Theme Dot (#5D8246) */}
                  <button
                    type="button"
                    onClick={() => handleThemeChange('olive')}
                    aria-label="Olive theme"
                    title="Olive theme"
                    style={{
                      width: '18px',
                      height: '18px',
                      minWidth: '18px',
                      minHeight: '18px',
                      backgroundColor: THEMES.olive.dotBg,
                      border: `1px solid ${THEMES.olive.dotBorder}`,
                    }}
                    className={`rounded-full cursor-pointer transition-all shrink-0 ${
                      theme === 'olive'
                        ? 'ring-2 ring-offset-2 ring-[#FF6B4A]'
                        : 'opacity-70 hover:opacity-100 hover:scale-110'
                    }`}
                  />

                  {/* Dark Theme Dot (#111317) */}
                  <button
                    type="button"
                    onClick={() => handleThemeChange('dark')}
                    aria-label="Dark theme"
                    title="Dark theme"
                    style={{
                      width: '18px',
                      height: '18px',
                      minWidth: '18px',
                      minHeight: '18px',
                      backgroundColor: THEMES.dark.dotBg,
                      border: `1px solid ${THEMES.dark.dotBorder}`,
                    }}
                    className={`rounded-full cursor-pointer transition-all shrink-0 ${
                      theme === 'dark'
                        ? 'ring-2 ring-offset-2 ring-[#FF6B4A]'
                        : 'opacity-70 hover:opacity-100 hover:scale-110'
                    }`}
                  />
                </div>

                {/* 3. SAVE (icon + label) */}
                <button
                  type="button"
                  onClick={handleSaveToggle}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    fontSize: '11px',
                    letterSpacing: '0.08em',
                    lineHeight: 1,
                    borderRadius: '999px',
                    overflow: 'visible',
                    border: `1px solid ${currentTheme.border}`,
                    backgroundColor: currentTheme.buttonBg,
                    color: currentTheme.text,
                  }}
                  className="font-mono uppercase font-bold cursor-pointer hover:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#FF6B4A]"
                  title="Save article"
                  aria-label="Save"
                >
                  <svg
                    width="14"
                    height="14"
                    fill={isArticleSaved ? 'currentColor' : 'none'}
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    className="shrink-0"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                    />
                  </svg>
                  <span className="hidden sm:inline">{isArticleSaved ? 'SAVED' : 'SAVE'}</span>
                </button>

                {/* 4. ORIGINAL ↗ (Orange pill, cream text, 12px bold) */}
                <a
                  href={article.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    fontSize: '12px',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    lineHeight: 1,
                    borderRadius: '999px',
                    overflow: 'visible',
                    backgroundColor: '#FF6B4A',
                    color: '#FFFDD0',
                  }}
                  className="font-mono uppercase cursor-pointer hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#FF6B4A]"
                  title="Open original article"
                >
                  <span>ORIGINAL</span>
                  <span className="text-[13px] leading-none">↗</span>
                </a>

              </div>
            </header>

            {/* Scrollable Article Body */}
            <div
              ref={scrollContainerRef}
              onScroll={handleScroll}
              data-lenis-prevent="true"
              tabIndex={0}
              className="flex-1 overflow-y-auto overscroll-contain select-text outline-none focus:outline-none"
            >
              {/* Content Column: Max-width 680px, Centered, Generous Padding */}
              <div
                ref={contentRef}
                className="max-w-[680px] w-full mx-auto px-5 sm:px-8 py-8 md:py-12"
              >
                {/* 1. Meta Line: SOURCE • date • readTime */}
                <div
                  style={{ marginTop: '32px', marginBottom: '16px' }}
                  className="font-mono text-[11px] uppercase tracking-[0.1em] opacity-60 flex flex-wrap items-center gap-2"
                >
                  <span className="font-bold text-[#FF6B4A]">{decodeHtmlEntities(article.source || 'DISPATCH')}</span>
                  <span>•</span>
                  <span>{article.date || 'RECENT'}</span>
                  {readTimeLabel && (
                    <>
                      <span>•</span>
                      <span>{readTimeLabel}</span>
                    </>
                  )}
                </div>

                {/* 2. Headline: Authoritative editorial type */}
                <h1
                  style={{
                    fontSize: 'clamp(32px, 4vw, 52px)',
                    lineHeight: 1.05,
                    letterSpacing: '-0.025em',
                  }}
                  className="font-sans font-black text-left mb-6"
                >
                  {decodeHtmlEntities(article.title)}
                </h1>

                {/* 3. Thin hairline rule across the 680px column */}
                <hr
                  style={{ borderColor: currentTheme.border }}
                  className="my-6 border-t"
                />

                {/* 4. Hero image: 16:10 or 4:3, border-radius 8px */}
                {hasHeroImage && (
                  <figure className="my-6 rounded-lg overflow-hidden" style={{ border: `1px solid ${currentTheme.border}` }}>
                    <div style={{ aspectRatio: '16/10', maxHeight: '440px' }} className="w-full overflow-hidden">
                      <img
                        src={activeHeroSrc}
                        alt={article.title}
                        onError={() => {
                          if (!useProxy && heroImageUrl && !heroImageUrl.startsWith('/api/image-proxy')) {
                            setUseProxy(true);
                          } else {
                            setImageError(true);
                          }
                        }}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </figure>
                )}

                {/* 5. Article body typography */}
                {isLoading ? (
                  <div className="space-y-4 animate-pulse opacity-40 mt-8">
                    {[100, 92, 85, 96, 75, 88].map((w, i) => (
                      <div
                        key={i}
                        className="h-4 rounded"
                        style={{ width: `${w}%`, backgroundColor: currentTheme.text }}
                      />
                    ))}
                  </div>
                ) : previewOnly ? (
                  <div className="space-y-6 mt-8">
                    {bodyContent && (
                      <div
                        className="rm-body font-serif opacity-90 space-y-4"
                        style={{ fontSize: '19px', lineHeight: 1.7 }}
                      >
                        {decodeHtmlEntities(bodyContent)
                          .replace(/<[^>]*>/g, '')
                          .split(/\n+/)
                          .map((para: string, idx: number) =>
                            para.trim() ? <p key={idx}>{para.trim()}</p> : null
                          )}
                      </div>
                    )}
                    <div
                      className="rounded-xl p-8 text-center space-y-4 my-8"
                      style={{
                        border: `1px solid ${currentTheme.border}`,
                        backgroundColor: currentTheme.buttonBg,
                      }}
                    >
                      <p className="text-xs uppercase font-mono tracking-widest opacity-60">
                        Full story available on
                      </p>
                      <p className="font-bold text-xl">{decodeHtmlEntities(article.source || 'Original Publication')}</p>
                      <a
                        href={article.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          backgroundColor: '#FF6B4A',
                          color: '#FFFDD0',
                        }}
                        className="inline-block px-7 py-3 font-mono font-bold text-xs uppercase tracking-wider rounded-full hover:opacity-90 transition-opacity"
                      >
                        Read Full Story →
                      </a>
                    </div>
                  </div>
                ) : (
                  <>
                    <style jsx global>{`
                      .rm-body {
                        font-family: Georgia, Cambria, 'Times New Roman', serif;
                        font-size: 19px;
                        line-height: 1.7;
                        font-weight: 500;
                        color: inherit;
                      }
                      .rm-body p {
                        margin-bottom: 1.1em;
                      }
                      .rm-body > p:first-of-type::first-letter {
                        float: left;
                        font-size: 3.2em;
                        line-height: 0.85;
                        padding-right: 8px;
                        padding-top: 4px;
                        color: #FF6B4A;
                        font-weight: 700;
                        font-family: Georgia, Cambria, 'Times New Roman', serif;
                      }
                      .rm-body h1, .rm-body h2, .rm-body h3, .rm-body h4 {
                        font-family: var(--font-sans), system-ui, sans-serif;
                        font-weight: 800;
                        margin: 1.8em 0 0.8em;
                        line-height: 1.2;
                        color: inherit;
                      }
                      .rm-body h1 { font-size: 1.8em; }
                      .rm-body h2 { font-size: 1.45em; }
                      .rm-body h3 { font-size: 1.25em; }
                      .rm-body a {
                        color: ${currentTheme.link};
                        text-decoration: underline;
                        text-decoration-color: #FF6B4A;
                        text-decoration-thickness: 2px;
                        text-underline-offset: 4px;
                        transition: opacity 0.2s;
                      }
                      .rm-body a:hover {
                        opacity: 0.8;
                      }
                      .rm-body blockquote {
                        font-style: italic;
                        font-size: 20px;
                        line-height: 1.6;
                        border-left: 3px solid #FF6B4A;
                        padding-left: 16px;
                        margin: 1.6em 0;
                        opacity: 0.9;
                      }
                      .rm-body img {
                        max-width: 100%;
                        max-height: 70vh;
                        margin: 2rem auto;
                        border-radius: 6px;
                        display: block;
                        object-fit: contain;
                      }
                      .rm-body figure {
                        margin: 2rem auto;
                      }
                      .rm-body figcaption {
                        text-align: center;
                        font-size: 12px;
                        font-style: italic;
                        font-family: ui-monospace, monospace;
                        opacity: 0.7;
                        margin-top: 8px;
                      }
                      .rm-body hr {
                        border: none;
                        border-top: 1px solid ${currentTheme.border};
                        margin: 2rem 0;
                      }
                      .rm-body ul, .rm-body ol {
                        padding-left: 1.5em;
                        margin-bottom: 1.1em;
                      }
                      .rm-body li {
                        margin-bottom: 0.4em;
                      }
                    `}</style>

                    <div
                      className="rm-body transition-colors duration-200"
                      dangerouslySetInnerHTML={{ __html: sanitizedBody }}
                    />
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
