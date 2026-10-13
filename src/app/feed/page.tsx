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
import { EditorialMasthead } from "@/components/magazine/EditorialMasthead";
import { FeaturedStoryCarousel } from "@/components/magazine/FeaturedStoryCarousel";
import { EditorialStoryGrid } from "@/components/magazine/EditorialStoryGrid";
import { EditorialCategoryBand } from "@/components/magazine/EditorialCategoryBand";
import { OdysseusDeskShelf } from "@/components/magazine/OdysseusDeskShelf";
import { ScrollRail, RailSection } from "@/components/ScrollRail";
import { isPlaceholderOrLogoUrl, isSmallThumbnailUrl, upgradeThumbnailResolution } from "@/lib/textUtils";

function matchesCategory(story: any, targetCategory: string): boolean {
  if (!story) return false;
  const cat = (story.category || '').toLowerCase();
  const desk = (story.desk || '').toLowerCase();
  const src = (story.source || '').toLowerCase();

  // Financial / markets feeds must NEVER appear under culture, tech, design, science, sports
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

  // Fetch breaking trending headlines for the ticker
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

  // Rigorous Editorial Content Curation & Deduplication
  const { 
    carouselStories, 
    dailyDispatchStories, 
    bands, 
    deskStories 
  } = useMemo(() => {
    if (!stories || stories.length === 0) {
      return {
        carouselStories: [],
        dailyDispatchStories: [],
        bands: { tech: [], design: [], culture: [], science: [], sports: [] },
        deskStories: [],
      };
    }

    const getStoryKey = (s: any) => String(s.id || s.link || s.title);
    const seenKeys = new Set<string>();

    // 1. Featured Cover Carousel: 3 to 5 stories with high-res photography
    const carouselCandidates = stories.filter(s => {
      const img = s.imageUrl ? (upgradeThumbnailResolution(s.imageUrl) || s.imageUrl) : null;
      return img && 
        img.length > 10 && 
        !isPlaceholderOrLogoUrl(img) && 
        !isSmallThumbnailUrl(img);
    });

    const carouselSelected = carouselCandidates.slice(0, 5);
    // If fewer than 3 high-res stories, supplement with available stories
    if (carouselSelected.length < 3) {
      for (const s of stories) {
        if (carouselSelected.length >= 3) break;
        const key = getStoryKey(s);
        if (!carouselSelected.some(c => getStoryKey(c) === key)) {
          carouselSelected.push(s);
        }
      }
    }

    for (const s of carouselSelected) {
      seenKeys.add(getStoryKey(s));
    }

    // 2. Category Bands: pick top 3 stories per category (preserving image priority)
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

    // 3. Daily Dispatch Grid (01 / THE DAILY DISPATCH): up to 6 stories (1 lead + 2 medium + 3 compact)
    const dispatchCandidates: any[] = [];
    for (const s of stories) {
      if (dispatchCandidates.length >= 6) break;
      const key = getStoryKey(s);
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        dispatchCandidates.push(s);
      }
    }

    // 4. From the Odysseus Desk (Curated Discovery): up to 4 remaining stories
    const deskCandidates: any[] = [];
    for (const s of stories) {
      if (deskCandidates.length >= 4) break;
      const key = getStoryKey(s);
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        deskCandidates.push(s);
      }
    }

    return {
      carouselStories: carouselSelected,
      dailyDispatchStories: dispatchCandidates,
      bands: { tech, design, culture, science, sports },
      deskStories: deskCandidates,
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

  // Rail sections for desktop ScrollRail tracking
  const railSections: RailSection[] = useMemo(() => {
    const list: RailSection[] = [
      { id: 'for-you', label: 'COVER', index: '✦' },
    ];
    if (dailyDispatchStories.length > 0) {
      list.push({ id: 'dispatch', label: 'DISPATCH', index: '01' });
    }
    if (bands.tech.length >= 2) {
      list.push({ id: 'tech', label: 'TECH', index: '02' });
    }
    if (bands.design.length >= 2) {
      list.push({ id: 'design', label: 'DESIGN', index: '03' });
    }
    if (bands.culture.length >= 2) {
      list.push({ id: 'culture', label: 'CULTURE', index: '04' });
    }
    if (bands.science.length >= 2) {
      list.push({ id: 'science', label: 'SCIENCE', index: '05' });
    }
    if (bands.sports.length >= 2) {
      list.push({ id: 'sports', label: 'SPORTS', index: '06' });
    }
    if (deskStories.length > 0) {
      list.push({ id: 'desk', label: 'DESK', index: '✦' });
    }
    return list;
  }, [dailyDispatchStories, bands, deskStories]);

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
      
      {/* Fixed Header with 6 section links and brand logo */}
      <AppHeader sections={renderedNavSections} />

      {/* Desktop Vertical Scroll Navigation Rail */}
      <ScrollRail sections={railSections} />

      {/* Main Editorial Container */}
      <main className="w-full relative z-10 hub-main">
        
        {/* === SECTION 1: #for-you (Olive Background, Cream Typography) === */}
        <section id="for-you" className="w-full bg-[#5D8246] text-[#FFFDD0] hub-for-you">
          
          {/* Slim Orange Ticker (Constant px/sec speed, pause-on-hover) */}
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

          <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 pb-16">
            
            {/* Editorial Masthead */}
            <EditorialMasthead
              userName={profile?.first_name}
              issueNumber="VOL. IV — NO. 108"
            />

            {/* Featured Cover Story Carousel */}
            {carouselStories.length > 0 && (
              <FeaturedStoryCarousel
                stories={carouselStories}
                onSelectStory={setReadingArticle}
                onToggleSave={handleToggleSave}
                isSaved={isSaved}
              />
            )}

            {/* 01 / THE DAILY DISPATCH Asymmetrical Grid */}
            {dailyDispatchStories.length > 0 && (
              <EditorialStoryGrid
                stories={dailyDispatchStories}
                onSelectStory={setReadingArticle}
                onToggleSave={handleToggleSave}
                isSaved={isSaved}
              />
            )}

          </div>
        </section>

        {/* === SECTION 2: 02 / TECHNOLOGY (Cream Background, Olive Text) === */}
        {bands.tech.length >= 2 && (
          <EditorialCategoryBand
            id="tech"
            sectionIndex="02 /"
            title="TECHNOLOGY"
            stories={bands.tech}
            totalCount={totalCategoryCounts['tech']}
            theme="cream"
            layoutVariant="grid"
            onSelectStory={setReadingArticle}
            onToggleSave={handleToggleSave}
            isSaved={isSaved}
          />
        )}

        {/* === SECTION 3: 03 / DESIGN (Olive Background, Cream Text, Feature Split Layout) === */}
        {bands.design.length >= 2 && (
          <EditorialCategoryBand
            id="design"
            sectionIndex="03 /"
            title="DESIGN"
            stories={bands.design}
            totalCount={totalCategoryCounts['design']}
            theme="olive"
            layoutVariant="feature-split"
            onSelectStory={setReadingArticle}
            onToggleSave={handleToggleSave}
            isSaved={isSaved}
          />
        )}

        {/* === SECTION 4: 04 / CULTURE (Cream Background, Olive Text) === */}
        {bands.culture.length >= 2 && (
          <EditorialCategoryBand
            id="culture"
            sectionIndex="04 /"
            title="CULTURE"
            stories={bands.culture}
            totalCount={totalCategoryCounts['culture']}
            theme="cream"
            layoutVariant="grid"
            onSelectStory={setReadingArticle}
            onToggleSave={handleToggleSave}
            isSaved={isSaved}
          />
        )}

        {/* === SECTION 5: 05 / SCIENCE (Olive Background, Cream Text, Feature Split Layout) === */}
        {bands.science.length >= 2 && (
          <EditorialCategoryBand
            id="science"
            sectionIndex="05 /"
            title="SCIENCE"
            stories={bands.science}
            totalCount={totalCategoryCounts['science']}
            theme="olive"
            layoutVariant="feature-split"
            onSelectStory={setReadingArticle}
            onToggleSave={handleToggleSave}
            isSaved={isSaved}
          />
        )}

        {/* === SECTION 6: 06 / SPORTS (Cream Background, Olive Text) === */}
        {bands.sports.length >= 2 && (
          <EditorialCategoryBand
            id="sports"
            sectionIndex="06 /"
            title="SPORTS"
            stories={bands.sports}
            totalCount={totalCategoryCounts['sports']}
            theme="cream"
            layoutVariant="grid"
            onSelectStory={setReadingArticle}
            onToggleSave={handleToggleSave}
            isSaved={isSaved}
          />
        )}

        {/* === SECTION 7: FROM THE ODYSSEUS DESK (Curated Discovery Shelf) === */}
        {deskStories.length > 0 && (
          <OdysseusDeskShelf
            stories={deskStories}
            onSelectStory={setReadingArticle}
            onToggleSave={handleToggleSave}
            isSaved={isSaved}
          />
        )}

        {/* Editorial Colophon & Footer */}
        <footer className="border-t border-[#FFFDD0]/15 py-14 text-center text-[#FFFDD0]/60 font-mono text-[10px] sm:text-xs uppercase tracking-widest bg-[#5D8246]">
          <div className="max-w-[1240px] mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>ODYSSEUS · SLOW JOURNALISM FOR THE CURIOUS</div>
            <div className="text-[#FFFDD0]/40">VOL. IV — NO. 108 · ALL DISPATCHES RESPECT THEIR ORIGINAL CREATORS</div>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="text-[#FF6B4A] hover:text-[#FFFDD0] transition-colors font-bold"
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
