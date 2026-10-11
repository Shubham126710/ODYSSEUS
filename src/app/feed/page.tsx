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
  const [headlines, setHeadlines] = useState<any[]>([]);

  // Fetch true breaking trending headlines from /api/rss?mode=trending
  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const res = await fetch('/api/rss?mode=trending');
        const data = await res.json();
        if (data.success && data.headlines && data.headlines.length > 0) {
          setHeadlines(data.headlines);
        }
      } catch (e) {
        console.error('Failed to fetch trending headlines', e);
      }
    };
    fetchTrending();
  }, []);

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

  // Curated Main Stories for The Salon Collection (clean, focused, uncluttered)
  const displayedStories = useMemo(() => {
    return otherStories.slice(0, 16);
  }, [otherStories]);

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
    <div className="min-h-screen bg-[#5D8246] text-[#FFFDD0] font-sans selection:bg-[#EA580C] selection:text-white relative">
      
      {/* Tactile Archival Background Dot Pattern */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-20 z-0" 
        style={{
          backgroundImage: 'radial-gradient(rgba(255, 253, 208, 0.15) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }} 
      />

      {/* Sticky Masthead Navigation */}
      <AppHeader />

      {/* Navigational Compass Scroll Wheel (Graduated horizontal markers on right side) */}
      <CompassScrollWheel />

      {/* Main Continuous Editorial Broadsheet */}
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 xl:pr-24 2xl:pr-28 py-8 sm:py-12 space-y-12 sm:space-y-16 relative z-10">
        
        {/* SECTION 1: EDITORIAL WELCOME & MASTHEAD DISPATCH */}
        <section id="hub-dispatch" className="border-b border-[#FFFDD0]/15 pb-10 sm:pb-12 space-y-6">
          
          {/* Top Folio Dateline */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-[10px] sm:text-xs font-mono uppercase tracking-[0.25em] text-[#FFFDD0]/70 border-b border-[#FFFDD0]/15 pb-4">
            <div className="flex items-center gap-2.5">
              <span className="font-bold text-[#FFFDD0] tracking-widest">THE ODYSSEUS JOURNAL</span>
              <span className="text-[#EA580C]">•</span>
              <span className="text-[#EA580C] font-bold">VOL. IV — NO. 108</span>
              <span className="hidden sm:inline text-white/30">•</span>
              <span className="hidden sm:inline text-[#FFFDD0]/60">{todayFormatted}</span>
            </div>
            
            <div className="flex items-center gap-2.5">
              <span className="font-bold text-[#EA580C] bg-[#EA580C]/15 border border-[#EA580C]/30 px-3 py-1 rounded-full text-[10px]">{rank.title}</span>
              <span className="text-white/30">•</span>
              <span className="font-bold text-[#FFFDD0] tracking-wider">{profile?.streak_count || 1}D STREAK</span>
            </div>
          </div>

          {/* Hero Welcome Headline */}
          <div className="max-w-4xl space-y-3 pt-2">
            <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#FFFDD0] leading-[1.12]">
              Welcome back, <span className="text-[#FF7A59] font-normal italic font-serif">{profile?.first_name || 'Traveler'}</span>.
            </h1>
            <p className="text-sm sm:text-base text-[#FFFDD0]/80 font-serif italic max-w-2xl leading-relaxed">
              Curated slow journalism from the world&apos;s most respected publications. Pure stories, zero clutter.
            </p>
          </div>

          {/* Signature Hermès Orange Trending Wire Marquee Ribbon */}
          <div 
            style={{ backgroundColor: '#EA580C' }}
            className="w-full h-12 sm:h-14 rounded-2xl flex items-center shadow-xl overflow-hidden border border-white/25 relative z-20"
          >
            {/* Static Trending Badge Section */}
            <div 
              style={{ backgroundColor: '#EA580C' }}
              className="h-full flex items-center pl-4 sm:pl-6 pr-4 sm:pr-6 z-20 relative shrink-0 border-r border-white/25"
            >
              <div 
                style={{ backgroundColor: '#FFFDD0', color: '#EA580C' }}
                className="px-3 sm:px-4 py-1 sm:py-1.5 rounded-full font-mono font-black text-[10px] sm:text-xs uppercase tracking-widest flex items-center gap-2 shadow-sm"
              >
                <span className="w-2 h-2 rounded-full bg-[#EA580C] animate-pulse" />
                <span>Trending</span>
              </div>
            </div>

            {/* Scrolling Headline Marquee Section */}
            <div className="flex-1 overflow-hidden relative h-full flex items-center">
              <div className="absolute left-0 top-0 bottom-0 w-8 sm:w-16 bg-gradient-to-r from-[#EA580C] to-transparent z-10 pointer-events-none" />
              <div className="absolute right-0 top-0 bottom-0 w-8 sm:w-16 bg-gradient-to-l from-[#EA580C] to-transparent z-10 pointer-events-none" />

              <div className="flex items-center gap-8 sm:gap-14 pl-6 animate-marquee whitespace-nowrap">
                {(headlines.length > 0 
                  ? [...headlines, ...headlines] 
                  : [...stories.slice(0, 10), ...stories.slice(0, 10)]
                ).map((item, idx) => {
                  const title = item.title;
                  const source = item.source ? item.source.split('>')[0].trim() : 'Wire';
                  const link = item.link;
                  return (
                    <button
                      key={idx}
                      onClick={() => setReadingArticle({
                        title,
                        link,
                        source,
                        excerpt: item.excerpt || '',
                        date: 'Trending Wire',
                        readTime: item.readTime || '3 min',
                      })}
                      className="group flex items-center gap-2.5 text-xs sm:text-sm font-serif font-bold text-white hover:text-[#FFFDD0] transition-colors cursor-pointer"
                    >
                      <span className="font-mono text-[10px] sm:text-xs tracking-wider uppercase text-[#FFFDD0]/85 group-hover:text-white shrink-0">
                        [{source}]
                      </span>
                      <span className="group-hover:underline underline-offset-4 decoration-white/70 whitespace-nowrap">
                        {decodeHtmlEntities(title)}
                      </span>
                      <span className="mx-4 text-white/40 select-none">•</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: THE LEAD COVER STORY (All-Green Typography Focus) */}
        {featuredStory && (
          <section 
            id="hub-lead" 
            className="bg-white/5 text-[#FFFDD0] border border-[#FFFDD0]/25 rounded-3xl p-6 sm:p-8 lg:p-12 shadow-2xl hover:border-[#EA580C]/60 transition-all backdrop-blur-xs"
          >
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-10 lg:gap-12 items-center">
              
              {/* Left Column: Headline & Editorial Prose */}
              <div className="md:col-span-7 space-y-4 sm:space-y-6">
                <div className="flex items-center gap-3 text-[10px] sm:text-xs font-mono uppercase tracking-[0.2em]">
                  <span className="px-3 py-1 rounded-full bg-[#EA580C]/20 border border-[#EA580C]/40 text-[#EA580C] font-bold text-[10px] tracking-widest shadow-xs">
                    {featuredStory.category}
                  </span>
                  <span className="text-[#FFFDD0]/40">•</span>
                  <span className="font-bold text-[#EA580C] tracking-wider">{featuredStory.source}</span>
                  <span className="text-[#FFFDD0]/40">•</span>
                  <span className="text-[#FFFDD0]/70 font-semibold">{featuredStory.readTime}</span>
                </div>

                <div 
                  onClick={() => setReadingArticle(featuredStory)}
                  className="cursor-pointer group block"
                >
                  <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-[#FFFDD0] group-hover:text-[#FF7A59] transition-colors leading-[1.08] tracking-tight">
                    {decodeHtmlEntities(featuredStory.title)}
                  </h2>
                </div>

                <p className="text-base sm:text-lg text-[#FFFDD0]/80 font-serif italic leading-relaxed line-clamp-3 sm:line-clamp-4 border-l-2 border-[#EA580C] pl-4">
                  {decodeHtmlEntities(featuredStory.excerpt)}
                </p>

                {/* Perspective Links */}
                {featuredStory.relatedPerspectives && featuredStory.relatedPerspectives.length > 0 && (
                  <div className="pt-1">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[#FFFDD0]/70 block mb-2 font-bold">
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
                          className="text-xs px-3 py-1.5 rounded-xl bg-[#243B26] hover:bg-[#2c482f] border border-[#FFFDD0]/15 text-[#FFFDD0] flex items-center gap-1.5 transition-colors shadow-xs"
                        >
                          <span className="font-bold text-[#EA580C] font-mono text-[11px]">{p.source}:</span>
                          <span className="truncate max-w-[180px] sm:max-w-[240px] text-[#FFFDD0]/85">{decodeHtmlEntities(p.title)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-2 flex items-center gap-4">
                  <button
                    onClick={() => setReadingArticle(featuredStory)}
                    className="px-8 py-3.5 rounded-full bg-[#EA580C] hover:bg-[#C2410C] text-white font-mono font-bold text-xs uppercase tracking-wider shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                  >
                    <span>Read Cover Story</span>
                    <span className="text-sm">→</span>
                  </button>

                  <button
                    onClick={() => handleToggleSave(featuredStory)}
                    className={`p-3.5 rounded-full border transition-all ${
                      isSaved(featuredStory)
                        ? 'bg-[#EA580C]/20 border-[#EA580C] text-[#EA580C]'
                        : 'border-[#FFFDD0]/20 text-[#FFFDD0]/80 hover:text-[#EA580C] hover:border-[#EA580C] hover:bg-white/5'
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
                className="md:col-span-5 aspect-[4/3] sm:aspect-[16/10] md:aspect-[4/3] rounded-2xl sm:rounded-3xl overflow-hidden relative shadow-2xl cursor-pointer group bg-[#162919] border border-[#FFFDD0]/15"
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
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60 pointer-events-none" />
              </div>

            </div>
          </section>
        )}

        {/* SECTION 3: THE 5 CURATED PRESTIGE DESKS */}
        <section id="hub-desks" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-[#FFFDD0]/15 pb-4">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#EA580C] font-bold block mb-1">
                EDITORIAL DESKS • 5 THEMATIC TERRITORIES
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#FFFDD0]">
                Curated Genre Desks
              </h2>
            </div>
            <p className="text-xs text-[#FFFDD0]/75 font-sans max-w-md">
              Immerse yourself by discipline. Authoritative reporting gathered from premier publications.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              {
                id: 'tech',
                numeral: 'I',
                glyph: '✦',
                desk: 'The Vanguard',
                category: 'Tech & AI',
                desc: 'Frontier intelligence, cybernetics, and synthetic compute.',
                sources: 'Wired • Verge • MIT',
              },
              {
                id: 'design',
                numeral: 'II',
                glyph: '◈',
                desk: 'The Atelier',
                category: 'Design & Craft',
                desc: 'Spatial craft, typography, and visual culture.',
                sources: 'Dezeen • Eye • UX',
              },
              {
                id: 'culture',
                numeral: 'III',
                glyph: '◆',
                desk: 'The Forum',
                category: 'Culture & Ideas',
                desc: 'Philosophy, longform criticism, and society.',
                sources: 'The Atlantic • Aeon',
              },
              {
                id: 'chronicle',
                numeral: 'IV',
                glyph: '—',
                desk: 'The Chronicle',
                category: 'Global Affairs',
                desc: 'Geopolitics, macro markets, and chronicles.',
                sources: 'NY Times • Bloomberg',
              },
              {
                id: 'science',
                numeral: 'V',
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
                className={`group p-5 sm:p-6 rounded-2xl bg-white/5 hover:bg-white/10 text-[#FFFDD0] border border-[#FFFDD0]/25 hover:border-[#EA580C] hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between ${
                  desk.id === 'science' ? 'sm:col-span-2 lg:col-span-1' : ''
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-[#EA580C] tracking-widest">
                      {desk.numeral}. {desk.glyph}
                    </span>
                    <span className="text-xs font-mono font-bold text-[#FFFDD0]/50 group-hover:text-[#EA580C] group-hover:translate-x-0.5 transition-all">
                      →
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#FFFDD0]/60 block mb-1">
                      {desk.desk}
                    </span>
                    <h3 className="font-serif text-lg font-bold text-[#FFFDD0] group-hover:text-[#EA580C] transition-colors">
                      {desk.category}
                    </h3>
                  </div>

                  <p className="text-xs text-[#FFFDD0]/80 font-serif italic leading-relaxed line-clamp-2">
                    {desk.desc}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-[#FFFDD0]/10 text-[10px] font-mono text-[#FFFDD0]/60 truncate">
                  {desk.sources}
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* SECTION 4: THE LIVE SALON COLLECTION */}
        <section id="hub-salon" className="space-y-6 pt-4">
          
          {/* Header & Source Filter Chips */}
          <div className="space-y-4 border-b border-[#FFFDD0]/15 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#EA580C] font-bold block mb-1">
                  SELECT DISPATCHES • {displayedStories.length} CURATED READS
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#FFFDD0]">
                  The Salon Collection
                </h2>
              </div>
              <p className="text-xs text-[#FFFDD0]/75 font-sans">
                Filter by publication or browse essential dispatches.
              </p>
            </div>

            {/* Source Filter Chips */}
            {uniqueSources.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                <button
                  onClick={() => setSelectedSources([])}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-bold uppercase tracking-wider transition-all shrink-0 whitespace-nowrap ${
                    selectedSources.length === 0
                      ? 'bg-[#EA580C] text-white shadow-md'
                      : 'bg-white/10 text-[#FFFDD0]/80 hover:text-[#FFFDD0] hover:bg-white/15 border border-white/15'
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
                          ? 'bg-[#EA580C] text-white shadow-md'
                          : 'bg-white/10 text-[#FFFDD0]/80 hover:text-[#FFFDD0] hover:bg-white/15 border border-white/15'
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
          {displayedStories.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {displayedStories.map((story) => (
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
            <div className="text-center py-20 bg-white/5 text-[#FFFDD0] rounded-3xl border border-[#FFFDD0]/25 p-8 space-y-4 shadow-xl">
              <span className="text-2xl text-[#EA580C] font-mono">✦</span>
              <h3 className="font-serif text-xl font-bold text-[#FFFDD0]">
                {stories.length === 0 ? "Your feed is currently empty" : "No stories match this filter"}
              </h3>
              <p className="text-xs text-[#FFFDD0]/70 max-w-sm mx-auto">
                {stories.length === 0
                  ? "Connect custom RSS feeds or select topics to begin your voyage."
                  : "Try clearing selected publications to view all stories."}
              </p>
              {selectedSources.length > 0 && (
                <button
                  onClick={() => setSelectedSources([])}
                  className="px-5 py-2 rounded-full bg-[#EA580C] hover:bg-[#C2410C] text-white font-mono text-xs uppercase tracking-wider shadow-sm transition-all"
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
