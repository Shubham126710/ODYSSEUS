"use client";

import React, { useState, useEffect, useRef } from 'react';
import { AppHeader } from '@/components/AppHeader';
import { Footer } from '@/components/Footer';
import { useProfile } from '@/hooks/useProfile';
import { useFeedFetcher } from '@/hooks/useFeedFetcher';
import { useSavedStories } from '@/hooks/useSavedStories';
import { supabase } from '@/lib/supabaseClient';
import { MOCK_STORIES } from '@/lib/mockData';
import Link from 'next/link';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { InteractiveCompass } from '@/components/InteractiveCompass';
import { StaticOrangeCompass } from '@/components/StaticOrangeCompass';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

const FeedLoadingScreen = () => {
  const container = useRef<HTMLDivElement>(null);
  const compassRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLHeadingElement>(null);

  useGSAP(() => {
    // Compass spin
    gsap.to(compassRef.current, {
      rotation: 360,
      duration: 2,
      repeat: -1,
      ease: "none"
    });
    
    // Text pulse
    gsap.to(textRef.current, {
      opacity: 0.5,
      duration: 1,
      repeat: -1,
      yoyo: true,
      ease: "power1.inOut"
    });
  }, { scope: container });

  return (
    <div
      ref={container}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-juice-orange text-juice-cream"
    >
      <div className="relative flex flex-col items-center px-4">
        <div ref={compassRef}>
          <StaticOrangeCompass className="w-24 h-24 md:w-48 md:h-48 drop-shadow-2xl" />
        </div>
        
        <div className="mt-8 md:mt-12 space-y-2 text-center">
          <h2 ref={textRef} className="font-serif text-2xl md:text-5xl font-bold tracking-widest">
            CURATING FEED
          </h2>
          <p className="text-xs md:text-base font-mono uppercase tracking-[0.2em] md:tracking-[0.3em] opacity-80">
            Gathering stories from across the web...
          </p>
        </div>
      </div>
    </div>
  );
};
import { AddFeedModal } from '@/components/AddFeedModal';
import { ReadingModal } from '@/components/ReadingModal';
import { Toast } from '@/components/Toast';
import { EditorialMonogramPoster } from '@/components/EditorialMonogramPoster';
import { formatDistanceToNow, format } from 'date-fns';
import { decodeHtmlEntities } from '@/lib/textUtils';
import { getCurrentMultiplier, getExplorerRank } from '@/lib/gamification';

const TRENDING_HEADLINES = [
  { title: "The Future of Interface Design is Invisible", link: "#", source: "Design" },
  { title: "Sustainable Cities: A Blueprint for 2050", link: "#", source: "Future" },
  { title: "Why We Crave Analog in a Digital World", link: "#", source: "Culture" },
  { title: "The Quiet Revolution of Rust Programming", link: "#", source: "Tech" },
  { title: "SpaceX Launches New Mission to Mars", link: "#", source: "Space" },
  { title: "Minimalism is Back: The New Design Trend", link: "#", source: "Style" }
];

const GREETINGS = [
  { line1: "GOOD", line2: "MORNING", type: "morning" },
  { line1: "GOOD", line2: "AFTERNOON", type: "afternoon" },
  { line1: "GOOD", line2: "EVENING", type: "evening" },
  { line1: "GOOD", line2: "NIGHT", type: "night" },
  { line1: "HAPPY", line2: "READING", type: "any" },
  { line1: "WELCOME", line2: "BACK", type: "any" },
  { line1: "GREAT TO", line2: "BE BACK", type: "any" },
  { line1: "WELCOME", line2: "NIGHT OWL", type: "night" },
  { line1: "TODAY'S", line2: "UPDATE", type: "any" },
  { line1: "HOW", line2: "ARE YOU?", type: "any" },
  { line1: "READY TO", line2: "EXPLORE?", type: "any" },
  { line1: "YOUR", line2: "JOURNEY", type: "any" },
  { line1: "RISE", line2: "AND SHINE", type: "morning" },
  { line1: "LATE", line2: "READS", type: "night" },
];

// Helper to map feed titles to categories (fallback)
// Removed local helper in favor of hook logic

// Helper to calculate read time
// Removed local helper in favor of hook logic

export default function FeedPage() {
  const { profile, loading: profileLoading } = useProfile();
  const { stories, loading: loadingFeeds, refetch } = useFeedFetcher(profile?.id);
  const { isSaved, addSavedStory, removeSavedStory } = useSavedStories(profile?.id);
  const [greeting, setGreeting] = useState({ line1: "GOOD", line2: "MORNING" });
  const [headerTheme, setHeaderTheme] = useState<'light' | 'dark' | 'orange'>('light');
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, -50]);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  // RSS & Feed State
  const [headlines, setHeadlines] = useState<Array<{title: string, link: string, source: string}>>(TRENDING_HEADLINES);
  const [isAddFeedOpen, setIsAddFeedOpen] = useState(false);
  const [readingArticle, setReadingArticle] = useState<any>(null);
  const [initialLoad, setInitialLoad] = useState(true);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [toast, setToast] = useState({ message: '', isVisible: false });

  // Derived state for filtering
  const uniqueSources = Array.from(new Set(stories.map(s => s.source))).sort();
  const filteredStories = selectedSources.length > 0 
    ? stories.filter(s => selectedSources.includes(s.source))
    : stories;

  const toggleSource = (source: string) => {
    setSelectedSources(prev => 
      prev.includes(source) 
        ? prev.filter(s => s !== source)
        : [...prev, source]
    );
  };

  const fetchTrending = async () => {
    try {
      const res = await fetch('/api/rss?mode=trending');
      const data = await res.json();
      if (data.success && data.headlines.length > 0) {
        setHeadlines(data.headlines);
      }
    } catch (e) {
      console.error('Failed to fetch trending headlines');
    }
  };

  // Handle initial load state
  useEffect(() => {
    if (!loadingFeeds && !profileLoading) {
      const timer = setTimeout(() => setInitialLoad(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [loadingFeeds, profileLoading]);

  useEffect(() => {
    fetchTrending();

    const handleReaderEvent = (e: any) => {
      if (e.detail) setReadingArticle(e.detail);
    };
    window.addEventListener('odysseus:open-reader', handleReaderEvent);
    return () => window.removeEventListener('odysseus:open-reader', handleReaderEvent);
  }, []);

  const handleSaveForLater = async (story: any) => {
    if (!profile) return;
    
    try {
      if (isSaved(story)) {
        await removeSavedStory(story);
        setToast({ message: 'Removed from saved stories', isVisible: true });
      } else {
        await addSavedStory(story);
        setToast({ message: 'Saved for later!', isVisible: true });
      }
    } catch (e) {
      console.error("Save action failed", e);
      setToast({ message: 'Failed to update saved stories', isVisible: true });
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
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      try {
        await navigator.clipboard.writeText(story.link);
        setToast({ message: 'Link copied to clipboard!', isVisible: true });
      } catch {
        setToast({ message: 'Could not copy link', isVisible: true });
      }
    }
  };

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -400, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 400, behavior: 'smooth' });
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    const viewportHeight = e.currentTarget.clientHeight;
    const sectionIndex = Math.round(scrollTop / viewportHeight);

    // Section 0: Broadsheet (Cream) -> Light Theme
    // Section 1: Cover Story (Forest Green) -> Dark Theme
    // Section 2: Salon Anthology (Parchment Cream) -> Light Theme
    // Section 3: Curated Desks (Parchment Cream) -> Light Theme
    // Section 4: Footer (Forest Green) -> Dark Theme
    if (sectionIndex === 1 || sectionIndex === 4) {
      setHeaderTheme('dark');
    } else {
      setHeaderTheme('light');
    }
  };

  useEffect(() => {
    const getGreeting = () => {
      const now = new Date();
      const hour = now.getHours();
      let timeOfDay = 'night';
      
      if (hour >= 5 && hour < 12) timeOfDay = 'morning';
      else if (hour >= 12 && hour < 17) timeOfDay = 'afternoon';
      else if (hour >= 17 && hour < 22) timeOfDay = 'evening';

      const validGreetings = GREETINGS.filter(g => g.type === 'any' || g.type === timeOfDay);
      const randomGreeting = validGreetings[Math.floor(Math.random() * validGreetings.length)];
      
      return randomGreeting;
    };

    setGreeting(getGreeting());
  }, []);

  const featuredStory = filteredStories.length > 0 ? filteredStories[0] : null;
  const otherStories = filteredStories.length > 0 ? filteredStories.slice(1) : [];

  const multiplier = getCurrentMultiplier();
  const rank = getExplorerRank(profile?.total_reading_minutes || 0, profile?.streak_count || 1);
  const minutesToday = profile?.minutes_read_today || 0;
  const dailyGoal = profile?.daily_goal_minutes || 15;
  const freezesAvailable = profile?.streak_freezes_available ?? 1;
  const todayFormatted = format(new Date(), 'EEEE, d MMMM yyyy');

  const currentHour = new Date().getHours();
  const editionLabel = currentHour >= 5 && currentHour < 12 
    ? 'Morning Dispatch' 
    : currentHour >= 12 && currentHour < 17 
    ? 'Midday Edition' 
    : currentHour >= 17 && currentHour < 22 
    ? 'Dusk Journal' 
    : 'Night Owl Nocturne';

  return (
    <>
      {/* Full Screen Loading State */}
      <AnimatePresence>
        {(loadingFeeds || initialLoad || profileLoading) && (
          <FeedLoadingScreen />
        )}
      </AnimatePresence>

      <div className="fixed top-0 left-0 right-0 z-50">
        <AppHeader theme={headerTheme} />
      </div>

      <AddFeedModal 
        isOpen={isAddFeedOpen} 
        onClose={() => setIsAddFeedOpen(false)} 
        userId={profile?.id || ''}
        onSuccess={refetch}
      />

      <ReadingModal 
        isOpen={!!readingArticle} 
        onClose={() => setReadingArticle(null)} 
        article={readingArticle} 
        onSave={handleSaveForLater}
      />

      <div 
        ref={containerRef}
        onScroll={handleScroll}
        data-lenis-prevent
        className="h-[100dvh] overflow-y-scroll snap-y snap-mandatory bg-juice-cream font-sans selection:bg-juice-orange selection:text-white flex flex-col overflow-x-hidden scroll-smooth"
      >
      
      {/* HERO SECTION - The Editorial Broadside */}
      <section className="relative h-screen w-full flex flex-col justify-between overflow-hidden snap-start shrink-0 pt-14 md:pt-20 bg-juice-cream text-juice-green select-none">
        
        {/* Luxury Editorial Backdrop: Radial Glow, Archival Dot Grid & Corner Hallmarks */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_48%,rgba(255,250,240,0.95)_0%,rgba(245,242,235,0.75)_60%,rgba(238,232,220,0.85)_100%)] pointer-events-none" />
        
        {/* Fine Archival Dot Grid Texture */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-30" 
          style={{
            backgroundImage: 'radial-gradient(rgba(93, 130, 70, 0.18) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }} 
        />

        {/* Subtle Architectural Hairline Margins */}
        <div className="absolute inset-y-0 left-6 md:left-14 w-px bg-juice-green/10 pointer-events-none hidden sm:block" />
        <div className="absolute inset-y-0 right-6 md:right-14 w-px bg-juice-green/10 pointer-events-none hidden sm:block" />

        {/* Archival Corner Hallmarks */}
        <div className="absolute top-16 md:top-24 left-8 md:left-16 flex flex-col items-start gap-1 pointer-events-none hidden sm:flex">
          <div className="w-4 h-4 border-l border-t border-juice-green/30" />
          <span className="font-mono text-[8px] md:text-[9px] tracking-[0.2em] text-juice-green/50 uppercase">FOLIO N° 01 • SALON</span>
        </div>
        <div className="absolute top-16 md:top-24 right-8 md:right-16 flex flex-col items-end gap-1 pointer-events-none hidden sm:flex">
          <div className="w-4 h-4 border-r border-t border-juice-green/30" />
          <span className="font-mono text-[8px] md:text-[9px] tracking-[0.2em] text-juice-green/50 uppercase">EDITION PRINT • 2026</span>
        </div>
        <div className="absolute bottom-16 md:bottom-24 left-8 md:left-16 flex flex-col items-start gap-1 pointer-events-none hidden sm:flex">
          <span className="font-mono text-[8px] md:text-[9px] tracking-[0.2em] text-juice-green/50 uppercase">✦ HARVEST PRESS</span>
          <div className="w-4 h-4 border-l border-b border-juice-green/30" />
        </div>
        <div className="absolute bottom-16 md:bottom-24 right-8 md:right-16 flex flex-col items-end gap-1 pointer-events-none hidden sm:flex">
          <span className="font-mono text-[8px] md:text-[9px] tracking-[0.2em] text-juice-green/50 uppercase">SLOW JOURNALISM ✦</span>
          <div className="w-4 h-4 border-r border-b border-juice-green/30" />
        </div>

        {/* Archival Latitude Coordinates in Margins */}
        <div className="absolute top-16 md:top-24 left-16 md:left-24 font-mono text-[8px] md:text-[9px] tracking-[0.25em] text-juice-green/45 uppercase hidden lg:block pointer-events-none">
          LAT. 40°42&apos;46&quot;N • LON. 74°00&apos;21&quot;W
        </div>
        <div className="absolute top-16 md:top-24 right-16 md:right-24 font-mono text-[8px] md:text-[9px] tracking-[0.25em] text-juice-green/45 uppercase hidden lg:block pointer-events-none text-right">
          SALON DE L&apos;ODYSSEUS • ED. 2026
        </div>

        {/* Editorial Masthead Dateline */}
        <div className="shrink-0 w-full border-b border-juice-green/15 px-4 md:px-12 py-2 flex items-center justify-between text-[9px] md:text-xs font-mono uppercase tracking-[0.2em] text-juice-green/70 z-20 bg-juice-cream/40 backdrop-blur-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-juice-orange">VOL. IV</span>
            <span className="opacity-40">•</span>
            <span>NO. {String(new Date().getDate()).padStart(3, '0')}</span>
            <span className="hidden sm:inline-block opacity-40">•</span>
            <span className="hidden sm:inline-block font-semibold">{editionLabel}</span>
          </div>
          <div className="font-serif font-bold text-xs tracking-wider hidden md:block text-juice-green">
            THE ODYSSEUS JOURNAL
          </div>
          <div className="flex items-center gap-2 font-mono">
            <span>{todayFormatted}</span>
            <span className="opacity-40 hidden sm:inline-block">•</span>
            <span className="text-juice-orange font-bold hidden sm:inline-block">GLOBAL SALON</span>
          </div>
        </div>

        {/* Central Hero Broadside Showcase */}
        <div className="relative z-10 max-w-5xl mx-auto w-full px-4 md:px-8 flex-1 flex flex-col items-center justify-center text-center my-auto pt-4 pb-16 md:pt-6 md:pb-24">
          
          {/* Refined Editorial Status Ribbon */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-[10px] md:text-xs font-mono tracking-wider bg-white/70 border border-juice-green/15 text-juice-green mb-3 md:mb-5 shadow-xs"
          >
            <span className="text-juice-orange font-bold">✦</span>
            <span className="font-semibold uppercase">{editionLabel}</span>
            <span className="opacity-30">•</span>
            <span className="uppercase">{rank.title}</span>
            <span className="opacity-30">•</span>
            <span className="font-bold text-juice-orange">{profile?.streak_count || 1}D STREAK</span>
          </motion.div>

          {/* Main Headline with Handcrafted Curved Vector Underline */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.1, type: "spring" }}
            className="space-y-2 mb-3 md:mb-6"
          >
            <div className="text-[9px] md:text-xs font-mono uppercase tracking-[0.25em] text-juice-green/60">
              DISPATCH EDITION • CURATED CHRONICLE
            </div>
            <h1 className="font-serif text-2xl sm:text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-juice-green leading-[1.08]">
              <span className="italic font-normal">Welcome back, </span>
              <span className="relative inline-block text-juice-orange not-italic">
                {profile?.first_name || 'Traveler'}
                {/* Handcrafted Symmetrical Curved Smile Underline SVG */}
                <svg
                  className="absolute left-0 -bottom-1.5 md:-bottom-2 w-full h-2 md:h-2.5 text-juice-orange pointer-events-none overflow-hidden"
                  viewBox="0 0 100 8"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M 2 4.5 Q 50 8 98 4"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    fill="none"
                  />
                </svg>
              </span>
              <span>.</span>
            </h1>
            <p className="max-w-lg mx-auto text-xs sm:text-sm text-juice-green/75 leading-relaxed font-sans mt-2 md:mt-4">
              Curated salon of slow journalism, technology, architecture, and global affairs.
            </p>
          </motion.div>

          {/* Centerpiece: Clean Interactive Compass Framed by Celestial Astrolabe Rings */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2, type: "spring", damping: 16 }}
            className="relative my-2 sm:my-4 flex items-center justify-center"
          >
            {/* Celestial Astrolabe Coordinate Rings centered strictly on Compass */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none -z-10">
              <svg 
                className="w-36 h-36 sm:w-52 sm:h-52 md:w-64 md:h-64 text-juice-green/35 animate-[spin_180s_linear_infinite]" 
                viewBox="0 0 240 240" 
                fill="none"
              >
                <circle cx="120" cy="120" r="66" stroke="currentColor" strokeWidth="1" strokeDasharray="3 4" opacity="0.5" />
                <circle cx="120" cy="120" r="92" stroke="currentColor" strokeWidth="1.2" opacity="0.4" />
                <circle cx="120" cy="120" r="110" stroke="currentColor" strokeWidth="0.8" strokeDasharray="2 4" opacity="0.3" />
                {/* Cardinal Tick Marks */}
                <line x1="120" y1="2" x2="120" y2="12" stroke="currentColor" strokeWidth="1.5" />
                <line x1="120" y1="228" x2="120" y2="238" stroke="currentColor" strokeWidth="1.5" />
                <line x1="2" y1="120" x2="12" y2="120" stroke="currentColor" strokeWidth="1.5" />
                <line x1="228" y1="120" x2="238" y2="120" stroke="currentColor" strokeWidth="1.5" />
              </svg>
              {/* Subtle Warm Amber Glow Halo */}
              <div className="absolute w-32 h-32 sm:w-44 sm:h-44 rounded-full bg-juice-orange/10 blur-xl pointer-events-none" />
            </div>

            <InteractiveCompass className="w-20 h-20 sm:w-28 sm:h-28 md:w-36 md:h-36 text-juice-orange drop-shadow-xl hover:scale-105 transition-transform" />
          </motion.div>

          {/* Quick Magazine Portals (Two Clean Primary Actions) */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex items-center justify-center gap-3 mt-3"
          >
            <button
              onClick={() => {
                if (containerRef.current) {
                  containerRef.current.scrollTo({ top: containerRef.current.clientHeight, behavior: 'smooth' });
                }
              }}
              className="px-5 py-2.5 rounded-full bg-juice-green hover:bg-[#4b6a38] text-juice-cream font-bold text-xs font-mono uppercase tracking-wider shadow-md hover:scale-105 transition-all flex items-center gap-2 group"
            >
              <span>Read Cover Story</span>
              <span className="group-hover:translate-y-0.5 transition-transform font-sans">↓</span>
            </button>

            <button
              onClick={() => {
                if (containerRef.current) {
                  containerRef.current.scrollTo({ top: containerRef.current.clientHeight * 2, behavior: 'smooth' });
                }
              }}
              className="px-5 py-2.5 rounded-full bg-white/80 hover:bg-white text-juice-green border border-juice-green/20 hover:border-juice-green/40 font-bold text-xs font-mono uppercase tracking-wider shadow-xs hover:scale-105 transition-all flex items-center gap-2"
            >
              <span>The Collection</span>
              <span className="text-juice-orange font-mono">({stories.length})</span>
              <span className="font-sans">→</span>
            </button>
          </motion.div>

          {/* Kinetic Scroll Prompt Indicator */}
          <div className="mt-3 flex items-center gap-2 text-[9px] font-mono uppercase tracking-[0.25em] text-juice-green/50">
            <span className="w-1.5 h-1.5 rounded-full bg-juice-orange" />
            <span>Scroll to browse edition</span>
            <span>↓</span>
          </div>
        </div>



        {/* News Ticker Ribbon */}
        <div className="absolute bottom-0 left-0 right-0 h-12 md:h-20 bg-juice-orange flex items-center z-30 border-t-2 md:border-t-4 border-juice-cream shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
          
          {/* Static Label Section */}
          <div className="h-full bg-juice-orange flex items-center pl-3 md:pl-8 pr-4 md:pr-6 z-40 relative shrink-0">
             <div className="bg-juice-cream px-2.5 md:px-5 py-1 md:py-2 rounded-full text-juice-orange font-black text-[8px] md:text-sm uppercase tracking-widest flex items-center gap-1.5 md:gap-2 shadow-sm ring-2 ring-juice-orange ring-offset-2 ring-offset-juice-cream">
               <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-juice-orange" />
               Trending
             </div>
          </div>

          {/* Scrolling Content Section */}
          <div className="flex-1 overflow-hidden relative h-full flex items-center bg-juice-orange">
             {/* Gradient Mask for smooth fade in from left */}
             <div className="absolute left-0 top-0 bottom-0 w-8 md:w-16 bg-gradient-to-r from-juice-orange to-transparent z-10 pointer-events-none" />
             <div className="absolute right-0 top-0 bottom-0 w-8 md:w-16 bg-gradient-to-l from-juice-orange to-transparent z-10 pointer-events-none" />
             
             <motion.div 
                className="flex items-center gap-8 md:gap-16 pl-6 md:pl-12 w-max"
                animate={{ x: "-50%" }}
                transition={{ repeat: Infinity, duration: 90, ease: "linear" }}
              >
                {/* Duplicate list once to create seamless loop */}
                {[...headlines, ...headlines].map((headline, i) => (
                  <button 
                    key={i} 
                    onClick={() => setReadingArticle({
                      title: headline.title,
                      link: headline.link,
                      source: headline.source,
                      excerpt: '',
                      date: 'Trending',
                      readTime: '3 min'
                    })}
                    className="text-xs md:text-xl font-bold uppercase tracking-wider flex items-center gap-3 md:gap-6 text-juice-cream/90 hover:text-white hover:underline decoration-2 underline-offset-4 transition-all cursor-pointer whitespace-nowrap"
                  >
                    {headline.title}
                    <span className="w-1 md:w-1.5 h-1 md:h-1.5 rounded-full bg-juice-cream/50" />
                  </button>
                ))}
              </motion.div>
          </div>
        </div>
      </section>

      {/* FEATURED STORY - Green */}
      <section className="min-h-screen md:h-screen bg-juice-green text-juice-cream flex items-center py-10 md:py-16 px-4 md:px-12 relative snap-start shrink-0 pt-20 md:pt-24 pb-8 md:pb-12">
        {featuredStory ? (
          <div className="max-w-7xl mx-auto w-full grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="space-y-4 md:space-y-6"
            >
              <div className="flex items-center gap-4 text-juice-orange font-bold tracking-widest uppercase text-sm">
                <span className="w-12 h-[1px] bg-juice-orange"></span>
                Top Story
              </div>
              <div 
                onClick={() => setReadingArticle(featuredStory)}
                className="block group cursor-pointer"
              >
                <h2 className="text-2xl md:text-5xl font-serif font-bold leading-tight group-hover:text-juice-orange transition-colors duration-300">
                  {decodeHtmlEntities(featuredStory.title)}
                </h2>
              </div>
              <p className="text-sm md:text-lg opacity-80 leading-relaxed max-w-xl line-clamp-3">
                {decodeHtmlEntities(featuredStory.excerpt)}
              </p>
              <div className="flex items-center gap-6 text-sm font-mono opacity-60">
                <span>{decodeHtmlEntities(featuredStory.source)}</span>
                <span>•</span>
                <span>{featuredStory.readTime}</span>
              </div>
              {featuredStory.relatedPerspectives && featuredStory.relatedPerspectives.length > 0 && (
                <div className="pt-2">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-juice-orange block mb-1.5 font-bold">
                    ✦ Alternative Perspectives ({featuredStory.relatedPerspectives.length})
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
                        className="text-xs px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center gap-1.5 transition-colors text-left"
                      >
                        <span className="font-bold text-juice-orange">{p.source}:</span>
                        <span className="truncate max-w-[180px] md:max-w-[240px] opacity-90">{decodeHtmlEntities(p.title)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <button 
                onClick={() => setReadingArticle(featuredStory)}
                className="mt-6 px-8 py-3 border border-juice-cream rounded-full font-bold uppercase tracking-widest hover:bg-juice-cream hover:text-juice-green transition-all duration-300 shadow-md hover:scale-105 active:scale-95"
              >
                Read Story
              </button>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative aspect-[4/5] md:aspect-square rounded-3xl overflow-hidden shadow-2xl rotate-1 hover:rotate-0 transition-transform duration-500 max-h-[50vh] md:max-h-none mx-auto w-full bg-juice-cream/10 border border-white/15"
            >
              {featuredStory.imageUrl ? (
                <img 
                  src={featuredStory.imageUrl} 
                  alt={featuredStory.title} 
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (!target.src.includes('/api/image-proxy') && featuredStory.imageUrl) {
                      target.src = `/api/image-proxy?url=${encodeURIComponent(featuredStory.imageUrl)}`;
                    } else {
                      target.style.display = 'none';
                      const fallback = target.nextElementSibling as HTMLElement;
                      if (fallback) fallback.style.display = 'block';
                    }
                  }}
                  className="w-full h-full object-cover"
                />
              ) : null}
              <div 
                style={{ display: featuredStory.imageUrl ? 'none' : 'block' }} 
                className="w-full h-full"
              >
                <EditorialMonogramPoster 
                  source={featuredStory.source} 
                  category={featuredStory.category} 
                  title={featuredStory.title} 
                  className="w-full h-full" 
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-juice-green/80 via-transparent to-transparent opacity-50 pointer-events-none" />
            </motion.div>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto w-full flex flex-col items-center justify-center text-center">
            <h2 className="font-serif text-5xl md:text-6xl font-bold mb-6">Your Feed is Empty</h2>
            <p className="text-xl opacity-80 mb-10 max-w-xl">
              Add your favorite sources to start curating your personal reading journey.
            </p>
            <button 
              onClick={() => setIsAddFeedOpen(true)}
              className="px-8 py-4 bg-juice-cream text-juice-green rounded-full font-bold uppercase tracking-widest hover:bg-white transition-all duration-300"
            >
              Add Sources
            </button>
          </div>
        )}
      </section>

      {/* SECTION 2: THE ANTHOLOGY - Warm Parchment Salon Collection */}
      <section className="min-h-[100dvh] md:h-[100dvh] md:max-h-[100dvh] bg-[#FAF7F0] text-juice-green flex flex-col justify-between pt-16 pb-4 md:pt-20 md:pb-6 px-4 md:px-8 relative snap-start snap-always shrink-0 overflow-y-auto md:overflow-hidden select-none">
        
        {/* Archival Stipple Grid Texture */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-25" 
          style={{
            backgroundImage: 'radial-gradient(rgba(93, 130, 70, 0.18) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }} 
        />

        <div className="w-full max-w-[1400px] mx-auto px-2 md:px-6 flex flex-col h-full justify-between z-10">
          
          {/* Section Header */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center shrink-0 pt-1"
          >
            <div className="text-[9px] md:text-xs font-mono uppercase tracking-[0.25em] text-juice-orange font-bold mb-1">
              ✦ THE SALON ANTHOLOGY • VOL. IV
            </div>
            <h3 className="font-serif text-2xl md:text-4xl font-bold tracking-tight text-juice-green mb-1">
              The Salon Collection
            </h3>
            <p className="text-xs md:text-sm text-juice-green/70 max-w-xl mx-auto">
              Curated dispatches from prestige global publications, updated in real time.
            </p>
            
            {/* Source Filter Letterpress Pills */}
            {uniqueSources.length > 0 && (
              <div className="flex flex-nowrap sm:flex-wrap justify-start sm:justify-center gap-1.5 md:gap-2 mt-2 md:mt-3 max-w-3xl mx-auto overflow-x-auto scrollbar-hide px-2">
                {uniqueSources.map(source => (
                  <button
                    key={source}
                    onClick={() => toggleSource(source)}
                    className={`px-3 py-1 rounded-full text-[10px] md:text-xs font-mono font-bold uppercase tracking-wider transition-all border whitespace-nowrap shrink-0 ${
                      selectedSources.includes(source)
                        ? 'bg-juice-green text-juice-cream border-juice-green shadow-xs'
                        : 'bg-white/80 text-juice-green/70 border-juice-green/20 hover:border-juice-green hover:text-juice-green'
                    }`}
                  >
                    {source}
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Horizontal Scroll Container */}
          <div className="relative flex-grow flex items-center w-full my-auto py-2">
            
            {/* Left Navigation Button */}
            <button 
              onClick={scrollLeft}
              className="absolute left-1 md:left-2 z-20 w-10 h-10 md:w-11 md:h-11 rounded-full bg-juice-green text-juice-cream flex items-center justify-center shadow-md hover:bg-juice-orange hover:scale-105 transition-all hidden md:flex"
              aria-label="Scroll Left"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
            </button>

            <div 
              ref={scrollContainerRef}
              className="flex-grow flex items-center overflow-x-auto snap-x snap-mandatory scrollbar-hide py-2 px-2 md:px-12 gap-5 md:gap-6 w-full"
            >
              {loadingFeeds && (
                <div className="flex items-center justify-center w-full h-full min-h-[380px]">
                  <div className="animate-spin rounded-full h-10 w-10 border-2 border-juice-green/30 border-t-juice-orange"></div>
                </div>
              )}

              {!loadingFeeds && filteredStories.length === 0 && (
                <div className="flex flex-col items-center justify-center w-full h-full min-h-[380px] text-juice-green text-center">
                  <p className="text-xl md:text-2xl font-serif mb-4">
                    {stories.length === 0 ? "Your collection is empty." : "No stories match this filter."}
                  </p>
                  {stories.length === 0 && (
                    <button 
                      onClick={() => setIsAddFeedOpen(true)}
                      className="px-6 py-2.5 bg-juice-green text-juice-cream rounded-full font-mono font-bold uppercase tracking-wider text-xs hover:bg-juice-orange transition-colors shadow-sm"
                    >
                      Add Your First Source
                    </button>
                  )}
                </div>
              )}

              {!loadingFeeds && otherStories.map((story, index) => (
                <motion.div
                  key={story.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ 
                    delay: Math.min(index * 0.04, 0.3), 
                    type: "spring",
                    stiffness: 220,
                    damping: 22
                  }}
                  className="snap-center shrink-0"
                >
                  <div 
                    onClick={() => setReadingArticle(story)}
                    className="cursor-pointer block h-full"
                  >
                    <div className="w-[82vw] max-w-[310px] md:max-w-[370px] bg-white rounded-2xl md:rounded-3xl p-4 md:p-5 shadow-xs border border-juice-green/15 flex flex-col h-[370px] md:h-[450px] relative overflow-hidden group hover:-translate-y-1.5 hover:border-juice-orange/50 hover:shadow-xl transition-all duration-300">
                      
                      {/* Top Foil Hairline */}
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-juice-green/30 to-juice-orange/40" />

                      {/* Header: Source & Date */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-juice-green/10 border border-juice-green/15 flex items-center justify-center text-juice-green font-mono font-bold text-[10px]">
                            {story.source.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-juice-green truncate max-w-[120px]">{story.source}</span>
                            <span className="text-[8px] font-mono text-juice-green/50 uppercase">{story.date}</span>
                          </div>
                        </div>
                        <div className="px-2 py-0.5 rounded-full bg-juice-green/5 border border-juice-green/10 text-[8px] font-mono font-bold uppercase tracking-wider text-juice-green/70">
                          {story.category}
                        </div>
                      </div>

                      {/* Title */}
                      <h3 className="font-serif text-sm md:text-lg font-bold text-juice-green mb-2 leading-snug group-hover:text-juice-orange transition-colors duration-200 line-clamp-2 md:line-clamp-3">
                        {decodeHtmlEntities(story.title)}
                      </h3>

                      {/* Image Area with 4-Tier Fallback */}
                      <div className="w-full h-28 md:h-36 rounded-xl overflow-hidden mb-3 relative shrink-0 bg-juice-green/5">
                        {story.imageUrl || (story as any).enclosure?.url ? (
                          <img 
                            src={story.imageUrl || (story as any).enclosure?.url} 
                            alt={story.title} 
                            onError={(e) => {
                              const target = e.currentTarget;
                              const originalUrl = story.imageUrl || (story as any).enclosure?.url;
                              if (!target.src.includes('/api/image-proxy') && originalUrl) {
                                target.src = `/api/image-proxy?url=${encodeURIComponent(originalUrl)}`;
                              } else {
                                target.style.display = 'none';
                                const fallback = target.nextElementSibling as HTMLElement;
                                if (fallback) fallback.style.display = 'block';
                              }
                            }}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                        ) : null}
                        <div 
                          style={{ display: (story.imageUrl || (story as any).enclosure?.url) ? 'none' : 'block' }} 
                          className="w-full h-full"
                        >
                          <EditorialMonogramPoster 
                            source={story.source} 
                            category={story.category} 
                            title={story.title} 
                            className="w-full h-full" 
                          />
                        </div>
                      </div>

                      {/* Excerpt */}
                      <p className="text-juice-green/75 text-xs leading-relaxed line-clamp-2 mb-3 flex-grow font-sans hidden sm:block">
                        {decodeHtmlEntities(story.excerpt)}
                      </p>

                      {/* Footer Actions */}
                      <div className="flex items-center justify-between pt-3 border-t border-juice-green/10 mt-auto text-juice-green/60">
                        <div className="flex items-center gap-1.5 text-[10px] font-mono">
                          <span>⏱</span>
                          <span className="font-bold">{story.readTime}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleSaveForLater(story); }}
                            className={`transition-colors hover:scale-110 transform duration-200 ${isSaved(story) ? 'text-juice-orange' : 'text-juice-green/50 hover:text-juice-orange'}`}
                            title={isSaved(story) ? "Saved" : "Save for Later"}
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill={isSaved(story) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleShare(story); }}
                            className="text-juice-green/50 hover:text-juice-orange transition-colors hover:scale-110 transform duration-200"
                            title="Share"
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
              
              {/* Add Source Card */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="snap-center shrink-0"
              >
                <button 
                  onClick={() => setIsAddFeedOpen(true)}
                  className="w-[82vw] max-w-[310px] md:max-w-[370px] h-[370px] md:h-[450px] bg-white/70 border-2 border-dashed border-juice-green/25 hover:border-juice-orange hover:bg-white rounded-2xl md:rounded-3xl p-6 flex flex-col items-center justify-center text-juice-green transition-all duration-300 group shadow-xs hover:shadow-lg"
                >
                  <span className="text-4xl md:text-5xl mb-4 group-hover:scale-110 transition-transform duration-300 text-juice-orange font-light">+</span>
                  <span className="font-mono font-bold uppercase tracking-widest text-sm md:text-base">Add Publication</span>
                  <span className="text-xs text-juice-green/60 mt-1 font-mono">Curate personal RSS desk</span>
                </button>
              </motion.div>
            </div>

            {/* Right Navigation Button */}
            <button 
              onClick={scrollRight}
              className="absolute right-1 md:right-2 z-20 w-10 h-10 md:w-11 md:h-11 rounded-full bg-juice-green text-juice-cream flex items-center justify-center shadow-md hover:bg-juice-orange hover:scale-105 transition-all hidden md:flex"
              aria-label="Scroll Right"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          </div>

          {/* Section Indicator */}
          <div className="shrink-0 flex items-center justify-center gap-2 text-[9px] md:text-[10px] font-mono uppercase tracking-[0.2em] text-juice-green/50 pb-1">
            <span>Scroll for Curated Desks</span>
            <span className="text-juice-orange font-bold">↓</span>
          </div>
        </div>
      </section>

      {/* SECTION 3: CURATED DESKS / THE 5 THEMATIC TERRITORIES */}
      <section className="min-h-[100dvh] md:h-[100dvh] md:max-h-[100dvh] bg-juice-cream text-juice-green flex flex-col justify-between pt-16 pb-6 md:pt-20 md:pb-6 px-4 md:px-8 relative snap-start snap-always shrink-0 overflow-y-auto md:overflow-hidden select-none">
        
        {/* Archival Stipple Grid */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-20" 
          style={{
            backgroundImage: 'radial-gradient(rgba(93, 130, 70, 0.18) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }} 
        />

        <div className="max-w-7xl mx-auto w-full flex flex-col h-full justify-between z-10">
          
          {/* Section Header */}
          <div className="text-center space-y-1 shrink-0 pt-1">
            <div className="text-[9px] md:text-xs font-mono uppercase tracking-[0.25em] text-juice-orange font-bold">
              EDITORIAL DESKS • 5 THEMATIC TERRITORIES
            </div>
            <h2 className="font-serif text-2xl md:text-4xl font-bold tracking-tight text-juice-green">
              Curated Genre Desks
            </h2>
            <p className="max-w-xl mx-auto text-xs md:text-sm text-juice-green/70">
              Immerse yourself by discipline. Each desk gathers authoritative reporting from prestige publications.
            </p>
          </div>

          {/* Desk Cards Grid (5 Desks in 5 columns on lg, 2 cols on sm, 1 col on mobile) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 md:gap-3.5 my-auto py-2">
            {[
              {
                id: 'tech',
                glyph: '✦',
                desk: 'The Vanguard',
                category: 'Tech & AI',
                desc: 'Frontier models, cybernetics, chip architecture, and the digital frontier.',
                sources: 'Wired • Verge • MIT',
                border: 'border-juice-green/15 hover:border-juice-orange',
              },
              {
                id: 'design',
                glyph: '◈',
                desk: 'The Atelier',
                category: 'Design & Craft',
                desc: 'Spatial architecture, typography, tactile objects, and visual culture.',
                sources: 'Dezeen • Eye • It\'s Nice That',
                border: 'border-juice-green/15 hover:border-juice-orange',
              },
              {
                id: 'culture',
                glyph: '◆',
                desk: 'The Forum',
                category: 'Culture & Essays',
                desc: 'Philosophy, slow journalism, literary criticism, and the human condition.',
                sources: 'The Atlantic • Aeon',
                border: 'border-juice-green/15 hover:border-juice-orange',
              },
              {
                id: 'chronicle',
                glyph: '—',
                desk: 'The Chronicle',
                category: 'Global Affairs',
                desc: 'Geopolitical analysis, macro markets, and international chronicles.',
                sources: 'NY Times • Bloomberg',
                border: 'border-juice-green/15 hover:border-juice-orange',
              },
              {
                id: 'science',
                glyph: '❖',
                desk: 'The Observatory',
                category: 'Science & Cosmos',
                desc: 'Astrophysics, biology, quantum mechanics, and planetary discovery.',
                sources: 'Quanta • Nature',
                border: 'border-juice-green/15 hover:border-juice-orange',
              },
            ].map((desk) => (
              <Link
                key={desk.id}
                href={`/feed/${desk.id}`}
                className={`group p-3.5 md:p-4 rounded-2xl md:rounded-3xl bg-white/80 border ${desk.border} shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-juice-orange font-bold font-mono">
                      {desk.glyph}
                    </span>
                    <span className="text-xs font-mono font-bold text-juice-orange group-hover:translate-x-1 transition-transform">
                      →
                    </span>
                  </div>
                  <div className="text-[8px] md:text-[9px] font-mono font-bold uppercase tracking-widest text-juice-green/50 mb-0.5">
                    {desk.desk}
                  </div>
                  <h3 className="font-serif text-base md:text-lg font-bold text-juice-green mb-1.5 group-hover:text-juice-orange transition-colors">
                    {desk.category}
                  </h3>
                  <p className="text-[10px] md:text-[11px] text-juice-green/75 leading-relaxed line-clamp-2 md:line-clamp-3 mb-2 font-sans">
                    {desk.desc}
                  </p>
                </div>
                <div className="pt-2 border-t border-juice-green/10 flex items-center justify-between text-[8px] md:text-[9px] font-mono text-juice-green/60">
                  <span className="truncate">{desk.sources}</span>
                </div>
              </Link>
            ))}
          </div>

          {/* Section prompt */}
          <div className="shrink-0 flex items-center justify-center gap-3 text-[9px] md:text-[10px] font-mono uppercase tracking-wider text-juice-green/60 pb-1">
            <span>Scroll down for Masthead Archive</span>
            <span className="text-juice-orange font-bold">↓</span>
          </div>
        </div>
      </section>

      <div className="snap-start shrink-0">
        <Footer />
      </div>
    </div>
    
    <Toast 
        message={toast.message} 
        isVisible={toast.isVisible} 
        onClose={() => setToast(prev => ({ ...prev, isVisible: false }))} 
      />
    </>
  );
}
