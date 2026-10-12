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
import { isPlaceholderOrLogoUrl, isSmallThumbnailUrl } from "@/lib/textUtils";

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

    const getStoryKey = (s: any) => String(s.id || s.link || s.title);
    const seenKeys = new Set<string>();

    // 1. Lead Story: choose only from stories with valid image (>= 600px wide, not logo/placeholder)
    // Fall back to best available if none qualify
    const validImageLead = stories.find(s => 
      s.imageUrl && 
      s.imageUrl.length > 10 && 
      !isPlaceholderOrLogoUrl(s.imageUrl) && 
      !isSmallThumbnailUrl(s.imageUrl)
    );
    const fallbackImageLead = stories.find(s => s.imageUrl && !isPlaceholderOrLogoUrl(s.imageUrl));
    const lead = validImageLead || fallbackImageLead || stories[0];

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

    // 3. Bands: allow 2 stories if only 2 available, otherwise up to 3; hide if < 2
    // Prefer stories with valid images first to avoid mixing image and image-less cards
    const pickBand = (categoryName: string) => {
      const candidates: any[] = [];
      for (const s of stories) {
        const key = getStoryKey(s);
        if (!seenKeys.has(key) && matchesCategory(s, categoryName)) {
          candidates.push(s);
        }
      }
      if (candidates.length < 2) {
        return [];
      }

      // Sort: valid images first, text-only second
      const withImages = candidates.filter(s => s.imageUrl && !isPlaceholderOrLogoUrl(s.imageUrl));
      const withoutImages = candidates.filter(s => !s.imageUrl || isPlaceholderOrLogoUrl(s.imageUrl));
      const prioritized = [...withImages, ...withoutImages];

      const selected = prioritized.slice(0, 3);
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

  // Compute real total number of stories in each category from the feed
  const totalCategoryCounts = useMemo(() => {
    if (!stories || stories.length === 0) return {};
    return {
      tech: stories.filter(s => matchesCategory(s, 'tech')).length,
      design: stories.filter(s => matchesCategory(s, 'design')).length,
      culture: stories.filter(s => matchesCategory(s, 'culture')).length,
      science: stories.filter(s => matchesCategory(s, 'science')).length,
      sports: stories.filter(s => matchesCategory(s, 'sports')).length,
    };
  }, [stories]);

  // Dynamically list ONLY the sections that actually rendered
  const renderedSections = useMemo(() => {
    const list = [
      { id: 'for-you', label: 'FOR YOU', route: '/feed' },
    ];
    if (bands.tech.length >= 2) list.push({ id: 'tech', label: 'TECH', route: '/feed/tech' });
    if (bands.design.length >= 2) list.push({ id: 'design', label: 'DESIGN', route: '/feed/design' });
    if (bands.culture.length >= 2) list.push({ id: 'culture', label: 'CULTURE', route: '/feed/culture' });
    if (bands.science.length >= 2) list.push({ id: 'science', label: 'SCIENCE', route: '/feed/science' });
    if (bands.sports.length >= 2) list.push({ id: 'sports', label: 'SPORTS', route: '/feed/sports' });
    return list;
  }, [bands]);

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
      <AppHeader sections={renderedSections} />

      {/* Main content with matching top padding (72px desktop, 100px mobile for 2-row header) */}
      <main className="w-full relative z-10 hub-main">
        
        {/* === SECTION 1: #for-you BAND (Olive Background, Cream Text) === */}
        <section id="for-you" className="w-full bg-[#5D8246] text-[#FFFDD0] hub-for-you flex flex-col justify-between">
          
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

          {/* Top Spacing: 24px between ticker and greeting, 64px bottom padding before cream Tech band */}
          <div 
            style={{ paddingTop: '24px', paddingBottom: '64px' }}
            className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8"
          >
            
            {/* Greeting Row: 24px below ticker, rule at bottom */}
            <div className="border-b border-[#FFFDD0]/15 pb-4 flex flex-wrap items-baseline justify-between gap-3">
              <p className="font-serif text-sm sm:text-base text-[#FFFDD0]/80">
                Welcome back, <span className="italic text-[#FFFDD0]">{profile?.first_name || 'Traveler'}</span>.
              </p>
              <span className="font-mono text-[10px] sm:text-xs uppercase tracking-widest text-[#FFFDD0]/50">
                VOL. IV — NO. 108
              </span>
            </div>

            {/* Lead Story: 24px between greeting rule and lead story */}
            {leadStory && (
              <div style={{ marginTop: '24px' }}>
                <LeadStorySection
                  story={leadStory}
                  onSelectStory={setReadingArticle}
                  onToggleSave={handleToggleSave}
                  isSaved={isSaved}
                />
              </div>
            )}

            {/* "Latest" list: 48px above it, 16px below label, hairline between rows */}
            {latestStories.length > 0 && (
              <div aria-label="Latest Stories" style={{ marginTop: '48px' }}>
                <div style={{ marginBottom: '16px' }} className="border-b border-[#FFFDD0]/15 pb-2 flex items-center justify-between">
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
        {bands.tech.length >= 2 && (
          <CategorySectionBand
            id="tech"
            title="TECH"
            stories={bands.tech}
            totalCount={totalCategoryCounts['tech']}
            theme="cream"
            onSelectStory={setReadingArticle}
            onToggleSave={handleToggleSave}
            isSaved={isSaved}
          />
        )}

        {/* === SECTION 3: #design BAND (Olive Background, Cream Text) === */}
        {bands.design.length >= 2 && (
          <CategorySectionBand
            id="design"
            title="DESIGN"
            stories={bands.design}
            totalCount={totalCategoryCounts['design']}
            theme="olive"
            onSelectStory={setReadingArticle}
            onToggleSave={handleToggleSave}
            isSaved={isSaved}
          />
        )}

        {/* === SECTION 4: #culture BAND (Cream Background, Olive Text) === */}
        {bands.culture.length >= 2 && (
          <CategorySectionBand
            id="culture"
            title="CULTURE"
            stories={bands.culture}
            totalCount={totalCategoryCounts['culture']}
            theme="cream"
            onSelectStory={setReadingArticle}
            onToggleSave={handleToggleSave}
            isSaved={isSaved}
          />
        )}

        {/* === SECTION 5: #science BAND (Olive Background, Cream Text) === */}
        {bands.science.length >= 2 && (
          <CategorySectionBand
            id="science"
            title="SCIENCE"
            stories={bands.science}
            totalCount={totalCategoryCounts['science']}
            theme="olive"
            onSelectStory={setReadingArticle}
            onToggleSave={handleToggleSave}
            isSaved={isSaved}
          />
        )}

        {/* === SECTION 6: #sports BAND (Cream Background, Olive Text) === */}
        {bands.sports.length >= 2 && (
          <CategorySectionBand
            id="sports"
            title="SPORTS"
            stories={bands.sports}
            totalCount={totalCategoryCounts['sports']}
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
