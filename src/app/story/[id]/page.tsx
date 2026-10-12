"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import DOMPurify from 'dompurify';
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
    <div className="fixed inset-0 bg-[#FFFDD0] text-[#2F4522] font-sans antialiased flex flex-col z-[100] overflow-hidden selection:bg-[#FF6B4A] selection:text-[#FFFDD0]">
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="flex-1 w-full h-full bg-[#FFFDD0] overflow-hidden flex flex-col relative"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 md:px-10 md:py-4 border-b border-[#5D8246]/20 bg-[#FFFDD0]/95 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-3 min-w-0">
            <button 
              onClick={() => router.back()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-[#5D8246]/10 text-[#2F4522] transition-all group shrink-0 font-mono text-xs font-bold uppercase tracking-wider cursor-pointer"
            >
              <ArrowLeft style={{ width: 16, height: 16 }} className="group-hover:-translate-x-0.5 transition-transform" />
              <span>Back</span>
            </button>
            <div className="h-4 w-px bg-[#5D8246]/20" />
            <span className="font-mono text-[10px] md:text-xs font-bold uppercase tracking-widest text-[#FF6B4A] truncate">
              {source || 'Publication'}
            </span>
            {isLoading && (
              <span className="hidden sm:flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-widest text-[#5D8246] animate-pulse">
                <span className="w-1.5 h-1.5 bg-[#FF6B4A] rounded-full" />
                Purifying Prose
              </span>
            )}
          </div>

          <a 
            href={storyUrl || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-1.5 rounded-full bg-[#FF6B4A] hover:bg-[#E55A3A] text-[#FFFDD0] border border-[#FF6B4A] text-[10px] font-mono font-bold uppercase tracking-widest transition-colors shrink-0 shadow-xs"
          >
            Original ↗
          </a>
        </div>

        {/* Content Scroll Area */}
        <div className="flex-1 overflow-y-auto w-full scroll-smooth">
          <div className="max-w-3xl mx-auto px-5 py-8 md:px-6 md:py-14 pb-24">
            
            {/* Article Title Header */}
            <header className="mb-10 text-center">
              <div className="flex items-center justify-center gap-2 font-mono text-[10px] uppercase tracking-widest text-[#5D8246] mb-3">
                <span>{date}</span>
                <span>•</span>
                <span>{readTime} read</span>
              </div>
              <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-black text-[#2F4522] mb-4 leading-tight tracking-tight">
                {title || 'Loading Dispatch...'}
              </h1>
            </header>

            {/* Hero Image */}
            {initialImageUrl && (
              <div className="mb-12 rounded-2xl overflow-hidden shadow-lg aspect-video bg-[#5D8246]/10 border border-[#5D8246]/20 w-full">
                <img src={initialImageUrl} alt="" className="w-full h-full object-cover rounded-2xl" />
              </div>
            )}

            {/* Preview Fallback */}
            {previewOnly && !isLoading && (
              <div className="mb-10 rounded-2xl border border-[#5D8246]/20 bg-white/60 shadow-xs overflow-hidden">
                <div className="p-8 text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-[#5D8246]/10 flex items-center justify-center mx-auto text-[#FF6B4A]">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-[#5D8246] text-xs font-mono uppercase tracking-wider mb-1">Full article hosted on</p>
                    <p className="text-[#2F4522] font-serif font-bold text-lg">{source}</p>
                  </div>
                  <a
                    href={storyUrl || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block px-7 py-3 bg-[#FF6B4A] text-[#FFFDD0] font-mono font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-[#E55A3A] transition-all shadow-xs"
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
                .prose h1, .prose h2, .prose h3, .prose h4 { color: #2F4522 !important; font-weight: 700; margin-top: 2em; margin-bottom: 0.8em; line-height: 1.3; }
                .prose p { color: #2F4522 !important; font-weight: 400; margin-bottom: 1.5em; line-height: 1.85; font-size: 1.125rem; }
                .prose strong, .prose b { color: #2F4522 !important; font-weight: 700; }
                .prose ul, .prose ol { color: #2F4522 !important; margin-bottom: 1.5em; padding-left: 1.5em; line-height: 1.8; }
                .prose li { margin-bottom: 0.5em; }
                .prose a { color: #FF6B4A !important; text-decoration: none; font-weight: 600; }
                .prose a:hover { text-decoration: underline; }
                .prose blockquote { color: #5D8246 !important; border-left: 4px solid #FF6B4A !important; padding-left: 1.25em; margin: 2em 0; font-style: italic; }
                .prose img { margin: 2rem auto; border-radius: 1rem; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08); max-width: 100%; height: auto; }
                .prose code { color: #2F4522 !important; background-color: rgba(93, 130, 70, 0.1); padding: 0.2em 0.4em; border-radius: 0.25em; font-size: 0.88em; font-family: ui-monospace, monospace; }
                .prose pre { background-color: #2F4522 !important; color: #FFFDD0 !important; padding: 1.25em; border-radius: 0.75rem; overflow-x: auto; }
              `}</style>
              {fullContent ? (
                <div dangerouslySetInnerHTML={{ __html: cleanContent(fullContent) }} />
              ) : (
                isLoading && (
                  <div className="space-y-4 opacity-50 animate-pulse">
                    <div className="h-4 bg-[#5D8246]/20 rounded w-full" />
                    <div className="h-4 bg-[#5D8246]/20 rounded w-5/6" />
                    <div className="h-4 bg-[#5D8246]/20 rounded w-4/6" />
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
