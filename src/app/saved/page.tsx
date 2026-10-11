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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      onClick={onOpen}
      className="group relative flex flex-col bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl border border-juice-green/10 hover:border-juice-orange/40 hover:-translate-y-1.5 transition-all duration-300 cursor-pointer flex-1"
    >
      {/* Top Decorative Border Accent */}
      <div className="h-1.5 w-full bg-gradient-to-r from-juice-orange via-juice-green to-amber-500 opacity-80 group-hover:opacity-100 transition-opacity" />

      {/* Card Header: Source & Un-save Stamp */}
      <div className="p-6 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-juice-green/10 text-juice-green font-serif font-black text-xs flex items-center justify-center shadow-xs">
            {sourceInitial}
          </div>
          <div>
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-juice-green block truncate max-w-[130px]">
              {sourceName}
            </span>
            <span className="text-[9px] font-mono text-juice-green/40">
              {story.read_time || '5 min read'}
            </span>
          </div>
        </div>

        {/* Wax Seal Bookmark Button */}
        <button
          onClick={onRemove}
          className="w-8 h-8 rounded-full bg-juice-orange/10 hover:bg-red-50 text-juice-orange hover:text-red-500 flex items-center justify-center transition-all duration-200"
          title="Remove from saved stories"
          aria-label="Remove story"
        >
          <span className="text-sm font-bold">✕</span>
        </button>
      </div>

      {/* Card Title */}
      <div className="px-6 py-2">
        <h3 className="font-serif text-lg md:text-xl font-bold text-juice-green leading-snug group-hover:text-juice-orange transition-colors line-clamp-2">
          {story.title}
        </h3>
      </div>

      {/* Hero Visual: Image with Proxy Retry OR Editorial Monogram Poster */}
      <div className="px-6 py-2">
        <div className="w-full h-36 rounded-2xl overflow-hidden relative shadow-inner bg-juice-cream/50">
          {!imgFailed && imgSrc ? (
            <img
              src={imgSrc}
              alt={story.title}
              onError={handleImgError}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
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
        </div>
      </div>

      {/* Excerpt */}
      <div className="px-6 py-2 flex-grow">
        <p className="text-xs text-juice-green/75 leading-relaxed line-clamp-3 font-medium">
          {story.excerpt || 'Pure prose archived for focused offline reading.'}
        </p>
      </div>

      {/* Card Footer: Zen Chamber Button & Original Link */}
      <div className="p-6 pt-4 mt-auto border-t border-juice-green/10 flex items-center justify-between text-xs font-mono">
        <span className="font-bold text-juice-orange flex items-center gap-1 group-hover:underline">
          <span>Read In Chamber</span>
          <span>→</span>
        </span>

        {story.url && (
          <a
            href={story.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-[10px] text-juice-green/40 hover:text-juice-green transition-colors uppercase tracking-wider"
            title="Open original website"
          >
            Source ↗
          </a>
        )}
      </div>
    </motion.div>
  );
};

export default function SavedPage() {
  const { profile } = useProfile();
  const { savedStories, loading, removeSavedStory, refetch } = useSavedStories(profile?.id);
  const [toast, setToast] = useState({ message: '', isVisible: false });
  const [headerTheme, setHeaderTheme] = useState<'light' | 'dark' | 'orange'>('light');
  const [activeStory, setActiveStory] = useState<any | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [quickUrl, setQuickUrl] = useState('');
  const [isPurifyingQuick, setIsPurifyingQuick] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'imported' | 'prestige'>('all');

  const handleRemove = async (story: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await removeSavedStory(story);
      setToast({ message: 'Story removed from your offline salon', isVisible: true });
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

        // Open in reader
        setActiveStory(article);
        setQuickUrl('');

        // Also save to library
        if (profile?.id) {
          await fetch('/api/read-later', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: profile.id,
              url: article.link,
              title: article.title,
              excerpt: article.excerpt,
              source_name: article.source,
              content: article.content,
            }),
          });
          refetch();
        }
      } else {
        setToast({ message: data.error || 'Could not extract clean prose. Try another URL.', isVisible: true });
      }
    } catch {
      setToast({ message: 'Extraction timed out. Try again or open via standard link.', isVisible: true });
    } finally {
      setIsPurifyingQuick(false);
    }
  };

  // Support incoming deep-links from Odyssey Chromium extension
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlToImport = params.get('importUrl');
      if (urlToImport) {
        setQuickUrl(urlToImport);
        const autoPurifyIncoming = async () => {
          setIsPurifyingQuick(true);
          try {
            const res = await fetch(`/api/read-mode?url=${encodeURIComponent(urlToImport)}&t=${Date.now()}`);
            const data = await res.json();
            if (data.success && data.article?.content) {
              const article = {
                title: data.article.title || 'Imported Story',
                content: data.article.content,
                excerpt: data.article.textContent?.slice(0, 240) + '...',
                link: urlToImport,
                source: data.article.siteName || new URL(urlToImport).hostname.replace('www.', ''),
                readTime: data.article.readTime || `${Math.ceil((data.article.wordCount || 500) / 220)} min read`,
                date: 'Imported via Odyssey Companion',
                wordCount: data.article.wordCount,
                isImported: true,
              };
              setActiveStory(article);
              setToast({ message: '✦ Story purified via Odyssey Companion!', isVisible: true });
            }
          } catch {
            // ignore
          } finally {
            setIsPurifyingQuick(false);
          }
        };
        autoPurifyIncoming();
      }
    }
  }, []);

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

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    const viewportHeight = e.currentTarget.clientHeight;
    const sectionIndex = Math.round(scrollTop / viewportHeight);
    setHeaderTheme(sectionIndex === 0 ? 'light' : 'dark');
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
    <div 
      onScroll={handleScroll}
      data-lenis-prevent
      className="h-screen w-full overflow-y-scroll snap-y snap-mandatory scroll-smooth bg-juice-cream text-juice-green font-sans selection:bg-juice-orange selection:text-juice-cream"
    >
      <div className="fixed top-0 left-0 right-0 z-50">
        <AppHeader theme={headerTheme} />
      </div>
      
      {/* Saved Stories Section */}
      <section className="min-h-screen snap-start pt-20 md:pt-24 pb-16 px-4 md:px-8 lg:px-12 max-w-[1440px] mx-auto flex flex-col">
        
        {/* Editorial Dateline & Masthead */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 md:mb-10 border-b border-juice-green/15 pb-6"
        >
          <div className="flex items-center justify-between text-[10px] md:text-xs font-mono uppercase tracking-[0.2em] text-juice-green/60 mb-3">
            <span className="font-bold text-juice-orange">THE OFFLINE SALON • VOL. IV</span>
            <span>{savedStories.length} {savedStories.length === 1 ? 'STORY' : 'STORIES'} CURATED</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl font-bold text-juice-green leading-tight">
                Saved Stories & Pure Prose
              </h1>
              <p className="text-xs sm:text-sm text-juice-green/70 mt-2 max-w-xl font-sans leading-relaxed">
                Your personal reading sanctuary. Purified essays stripped of author bios, social follow cards, newsletters, and web clutter.
              </p>
            </div>

            <button
              onClick={() => setIsImportModalOpen(true)}
              className="self-start md:self-auto px-5 py-3 rounded-2xl bg-juice-orange hover:bg-orange-600 text-white font-bold text-xs uppercase tracking-wider shadow-md hover:scale-105 active:scale-95 transition-all flex items-center gap-2 shrink-0"
            >
              <span className="text-base leading-none">✦</span>
              <span>Import Any Article</span>
            </button>
          </div>
        </motion.div>

        {/* Pocket / Instapaper Custom Article Quick Bar */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 p-4 md:p-6 rounded-3xl bg-white border border-juice-green/15 shadow-sm"
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-juice-orange block">
                Pocket & Instapaper Clean Reader Protocol
              </span>
              <h3 className="font-serif text-base md:text-lg font-bold text-juice-green">
                Purify Any Web Article In Seconds
              </h3>
              <p className="text-xs text-juice-green/70">
                Paste any link from Substack, Medium, blogs, or news sites to read pure text in Odysseus.
              </p>
            </div>

            <form onSubmit={handleQuickImport} className="flex-1 max-w-xl flex items-center gap-2">
              <input
                type="url"
                value={quickUrl}
                onChange={(e) => setQuickUrl(e.target.value)}
                placeholder="https://example.com/essay-or-article..."
                className="w-full bg-juice-cream/60 border border-juice-green/20 focus:border-juice-orange rounded-xl px-4 py-2.5 text-xs text-juice-green placeholder:text-juice-green/30 focus:outline-none transition-all"
              />
              <button
                type="submit"
                disabled={isPurifyingQuick || !quickUrl.trim()}
                className="px-5 py-2.5 rounded-xl bg-juice-green hover:bg-[#4b6a38] disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider shrink-0 shadow-xs transition-all flex items-center gap-1.5"
              >
                {isPurifyingQuick ? (
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  'Purify & Read'
                )}
              </button>
            </form>
          </div>
        </motion.div>

        {/* Filter Desk Pills */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-1.5 rounded-full text-xs font-mono font-bold uppercase tracking-wider transition-all ${
              activeTab === 'all'
                ? 'bg-juice-green text-juice-cream shadow-xs'
                : 'bg-white/70 text-juice-green/60 hover:text-juice-green hover:bg-white border border-juice-green/10'
            }`}
          >
            All Saved ({savedStories.length})
          </button>
          <button
            onClick={() => setActiveTab('imported')}
            className={`px-4 py-1.5 rounded-full text-xs font-mono font-bold uppercase tracking-wider transition-all ${
              activeTab === 'imported'
                ? 'bg-juice-orange text-white shadow-xs'
                : 'bg-white/70 text-juice-green/60 hover:text-juice-orange hover:bg-white border border-juice-green/10'
            }`}
          >
            ✦ Imported Web Prose
          </button>
          <button
            onClick={() => setActiveTab('prestige')}
            className={`px-4 py-1.5 rounded-full text-xs font-mono font-bold uppercase tracking-wider transition-all ${
              activeTab === 'prestige'
                ? 'bg-juice-green text-juice-cream shadow-xs'
                : 'bg-white/70 text-juice-green/60 hover:text-juice-green hover:bg-white border border-juice-green/10'
            }`}
          >
            Prestige Publications
          </button>
        </div>

        {/* Stories Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-28 gap-4 flex-grow">
            <div className="w-10 h-10 border-3 border-juice-orange/20 border-t-juice-orange rounded-full animate-spin" />
            <p className="font-mono text-xs uppercase tracking-widest text-juice-green/60">
              Retrieving your offline salon...
            </p>
          </div>
        ) : filteredStories.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center flex-grow text-center py-20 px-6 rounded-3xl bg-white/60 border border-dashed border-juice-green/20"
          >
            <div className="w-16 h-16 rounded-full bg-juice-orange/10 flex items-center justify-center text-juice-orange text-2xl font-serif font-bold mb-4 shadow-inner">
              ✦
            </div>
            <h3 className="font-serif text-2xl font-bold text-juice-green mb-2">
              Your Offline Salon Awaits
            </h3>
            <p className="text-xs sm:text-sm text-juice-green/70 max-w-md mb-6 leading-relaxed">
              Bookmark stories while browsing the Odysseus feed or paste any web URL to curate pure, distraction-free prose.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => setIsImportModalOpen(true)}
                className="px-6 py-3 rounded-2xl bg-juice-orange text-white font-bold text-xs uppercase tracking-wider hover:bg-orange-600 transition-all shadow-md"
              >
                ✦ Import Custom Web Article
              </button>
              <Link
                href="/feed"
                className="px-6 py-3 rounded-2xl bg-juice-green text-juice-cream font-bold text-xs uppercase tracking-wider hover:bg-[#4b6a38] transition-all shadow-sm"
              >
                Explore Live Feed →
              </Link>
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
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
      </section>
      
      {/* Footer Section */}
      <section className="snap-start shrink-0">
        <Footer />
      </section>

      {/* Zen Chamber Reading Modal */}
      <ReadingModal
        isOpen={!!activeStory}
        onClose={() => setActiveStory(null)}
        article={activeStory}
      />

      {/* Import Article Modal */}
      <ImportArticleModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        userId={profile?.id}
        onReadArticle={(art) => {
          setActiveStory(art);
          setIsImportModalOpen(false);
        }}
        onSavedSuccess={() => {
          refetch();
          setToast({ message: 'Story purified and added to your salon!', isVisible: true });
        }}
      />

      <Toast 
        message={toast.message} 
        isVisible={toast.isVisible} 
        onClose={() => setToast(prev => ({ ...prev, isVisible: false }))} 
      />
    </div>
  );
}
