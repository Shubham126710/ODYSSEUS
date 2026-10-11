"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useFeedFetcher } from "@/hooks/useFeedFetcher";
import { useProfile } from "@/hooks/useProfile";
import { useSavedStories } from "@/hooks/useSavedStories";
import { FeedLoadingScreen } from "@/components/FeedLoadingScreen";
import { StoryCard } from "@/components/StoryCard";
import { AppHeader } from "@/components/AppHeader";
import { Footer } from "@/components/Footer";
import { Toast } from "@/components/Toast";
import { ReadingModal } from "@/components/ReadingModal";
import { AddFeedModal } from "@/components/AddFeedModal";
import { EditorialMonogramPoster } from "@/components/EditorialMonogramPoster";
import { StaticOrangeCompass } from "@/components/StaticOrangeCompass";
import { decodeHtmlEntities } from "@/lib/textUtils";
import { getExplorerRank, getCurrentMultiplier } from "@/lib/gamification";
import { CompassScrollWheel } from "@/components/CompassScrollWheel";
import { motion, AnimatePresence } from "framer-motion";
import Link from 'next/link';

export default function FeedPage() {
  const { profile } = useProfile();
  const { stories, loading: loadingFeeds, error, refetch } = useFeedFetcher(profile?.id);
  const { isSaved, addSavedStory, removeSavedStory } = useSavedStories(profile?.id);
  
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [readingArticle, setReadingArticle] = useState<any | null>(null);
  const [isAddFeedOpen, setIsAddFeedOpen] = useState(false);
  const [toast, setToast] = useState({ message: '', isVisible: false });
  const [featuredImageFailed, setFeaturedImageFailed] = useState(false);
  const [triedFeaturedProxy, setTriedFeaturedProxy] = useState(false);

  // Derived rank and multiplier
  const rank = getExplorerRank(profile?.total_reading_minutes || 0, profile?.streak_count || 1);
  const multiplier = getCurrentMultiplier();

  // Date and edition
  const todayFormatted = useMemo(() => {
    try {
      return new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      }).format(new Date()).toUpperCase();
    } catch {
      return 'SUNDAY EDITION';
    }
  }, []);

  // Unique sources
  const uniqueSources = useMemo(() => {
    return Array.from(new Set(stories.map(s => s.source))).filter(Boolean);
  }, [stories]);

  // Filtered stories
  const filteredStories = useMemo(() => {
    if (selectedSources.length === 0) return stories;
    return stories.filter(s => selectedSources.includes(s.source));
  }, [stories, selectedSources]);

  // Lead featured story (first story with image or simply first story)
  const featuredStory = useMemo(() => {
    if (filteredStories.length === 0) return null;
    return filteredStories.find(s => s.imageUrl && s.imageUrl.length > 5) || filteredStories[0];
  }, [filteredStories]);

  // Other stories (excluding the featured one)
  const otherStories = useMemo(() => {
    if (!featuredStory) return filteredStories;
    return filteredStories.filter(s => s.id !== featuredStory.id);
  }, [filteredStories, featuredStory]);

  const toggleSource = (source: string) => {
    setSelectedSources(prev => 
      prev.includes(source) 
        ? prev.filter(s => s !== source) 
        : [...prev, source]
    );
  };

  const handleToggleSave = async (story: any) => {
    if (!profile) return;
    try {
      if (isSaved(story)) {
        await removeSavedStory(story);
        setToast({ message: 'Removed from your library', isVisible: true });
      } else {
        await addSavedStory(story);
        setToast({ message: 'Saved to your library ✦', isVisible: true });
      }
    } catch {
      setToast({ message: 'Could not update library', isVisible: true });
    }
  };

  const handleShare = async (story: any) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: story.title,
          text: story.excerpt,
          url: story.link,
        });
      } catch {
        // user cancelled
      }
    } else {
      try {
        await navigator.clipboard.writeText(story.link);
        setToast({ message: 'Article link copied to clipboard', isVisible: true });
      } catch {
        setToast({ message: 'Could not copy link', isVisible: true });
      }
    }
  };

  if (loadingFeeds && stories.length === 0) {
    return <FeedLoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-stone-900 font-sans selection:bg-[#EA580C] selection:text-white">
      
      {/* Sticky Masthead Navigation */}
      <AppHeader />

      {/* Navigational Compass Scroll Wheel (Graduated horizontal markers on right side) */}
      <CompassScrollWheel />

      {/* Main Continuous Editorial Broadsheet */}
      <main className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-12 py-8 sm:py-12 space-y-12 sm:space-y-16">
        
        {/* SECTION 1: EDITORIAL WELCOME & MASTHEAD DISPATCH */}
        <section id="hub-dispatch" className="border-b border-stone-200/80 pb-10 sm:pb-12 space-y-6">
          
          {/* Top Folio Dateline */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-[10px] sm:text-xs font-mono uppercase tracking-[0.2em] text-stone-500 border-b border-stone-200/60 pb-3">
            <div className="flex items-center gap-2">
              <span className="font-bold text-stone-900">THE ODYSSEUS JOURNAL</span>
              <span>•</span>
              <span>VOL. IV — NO. 108</span>
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:inline">{todayFormatted}</span>
            </div>
            
            <div className="flex items-center gap-2 text-stone-400">
              <span className="font-bold text-[#EA580C]">{rank.title}</span>
              <span>•</span>
              <span className="font-bold text-stone-700">{profile?.streak_count || 1}D STREAK</span>
            </div>
          </div>

          {/* Hero Welcome Headline */}
          <div className="max-w-4xl space-y-3">
            <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-stone-900 leading-[1.08]">
              <span className="font-normal italic">Welcome back, </span>
              <span className="text-[#EA580C] font-semibold">{profile?.first_name || 'Traveler'}</span>
              <span>.</span>
            </h1>
            <p className="text-sm sm:text-base text-stone-600 font-sans leading-relaxed max-w-2xl">
              Curated slow journalism from the world&apos;s most respected publications. Pure stories, zero clutter.
            </p>
          </div>

          {/* Understated Live Trending Ribbon */}
          {stories.length > 0 && (
            <div className="bg-white border border-stone-200/80 rounded-2xl p-2.5 sm:p-3 flex items-center gap-3 shadow-xs overflow-hidden">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EA580C]/10 text-[#EA580C] font-mono text-[10px] sm:text-xs font-bold uppercase tracking-wider shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-[#EA580C] animate-pulse" />
                <span>Trending Wire</span>
              </div>
              <div className="flex-1 overflow-hidden relative">
                <div className="flex items-center gap-8 animate-marquee whitespace-nowrap text-xs font-mono text-stone-700">
                  {stories.slice(0, 10).map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => setReadingArticle(s)}
                      className="hover:text-[#EA580C] hover:underline transition-colors cursor-pointer truncate max-w-md text-left"
                    >
                      <span className="font-bold text-stone-400 mr-2">[{s.source}]</span>
                      <span>{decodeHtmlEntities(s.title)}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* SECTION 2: THE LEAD COVER STORY */}
        {featuredStory && (
          <section id="hub-lead" className="bg-white border border-stone-200/90 rounded-3xl p-6 sm:p-10 shadow-xs hover:shadow-md transition-shadow">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              
              {/* Left Column: Headline & Editorial Prose */}
              <div className="lg:col-span-7 space-y-4 sm:space-y-6">
                <div className="flex items-center gap-2.5 text-[10px] sm:text-xs font-mono uppercase tracking-[0.2em]">
                  <span className="px-2.5 py-1 rounded-full bg-stone-100 text-stone-800 font-bold">
                    {featuredStory.category}
                  </span>
                  <span className="text-stone-400">•</span>
                  <span className="font-bold text-[#EA580C]">{featuredStory.source}</span>
                  <span className="text-stone-400">•</span>
                  <span className="text-stone-400">{featuredStory.readTime}</span>
                </div>

                <div 
                  onClick={() => setReadingArticle(featuredStory)}
                  className="cursor-pointer group block"
                >
                  <h2 className="font-serif text-2xl sm:text-4xl lg:text-5xl font-bold text-stone-900 group-hover:text-[#EA580C] transition-colors leading-[1.12]">
                    {decodeHtmlEntities(featuredStory.title)}
                  </h2>
                </div>

                <p className="text-sm sm:text-base text-stone-600 leading-relaxed font-sans line-clamp-3 sm:line-clamp-4">
                  {decodeHtmlEntities(featuredStory.excerpt)}
                </p>

                {/* Perspective Links */}
                {featuredStory.relatedPerspectives && featuredStory.relatedPerspectives.length > 0 && (
                  <div className="pt-2">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-stone-400 block mb-2 font-bold">
                      Alternative Viewpoints ({featuredStory.relatedPerspectives.length})
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {featuredStory.relatedPerspectives.map((p: any, i: number) => (
                        <button
                          key={i}
                          onClick={() => setReadingArticle({
                            title: p.title,
                            link: p.link,
                            source: p.source,
                            excerpt: '',
                            date: 'Related Perspective',
                            readTime: '3 min'
                          })}
                          className="text-xs px-3 py-1.5 rounded-xl bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-700 flex items-center gap-1.5 transition-colors"
                        >
                          <span className="font-bold text-amber-700">{p.source}:</span>
                          <span className="truncate max-w-[180px] sm:max-w-[240px]">{decodeHtmlEntities(p.title)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-3 flex items-center gap-4">
                  <button
                    onClick={() => setReadingArticle(featuredStory)}
                    className="px-6 sm:px-8 py-3 rounded-full bg-stone-900 hover:bg-stone-800 text-white font-mono font-bold text-xs uppercase tracking-wider shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
                  >
                    <span>Read Cover Story</span>
                    <span className="text-sm">→</span>
                  </button>

                  <button
                    onClick={() => handleToggleSave(featuredStory)}
                    className={`p-3 rounded-full border transition-all ${
                      isSaved(featuredStory)
                        ? 'bg-amber-50 border-amber-300 text-amber-700'
                        : 'border-stone-200 text-stone-400 hover:text-stone-700 hover:bg-stone-50'
                    }`}
                    title={isSaved(featuredStory) ? "Saved" : "Save for later"}
                  >
                    <svg className="w-4 h-4" fill={isSaved(featuredStory) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Right Column: Hero Visual Frame */}
              <div 
                onClick={() => setReadingArticle(featuredStory)}
                className="lg:col-span-5 aspect-[4/3] sm:aspect-[16/10] lg:aspect-[4/3] rounded-2xl sm:rounded-3xl overflow-hidden relative shadow-lg cursor-pointer group bg-stone-100 border border-stone-200/80"
              >
                {!featuredImageFailed && featuredStory.imageUrl ? (
                  <img
                    src={triedFeaturedProxy 
                      ? `/api/image-proxy?url=${encodeURIComponent(featuredStory.imageUrl)}`
                      : featuredStory.imageUrl}
                    alt={featuredStory.title}
                    onError={() => {
                      if (!triedFeaturedProxy && featuredStory.imageUrl) {
                        setTriedFeaturedProxy(true);
                      } else {
                        setFeaturedImageFailed(true);
                      }
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                ) : (
                  <EditorialMonogramPoster
                    source={featuredStory.source}
                    category={featuredStory.category}
                    title={featuredStory.title}
                    className="w-full h-full"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60 pointer-events-none" />
              </div>

            </div>
          </section>
        )}

        {/* SECTION 3: THE 5 CURATED PRESTIGE DESKS */}
        <section id="hub-desks" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-stone-200/80 pb-4">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#EA580C] font-bold block mb-1">
                EDITORIAL DESKS • 5 THEMATIC TERRITORIES
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
                Curated Genre Desks
              </h2>
            </div>
            <p className="text-xs text-stone-500 font-sans max-w-md">
              Immerse yourself by discipline. Authoritative reporting gathered from premier publications.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              {
                id: 'tech',
                glyph: '✦',
                desk: 'The Vanguard',
                category: 'Tech & AI',
                desc: 'Frontier models, cybernetics, and compute.',
                sources: 'Wired • Verge • MIT',
              },
              {
                id: 'design',
                glyph: '◈',
                desk: 'The Atelier',
                category: 'Design & Craft',
                desc: 'Spatial craft, typography, and visual culture.',
                sources: 'Dezeen • Eye • UX',
              },
              {
                id: 'culture',
                glyph: '◆',
                desk: 'The Forum',
                category: 'Culture & Essays',
                desc: 'Philosophy, longform criticism, and society.',
                sources: 'The Atlantic • Aeon',
              },
              {
                id: 'chronicle',
                glyph: '—',
                desk: 'The Chronicle',
                category: 'Global Affairs',
                desc: 'Geopolitics, macro markets, and chronicles.',
                sources: 'NY Times • Bloomberg',
              },
              {
                id: 'science',
                glyph: '❖',
                desk: 'The Observatory',
                category: 'Science & Cosmos',
                desc: 'Astrophysics, biology, and quantum physics.',
                sources: 'Quanta • Nature',
              },
            ].map((desk) => (
              <Link
                key={desk.id}
                href={`/feed/${desk.id}`}
                className="group p-5 rounded-2xl bg-white border border-stone-200/90 hover:border-stone-400 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-[#EA580C] font-mono">
                      {desk.glyph}
                    </span>
                    <span className="text-xs font-mono font-bold text-stone-400 group-hover:text-stone-900 group-hover:translate-x-0.5 transition-all">
                      →
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-stone-400 block mb-1">
                      {desk.desk}
                    </span>
                    <h3 className="font-serif text-lg font-bold text-stone-900 group-hover:text-[#EA580C] transition-colors">
                      {desk.category}
                    </h3>
                  </div>

                  <p className="text-xs text-stone-600 leading-relaxed font-sans line-clamp-2">
                    {desk.desc}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-stone-100 text-[10px] font-mono text-stone-400 truncate">
                  {desk.sources}
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* SECTION 4: THE LIVE SALON COLLECTION */}
        <section id="hub-salon" className="space-y-6 pt-4">
          
          {/* Header & Source Filter Chips */}
          <div className="space-y-4 border-b border-stone-200/80 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#EA580C] font-bold block mb-1">
                  REAL-TIME DISPATCHES • {otherStories.length} STORIES
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
                  The Salon Collection
                </h2>
              </div>
              <p className="text-xs text-stone-500 font-sans">
                Filter by publication or browse the complete chronicle.
              </p>
            </div>

            {/* Source Filter Chips */}
            {uniqueSources.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                <button
                  onClick={() => setSelectedSources([])}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-bold uppercase tracking-wider transition-all shrink-0 whitespace-nowrap ${
                    selectedSources.length === 0
                      ? 'bg-stone-900 text-white shadow-xs'
                      : 'bg-white text-stone-600 hover:text-stone-900 border border-stone-200 hover:border-stone-400'
                  }`}
                >
                  All Publications ({stories.length})
                </button>
                {uniqueSources.map((source) => {
                  const isSelected = selectedSources.includes(source);
                  return (
                    <button
                      key={source}
                      onClick={() => toggleSource(source)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-bold uppercase tracking-wider transition-all shrink-0 whitespace-nowrap ${
                        isSelected
                          ? 'bg-[#EA580C] text-white shadow-xs'
                          : 'bg-white text-stone-600 hover:text-stone-900 border border-stone-200 hover:border-stone-400'
                      }`}
                    >
                      {source}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Cards Grid */}
          {otherStories.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {otherStories.map((story) => (
                <div 
                  key={story.id} 
                  onClick={() => setReadingArticle(story)}
                  className="cursor-pointer"
                >
                  <StoryCard
                    {...story}
                    isSaved={isSaved(story)}
                    onToggleSave={() => handleToggleSave(story)}
                    onShare={() => handleShare(story)}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-3xl border border-stone-200 p-8 space-y-4">
              <span className="text-2xl text-[#EA580C] font-mono">✦</span>
              <h3 className="font-serif text-xl font-bold text-stone-900">
                {stories.length === 0 ? "Your feed is currently empty" : "No stories match this filter"}
              </h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                {stories.length === 0
                  ? "Connect custom RSS feeds or select topics to begin your voyage."
                  : "Try clearing selected publications to view all stories."}
              </p>
              {selectedSources.length > 0 && (
                <button
                  onClick={() => setSelectedSources([])}
                  className="px-5 py-2 rounded-full bg-stone-900 text-white font-mono text-xs uppercase tracking-wider"
                >
                  Reset Filters
                </button>
              )}
            </div>
          )}
        </section>

      </main>

      {/* Classical Masthead Footer */}
      <Footer />

      {/* Add Feed Modal */}
      <AddFeedModal
        isOpen={isAddFeedOpen}
        onClose={() => setIsAddFeedOpen(false)}
        userId={profile?.id}
        onFeedAdded={refetch}
      />

      {/* Reading Chamber Modal */}
      {readingArticle && (
        <ReadingModal
          isOpen={!!readingArticle}
          onClose={() => setReadingArticle(null)}
          article={readingArticle}
          onSave={handleToggleSave}
        />
      )}

      {/* Toast Notification */}
      <Toast
        message={toast.message}
        isVisible={toast.isVisible}
        onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
      />
    </div>
  );
}
