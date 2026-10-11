"use client";

import React, { useState, useMemo } from "react";
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
import { decodeHtmlEntities } from "@/lib/textUtils";
import { getExplorerRank, getCurrentMultiplier } from "@/lib/gamification";
import Link from 'next/link';

export default function FeedPage() {
  const { profile } = useProfile();
  const { stories, loading: loadingFeeds, error, refetch } = useFeedFetcher(profile?.id);
  const { isSaved, addSavedStory, removeSavedStory } = useSavedStories(profile?.id);
  
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [readingArticle, setReadingArticle] = useState<any | null>(null);
  const [isAddFeedOpen, setIsAddFeedOpen] = useState(false);
  const [toast, setToast] = useState({ message: '', isVisible: false });

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

  // Lead featured story
  const featuredStory = useMemo(() => {
    if (filteredStories.length === 0) return null;
    return filteredStories.find(s => s.imageUrl && s.imageUrl.length > 5) || filteredStories[0];
  }, [filteredStories]);

  // Remaining stories
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
      } catch {}
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
    <div className="min-h-screen bg-vellum-texture text-[#181715] font-sans selection:bg-[#EA580C] selection:text-white flex flex-col">
      
      {/* Sticky Masthead Navigation */}
      <AppHeader />

      {/* Main Continuous Editorial Broadsheet */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-10 space-y-12 sm:space-y-14">
        
        {/* SECTION 1: ARTFUL EDITORIAL FOLIO & ARCHIVAL MASTHEAD */}
        <section className="space-y-5">
          
          {/* Authentic Broadsheet Folio Rules */}
          <div className="border-editorial-double pb-3.5 pt-1 flex flex-wrap items-center justify-between gap-3 text-[10px] sm:text-xs font-mono uppercase tracking-[0.22em] text-[#7D7569]">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#181715]">THE ODYSSEUS JOURNAL</span>
              <span>•</span>
              <span>{todayFormatted}</span>
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:inline">VOL. IV — NO. 108</span>
            </div>

            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-0.5 rounded-full bg-[#FAF7F2] border border-[#DDD6C8] text-[#181715] font-medium shadow-2xs">
                {rank.title}
              </span>
              <span>•</span>
              <span className="font-bold text-[#EA580C]">{profile?.streak_count || 1}D STREAK</span>
              {multiplier.isBonusActive && (
                <span className="hidden md:inline-flex items-center gap-1 text-[#EA580C] bg-[#EA580C]/10 px-2 py-0.5 rounded-full font-bold">
                  <span>✦</span>
                  <span>{multiplier.multiplier}x Active</span>
                </span>
              )}
            </div>
          </div>

          {/* Editorial Greeting Spread */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-1">
            <div className="space-y-1">
              <h1 className="font-serif text-3xl sm:text-5xl text-[#181715] font-normal tracking-tight leading-[1.08]">
                <span className="italic font-light">The Salon of </span>
                <span className="font-bold text-[#181715]">{profile?.first_name || 'Shubham'}</span>
                <span className="text-[#EA580C]">.</span>
              </h1>
              <p className="text-xs sm:text-sm text-[#7D7569] font-sans max-w-xl leading-relaxed">
                Distraction-free, long-form dispatches curated across five dedicated specialty desks.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono text-[#8C8275] bg-[#FAF7F2] border border-[#DDD6C8] px-3.5 py-2 rounded-xl shadow-2xs self-start md:self-auto">
              <span className="text-[#EA580C]">✦</span>
              <span>{filteredStories.length} Curated Stories Today</span>
            </div>
          </div>

          {/* Understated Live Trending Wire Ribbon */}
          {stories.length > 0 && (
            <div className="bg-[#FAF7F2] border border-[#DDD6C8] rounded-xl px-3.5 py-2.5 flex items-center gap-3 shadow-2xs overflow-hidden">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#F0ECE1] text-[#2C241E] font-mono text-[10px] font-bold uppercase tracking-wider shrink-0 border border-[#E3DDCF]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#EA580C] animate-pulse" />
                <span>Trending Wire</span>
              </div>
              <div className="flex-1 overflow-hidden relative">
                <div className="flex items-center gap-8 animate-marquee whitespace-nowrap text-xs font-mono text-[#554D42]">
                  {stories.slice(0, 10).map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => setReadingArticle(s)}
                      className="hover:text-[#181715] hover:underline transition-colors cursor-pointer truncate max-w-md text-left"
                    >
                      <span className="font-bold text-[#8C8275] mr-1.5">[{s.source}]</span>
                      <span>{decodeHtmlEntities(s.title)}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* SECTION 2: THE LEAD COVER BROADSIDE */}
        {featuredStory && (
          <section className="bg-[#FCFAF7] border border-[#DDD5C5] rounded-3xl p-6 sm:p-10 shadow-[0_8px_30px_rgba(40,30,20,0.04)] relative overflow-hidden group">
            
            {/* Top Eyebrow Ribbon */}
            <div className="flex items-center justify-between border-b border-[#E8E2D5] pb-4 mb-6">
              <div className="flex items-center gap-2 text-[10px] sm:text-xs font-mono uppercase tracking-[0.2em] text-[#8C8275]">
                <span className="text-[#EA580C] font-bold">FRONT DISPATCH</span>
                <span>•</span>
                <span>LEAD ESSAY</span>
                <span>•</span>
                <span className="font-bold text-[#181715]">{featuredStory.source}</span>
              </div>
              <span className="text-xs font-mono text-[#8C8275]">{featuredStory.readTime} read</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              
              {/* Left Column: Headline & Editorial Prose */}
              <div className="lg:col-span-7 space-y-5">
                <div 
                  onClick={() => setReadingArticle(featuredStory)}
                  className="cursor-pointer block"
                >
                  <h2 className="font-serif text-2xl sm:text-4xl lg:text-5xl font-bold text-[#181715] group-hover:text-[#EA580C] transition-colors leading-[1.12] tracking-tight">
                    {decodeHtmlEntities(featuredStory.title)}
                  </h2>
                </div>

                <p className="text-sm sm:text-base text-[#554D42] leading-relaxed font-sans line-clamp-3 sm:line-clamp-4">
                  {decodeHtmlEntities(featuredStory.excerpt)}
                </p>

                {/* Perspective Links */}
                {featuredStory.relatedPerspectives && featuredStory.relatedPerspectives.length > 0 && (
                  <div className="pt-2">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[#8C8275] block mb-2 font-bold">
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
                          className="text-xs px-3 py-1.5 rounded-xl bg-[#F4F0E6] hover:bg-[#EBE5D8] border border-[#DDD5C5] text-[#3A332B] flex items-center gap-1.5 transition-colors"
                        >
                          <span className="font-bold text-[#181715]">{p.source}:</span>
                          <span className="truncate max-w-[180px] sm:max-w-[240px]">{decodeHtmlEntities(p.title)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-3 flex items-center gap-3">
                  <button
                    onClick={() => setReadingArticle(featuredStory)}
                    className="px-7 py-3 rounded-full bg-[#181715] hover:bg-[#2C241E] text-[#FAF7F2] font-mono font-bold text-xs uppercase tracking-wider shadow-sm hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center gap-2"
                  >
                    <span>Read Dispatch</span>
                    <span>→</span>
                  </button>

                  <button
                    onClick={() => handleToggleSave(featuredStory)}
                    className={`p-2.5 rounded-full border border-[#DDD5C5] transition-colors ${
                      isSaved(featuredStory) ? 'text-[#EA580C] border-[#EA580C] bg-[#EA580C]/10' : 'text-[#7D7569] hover:text-[#181715] hover:bg-[#F2EFE8]'
                    }`}
                    title={isSaved(featuredStory) ? "Saved in Library" : "Save for Later"}
                  >
                    <svg className="w-4 h-4" fill={isSaved(featuredStory) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                  </button>

                  <button
                    onClick={() => handleShare(featuredStory)}
                    className="p-2.5 rounded-full border border-[#DDD5C5] text-[#7D7569] hover:text-[#181715] hover:bg-[#F2EFE8] transition-colors"
                    title="Share Article"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Right Column: Framed Archival Print Visual */}
              <div 
                onClick={() => setReadingArticle(featuredStory)}
                className="lg:col-span-5 aspect-[16/10] rounded-2xl p-2 bg-[#FAF8F5] border border-[#DDD5C5] shadow-xs cursor-pointer group"
              >
                <div className="w-full h-full rounded-xl overflow-hidden bg-[#ECE7DC] relative">
                  {featuredStory.imageUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={featuredStory.imageUrl}
                      alt={featuredStory.title}
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
                </div>
              </div>

            </div>
          </section>
        )}

        {/* SECTION 3: CURATED EDITORIAL DESKS - 5 BESPOKE BOOKPLATE SALONS */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-editorial-double pb-2">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#EA580C] font-bold block">
                SPECIALIST INQUIRY
              </span>
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#181715]">
                Curated Genre Desks
              </h3>
            </div>
            <span className="text-xs font-mono text-[#8C8275]">
              5 Classical Chambers
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {[
              { 
                id: 'tech', 
                name: 'The Vanguard', 
                desk: 'Tech', 
                numeral: 'I',
                glyph: '✦',
                theme: 'from-[#17261D] to-[#101C15]',
                accentColor: '#4ADE80',
                desc: 'Frontier AI, cybernetics & silicon architectures.' 
              },
              { 
                id: 'design', 
                name: 'The Atelier', 
                desk: 'Design', 
                numeral: 'II',
                glyph: '◈',
                theme: 'from-[#2A1F18] to-[#1C140F]',
                accentColor: '#FB923C',
                desc: 'Spatial craft, typography & industrial form.' 
              },
              { 
                id: 'culture', 
                name: 'The Forum', 
                desk: 'Culture', 
                numeral: 'III',
                glyph: '◆',
                theme: 'from-[#1B252E] to-[#121A22]',
                accentColor: '#38BDF8',
                desc: 'Slow essays, cultural critique & philosophy.' 
              },
              { 
                id: 'science', 
                name: 'The Observatory', 
                desk: 'Science', 
                numeral: 'IV',
                glyph: '❖',
                theme: 'from-[#221B27] to-[#16111A]',
                accentColor: '#C084FC',
                desc: 'Astrophysics, biology & deep cosmic order.' 
              },
              { 
                id: 'chronicle', 
                name: 'The Chronicle', 
                desk: 'Chronicle', 
                numeral: 'V',
                glyph: '—',
                theme: 'from-[#281D18] to-[#1C130E]',
                accentColor: '#F59E0B',
                desc: 'Macro markets, geopolitics & global statecraft.' 
              },
            ].map((desk) => (
              <Link
                key={desk.id}
                href={`/feed/${desk.desk.toLowerCase()}`}
                className={`group p-5 bg-gradient-to-br ${desk.theme} text-[#FAF7F2] rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between relative overflow-hidden border border-white/10`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-mono tracking-widest uppercase font-bold" style={{ color: desk.accentColor }}>
                      DESK {desk.numeral}
                    </span>
                    <span className="text-base font-serif opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-transform">
                      {desk.glyph}
                    </span>
                  </div>
                  <h4 className="font-serif text-lg font-bold tracking-tight text-[#FAF7F2] mb-1.5 group-hover:underline">
                    {desk.name}
                  </h4>
                  <p className="text-xs text-white/70 leading-relaxed font-sans line-clamp-2">
                    {desk.desc}
                  </p>
                </div>
                <div className="pt-4 mt-4 border-t border-white/15 flex items-center justify-between text-[10px] font-mono text-white/60 group-hover:text-white">
                  <span>Enter Chamber</span>
                  <span className="font-bold">→</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* SECTION 4: THE SALON COLLECTION (ALL ARTICLES) */}
        <section className="space-y-6 pb-14">
          
          {/* Header & Source Filters */}
          <div className="flex flex-col md:flex-row md:items-end justify-between border-editorial-double pb-4 gap-4">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#EA580C] font-bold block mb-0.5">
                VERIFIED REPOSITORY
              </span>
              <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#181715]">
                The Salon Collection
              </h3>
            </div>

            {/* Source Filter Chips */}
            {uniqueSources.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
                <button
                  onClick={() => setSelectedSources([])}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-medium transition-all shrink-0 shadow-2xs ${
                    selectedSources.length === 0
                      ? 'bg-[#181715] text-[#FAF7F2]'
                      : 'bg-[#FAF7F2] border border-[#DDD6C8] text-[#554D42] hover:text-[#181715] hover:border-[#8C8275]'
                  }`}
                >
                  All Sources ({stories.length})
                </button>
                {uniqueSources.map(source => (
                  <button
                    key={source}
                    onClick={() => toggleSource(source)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-medium transition-all shrink-0 shadow-2xs ${
                      selectedSources.includes(source)
                        ? 'bg-[#181715] text-[#FAF7F2]'
                        : 'bg-[#FAF7F2] border border-[#DDD6C8] text-[#554D42] hover:text-[#181715] hover:border-[#8C8275]'
                    }`}
                  >
                    {source}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Stories Grid with Tactile Parchment Cards */}
          {otherStories.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {otherStories.map((story) => (
                <div 
                  key={story.id} 
                  onClick={() => setReadingArticle(story)}
                  className="cursor-pointer"
                >
                  <StoryCard
                    title={story.title}
                    excerpt={story.excerpt}
                    source={story.source}
                    date={story.date}
                    readTime={story.readTime}
                    imageUrl={story.imageUrl}
                    category={story.category}
                    isSaved={isSaved(story)}
                    onToggleSave={() => handleToggleSave(story)}
                    onShare={() => handleShare(story)}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-[#FAF7F2] border border-[#DDD6C8] rounded-2xl shadow-2xs">
              <p className="text-[#7D7569] font-serif text-lg mb-2">No dispatches match the selected sources.</p>
              <button 
                onClick={() => setSelectedSources([])}
                className="text-xs font-mono font-bold uppercase tracking-wider text-[#EA580C] hover:underline"
              >
                Clear Filters
              </button>
            </div>
          )}

        </section>

      </main>

      {/* Reader Modal */}
      {readingArticle && (
        <ReadingModal
          isOpen={!!readingArticle}
          onClose={() => setReadingArticle(null)}
          article={readingArticle}
          onSave={handleToggleSave}
        />
      )}

      {/* Add Feed Modal */}
      {isAddFeedOpen && (
        <AddFeedModal
          isOpen={isAddFeedOpen}
          onClose={() => setIsAddFeedOpen(false)}
          userId={profile?.id || ''}
          onSuccess={() => refetch()}
        />
      )}

      {/* Toast Notification */}
      <Toast 
        message={toast.message} 
        isVisible={toast.isVisible} 
        onClose={() => setToast({ message: '', isVisible: false })} 
      />

      {/* Harmonious Hardcover Book Colophon Footer */}
      <Footer />

    </div>
  );
}
