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
import { getExplorerRank } from "@/lib/gamification";
import Link from 'next/link';

export default function FeedPage() {
  const { profile } = useProfile();
  const { stories, loading: loadingFeeds, error, refetch } = useFeedFetcher(profile?.id);
  const { isSaved, addSavedStory, removeSavedStory } = useSavedStories(profile?.id);
  
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [readingArticle, setReadingArticle] = useState<any | null>(null);
  const [isAddFeedOpen, setIsAddFeedOpen] = useState(false);
  const [toast, setToast] = useState({ message: '', isVisible: false });

  // Derived rank
  const rank = getExplorerRank(profile?.total_reading_minutes || 0, profile?.streak_count || 1);

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
    <div className="min-h-screen bg-[#FAF9F6] text-stone-900 font-sans selection:bg-[#EA580C] selection:text-white flex flex-col">
      
      {/* Sticky Masthead Navigation */}
      <AppHeader />

      {/* Main Continuous Editorial Broadsheet */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-10 space-y-10 sm:space-y-12">
        
        {/* SECTION 1: QUIET EDITORIAL FOLIO HEADER */}
        <section className="border-b border-stone-200/80 pb-6 sm:pb-8 space-y-4">
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-[10px] sm:text-xs font-mono uppercase tracking-[0.2em] text-stone-400 mb-1">
                <span>THE ODYSSEUS JOURNAL</span>
                <span>•</span>
                <span>{todayFormatted}</span>
                <span>•</span>
                <span>VOL. IV</span>
              </div>
              <h1 className="font-serif text-2xl sm:text-4xl text-stone-900 font-normal tracking-tight">
                <span className="italic font-light">The Daily </span>
                <span className="font-bold">Dispatch</span>
              </h1>
              <p className="text-xs sm:text-sm text-stone-500 font-sans mt-0.5 max-w-xl">
                Distraction-free, slow journalism curated from the world&apos;s leading publications.
              </p>
            </div>

            <div className="flex items-center gap-2.5 text-xs font-mono text-stone-500">
              <span className="px-2.5 py-1 rounded-full bg-white border border-stone-200 text-stone-800 font-medium shadow-2xs">
                {rank.title}
              </span>
              <span>•</span>
              <span className="font-bold text-[#EA580C]">{profile?.streak_count || 1}D STREAK</span>
            </div>
          </div>

          {/* Understated Live Trending Wire */}
          {stories.length > 0 && (
            <div className="bg-white border border-stone-200/80 rounded-xl px-3 py-2 flex items-center gap-3 shadow-2xs overflow-hidden">
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 font-mono text-[10px] font-bold uppercase tracking-wider shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-[#EA580C] animate-pulse" />
                <span>Trending Wire</span>
              </div>
              <div className="flex-1 overflow-hidden relative">
                <div className="flex items-center gap-8 animate-marquee whitespace-nowrap text-xs font-mono text-stone-600">
                  {stories.slice(0, 10).map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => setReadingArticle(s)}
                      className="hover:text-stone-950 hover:underline transition-colors cursor-pointer truncate max-w-md text-left"
                    >
                      <span className="font-bold text-stone-400 mr-1.5">[{s.source}]</span>
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
          <section className="bg-white border border-stone-200/80 rounded-2xl p-6 sm:p-8 shadow-xs hover:border-stone-300 transition-colors">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center">
              
              {/* Left Column: Headline & Editorial Prose */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center gap-2 text-[10px] sm:text-xs font-mono uppercase tracking-wider text-stone-500">
                  <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-800 font-medium">
                    {featuredStory.category}
                  </span>
                  <span>•</span>
                  <span className="font-bold text-[#EA580C]">{featuredStory.source}</span>
                  <span>•</span>
                  <span>{featuredStory.readTime} read</span>
                </div>

                <div 
                  onClick={() => setReadingArticle(featuredStory)}
                  className="cursor-pointer group block"
                >
                  <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-stone-900 group-hover:text-[#EA580C] transition-colors leading-[1.15]">
                    {decodeHtmlEntities(featuredStory.title)}
                  </h2>
                </div>

                <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-sans line-clamp-3">
                  {decodeHtmlEntities(featuredStory.excerpt)}
                </p>

                {/* Perspective Links */}
                {featuredStory.relatedPerspectives && featuredStory.relatedPerspectives.length > 0 && (
                  <div className="pt-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400 block mb-1.5">
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
                          className="text-xs px-2.5 py-1 rounded-lg bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-700 flex items-center gap-1.5 transition-colors"
                        >
                          <span className="font-bold text-stone-900">{p.source}:</span>
                          <span className="truncate max-w-[180px] sm:max-w-[240px]">{decodeHtmlEntities(p.title)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-2 flex items-center gap-3">
                  <button
                    onClick={() => setReadingArticle(featuredStory)}
                    className="px-6 py-2.5 rounded-full bg-stone-900 hover:bg-black text-white font-mono font-medium text-xs uppercase tracking-wider shadow-xs hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center gap-2"
                  >
                    <span>Read Article</span>
                    <span>→</span>
                  </button>

                  <button
                    onClick={() => handleToggleSave(featuredStory)}
                    className={`p-2 rounded-full border border-stone-200 transition-colors ${
                      isSaved(featuredStory) ? 'text-[#EA580C] border-[#EA580C] bg-[#EA580C]/5' : 'text-stone-400 hover:text-stone-800 hover:bg-stone-50'
                    }`}
                    title={isSaved(featuredStory) ? "Saved in Library" : "Save for Later"}
                  >
                    <svg className="w-4 h-4" fill={isSaved(featuredStory) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                  </button>

                  <button
                    onClick={() => handleShare(featuredStory)}
                    className="p-2 rounded-full border border-stone-200 text-stone-400 hover:text-stone-800 hover:bg-stone-50 transition-colors"
                    title="Share Article"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Right Column: 16:10 Visual Image */}
              <div 
                onClick={() => setReadingArticle(featuredStory)}
                className="lg:col-span-5 aspect-[16/10] rounded-xl overflow-hidden bg-stone-100 border border-stone-200/90 shadow-xs cursor-pointer group"
              >
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
          </section>
        )}

        {/* SECTION 3: CURATED EDITORIAL DESKS */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-stone-200/80 pb-2">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#EA580C] font-bold block">
                SPECIALIST DISPATCHES
              </span>
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-stone-900">
                Curated Genre Desks
              </h3>
            </div>
            <span className="text-xs font-mono text-stone-400">
              5 Dedicated Channels
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {[
              { id: 'tech', name: 'The Vanguard', desk: 'Tech', category: 'Technology & AI', desc: 'Frontier AI, silicon architectures & autonomous systems.' },
              { id: 'design', name: 'The Atelier', desk: 'Design', category: 'Design & Craft', desc: 'Spatial computing, typography & industrial forms.' },
              { id: 'culture', name: 'The Forum', desk: 'Culture', category: 'Culture & Essays', desc: 'Philosophical essays, human conditions & criticism.' },
              { id: 'science', name: 'The Observatory', desk: 'Science', category: 'Science & Cosmos', desc: 'Astrophysics, biology & deep universe dispatches.' },
              { id: 'chronicle', name: 'The Chronicle', desk: 'Chronicle', category: 'Global Chronicle', desc: 'Geopolitics, macro trends & investigative journalism.' },
            ].map((desk) => (
              <Link
                key={desk.id}
                href={`/feed/${desk.desk.toLowerCase()}`}
                className="group p-4 bg-white border border-stone-200/80 hover:border-stone-400 rounded-xl shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[9px] font-mono uppercase tracking-wider text-stone-400">{desk.category}</span>
                    <span className="text-xs font-serif text-stone-300 group-hover:text-stone-900 transition-colors">↗</span>
                  </div>
                  <h4 className="font-serif text-base font-bold text-stone-900 group-hover:text-[#EA580C] transition-colors mb-1">
                    {desk.name}
                  </h4>
                  <p className="text-[11px] text-stone-500 leading-relaxed line-clamp-2">
                    {desk.desc}
                  </p>
                </div>
                <div className="pt-3 mt-3 border-t border-stone-100 flex items-center justify-between text-[10px] font-mono text-stone-400 group-hover:text-stone-700">
                  <span>Enter Desk</span>
                  <span>→</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* SECTION 4: THE SALON COLLECTION (ALL ARTICLES) */}
        <section className="space-y-6 pb-12">
          
          {/* Header & Source Filters */}
          <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-stone-200/80 pb-4 gap-4">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#EA580C] font-bold block mb-0.5">
                VERIFIED ARCHIVE
              </span>
              <h3 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
                The Salon Collection
              </h3>
            </div>

            {/* Source Filter Chips */}
            {uniqueSources.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
                <button
                  onClick={() => setSelectedSources([])}
                  className={`px-3 py-1 rounded-full text-xs font-mono font-medium transition-all shrink-0 ${
                    selectedSources.length === 0
                      ? 'bg-stone-900 text-white shadow-2xs'
                      : 'bg-white border border-stone-200 text-stone-600 hover:text-stone-900 hover:border-stone-300'
                  }`}
                >
                  All ({stories.length})
                </button>
                {uniqueSources.map(source => (
                  <button
                    key={source}
                    onClick={() => toggleSource(source)}
                    className={`px-3 py-1 rounded-full text-xs font-mono font-medium transition-all shrink-0 ${
                      selectedSources.includes(source)
                        ? 'bg-stone-900 text-white shadow-2xs'
                        : 'bg-white border border-stone-200 text-stone-600 hover:text-stone-900 hover:border-stone-300'
                    }`}
                  >
                    {source}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Stories Grid */}
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
            <div className="text-center py-16 bg-white border border-stone-200/80 rounded-2xl">
              <p className="text-stone-500 font-serif text-lg mb-2">No dispatches match the selected sources.</p>
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

      {/* Minimal Footer */}
      <Footer />

    </div>
  );
}
