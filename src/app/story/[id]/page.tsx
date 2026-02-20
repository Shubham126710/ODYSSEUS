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
  // Config DOMPurify to strip styles and classes for a clean reader view
  DOMPurify.addHook('afterSanitizeAttributes', function (node) {
    if ('removeAttribute' in node) {
      node.removeAttribute('style');
      node.removeAttribute('class');
      node.removeAttribute('width');
      node.removeAttribute('height');

      // Center images
      if (node.tagName === 'IMG') {
        node.classList.add('mx-auto', 'w-full', 'h-auto', 'rounded-2xl', 'my-8');
      }
      
      // Ensure figcaptions looked styled
      if (node.tagName === 'FIGCAPTION') {
        node.classList.add('text-center', 'text-sm', 'opacity-60', 'mt-2', 'italic');
      }
    }
  });

  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ['style', 'script', 'input', 'form', 'button'],
    FORBID_ATTR: ['style', 'class', 'width', 'height']
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
  }, [storyUrl]);

  const readTime = fullContent ? calculateReadTime(fullContent) : (searchParams.get('readTime') || '5 min');

  return (
    <div className="fixed inset-0 bg-juice-cream flex flex-col z-[100] overflow-hidden">
         {/* Card Container - Updated to be full screen without the floating border effect */}
         <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="flex-1 w-full h-full bg-juice-cream shadow-2xl overflow-hidden flex flex-col relative"
         >
             {/* Header */}
             <div className="flex items-center justify-between px-3 py-3 md:px-12 md:py-6 border-b border-juice-green/10 bg-juice-cream/90 backdrop-blur-md sticky top-0 z-20">
                 <div className="flex items-center gap-2 md:gap-4 min-w-0">
                    <button 
                        onClick={() => router.back()}
                        className="flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-2 -ml-1 rounded-full hover:bg-juice-green/5 text-juice-green transition-all group shrink-0"
                    >
                        <ArrowLeft style={{ width: 18, height: 18 }} className="group-hover:-translate-x-1 transition-transform" />
                        <span className="font-bold text-[10px] md:text-xs uppercase tracking-widest hidden sm:inline">Go Back</span>
                    </button>
                    <div className="h-4 w-px bg-juice-green/10 hidden sm:block" />
                    <span className="font-mono text-[9px] md:text-xs font-bold uppercase tracking-widest text-juice-green/60 pt-0.5 truncate">
                        {source || 'Source'}
                    </span>
                    {isLoading && (
                        <span className="hidden md:flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-juice-orange animate-pulse">
                            <span style={{ width: 6, height: 6 }} className="bg-juice-orange rounded-full"></span>
                            Fetching Story...
                        </span>
                    )}
                </div>

                <a 
                    href={storyUrl || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 md:px-4 py-1.5 md:py-2 rounded-full border border-juice-green/20 text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-juice-green hover:bg-juice-green hover:text-juice-cream transition-colors shrink-0 ml-2"
                >
                    Original
                </a>
             </div>

             {/* Content Scroll Area */}
             <div className="flex-1 overflow-y-auto w-full scroll-smooth">
                 <div className="max-w-3xl mx-auto px-4 py-8 md:px-0 md:py-16 pb-20">
                    {/* Article Title Header */}
                    <header className="mb-8 md:mb-10 text-center">
                        <h1 className="font-serif text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-bold text-juice-green mb-4 md:mb-6 leading-tight">
                            {title || 'Loading...'}
                        </h1>
                        <div className="flex items-center justify-center gap-3 text-juice-green/60 font-mono text-[10px] uppercase tracking-widest">
                             <span>{date}</span>
                             <span>•</span>
                             <span>{readTime}</span>
                        </div>
                    </header>

                    {/* Image */}
                    {initialImageUrl && (
                        <div className="mb-10 rounded-2xl overflow-hidden shadow-lg aspect-video bg-juice-green/5 w-full">
                             <img src={initialImageUrl} alt="" className="w-full h-full object-cover" />
                        </div>
                    )}

                    {/* Error State */}
                    {previewOnly && !isLoading && (
                        <div className="mb-10 rounded-2xl border border-juice-green/15 bg-juice-green/5 overflow-hidden">
                          <div className="p-8 text-center space-y-4">
                            <div className="w-12 h-12 rounded-full bg-juice-orange/10 flex items-center justify-center mx-auto">
                              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-juice-orange">
                                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                              </svg>
                            </div>
                            <div>
                              <p className="text-juice-green/60 text-sm mb-1">Full article on</p>
                              <p className="text-juice-green font-bold text-lg">{source}</p>
                            </div>
                            <a
                              href={storyUrl || '#'}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-block px-8 py-3.5 bg-juice-orange text-white font-bold text-sm uppercase tracking-widest rounded-full hover:scale-105 transition-transform shadow-lg"
                            >
                              Read Full Article →
                            </a>
                          </div>
                        </div>
                    )}

                    {/* Body */}
                    <article className="prose prose-lg md:prose-xl mx-auto font-serif">
                        <style jsx global>{`
                            .prose { max-width: 65ch; margin: 0 auto; }
                            .prose h1, .prose h2, .prose h3, .prose h4, .prose h5, .prose h6 { color: #5D8246 !important; font-weight: 700; margin-top: 2em; margin-bottom: 1em; line-height: 1.3; }
                            .prose p { color: #5D8246 !important; font-weight: 400; margin-bottom: 1.5em; line-height: 1.8; font-size: 1rem; }
                            @media (min-width: 640px) { .prose p { font-size: 1.125rem; } }
                            .prose strong, .prose b { color: #3d5a2e !important; font-weight: 700; }
                            .prose ul, .prose ol { color: #5D8246 !important; margin-bottom: 1.5em; padding-left: 1.5em; }
                            .prose li { color: #5D8246 !important; margin-bottom: 0.5em; }
                            .prose a { color: #FF6B4A !important; text-decoration: none; font-weight: 600; }
                            .prose a:hover { text-decoration: underline; }
                            .prose blockquote { color: #6b8f55 !important; border-left: 4px solid #FF6B4A !important; padding-left: 1em; margin-left: 0; font-style: italic; opacity: 0.9; }
                            .prose img { margin: 2rem auto; border-radius: 1rem; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); max-width: 100%; height: auto; }
                            .prose code { color: #5D8246 !important; background-color: rgba(93, 130, 70, 0.1); padding: 0.2em 0.4em; border-radius: 0.25em; font-size: 0.9em; }
                            .prose pre { background-color: #f5f5dc !important; color: #5D8246 !important; padding: 1em; border-radius: 0.5rem; overflow-x: auto; border: 1px solid rgba(93, 130, 70, 0.15); }
                        `}</style>
                        {fullContent ? (
                            <div dangerouslySetInnerHTML={{ __html: cleanContent(fullContent) }} />
                        ) : (
                           isLoading && (
                               <div className="space-y-4 opacity-50 animate-pulse">
                                   <div className="h-4 bg-gray-200 rounded w-full"></div>
                                   <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                                   <div className="h-4 bg-gray-200 rounded w-4/6"></div>
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
