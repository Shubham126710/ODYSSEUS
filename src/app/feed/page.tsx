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
import { EditorialTypographyHero } from "@/components/magazine/EditorialTypographyHero";
import { FeaturedImageGallery } from "@/components/magazine/FeaturedImageGallery";
import { TheLatestList } from "@/components/magazine/TheLatestList";
import { DailyDispatchFeed } from "@/components/magazine/DailyDispatchFeed";
import { CategoryEditorialSection } from "@/components/magazine/CategoryEditorialSection";
import { isPlaceholderOrLogoUrl, isSmallThumbnailUrl, upgradeThumbnailResolution } from "@/lib/textUtils";

function matchesCategory(story: any, targetCategory: string): boolean {
  if (!story) return false;
  const cat = (story.category || '').toLowerCase();
  const desk = (story.desk || '').toLowerCase();
  const src = (story.source || '').toLowerCase();

  // Financial / markets feeds must NEVER bleed into culture, tech, design, science, sports
  if (
    cat === 'chronicle' ||
    desk === 'chronicle' ||
    cat === 'business' ||
    cat === 'finance' ||
    cat === 'markets' ||
    src.includes('bloomberg') ||
    src.includes('financial times') ||
    src.includes('wsj') ||
    src.includes('economist') ||
    src.includes('reuters')
  ) {
    return false;
  }

  if (targetCategory === 'tech') {
    return cat === 'tech' || cat === 'technology' || cat === 'vanguard' || desk === 'vanguard' ||
      src.includes('verge') || src.includes('wired') || src.includes('tech') || src.includes('polygon') || src.includes('technology review');
  }
  if (targetCategory === 'design') {
    return cat === 'design' || cat === 'atelier' || desk === 'atelier' ||
      src.includes('dezeen') || src.includes('designboom') || src.includes('smashing') || src.includes('design');
  }
  if (targetCategory === 'culture') {
    return cat === 'culture' || cat === 'forum' || desk === 'forum' ||
      src.includes('atlantic') || src.includes('aeon') || src.includes('new yorker') || src.includes('harper');
  }
  if (targetCategory === 'science') {
    return cat === 'science' || cat === 'observatory' || desk === 'observatory' ||
      src.includes('quanta') || src.includes('scientific american') || src.includes('phys.org') || src.includes('nature') || src.includes('nautilus');
  }
  if (targetCategory === 'sports') {
    return cat === 'sports' || cat === 'sport' || desk === 'sports' ||
      src.includes('sport') || src.includes('espn') || src.includes('athletic');
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

  // Fetch breaking trending headlines for "The Latest" section
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

  // Strict Editorial Story Budget & Deduplication
  const { 
    featuredStories, 
    dailyDispatchStories, 
    bands 
  } = useMemo(() => {
    if (!stories || stories.length === 0) {
      return {
        featuredStories: [],
        dailyDispatchStories: [],
        bands: { tech: [], design: [], culture: [], science: [], sports: [] },
      };
    }

    const getStoryKey = (s: any) => String(s.id || s.link || s.title);
    const seenKeys = new Set<string>();

    // 1. Featured Image Gallery: top 3 stories with high-res photography
    const galleryCandidates = stories.filter(s => {
      const img = s.imageUrl ? (upgradeThumbnailResolution(s.imageUrl) || s.imageUrl) : null;
      return img && 
        img.length > 10 && 
        !isPlaceholderOrLogoUrl(img) && 
        !isSmallThumbnailUrl(img);
    });

    const gallerySelected = galleryCandidates.slice(0, 3);
    // If fewer than 3 high-res stories, supplement with available stories
    if (gallerySelected.length < 3) {
      for (const s of stories) {
        if (gallerySelected.length >= 3) break;
        const key = getStoryKey(s);
        if (!gallerySelected.some(g => getStoryKey(g) === key)) {
          gallerySelected.push(s);
        }
      }
    }

    for (const s of gallerySelected) {
      seenKeys.add(getStoryKey(s));
    }

    // 2. Category Bands: pick top 3 stories per category
    const pickBand = (categoryName: string) => {
      const candidates: any[] = [];
      for (const s of stories) {
        const key = getStoryKey(s);
        if (!seenKeys.has(key) && matchesCategory(s, categoryName)) {
          candidates.push(s);
        }
      }
      if (candidates.length < 2) return [];

      const withImages = candidates.filter(s => s.imageUrl && !isPlaceholderOrLogoUrl(s.imageUrl));
      const withoutImages = candidates.filter(s => !s.imageUrl || isPlaceholderOrLogoUrl(s.imageUrl));
      const prioritized = [...withImages, ...withoutImages];

      const selected = prioritized.slice(0, 3);
      for (const s of selected) {
        seenKeys.add(getStoryKey(s));
      }
      return selected;
    };

    const tech = pickBand('tech');
    const design = pickBand('design');
    const culture = pickBand('culture');
    const science = pickBand('science');
    const sports = pickBand('sports');

    // 3. Daily Dispatch: up to 6 stories (1 lead + 2 secondary + 3 compact)
    const dispatchCandidates: any[] = [];
    for (const s of stories) {
      if (dispatchCandidates.length >= 6) break;
      const key = getStoryKey(s);
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        dispatchCandidates.push(s);
      }
    }

    return {
      featuredStories: gallerySelected,
      dailyDispatchStories: dispatchCandidates,
      bands: { tech, design, culture, science, sports },
    };
  }, [stories]);

  // Total category counts from feed
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

  // Section list for AppHeader navigation
  const renderedNavSections = useMemo(() => {
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
    <div className="min-h-screen bg-[#5D8246] text-[#FFFDD0] font-sans selection:bg-[#FF694F] selection:text-[#FFFDD0] relative overflow-x-hidden">
      
      {/* 1. NAVIGATION: Fixed Header with brand logo & category navigation */}
      <AppHeader sections={renderedNavSections} />

      {/* Main Content Area */}
      <main className="w-full relative z-10 hub-main">
        
        {/* 2. OVERSIZED TYPOGRAPHY & INTRODUCTORY SECTION (Offscreen Canvas Inspired) */}
        <div id="for-you" className="w-full scroll-mt-24">
          <EditorialTypographyHero />
        </div>

        {/* 3. A ROW OF FEATURED ARTICLE THUMBNAILS (Image strip, not a carousel) */}
        {featuredStories.length > 0 && (
          <FeaturedImageGallery
            stories={featuredStories}
            onSelectStory={setReadingArticle}
            onToggleSave={handleToggleSave}
            isSaved={isSaved}
          />
        )}

        {/* 4. THE LATEST / DEVELOPING STORIES (Restrained Editorial Wire, Replacing Marquee) */}
        <TheLatestList
          headlines={headlines.length > 0 ? headlines : stories.slice(0, 6)}
          onSelectStory={setReadingArticle}
        />

        {/* 5. THE DAILY DISPATCH (2/3 Lead Article + 1/3 Secondary Column + 3 Text Dispatches) */}
        {dailyDispatchStories.length > 0 && (
          <DailyDispatchFeed
            stories={dailyDispatchStories}
            onSelectStory={setReadingArticle}
            onToggleSave={handleToggleSave}
            isSaved={isSaved}
          />
        )}

        {/* 6. CATEGORY SECTIONS (Preserving consistent forest-green identity & subtle layout variations) */}
        {bands.tech.length >= 2 && (
          <CategoryEditorialSection
            id="tech"
            sectionIndex="02"
            title="TECHNOLOGY"
            stories={bands.tech}
            totalCount={totalCategoryCounts['tech']}
            layoutVariant="grid-3"
            onSelectStory={setReadingArticle}
            onToggleSave={handleToggleSave}
            isSaved={isSaved}
          />
        )}

        {bands.design.length >= 2 && (
          <CategoryEditorialSection
            id="design"
            sectionIndex="03"
            title="DESIGN"
            stories={bands.design}
            totalCount={totalCategoryCounts['design']}
            layoutVariant="feature-2"
            onSelectStory={setReadingArticle}
            onToggleSave={handleToggleSave}
            isSaved={isSaved}
          />
        )}

        {bands.culture.length >= 2 && (
          <CategoryEditorialSection
            id="culture"
            sectionIndex="04"
            title="CULTURE"
            stories={bands.culture}
            totalCount={totalCategoryCounts['culture']}
            layoutVariant="grid-3"
            onSelectStory={setReadingArticle}
            onToggleSave={handleToggleSave}
            isSaved={isSaved}
          />
        )}

        {bands.science.length >= 2 && (
          <CategoryEditorialSection
            id="science"
            sectionIndex="05"
            title="SCIENCE"
            stories={bands.science}
            totalCount={totalCategoryCounts['science']}
            layoutVariant="feature-2"
            onSelectStory={setReadingArticle}
            onToggleSave={handleToggleSave}
            isSaved={isSaved}
          />
        )}

        {bands.sports.length >= 2 && (
          <CategoryEditorialSection
            id="sports"
            sectionIndex="06"
            title="SPORTS"
            stories={bands.sports}
            totalCount={totalCategoryCounts['sports']}
            layoutVariant="grid-3"
            onSelectStory={setReadingArticle}
            onToggleSave={handleToggleSave}
            isSaved={isSaved}
          />
        )}

        {/* 7. EDITORIAL COLOPHON & FOOTER */}
        <footer className="w-full py-16 text-center text-[#FFFDD0]/50 font-mono text-[10px] sm:text-xs uppercase tracking-widest bg-[#5D8246]">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF694F]" />
              <span className="font-bold text-[#FFFDD0]">ODYSSEUS</span>
              <span className="text-[#FFFDD0]/30">·</span>
              <span>SLOW JOURNALISM FOR THE CURIOUS</span>
            </div>

            <div className="text-[#FFFDD0]/40">
              VOL. IV — NO. 108 · ALL RIGHTS TO ORIGINAL SOURCES
            </div>

            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="text-[#FF694F] hover:text-[#FFFDD0] transition-colors font-bold"
            >
              BACK TO TOP ↑
            </button>
          </div>
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
