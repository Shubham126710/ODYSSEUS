"use client";

import React, { useState, useEffect } from 'react';
import { AppHeader } from '@/components/AppHeader';
import { Footer } from '@/components/Footer';
import { useProfile } from '@/hooks/useProfile';
import { useSavedStories } from '@/hooks/useSavedStories';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Toast } from '@/components/Toast';
import { ReadingModal } from '@/components/ReadingModal';
import { ImportArticleModal } from '@/components/ImportArticleModal';
import { EditorialMonogramPoster } from '@/components/EditorialMonogramPoster';
import { decodeHtmlEntities } from '@/lib/textUtils';

const SavedStoryCard = ({
  story,
  index,
  onOpen,
  onRemove,
}: {
  story: any;
  index: number;
  onOpen: () => void;
  onRemove: (e: React.MouseEvent) => void;
}) => {
  const initialImg = story.image_url || story.imageUrl || null;
  const [imgSrc, setImgSrc] = useState<string | null>(initialImg);
  const [triedProxy, setTriedProxy] = useState(false);
  const [imgFailed, setImgFailed] = useState(!initialImg);

  const handleImgError = () => {
    if (!triedProxy && imgSrc && (imgSrc.startsWith('http://') || imgSrc.startsWith('https://'))) {
      setTriedProxy(true);
      setImgSrc(`/api/image-proxy?url=${encodeURIComponent(imgSrc)}`);
    } else {
      setImgFailed(true);
    }
  };

  const sourceName = story.source || story.source_name || 'Odysseus Library';
  const sourceInitial = sourceName.charAt(0).toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.03, duration: 0.25 }}
      onClick={onOpen}
      className="group relative flex flex-col bg-[#FAF7EE] text-[#131E15] rounded-2xl overflow-hidden shadow-md hover:shadow-2xl border border-white/20 hover:border-[#EA580C] hover:-translate-y-1 transition-all duration-300 cursor-pointer flex-1"
    >
      {/* Visual Header */}
      <div className="relative w-full aspect-[16/10] overflow-hidden bg-stone-200 shrink-0">
        {!imgFailed && imgSrc ? (
          <img
            src={imgSrc}
            alt={story.title}
            onError={handleImgError}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            loading="lazy"
          />
        ) : (
          <EditorialMonogramPoster
            source={sourceName}
            category={story.category || 'culture'}
            title={story.title}
            className="w-full h-full"
          />
        )}

        {/* Source Badge */}
        <div className="absolute top-3 left-3 bg-[#131E15]/90 text-white backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider shadow-xs border border-white/10">
          {sourceName}
        </div>

        {/* Remove Bookmark Button */}
        <button
          onClick={onRemove}
          className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/95 hover:bg-red-50 text-stone-500 hover:text-red-500 flex items-center justify-center transition-colors shadow-xs border border-black/5"
          title="Remove from saved stories"
          aria-label="Remove story"
        >
          <span className="text-xs font-bold leading-none">✕</span>
        </button>
      </div>

      {/* Content Section */}
      <div className="p-5 flex flex-col flex-grow justify-between space-y-3">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider">
            <span className="font-bold text-[#EA580C]">{sourceName}</span>
            <span className="text-stone-500">{story.read_time || '5 min read'}</span>
          </div>

          <h3 className="font-serif text-lg font-bold text-[#131E15] leading-snug group-hover:text-[#EA580C] transition-colors line-clamp-2">
            {decodeHtmlEntities(story.title)}
          </h3>

          <p className="text-xs text-[#37493A] leading-relaxed line-clamp-2 font-sans">
            {decodeHtmlEntities(story.excerpt || 'Purified essay archived for focused offline reading.')}
          </p>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-stone-200/80 flex items-center justify-between text-xs font-mono">
          <span className="font-bold text-[#131E15] group-hover:text-[#EA580C] flex items-center gap-1 transition-colors">
            <span>Read In Chamber</span>
            <span className="text-sm font-sans transition-transform group-hover:translate-x-0.5">→</span>
          </span>

          {story.url && (
            <a
              href={story.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-[10px] text-stone-500 hover:text-[#EA580C] uppercase tracking-wider transition-colors"
              title="Open original website"
            >
              Source ↗
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default function SavedPage() {
  const { profile } = useProfile();
  const { savedStories, loading, removeSavedStory } = useSavedStories(profile?.id);
  const [toast, setToast] = useState({ message: '', isVisible: false });
  const [activeStory, setActiveStory] = useState<any | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [quickUrl, setQuickUrl] = useState('');
  const [isPurifyingQuick, setIsPurifyingQuick] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'imported' | 'prestige'>('all');

  const handleRemove = async (story: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await removeSavedStory(story);
      setToast({ message: 'Story removed from your library', isVisible: true });
    } catch {
      setToast({ message: 'Failed to remove story', isVisible: true });
    }
  };

  const handleQuickImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickUrl.trim()) return;

    try {
      new URL(quickUrl);
    } catch {
      setToast({ message: 'Please enter a valid web URL starting with https://', isVisible: true });
      return;
    }

    setIsPurifyingQuick(true);
    try {
      const res = await fetch(`/api/read-mode?url=${encodeURIComponent(quickUrl.trim())}&t=${Date.now()}`);
      const data = await res.json();

      if (data.success && data.article?.content) {
        const article = {
          title: data.article.title || 'Imported Story',
          content: data.article.content,
          excerpt: data.article.textContent?.slice(0, 240) + '...',
          link: quickUrl.trim(),
          source: data.article.siteName || new URL(quickUrl).hostname.replace('www.', ''),
          readTime: data.article.readTime || `${Math.ceil((data.article.wordCount || 500) / 220)} min read`,
          date: 'Imported Just Now',
          wordCount: data.article.wordCount,
          isImported: true,
        };
        setActiveStory(article);
        setQuickUrl('');
        setToast({ message: '✦ Story purified and ready to read!', isVisible: true });
      } else {
        setToast({ message: 'Could not extract clean article from link', isVisible: true });
      }
    } catch {
      setToast({ message: 'Extraction failed or was blocked by host', isVisible: true });
    } finally {
      setIsPurifyingQuick(false);
    }
  };

  const handleOpenReader = (story: any) => {
    const article = {
      title: story.title,
      link: story.url || story.link,
      source: story.source || story.source_name || 'Odysseus Library',
      excerpt: story.excerpt,
      content: story.content,
      imageUrl: story.image_url || story.imageUrl,
      date: 'Saved Offline',
      readTime: story.read_time || '5 min read',
    };
    setActiveStory(article);
  };

  // Filter logic
  const filteredStories = savedStories.filter((story) => {
    if (activeTab === 'imported') {
      return story.isImported || story.source?.includes('.') || story.url?.includes('medium') || story.url?.includes('substack');
    }
    if (activeTab === 'prestige') {
      return !story.isImported && !story.source?.includes('.');
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#243B26] text-[#FAF7EE] font-sans selection:bg-[#EA580C] selection:text-white relative">
      
      {/* Tactile Archival Background Dot Pattern */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-20 z-0" 
        style={{
          backgroundImage: 'radial-gradient(rgba(255, 253, 208, 0.15) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }} 
      />

      <AppHeader />
      
      <main className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-12 py-8 sm:py-12 space-y-10 relative z-10">
        
        {/* Editorial Masthead */}
        <div className="border-b border-[#FFFDD0]/15 pb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-[10px] sm:text-xs font-mono uppercase tracking-[0.2em] text-[#FFFDD0]/70 font-bold">
              <span className="text-[#EA580C]">✦</span>
              <span>THE OFFLINE SALON • {savedStories.length} STORIES CURATED</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-5xl font-bold text-[#FFFDD0] leading-tight">
              Saved Library & Pure Prose
            </h1>
            <p className="text-xs sm:text-sm text-[#FFFDD0]/80 max-w-xl font-sans leading-relaxed">
              Your personal reading sanctuary. Purified articles stripped of author bios, social widgets, popups, and web clutter.
            </p>
          </div>

          <button
            onClick={() => setIsImportModalOpen(true)}
            className="self-start md:self-auto px-6 py-3 rounded-full bg-[#EA580C] hover:bg-[#C2410C] text-white font-mono font-bold text-xs uppercase tracking-wider shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 shrink-0"
          >
            <span>✦</span>
            <span>Import Custom Article</span>
          </button>
        </div>

        {/* Quick Purify Bar */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#FAF7EE] text-[#131E15] border border-white/20 shadow-xl">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#EA580C] block">
                Pocket & Instapaper Clean Protocol
              </span>
              <h3 className="font-serif text-base font-bold text-[#131E15]">
                Purify Any Web Article In Seconds
              </h3>
              <p className="text-xs text-[#37493A]">
                Paste any link from Substack, Medium, blogs, or news to read pure text in Odysseus.
              </p>
            </div>

            <form onSubmit={handleQuickImport} className="flex-1 max-w-xl flex flex-col sm:flex-row gap-2.5">
              <input
                type="url"
                value={quickUrl}
                onChange={(e) => setQuickUrl(e.target.value)}
                placeholder="https://example.com/essay-or-article..."
                className="flex-1 bg-white border border-stone-300 focus:border-[#EA580C] rounded-xl px-4 py-2.5 text-xs text-[#131E15] placeholder:text-stone-400 focus:outline-none transition-all shadow-xs"
              />
              <button
                type="submit"
                disabled={isPurifyingQuick || !quickUrl.trim()}
                className="px-5 py-2.5 rounded-xl bg-[#EA580C] hover:bg-[#C2410C] disabled:opacity-50 text-white font-mono font-bold text-xs uppercase tracking-wider shrink-0 transition-all flex items-center justify-center gap-1.5 shadow-sm"
              >
                {isPurifyingQuick ? (
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  'Purify & Read →'
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Filter Desk Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-1.5 rounded-full text-xs font-mono font-bold uppercase tracking-wider transition-all shrink-0 ${
              activeTab === 'all'
                ? 'bg-[#EA580C] text-white shadow-md'
                : 'bg-[#182C1B] text-[#FFFDD0]/80 hover:text-[#FFFDD0] hover:bg-[#1f3723] border border-white/15'
            }`}
          >
            All Saved ({savedStories.length})
          </button>
          <button
            onClick={() => setActiveTab('imported')}
            className={`px-4 py-1.5 rounded-full text-xs font-mono font-bold uppercase tracking-wider transition-all shrink-0 ${
              activeTab === 'imported'
                ? 'bg-[#EA580C] text-white shadow-md'
                : 'bg-[#182C1B] text-[#FFFDD0]/80 hover:text-[#FFFDD0] hover:bg-[#1f3723] border border-white/15'
            }`}
          >
            ✦ Imported Web Prose
          </button>
          <button
            onClick={() => setActiveTab('prestige')}
            className={`px-4 py-1.5 rounded-full text-xs font-mono font-bold uppercase tracking-wider transition-all shrink-0 ${
              activeTab === 'prestige'
                ? 'bg-[#EA580C] text-white shadow-md'
                : 'bg-[#182C1B] text-[#FFFDD0]/80 hover:text-[#FFFDD0] hover:bg-[#1f3723] border border-white/15'
            }`}
          >
            Prestige Publications
          </button>
        </div>

        {/* Stories Content Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-28 gap-4">
            <div className="w-8 h-8 border-3 border-[#EA580C]/20 border-t-[#EA580C] rounded-full animate-spin" />
            <p className="font-mono text-xs uppercase tracking-widest text-[#FFFDD0]/70">
              Retrieving your offline library...
            </p>
          </div>
        ) : filteredStories.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-24 px-6 rounded-3xl bg-[#FAF7EE] text-[#131E15] border border-white/20 shadow-xl space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-[#EA580C]/15 text-[#EA580C] flex items-center justify-center text-2xl font-serif font-bold shadow-xs">
              ✦
            </div>
            <h3 className="font-serif text-2xl font-bold text-[#131E15]">
              Your Offline Salon Awaits
            </h3>
            <p className="text-xs sm:text-sm text-[#37493A] max-w-md mx-auto leading-relaxed">
              Bookmark stories while browsing the Odysseus broadsheet or paste any article URL to curate pure, distraction-free prose.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setIsImportModalOpen(true)}
                className="px-6 py-2.5 rounded-full bg-[#EA580C] hover:bg-[#C2410C] text-white font-mono font-bold text-xs uppercase tracking-wider transition-all shadow-md"
              >
                ✦ Import Web Article
              </button>
              <Link
                href="/feed"
                className="px-6 py-2.5 rounded-full bg-white border border-[#131E15]/20 text-[#131E15] font-mono font-bold text-xs uppercase tracking-wider hover:bg-stone-50 transition-all"
              >
                Explore Live Feed →
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence>
              {filteredStories.map((story, index) => (
                <SavedStoryCard
                  key={story.id || story.url || index}
                  story={story}
                  index={index}
                  onOpen={() => handleOpenReader(story)}
                  onRemove={(e) => handleRemove(story, e)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}

      </main>

      <Footer />

      <ImportArticleModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        userId={profile?.id}
        onReadArticle={(art) => setActiveStory(art)}
      />

      {activeStory && (
        <ReadingModal
          isOpen={!!activeStory}
          onClose={() => setActiveStory(null)}
          article={activeStory}
        />
      )}

      <Toast
        message={toast.message}
        isVisible={toast.isVisible}
        onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
      />
    </div>
  );
}
