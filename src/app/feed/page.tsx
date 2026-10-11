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
import { ScrollRail } from "@/components/ScrollRail";
import { Masthead } from "@/components/magazine/Masthead";
import { TrendingTicker } from "@/components/magazine/TrendingTicker";
import { LeadStory } from "@/components/magazine/LeadStory";
import { EditorialGrid } from "@/components/magazine/EditorialGrid";
import { FeatureBreak } from "@/components/magazine/FeatureBreak";
import { CategorySection } from "@/components/magazine/CategorySection";
import { DeskPicks } from "@/components/magazine/DeskPicks";
import { MagazineFooter } from "@/components/magazine/MagazineFooter";
import { getExplorerRank } from "@/lib/gamification";

const CATEGORIES = ['ALL', 'TECH', 'DESIGN', 'CULTURE', 'SCIENCE', 'SPORTS'];

export default function FeedPage() {
  const { profile } = useProfile();
  const { stories, loading: loadingFeeds, refetch } = useFeedFetcher(profile?.id);
  const { isSaved, addSavedStory, removeSavedStory } = useSavedStories(profile?.id);
  
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [readingArticle, setReadingArticle] = useState<any | null>(null);
  const [isAddFeedOpen, setIsAddFeedOpen] = useState(false);
  const [toast, setToast] = useState({ message: '', isVisible: false });
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

  // Derived rank
  const rank = getExplorerRank(profile?.total_reading_minutes || 0, profile?.streak_count || 1);

  // Date and edition string
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

  // Filtered stories if category is chosen in masthead
  const filteredStories = useMemo(() => {
    if (activeCategory === 'ALL') return stories;
    const cat = activeCategory.toLowerCase();
    return stories.filter(s => s.category.toLowerCase().includes(cat));
  }, [stories, activeCategory]);

  // Lead featured story (first story with high quality image or first item)
  const featuredStory = useMemo(() => {
    if (filteredStories.length === 0) return null;
    return filteredStories.find(s => s.imageUrl && s.imageUrl.length > 10) || filteredStories[0];
  }, [filteredStories]);

  // Remaining stories excluding lead
  const otherStories = useMemo(() => {
    if (!featuredStory) return filteredStories;
    return filteredStories.filter(s => s.id !== featuredStory.id);
  }, [filteredStories, featuredStory]);

  // Side stories for the lead section (top 3)
  const sideStories = useMemo(() => {
    return otherStories.slice(0, 3);
  }, [otherStories]);

  // Dispatch section stories (next 6 stories)
  const dispatchStories = useMemo(() => {
    return otherStories.slice(3, 9);
  }, [otherStories]);

  // "In Brief" wire essentials (items 9 to 15)
  const inBriefStories = useMemo(() => {
    return otherStories.slice(9, 15);
  }, [otherStories]);

  // Full-bleed feature break story (a strong visual story from deeper in the feed)
  const featureBreakStory = useMemo(() => {
    return otherStories.find((s, idx) => idx >= 12 && s.imageUrl) || otherStories[15] || null;
  }, [otherStories]);

  // Bucketed category stories for dedicated numbered sections
  const techStories = useMemo(() => {
    return stories.filter(s => s.category.toLowerCase().includes('tech') && s.id !== featuredStory?.id);
  }, [stories, featuredStory]);

  const designStories = useMemo(() => {
    return stories.filter(s => s.category.toLowerCase().includes('design') && s.id !== featuredStory?.id);
  }, [stories, featuredStory]);

  const cultureStories = useMemo(() => {
    return stories.filter(s => (s.category.toLowerCase().includes('culture') || s.category.toLowerCase().includes('chronicle')) && s.id !== featuredStory?.id);
  }, [stories, featuredStory]);

  const scienceStories = useMemo(() => {
    return stories.filter(s => s.category.toLowerCase().includes('science') && s.id !== featuredStory?.id);
  }, [stories, featuredStory]);

  const sportsStories = useMemo(() => {
    return stories.filter(s => s.category.toLowerCase().includes('sport') && s.id !== featuredStory?.id);
  }, [stories, featuredStory]);

  // "From the Odysseus Desk": 3 curated stories across different categories
  const deskPicks = useMemo(() => {
    if (stories.length === 0) return [];
    const picked: any[] = [];
    const usedCategories = new Set<string>();

    for (const story of stories) {
      if (story.id === featuredStory?.id) continue;
      const cat = story.category.toLowerCase();
      if (!usedCategories.has(cat)) {
        picked.push(story);
        usedCategories.add(cat);
        if (picked.length === 3) break;
      }
    }

    if (picked.length < 3) {
      for (const story of stories) {
        if (!picked.includes(story) && story.id !== featuredStory?.id) {
          picked.push(story);
          if (picked.length === 3) break;
        }
      }
    }

    return picked;
  }, [stories, featuredStory]);

  // Dynamically constructed sections for the ScrollRail navigation
  const dynamicSections = useMemo(() => {
    const list = [
      { id: 'hub-cover', label: 'COVER' },
      { id: 'hub-dispatch', label: 'DISPATCH' },
    ];
    if (techStories.length > 0) list.push({ id: 'hub-tech', label: 'TECH' });
    if (designStories.length > 0) list.push({ id: 'hub-design', label: 'DESIGN' });
    if (cultureStories.length > 0) list.push({ id: 'hub-culture', label: 'CULTURE' });
    if (scienceStories.length > 0) list.push({ id: 'hub-science', label: 'SCIENCE' });
    if (sportsStories.length > 0) list.push({ id: 'hub-sports', label: 'SPORTS' });
    list.push({ id: 'hub-desk', label: 'THE DESK' });
    list.push({ id: 'hub-colophon', label: 'COLOPHON' });
    return list;
  }, [techStories.length, designStories.length, cultureStories.length, scienceStories.length, sportsStories.length]);

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

  const handleSelectCategory = (cat: string) => {
    setActiveCategory(cat);
    if (cat !== 'ALL') {
      const targetId = `hub-${cat.toLowerCase()}`;
      const el = document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (loadingFeeds && stories.length === 0) {
    return <FeedLoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-[#243625] text-[#FFFDD0] font-sans selection:bg-[#EA580C] selection:text-white relative overflow-x-hidden">
      
      {/* Tactile Paper-Grain Noise Overlay (3-4% opacity) */}
      <div 
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none z-0 opacity-[0.038]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          backgroundSize: '160px 160px',
        }}
      />

      {/* Sticky App Header */}
      <AppHeader />

      {/* Integrated Vertical Scroll Navigation Rail (Right Edge) */}
      <ScrollRail sections={dynamicSections} navOffset={72} />

      {/* Main Magazine Layout Broadsheet */}
      <main className="max-w-[1560px] mx-auto px-4 sm:px-6 lg:pl-8 lg:pr-14 xl:pl-10 xl:pr-16 2xl:px-14 py-6 sm:py-8 space-y-10 sm:space-y-14 relative z-10">
        
        {/* 1. MASTHEAD FOLIO & CATEGORY STRIP */}
        <Masthead
          todayFormatted={todayFormatted}
          rankTitle={rank.title}
          streakCount={profile?.streak_count || 1}
          categories={CATEGORIES}
          activeCategory={activeCategory}
          onSelectCategory={handleSelectCategory}
        />

        {/* 2. GREETING (Quiet, does not compete with lead story) */}
        <div className="pt-1 pb-1 space-y-1">
          <p className="font-serif text-sm sm:text-base text-[#FFFDD0]/75">
            Welcome back, <span className="italic font-normal text-[#FFFDD0]">{profile?.first_name || 'Traveler'}</span>.
          </p>
          <div className="flex flex-wrap items-end justify-between border-b border-[#FFFDD0]/15 pb-3 gap-2">
            <h1 className="font-sans font-black text-2xl sm:text-3xl md:text-4xl text-[#FFFDD0] tracking-tight uppercase">
              Today&apos;s Stories
            </h1>
            <span className="font-mono text-[9px] sm:text-[10px] text-[#EA580C] uppercase tracking-[0.25em] font-bold">
              LIVE BROADCAST • EDITION NO. 108
            </span>
          </div>
        </div>

        {/* 3. TRENDING TICKER (Slim full-width newspaper ticker) */}
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

        {/* 4. DOMINANT LEAD STORY (Visible above the fold at 1440px) */}
        {featuredStory && (
          <div id="hub-cover" className="scroll-mt-24">
            <LeadStory
              featuredStory={featuredStory}
              sideStories={sideStories}
              onSelectStory={setReadingArticle}
              onToggleSave={handleToggleSave}
              isSaved={isSaved}
            />
          </div>
        )}

        {/* 5. ASYMMETRIC EDITORIAL GRID (01 / THE DISPATCH + IN BRIEF WIRE) */}
        <EditorialGrid
          stories={dispatchStories}
          inBriefStories={inBriefStories}
          onSelectStory={setReadingArticle}
          onToggleSave={handleToggleSave}
          isSaved={isSaved}
        />

        {/* 6. FULL-BLEED FEATURE MOMENT */}
        {featureBreakStory && (
          <FeatureBreak
            story={featureBreakStory}
            onSelectStory={setReadingArticle}
            onToggleSave={handleToggleSave}
            isSaved={isSaved}
          />
        )}

        {/* 7. NUMBERED CATEGORY SECTIONS */}
        <CategorySection
          sectionNumber="02"
          sectionId="hub-tech"
          title="Technology & AI"
          stories={techStories}
          seeAllHref="/feed/tech"
          onSelectStory={setReadingArticle}
          onToggleSave={handleToggleSave}
          isSaved={isSaved}
        />

        <CategorySection
          sectionNumber="03"
          sectionId="hub-design"
          title="Design & Architecture"
          stories={designStories}
          seeAllHref="/feed/design"
          onSelectStory={setReadingArticle}
          onToggleSave={handleToggleSave}
          isSaved={isSaved}
        />

        <CategorySection
          sectionNumber="04"
          sectionId="hub-culture"
          title="Culture & Essays"
          stories={cultureStories}
          seeAllHref="/feed/culture"
          onSelectStory={setReadingArticle}
          onToggleSave={handleToggleSave}
          isSaved={isSaved}
        />

        <CategorySection
          sectionNumber="05"
          sectionId="hub-science"
          title="Science & Cosmos"
          stories={scienceStories}
          seeAllHref="/feed/science"
          onSelectStory={setReadingArticle}
          onToggleSave={handleToggleSave}
          isSaved={isSaved}
        />

        <CategorySection
          sectionNumber="06"
          sectionId="hub-sports"
          title="Sports & Global Affairs"
          stories={sportsStories}
          seeAllHref="/feed/sports"
          onSelectStory={setReadingArticle}
          onToggleSave={handleToggleSave}
          isSaved={isSaved}
        />

        {/* 8. FROM THE ODYSSEUS DESK (3 Hand-Picked Stories across distinct categories) */}
        {deskPicks.length > 0 && (
          <DeskPicks
            stories={deskPicks}
            onSelectStory={setReadingArticle}
            onToggleSave={handleToggleSave}
            isSaved={isSaved}
          />
        )}

      </main>

      {/* 9. MAGAZINE FOOTER (Dark-green band with tagline) */}
      <MagazineFooter />

      {/* Add Feed Modal */}
      <AddFeedModal
        isOpen={isAddFeedOpen}
        onClose={() => setIsAddFeedOpen(false)}
        userId={profile?.id}
        onSuccess={refetch}
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
