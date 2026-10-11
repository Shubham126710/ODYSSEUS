"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useFeedFetcher } from "@/hooks/useFeedFetcher";
import { useProfile } from "@/hooks/useProfile";
import { useSavedStories } from "@/hooks/useSavedStories";
import { FeedLoadingScreen } from "@/components/FeedLoadingScreen";
import { AppHeader } from "@/components/AppHeader";
import { Toast } from "@/components/Toast";
import { ReadingModal } from "@/components/ReadingModal";
import { AddFeedModal } from "@/components/AddFeedModal";
import { TrendingTicker } from "@/components/magazine/TrendingTicker";
import { LeadStorySection } from "@/components/magazine/LeadStorySection";
import { StoryListRow } from "@/components/magazine/StoryListRow";
import { CategorySectionBand } from "@/components/magazine/CategorySectionBand";
import { OrangeMomentBand } from "@/components/magazine/OrangeMomentBand";

export default function FeedPage() {
  const { profile } = useProfile();
  const { stories, loading: loadingFeeds, refetch } = useFeedFetcher(profile?.id);
  const { isSaved, addSavedStory, removeSavedStory } = useSavedStories(profile?.id);
  
  const [readingArticle, setReadingArticle] = useState<any | null>(null);
  const [isAddFeedOpen, setIsAddFeedOpen] = useState(false);
  const [toast, setToast] = useState({ message: '', isVisible: false });
  const [headlines, setHeadlines] = useState<any[]>([]);
  const [visibleCount, setVisibleCount] = useState(6);

  // Fetch breaking trending headlines for the slim orange ticker
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

  // Lead featured story
  const leadStory = useMemo(() => {
    if (!stories || stories.length === 0) return null;
    return stories.find(s => s.imageUrl && s.imageUrl.length > 10) || stories[0];
  }, [stories]);

  // Remaining stories below the lead for the #for-you list
  const listStories = useMemo(() => {
    if (!leadStory) return stories;
    return stories.filter(s => s.id !== leadStory.id && s.link !== leadStory.link);
  }, [stories, leadStory]);

  const visibleStories = useMemo(() => {
    return listStories.slice(0, visibleCount);
  }, [listStories, visibleCount]);

  const hasMoreStories = listStories.length > visibleCount;

  // Category story buckets for color-blocked sections
  const techStories = useMemo(() => {
    return stories.filter(s => s.category?.toLowerCase().includes('tech') && s.id !== leadStory?.id);
  }, [stories, leadStory]);

  const designStories = useMemo(() => {
    return stories.filter(s => s.category?.toLowerCase().includes('design') && s.id !== leadStory?.id);
  }, [stories, leadStory]);

  const cultureStories = useMemo(() => {
    return stories.filter(s => 
      (s.category?.toLowerCase().includes('culture') || s.category?.toLowerCase().includes('chronicle')) && 
      s.id !== leadStory?.id
    );
  }, [stories, leadStory]);

  const scienceStories = useMemo(() => {
    return stories.filter(s => s.category?.toLowerCase().includes('science') && s.id !== leadStory?.id);
  }, [stories, leadStory]);

  const sportsStories = useMemo(() => {
    return stories.filter(s => s.category?.toLowerCase().includes('sport') && s.id !== leadStory?.id);
  }, [stories, leadStory]);

  // Pull-quote story for the single orange moment band
  const pullQuoteStory = useMemo(() => {
    return stories.find((s, idx) => idx >= 3 && s.id !== leadStory?.id) || stories[1] || null;
  }, [stories, leadStory]);

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

  if (loadingFeeds && stories.length === 0) {
    return <FeedLoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-juice-green text-juice-cream font-sans selection:bg-juice-orange selection:text-juice-cream relative overflow-x-hidden">
      
      {/* Sticky App Header with Compass Scroll-Tracking Navigation */}
      <AppHeader />

      {/* Main Container */}
      <main className="w-full relative z-10">
        
        {/* === SECTION 1: #for-you BAND (Olive Background, Cream Text) === */}
        <section id="for-you" className="scroll-mt-20 w-full bg-juice-green text-juice-cream">
          
          {/* 2. Orange Trending Ticker (One slim line) */}
          <TrendingTicker
            headlines={headlines.length > 0 ? headlines : stories.slice(0, 10)}
            onSelectStory={(item) => setReadingArticle({
              title: item.title,
              link: item.link,
              source: item.source || 'Trending Wire',
              excerpt: item.excerpt || '',
              date: 'Trending Wire',
              readTime: item.readTime || '3 min',
            })}
          />

          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12 sm:space-y-16">
            
            {/* Top Greeting: ~24px below ticker, ~24px above lead metadata */}
            <div className="mt-6 border-b border-juice-cream/15 pb-4 flex flex-wrap items-baseline justify-between gap-3">
              <p className="font-serif text-sm sm:text-base text-juice-cream/80">
                Welcome back, <span className="italic text-juice-cream">{profile?.first_name || 'Traveler'}</span>.
              </p>
              <span className="font-mono text-[10px] sm:text-xs uppercase tracking-widest text-juice-cream/50">
                Vol. IV — No. 108
              </span>
            </div>

            {/* Lead Story: 60/40 from 900px+, ~20px metadata-to-headline, drop cap on summary */}
            {leadStory && (
              <div className="mt-6">
                <LeadStorySection
                  story={leadStory}
                  onSelectStory={setReadingArticle}
                  onToggleSave={handleToggleSave}
                  isSaved={isSaved}
                />
              </div>
            )}

            {/* Rhythmic Story List: 6 rows, first 2 rows slightly larger, fixed 128px thumbnail column */}
            <div aria-label="Latest Stories" className="space-y-0 pt-4">
              {visibleStories.map((story, idx) => (
                <StoryListRow
                  key={story.id || story.link}
                  story={story}
                  index={idx}
                  theme="olive"
                  onSelectStory={setReadingArticle}
                  onToggleSave={handleToggleSave}
                  isSaved={isSaved}
                />
              ))}

              {/* "Load more" text link: single hairline rule, no underline */}
              {hasMoreStories && (
                <div className="pt-8 pb-4 text-center">
                  <button
                    type="button"
                    onClick={() => setVisibleCount((c) => c + 6)}
                    className="font-mono text-xs uppercase tracking-widest text-juice-cream/70 hover:text-juice-cream transition-colors cursor-pointer"
                  >
                    Load more stories ↓
                  </button>
                </div>
              )}
            </div>

          </div>
        </section>

        {/* === SECTION 2: #tech BAND (Cream Background, Olive Text) === */}
        {techStories.length > 0 && (
          <CategorySectionBand
            id="tech"
            title="TECH"
            stories={techStories}
            theme="cream"
            onSelectStory={setReadingArticle}
            onToggleSave={handleToggleSave}
            isSaved={isSaved}
          />
        )}

        {/* === SINGLE ORANGE MOMENT BAND: Pull-quote with large display type === */}
        <OrangeMomentBand
          story={pullQuoteStory}
          onSelectStory={setReadingArticle}
        />

        {/* === SECTION 3: #design BAND (Olive Background, Cream Text) === */}
        {designStories.length > 0 && (
          <CategorySectionBand
            id="design"
            title="DESIGN"
            stories={designStories}
            theme="olive"
            onSelectStory={setReadingArticle}
            onToggleSave={handleToggleSave}
            isSaved={isSaved}
          />
        )}

        {/* === SECTION 4: #culture BAND (Cream Background, Olive Text) === */}
        {cultureStories.length > 0 && (
          <CategorySectionBand
            id="culture"
            title="CULTURE"
            stories={cultureStories}
            theme="cream"
            onSelectStory={setReadingArticle}
            onToggleSave={handleToggleSave}
            isSaved={isSaved}
          />
        )}

        {/* === SECTION 5: #science BAND (Olive Background, Cream Text) === */}
        {scienceStories.length > 0 && (
          <CategorySectionBand
            id="science"
            title="SCIENCE"
            stories={scienceStories}
            theme="olive"
            onSelectStory={setReadingArticle}
            onToggleSave={handleToggleSave}
            isSaved={isSaved}
          />
        )}

        {/* === SECTION 6: #sports BAND (Cream Background, Olive Text) === */}
        {sportsStories.length > 0 && (
          <CategorySectionBand
            id="sports"
            title="SPORTS"
            stories={sportsStories}
            theme="cream"
            onSelectStory={setReadingArticle}
            onToggleSave={handleToggleSave}
            isSaved={isSaved}
          />
        )}

        {/* Clean Editorial Footer (60% cream opacity) */}
        <footer className="border-t border-juice-cream/15 py-12 text-center text-juice-cream/60 font-mono text-[10px] sm:text-[11px] uppercase tracking-widest bg-juice-green">
          Odysseus · Vol. IV — No. 108 · Curated slow journalism
        </footer>

      </main>

      {/* Add Feed Modal */}
      {profile?.id && (
        <AddFeedModal
          isOpen={isAddFeedOpen}
          onClose={() => setIsAddFeedOpen(false)}
          userId={profile.id}
          onSuccess={refetch}
        />
      )}

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
        onClose={() => setToast((prev) => ({ ...prev, isVisible: false }))}
      />
    </div>
  );
}
