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
import { isPlaceholderOrLogoUrl } from "@/lib/textUtils";

function matchesCategory(story: any, targetCategory: string): boolean {
  if (!story) return false;
  const cat = (story.category || '').toLowerCase();
  const src = (story.source || '').toLowerCase();

  // Bloomberg / Reuters / markets / chronicle stories must NEVER appear under culture, tech, design, science, sports
  if (
    cat === 'chronicle' ||
    cat === 'business' ||
    cat === 'finance' ||
    cat === 'markets' ||
    src.includes('bloomberg') ||
    src.includes('financial times') ||
    src.includes('wsj') ||
    src.includes('economist')
  ) {
    return false;
  }

  if (targetCategory === 'tech') {
    return cat === 'tech' || cat === 'technology' || cat === 'vanguard';
  }
  if (targetCategory === 'design') {
    return cat === 'design' || cat === 'atelier';
  }
  if (targetCategory === 'culture') {
    return cat === 'culture' || cat === 'forum';
  }
  if (targetCategory === 'science') {
    return cat === 'science' || cat === 'observatory';
  }
  if (targetCategory === 'sports') {
    return cat === 'sports' || cat === 'sport';
  }
  return false;
}

export default function FeedPage() {
  const { profile } = useProfile();
  const { stories, loading: loadingFeeds, refetch } = useFeedFetcher(profile?.id);
  const { isSaved, addSavedStory, removeSavedStory } = useSavedStories(profile?.id);
  
  const [readingArticle, setReadingArticle] = useState<any | null>(null);
  const [isAddFeedOpen, setIsAddFeedOpen] = useState(false);
  const [toast, setToast] = useState({ message: '', isVisible: false });
  const [headlines, setHeadlines] = useState<any[]>([]);

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

  // Strict content budget and deduplication:
  // 1 Lead + max 5 Latest + 5 Bands x 3 = 21 stories maximum
  const { leadStory, latestStories, bands } = useMemo(() => {
    if (!stories || stories.length === 0) {
      return {
        leadStory: null,
        latestStories: [],
        bands: { tech: [], design: [], culture: [], science: [], sports: [] },
      };
    }

    const seenKeys = new Set<string>();
    const getStoryKey = (s: any) => String(s.id || s.link || s.title);

    // 1. Lead Story: 1 story (first story with clean usable image, or stories[0])
    const lead = stories.find(s => s.imageUrl && s.imageUrl.length > 10 && !isPlaceholderOrLogoUrl(s.imageUrl)) || stories[0];
    if (lead) {
      seenKeys.add(getStoryKey(lead));
    }

    // 2. Latest Stories: max 5 rows, TEXT ONLY
    const latest: any[] = [];
    for (const s of stories) {
      if (latest.length >= 5) break;
      const key = getStoryKey(s);
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        latest.push(s);
      }
    }

    // 3. Bands: exactly 3 stories if available, otherwise 0 (hide band)
    const pickBand = (categoryName: string) => {
      const candidates: any[] = [];
      for (const s of stories) {
        const key = getStoryKey(s);
        if (!seenKeys.has(key) && matchesCategory(s, categoryName)) {
          candidates.push(s);
        }
      }
      if (candidates.length < 3) {
        return [];
      }
      const selected = candidates.slice(0, 3);
      for (const s of selected) {
        seenKeys.add(getStoryKey(s));
      }
      return selected;
    };

    // Strict order: tech, design, culture, science, sports
    const tech = pickBand('tech');
    const design = pickBand('design');
    const culture = pickBand('culture');
    const science = pickBand('science');
    const sports = pickBand('sports');

    return {
      leadStory: lead,
      latestStories: latest,
      bands: { tech, design, culture, science, sports },
    };
  }, [stories]);

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
    <div className="min-h-screen bg-[#5D8246] text-[#FFFDD0] font-sans selection:bg-[#FF6B4A] selection:text-[#FFFDD0] relative overflow-x-hidden">
      
      {/* Fixed Header (top-0, z-50, olive background, full width) */}
      <AppHeader />

      {/* Main content with matching top padding (64px) so content isn't hidden under fixed header */}
      <main style={{ paddingTop: '64px' }} className="w-full relative z-10">
        
        {/* === SECTION 1: #for-you BAND (Olive Background, Cream Text) === */}
        <section id="for-you" className="scroll-mt-16 w-full bg-[#5D8246] text-[#FFFDD0]">
          
          {/* Slim Orange Ticker (Directly below header) */}
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

          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10 sm:space-y-14">
            
            {/* Greeting Row */}
            <div className="border-b border-[#FFFDD0]/15 pb-4 flex flex-wrap items-baseline justify-between gap-3">
              <p className="font-serif text-sm sm:text-base text-[#FFFDD0]/80">
                Welcome back, <span className="italic text-[#FFFDD0]">{profile?.first_name || 'Traveler'}</span>.
              </p>
              <span className="font-mono text-[10px] sm:text-xs uppercase tracking-widest text-[#FFFDD0]/50">
                Vol. IV — No. 108
              </span>
            </div>

            {/* Lead Story: 7/12 & 5/12 at >= 900px, fixed 4:3 box, max-height 320px */}
            {leadStory && (
              <LeadStorySection
                story={leadStory}
                onSelectStory={setReadingArticle}
                onToggleSave={handleToggleSave}
                isSaved={isSaved}
              />
            )}

            {/* "Latest" list: max 5 rows, TEXT ONLY (no thumbnails), hairline separators */}
            {latestStories.length > 0 && (
              <div aria-label="Latest Stories" className="pt-2">
                <div className="border-b border-[#FFFDD0]/15 pb-2 mb-1 flex items-center justify-between">
                  <span className="font-mono text-[10px] sm:text-xs uppercase tracking-widest text-[#FFFDD0]/60 font-bold">
                    LATEST DISPATCHES
                  </span>
                </div>
                {latestStories.map((story) => (
                  <StoryListRow
                    key={story.id || story.link}
                    story={story}
                    theme="olive"
                    onSelectStory={setReadingArticle}
                  />
                ))}
              </div>
            )}

          </div>
        </section>

        {/* === SECTION 2: #tech BAND (Cream Background, Olive Text) === */}
        {bands.tech.length >= 3 && (
          <CategorySectionBand
            id="tech"
            title="TECH"
            stories={bands.tech}
            theme="cream"
            onSelectStory={setReadingArticle}
            onToggleSave={handleToggleSave}
            isSaved={isSaved}
          />
        )}

        {/* === SECTION 3: #design BAND (Olive Background, Cream Text) === */}
        {bands.design.length >= 3 && (
          <CategorySectionBand
            id="design"
            title="DESIGN"
            stories={bands.design}
            theme="olive"
            onSelectStory={setReadingArticle}
            onToggleSave={handleToggleSave}
            isSaved={isSaved}
          />
        )}

        {/* === SECTION 4: #culture BAND (Cream Background, Olive Text) === */}
        {bands.culture.length >= 3 && (
          <CategorySectionBand
            id="culture"
            title="CULTURE"
            stories={bands.culture}
            theme="cream"
            onSelectStory={setReadingArticle}
            onToggleSave={handleToggleSave}
            isSaved={isSaved}
          />
        )}

        {/* === SECTION 5: #science BAND (Olive Background, Cream Text) === */}
        {bands.science.length >= 3 && (
          <CategorySectionBand
            id="science"
            title="SCIENCE"
            stories={bands.science}
            theme="olive"
            onSelectStory={setReadingArticle}
            onToggleSave={handleToggleSave}
            isSaved={isSaved}
          />
        )}

        {/* === SECTION 6: #sports BAND (Cream Background, Olive Text) === */}
        {bands.sports.length >= 3 && (
          <CategorySectionBand
            id="sports"
            title="SPORTS"
            stories={bands.sports}
            theme="cream"
            onSelectStory={setReadingArticle}
            onToggleSave={handleToggleSave}
            isSaved={isSaved}
          />
        )}

        {/* Clean Editorial Footer */}
        <footer className="border-t border-[#FFFDD0]/15 py-12 text-center text-[#FFFDD0]/60 font-mono text-[10px] sm:text-[11px] uppercase tracking-widest bg-[#5D8246]">
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
