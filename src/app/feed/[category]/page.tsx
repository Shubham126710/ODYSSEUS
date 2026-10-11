"use client";

import React, { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from 'next/link';
import { useFeedFetcher } from "@/hooks/useFeedFetcher";
import { useProfile } from "@/hooks/useProfile";
import { useSavedStories } from "@/hooks/useSavedStories"; 
import { FeedLoadingScreen } from "@/components/FeedLoadingScreen";
import { AppHeader } from "@/components/AppHeader";
import { Toast } from "@/components/Toast";
import { ReadingModal } from "@/components/ReadingModal";
import { LeadStorySection } from "@/components/magazine/LeadStorySection";
import { StoryListRow } from "@/components/magazine/StoryListRow";

export default function CategoryFeedPage() {
  const { profile } = useProfile();
  const params = useParams();
  const rawCategory = params?.category;
  const category = rawCategory ? decodeURIComponent(typeof rawCategory === "string" ? rawCategory : "") : "";
  
  const { 
    stories, 
    loading: feedLoading, 
    error, 
    refetch 
  } = useFeedFetcher(profile?.id, { category });

  const { isSaved, addSavedStory, removeSavedStory } = useSavedStories(profile?.id);
  const [toast, setToast] = useState({ message: '', isVisible: false });
  const [activeArticle, setActiveArticle] = useState<any | null>(null);
  const [visibleCount, setVisibleCount] = useState(8);

  const handleToggleSave = async (story: any) => {
    if (!profile) return;
    try {
      if (isSaved(story)) {
        await removeSavedStory(story);
        setToast({ message: 'Removed from library', isVisible: true });
      } else {
        await addSavedStory(story);
        setToast({ message: 'Saved to library ✦', isVisible: true });
      }
    } catch {
      setToast({ message: 'Could not update library', isVisible: true });
    }
  };

  // Lead story for category
  const leadStory = useMemo(() => {
    if (!stories || stories.length === 0) return null;
    return stories.find(s => s.imageUrl && s.imageUrl.length > 10) || stories[0];
  }, [stories]);

  // Remaining list stories
  const listStories = useMemo(() => {
    if (!leadStory) return stories;
    return stories.filter(s => s.id !== leadStory.id && s.link !== leadStory.link);
  }, [stories, leadStory]);

  const visibleStories = useMemo(() => {
    return listStories.slice(0, visibleCount);
  }, [listStories, visibleCount]);

  const hasMoreStories = listStories.length > visibleCount;

  if (feedLoading && stories.length === 0) {
    return <FeedLoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-juice-green text-juice-cream font-sans selection:bg-juice-orange selection:text-juice-cream relative overflow-x-hidden">
      
      {/* Sticky App Header (Exact Hero olive green #5D8246) */}
      <AppHeader />
      
      <main className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-16 sm:space-y-20 relative z-10">
        
        {/* Top Folio & Return Navigation */}
        <div className="flex items-center justify-between gap-4 border-b border-juice-cream/15 pb-4">
          <Link 
            href="/feed"
            className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest text-juice-cream/60 hover:text-juice-cream transition-colors"
          >
            <span>←</span>
            <span>All Stories</span>
          </Link>
          <span className="font-mono text-[10px] sm:text-xs uppercase tracking-widest text-juice-cream/50">
            {category.toUpperCase()} DESK • {stories.length} DISPATCHES
          </span>
        </div>

        {/* Big Category Title in Heavy Grotesk Display Type */}
        <div className="pt-2">
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black uppercase tracking-tighter text-juice-cream leading-none">
            {category.toUpperCase()}
          </h1>
        </div>

        {/* Error Fallback */}
        {error && stories.length === 0 && (
          <div className="py-12 text-center space-y-4 border-b border-juice-cream/15">
            <p className="font-mono text-xs text-juice-cream/70 uppercase tracking-widest">
              Unable to load RSS wire dispatches
            </p>
            <button
              onClick={refetch}
              className="text-juice-orange hover:underline font-mono text-xs uppercase tracking-wider cursor-pointer"
            >
              Retry Connection →
            </button>
          </div>
        )}

        {/* 1. Lead Story */}
        {leadStory && (
          <LeadStorySection
            story={leadStory}
            onSelectStory={setActiveArticle}
            onToggleSave={handleToggleSave}
            isSaved={isSaved}
          />
        )}

        {/* 2. Story List */}
        {visibleStories.length > 0 && (
          <section aria-label={`${category} Stories`} className="space-y-0">
            {visibleStories.map((story, idx) => (
              <StoryListRow
                key={story.id || story.link}
                story={story}
                index={idx}
                onSelectStory={setActiveArticle}
                onToggleSave={handleToggleSave}
                isSaved={isSaved}
              />
            ))}

            {hasMoreStories && (
              <div className="text-center pt-8 pb-4">
                <button
                  type="button"
                  onClick={() => setVisibleCount((c) => c + 8)}
                  className="font-mono text-xs uppercase tracking-widest text-juice-cream/70 hover:text-juice-cream transition-colors cursor-pointer"
                >
                  Load more stories ↓
                </button>
              </div>
            )}
          </section>
        )}

        {/* Editorial Colophon Line */}
        <footer className="border-t border-juice-cream/15 pt-8 pb-12 text-center text-juice-cream/60 font-mono text-[10px] sm:text-[11px] uppercase tracking-widest">
          Odysseus · {category.toUpperCase()} · Curated slow journalism
        </footer>

      </main>

      {/* Reading Chamber Modal */}
      {activeArticle && (
        <ReadingModal
          isOpen={!!activeArticle}
          onClose={() => setActiveArticle(null)}
          article={activeArticle}
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
