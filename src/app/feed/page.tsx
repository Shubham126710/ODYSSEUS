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

export default function FeedPage() {
  const { profile } = useProfile();
  const { stories, loading: loadingFeeds, refetch } = useFeedFetcher(profile?.id);
  const { isSaved, addSavedStory, removeSavedStory } = useSavedStories(profile?.id);
  
  const [readingArticle, setReadingArticle] = useState<any | null>(null);
  const [isAddFeedOpen, setIsAddFeedOpen] = useState(false);
  const [toast, setToast] = useState({ message: '', isVisible: false });
  const [headlines, setHeadlines] = useState<any[]>([]);
  const [visibleCount, setVisibleCount] = useState(8);

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

  // Lead featured story (prioritize story with high quality image or first story)
  const leadStory = useMemo(() => {
    if (!stories || stories.length === 0) return null;
    return stories.find(s => s.imageUrl && s.imageUrl.length > 10) || stories[0];
  }, [stories]);

  // Remaining stories below the lead
  const listStories = useMemo(() => {
    if (!leadStory) return stories;
    return stories.filter(s => s.id !== leadStory.id && s.link !== leadStory.link);
  }, [stories, leadStory]);

  const visibleStories = useMemo(() => {
    return listStories.slice(0, visibleCount);
  }, [listStories, visibleCount]);

  const hasMoreStories = listStories.length > visibleCount;

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
      
      {/* Sticky App Header (Exact Hero olive green #5D8246) */}
      <AppHeader />

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

      {/* Main Magazine Broadsheet Layout (Max width 1200px, generous vertical rhythm) */}
      <main className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-16 sm:space-y-20 relative z-10">
        
        {/* 1. TOP: One-line greeting + mono edition line (Nothing else above the lead story) */}
        <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-juice-cream/15 pb-4">
          <p className="font-serif text-sm sm:text-base text-juice-cream/80">
            Welcome back, <span className="italic text-juice-cream">{profile?.first_name || 'Traveler'}</span>.
          </p>
          <span className="font-mono text-[10px] sm:text-xs uppercase tracking-widest text-juice-cream/50">
            Vol. IV — No. 108
          </span>
        </div>

        {/* 3. LEAD STORY (Two columns: ~60% huge headline + summary + CTA, ~40% capped image) */}
        {leadStory && (
          <LeadStorySection
            story={leadStory}
            onSelectStory={setReadingArticle}
            onToggleSave={handleToggleSave}
            isSaved={isSaved}
          />
        )}

        {/* 4. CLEAN STORY LIST (Separated by hairlines only, no cards/boxes/shadows) */}
        <section aria-label="Stories" className="space-y-0">
          {visibleStories.map((story) => (
            <StoryListRow
              key={story.id || story.link}
              story={story}
              onSelectStory={setReadingArticle}
              onToggleSave={handleToggleSave}
              isSaved={isSaved}
            />
          ))}

          {/* "Load more" text link (Initial load shows 8 rows) */}
          {hasMoreStories && (
            <div className="text-center pt-10 pb-6">
              <button
                type="button"
                onClick={() => setVisibleCount((c) => c + 8)}
                className="font-mono text-xs uppercase tracking-widest text-juice-cream/70 hover:text-juice-cream underline underline-offset-8 transition-colors cursor-pointer"
              >
                Load more stories ↓
              </button>
            </div>
          )}
        </section>

        {/* Clean Editorial Colophon Line */}
        <footer className="border-t border-juice-cream/15 pt-8 pb-12 text-center text-juice-cream/40 font-mono text-[10px] sm:text-[11px] uppercase tracking-widest">
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
