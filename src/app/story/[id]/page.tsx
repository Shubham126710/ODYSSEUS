"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import DOMPurify from 'isomorphic-dompurify';
import { ArrowLeft } from 'lucide-react';

const calculateReadTime = (text: string) => {
  const wordsPerMinute = 130;
  const words = text.trim().split(/\s+/).length;
  const minutes = Math.ceil(words / wordsPerMinute);
  return `${minutes} min`;
};

const cleanContent = (html: string) => {
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ['style', 'script', 'input', 'form', 'button', 'iframe'],
  });
};

export default function StoryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const storyUrl = searchParams.get('url');
  const title = searchParams.get('title');
  const source = searchParams.get('source');
  const date = searchParams.get('date');
  const initialImageUrl = searchParams.get('imageUrl');
  const rssContent = searchParams.get('rssContent');

  const [fullContent, setFullContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [previewOnly, setPreviewOnly] = useState(false);

  useEffect(() => {
    if (!storyUrl) return;
    setIsLoading(true);
    fetch(`/api/read-mode?url=${encodeURIComponent(storyUrl)}&t=${Date.now()}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.article?.content) {
          setFullContent(data.article.content);
        } else if (rssContent && rssContent.replace(/<[^>]*>/g, '').trim().length > 200) {
          setFullContent(rssContent);
        } else {
          setPreviewOnly(true);
        }
      })
      .catch(() => {
        if (rssContent && rssContent.replace(/<[^>]*>/g, '').trim().length > 200) {
          setFullContent(rssContent);
        } else {
          setPreviewOnly(true);
        }
      })
      .finally(() => setIsLoading(false));
  }, [storyUrl, rssContent]);

  const readTime = fullContent ? calculateReadTime(fullContent) : (searchParams.get('readTime') || '4 min');

  return (
    <div className="fixed inset-0 bg-vellum-texture text-[#181715] font-sans antialiased flex flex-col z-[100] overflow-hidden selection:bg-[#EA580C] selection:text-white">
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="flex-1 w-full h-full bg-vellum-texture overflow-hidden flex flex-col relative"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 md:px-10 md:py-4 border-b border-[#E0D9CC] bg-[#FCFAF7]/95 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-3 min-w-0">
            <button 
              onClick={() => router.back()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-[#EFECE6] text-[#2A2723] transition-all group shrink-0 font-mono text-xs font-bold uppercase tracking-wider border border-[#E0D9CC]"
            >
              <ArrowLeft style={{ width: 16, height: 16 }} className="group-hover:-translate-x-0.5 transition-transform" />
              <span>Back</span>
            </button>
            <div className="h-4 w-px bg-[#D5CDBD]" />
            <span className="font-mono text-[10px] md:text-xs font-bold uppercase tracking-widest text-[#EA580C] truncate">
              {source || 'Publication'}
            </span>
            {isLoading && (
              <span className="hidden sm:flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-widest text-[#7A7265] animate-pulse">
                <span className="w-1.5 h-1.5 bg-[#EA580C] rounded-full" />
                Purifying Prose
              </span>
            )}
          </div>

          <a 
            href={storyUrl || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-1.5 rounded-full border border-[#D5CDBD] text-[10px] font-mono font-bold uppercase tracking-widest text-[#2A2723] hover:text-[#181715] hover:border-[#181715] bg-[#FCFAF7] transition-colors shrink-0"
          >
            Original ↗
          </a>
        </div>

        {/* Content Scroll Area */}
        <div className="flex-1 overflow-y-auto w-full scroll-smooth">
          <div className="max-w-3xl mx-auto px-5 py-8 md:px-6 md:py-14 pb-24">
            
            {/* Article Title Header */}
            <header className="mb-10 text-center">
              <div className="flex items-center justify-center gap-2 font-mono text-[10px] uppercase tracking-widest text-stone-500 mb-3">
                <span>{date}</span>
                <span>•</span>
                <span>{readTime} read</span>
              </div>
              <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-stone-900 mb-4 leading-tight tracking-tight">
                {title || 'Loading Dispatch...'}
              </h1>
            </header>

            {/* Hero Image */}
            {initialImageUrl && (
              <div className="mb-12 rounded-2xl overflow-hidden shadow-xl aspect-video bg-stone-100 border border-stone-200/90 w-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={initialImageUrl} alt="" className="w-full h-full object-cover" />
              </div>
            )}

            {/* Preview Fallback */}
            {previewOnly && !isLoading && (
              <div className="mb-10 rounded-2xl border border-stone-200/90 bg-white shadow-xs overflow-hidden">
                <div className="p-8 text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mx-auto text-[#EA580C]">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-stone-500 text-xs font-mono uppercase tracking-wider mb-1">Full article hosted on</p>
                    <p className="text-stone-900 font-serif font-bold text-lg">{source}</p>
                  </div>
                  <a
                    href={storyUrl || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block px-7 py-3 bg-[#EA580C] text-white font-mono font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-[#C2410C] transition-all shadow-xs"
                  >
                    Read Full Article →
                  </a>
                </div>
              </div>
            )}

            {/* Body */}
            <article className="prose prose-lg mx-auto font-serif">
              <style jsx global>{`
                .prose { max-width: 68ch; margin: 0 auto; font-family: Georgia, 'Times New Roman', serif; }
                .prose h1, .prose h2, .prose h3, .prose h4 { color: #141518 !important; font-weight: 700; margin-top: 2em; margin-bottom: 0.8em; line-height: 1.3; }
                .prose p { color: #2B2D31 !important; font-weight: 400; margin-bottom: 1.5em; line-height: 1.85; font-size: 1.125rem; }
                .prose strong, .prose b { color: #141518 !important; font-weight: 700; }
                .prose ul, .prose ol { color: #2B2D31 !important; margin-bottom: 1.5em; padding-left: 1.5em; line-height: 1.8; }
                .prose li { margin-bottom: 0.5em; }
                .prose a { color: #EA580C !important; text-decoration: none; font-weight: 600; }
                .prose a:hover { text-decoration: underline; }
                .prose blockquote { color: #4B5563 !important; border-left: 4px solid #EA580C !important; padding-left: 1.25em; margin: 2em 0; font-style: italic; }
                .prose img { margin: 2rem auto; border-radius: 1rem; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08); max-width: 100%; height: auto; }
                .prose code { color: #141518 !important; background-color: rgba(0, 0, 0, 0.05); padding: 0.2em 0.4em; border-radius: 0.25em; font-size: 0.88em; font-family: ui-monospace, monospace; }
                .prose pre { background-color: #141518 !important; color: #FAF9F6 !important; padding: 1.25em; border-radius: 0.75rem; overflow-x: auto; }
              `}</style>
              {fullContent ? (
                <div dangerouslySetInnerHTML={{ __html: cleanContent(fullContent) }} />
              ) : (
                isLoading && (
                  <div className="space-y-4 opacity-50 animate-pulse">
                    <div className="h-4 bg-stone-200 rounded w-full" />
                    <div className="h-4 bg-stone-200 rounded w-5/6" />
                    <div className="h-4 bg-stone-200 rounded w-4/6" />
                  </div>
                )
              )}
            </article>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
