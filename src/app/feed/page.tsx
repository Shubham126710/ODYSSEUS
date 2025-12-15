"use client";

import React, { useState, useEffect } from 'react';
import { AppHeader } from '@/components/AppHeader';
import { Footer } from '@/components/Footer';
import { useProfile } from '@/hooks/useProfile';
import { useFeedFetcher } from '@/hooks/useFeedFetcher';
import { supabase } from '@/lib/supabaseClient';
import { MOCK_STORIES } from '@/lib/mockData';
import Link from 'next/link';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { InteractiveCompass } from '@/components/InteractiveCompass';
import { StaticOrangeCompass } from '@/components/StaticOrangeCompass';

const FeedLoadingScreen = () => {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-juice-orange text-juice-cream"
    >
      <div className="relative flex flex-col items-center">
        {/* Rotating Compass */}
        <div className="animate-[spin_3s_ease-in-out_infinite]">
          <StaticOrangeCompass className="w-32 h-32 md:w-48 md:h-48 drop-shadow-2xl" />
        </div>
        
        {/* Loading Text */}
        <div className="mt-12 space-y-2 text-center">
          <h2 className="font-serif text-3xl md:text-5xl font-bold tracking-widest animate-pulse">
            CURATING FEED
          </h2>
          <p className="text-sm md:text-base font-mono uppercase tracking-[0.3em] opacity-80">
            Gathering stories from across the web...
          </p>
        </div>
      </div>
    </motion.div>
  );
};
import { AddFeedModal } from '@/components/AddFeedModal';
import { ReadingModal } from '@/components/ReadingModal';
import { formatDistanceToNow } from 'date-fns';

const TRENDING_HEADLINES = [
  "The Future of Interface Design is Invisible",
  "Sustainable Cities: A Blueprint for 2050",
  "Why We Crave Analog in a Digital World",
  "The Quiet Revolution of Rust Programming",
  "SpaceX Launches New Mission to Mars",
  "Minimalism is Back: The New Design Trend"
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
const getCategoryForFeed = (source: string) => {
  const s = source.toLowerCase();
  if (s.includes('verge') || s.includes('tech') || s.includes('wired') || s.includes('hacker')) return 'tech';
  if (s.includes('design') || s.includes('smashing') || s.includes('ux')) return 'design';
  if (s.includes('culture') || s.includes('atlantic') || s.includes('new yorker')) return 'culture';
  if (s.includes('science') || s.includes('space') || s.includes('nature')) return 'science';
  return 'general';
};

// Helper to calculate read time
const calculateReadTime = (text: string) => {
  const wordsPerMinute = 130; // Slower reading speed for more generous estimates
  const words = text.trim().split(/\s+/).length;
  const minutes = Math.ceil(words / wordsPerMinute);
  return `${minutes} min`;
};

export default function FeedPage() {
  const { profile } = useProfile();
  const [greeting, setGreeting] = useState({ line1: "GOOD", line2: "MORNING" });
  const [headerTheme, setHeaderTheme] = useState<'light' | 'dark' | 'orange'>('light');
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, -50]);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  // RSS & Feed State
  const [stories, setStories] = useState<any[]>([]);
  const [headlines, setHeadlines] = useState<string[]>(TRENDING_HEADLINES);
  const [isAddFeedOpen, setIsAddFeedOpen] = useState(false);
  const [readingArticle, setReadingArticle] = useState<any>(null);
  const [loadingFeeds, setLoadingFeeds] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);

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

  const fetchFeeds = async () => {
    if (!profile) return;
    // Only show full screen loader on first load
    if (stories.length === 0) setLoadingFeeds(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`/api/rss?userId=${profile.id}&t=${Date.now()}`, { 
        cache: 'no-store',
        headers: {
          'Authorization': `Bearer ${session?.access_token || ''}`
        }
      });
      const data = await res.json();
      if (data.success && data.items.length > 0) {
        // Transform RSS items to match story structure
        const rssStories = data.items.map((item: any, index: number) => {
          // Better image extraction logic
          let imageUrl = null;

          // 1. Check media:thumbnail (Common in Wired, Verge, etc)
          // The backend now passes this through via customFields
          if (item['media:thumbnail']) {
             if (Array.isArray(item['media:thumbnail'])) {
                // Get the largest one or the first one
                imageUrl = item['media:thumbnail'][0]?.['$']?.url || item['media:thumbnail'][0]?.url;
             } else {
                imageUrl = item['media:thumbnail']?.['$']?.url || item['media:thumbnail']?.url;
             }
          }

          // 2. Check media:content (Yahoo, Bing, etc)
          if (!imageUrl && item['media:content']) {
            if (Array.isArray(item['media:content'])) {
               // Find one with type image
               const media = item['media:content'].find((m: any) => m['$']?.type?.startsWith('image') || m.type?.startsWith('image'));
               imageUrl = media?.['$']?.url || media?.url || item['media:content'][0]?.['$']?.url || item['media:content'][0]?.url;
            } else {
               imageUrl = item['media:content']?.['$']?.url || item['media:content']?.url;
            }
          }

          // 3. Check standard enclosure
          if (!imageUrl && item.enclosure && item.enclosure.type?.startsWith('image')) {
            imageUrl = item.enclosure.url;
          }
          
          // 4. Regex to find <img src="..."> in content
          const imgRegex = /<img[^>]+src=["']([^"']+)["']/;
          
          if (!imageUrl && item.content) {
            const match = item.content.match(imgRegex);
            if (match) imageUrl = match[1];
          }
          
          if (!imageUrl && item['content:encoded']) {
            const match = item['content:encoded'].match(imgRegex);
            if (match) imageUrl = match[1];
          }

          if (!imageUrl && item.description) {
             const match = item.description.match(imgRegex);
             if (match) imageUrl = match[1];
          }

          // Fallback for TechCrunch and others if no image found
          if (!imageUrl) {
             const sourceLower = (item.source || '').toLowerCase();
             if (sourceLower.includes('techcrunch')) {
                imageUrl = 'https://techcrunch.com/wp-content/uploads/2015/02/cropped-cropped-favicon-gradient.png?w=600'; // TechCrunch Logo/Placeholder
             } else if (sourceLower.includes('verge')) {
                imageUrl = 'https://cdn.vox-cdn.com/uploads/chorus_asset/file/7395361/verge-social-share.jpg';
             } else if (sourceLower.includes('wired')) {
                imageUrl = 'https://www.wired.com/verso/static/wired/assets/logo-header.svg'; // Or a better generic image
             }
          }

          // Clean excerpt
          const rawExcerpt = item.contentSnippet || item.content || item.summary || '';
          const cleanExcerpt = rawExcerpt.replace(/<[^>]*>?/gm, '').substring(0, 150) + '...';

          // Calculate read time
          const fullText = item.content || item['content:encoded'] || item.summary || '';
          const readTime = calculateReadTime(fullText);

          return {
            id: item.guid || item.link || index,
            title: item.title,
            excerpt: cleanExcerpt,
            source: item.source || 'RSS Feed',
            readTime: readTime,
            date: item.isoDate ? formatDistanceToNow(new Date(item.isoDate), { addSuffix: true }) : 'Just now',
            category: getCategoryForFeed(item.source || ''),
            imageUrl: imageUrl,
            link: item.link,
            content: item.content || item['content:encoded'] || item.description || item.summary
          };
        });
        setStories(rssStories);
      } else {
        setStories([]);
      }
    } catch (error) {
      console.error('Failed to fetch feeds', error);
    } finally {
      setLoadingFeeds(false);
      // Extended delay to ensure images are starting to load and animations are ready
      // This solves the "fetching info late" feeling by keeping the curtain down longer
      setTimeout(() => setInitialLoad(false), 2000); 
    }
  };

  useEffect(() => {
    fetchTrending();
    if (profile) {
      fetchFeeds();
    } else {
      // If no profile (not logged in), stop loading so we don't get stuck
      // Ideally we should redirect to login, but let's just show empty state or mock data
      setLoadingFeeds(false);
      setInitialLoad(false);
    }
  }, [profile]);

  const handleSaveForLater = async (story: any) => {
    if (!profile) return;
    try {
      await fetch('/api/read-later', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: profile.id,
          url: story.link || story.id, // Fallback
          title: story.title,
          excerpt: story.excerpt,
          image_url: story.imageUrl,
          source_name: story.source,
          content: story.content
        })
      });
      alert('Saved for later!');
    } catch (e) {
      console.error(e);
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

    // Section 0: Hero (Cream) -> Light Theme (Green Text)
    // Section 1: Featured (Green) -> Dark Theme (Cream Text)
    // Section 2: Feed (Orange) -> Orange Theme (Cream Text on Orange)
    // Section 3: Footer (Green) -> Dark Theme (Cream Text)
    
    if (sectionIndex === 0) {
      setHeaderTheme('light');
    } else if (sectionIndex === 2) {
      setHeaderTheme('orange');
    } else {
      setHeaderTheme('dark');
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

  const featuredStory = stories.length > 0 ? stories[0] : null;
  const otherStories = stories.length > 0 ? stories.slice(1) : [];

  return (
    <div 
      onScroll={handleScroll}
      className="h-screen overflow-y-scroll snap-y snap-mandatory scroll-smooth bg-juice-cream font-sans selection:bg-juice-orange selection:text-white flex flex-col overflow-x-hidden"
    >
      {/* Full Screen Loading State */}
      <AnimatePresence>
        {(loadingFeeds || initialLoad) && (
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
        onSuccess={fetchFeeds}
      />

      <ReadingModal 
        isOpen={!!readingArticle} 
        onClose={() => setReadingArticle(null)} 
        article={readingArticle} 
      />
      
      {/* HERO SECTION - Cream */}
      <section className="relative h-screen snap-start flex flex-col items-center justify-center overflow-hidden shrink-0">
        {/* Background Typography */}
        <motion.div 
          style={{ y }}
          className="absolute inset-0 flex flex-col items-center justify-center z-0 pointer-events-none select-none"
        >
          <motion.h1 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 0.08, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="text-[15vw] leading-[0.75] font-black tracking-tighter text-juice-green text-center mix-blend-multiply"
          >
            {greeting.line1}
          </motion.h1>
          <motion.h1 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 0.08, y: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
            className="text-[15vw] leading-[0.75] font-black tracking-tighter text-juice-green text-center mix-blend-multiply"
          >
            {greeting.line2}
          </motion.h1>
        </motion.div>

        {/* Foreground Content */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.8, type: "spring" }}
          className="z-10 relative text-center mb-32"
        >
          <div className="inline-block relative">
            <h2 className="text-juice-green font-serif text-5xl md:text-7xl font-bold italic tracking-tight leading-tight">
              Ready to explore,<br/>
              <span className="text-juice-orange not-italic underline decoration-4 decoration-juice-green/20 underline-offset-8">
                {profile?.first_name || 'Traveler'}?
              </span>
            </h2>
          </div>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            transition={{ delay: 1.2 }}
            className="mt-8 text-juice-green font-mono text-sm uppercase tracking-widest"
          >
            Scroll to begin your journey
          </motion.p>
        </motion.div>

        {/* News Ticker Ribbon */}
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-juice-orange flex items-center z-30 border-t-4 border-juice-cream shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
          
          {/* Static Label Section - Seamless Integration */}
          <div className="h-full bg-juice-orange flex items-center pl-8 pr-4 z-40 relative">
             <div className="bg-juice-cream px-5 py-2 rounded-full text-juice-orange font-black text-xs md:text-sm uppercase tracking-widest animate-pulse flex items-center gap-2 shadow-sm ring-2 ring-juice-orange ring-offset-2 ring-offset-juice-cream">
               <span className="w-2 h-2 rounded-full bg-juice-orange animate-ping" />
               Trending Now
             </div>
          </div>

          {/* Scrolling Content Section */}
          <div className="flex-1 overflow-hidden relative h-full flex items-center bg-juice-orange">
             {/* Gradient Mask for smooth fade in from left */}
             <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-juice-orange via-juice-orange/80 to-transparent z-10" />
             <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-juice-orange to-transparent z-10" />
             
             <motion.div 
                className="flex items-center gap-16 pl-4 w-max"
                animate={{ x: "-50%" }}
                transition={{ repeat: Infinity, duration: 60, ease: "linear" }}
              >
                {/* Duplicate list once to create seamless loop */}
                {[...headlines, ...headlines].map((headline, i) => (
                  <span key={i} className="text-lg md:text-xl font-bold uppercase tracking-wider flex items-center gap-6 text-juice-cream/90 hover:text-white transition-colors cursor-pointer whitespace-nowrap">
                    {headline}
                    <span className="w-1.5 h-1.5 rounded-full bg-juice-cream/50" />
                  </span>
                ))}
              </motion.div>
          </div>
        </div>
      </section>

      {/* FEATURED STORY - Green */}
      <section className="h-screen snap-start bg-juice-green text-juice-cream flex items-center py-20 px-4 md:px-12 relative shrink-0 pt-32">
        {featuredStory ? (
          <div className="max-w-7xl mx-auto w-full grid md:grid-cols-2 gap-12 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              <div className="flex items-center gap-4 text-juice-orange font-bold tracking-widest uppercase text-sm">
                <span className="w-12 h-[1px] bg-juice-orange"></span>
                Top Story
              </div>
              <div 
                onClick={() => setReadingArticle(featuredStory)}
                className="block group cursor-pointer"
              >
                <h2 className="text-4xl md:text-6xl font-serif font-bold leading-tight group-hover:text-juice-orange transition-colors duration-300">
                  {featuredStory.title}
                </h2>
              </div>
              <p className="text-xl opacity-80 leading-relaxed max-w-xl line-clamp-3">
                {featuredStory.excerpt}
              </p>
              <div className="flex items-center gap-6 text-sm font-mono opacity-60">
                <span>{featuredStory.source}</span>
                <span>•</span>
                <span>{featuredStory.readTime}</span>
              </div>
              <button 
                onClick={() => setReadingArticle(featuredStory)}
                className="mt-8 px-8 py-4 border border-juice-cream rounded-full font-bold uppercase tracking-widest hover:bg-juice-cream hover:text-juice-green transition-all duration-300"
              >
                Read Story
              </button>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative aspect-[4/5] md:aspect-square rounded-3xl overflow-hidden shadow-2xl rotate-2 hover:rotate-0 transition-transform duration-500"
            >
              <img 
                src={featuredStory.imageUrl} 
                alt={featuredStory.title} 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-juice-green/80 to-transparent opacity-60" />
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

      {/* THE FEED - Orange Background */}
      <section className="h-screen snap-start bg-juice-orange flex flex-col justify-center shrink-0 relative overflow-hidden">
        <div className="w-full max-w-[1400px] mx-auto px-4 md:px-8 flex flex-col h-full pt-32 pb-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-8 text-center text-juice-cream shrink-0"
          >
            <h3 className="font-serif text-4xl md:text-6xl font-bold mb-2">The Collection</h3>
            <p className="opacity-80 text-lg">Curated for your curiosity.</p>
            
            {/* Source Filter */}
            {uniqueSources.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2 mt-6 max-w-3xl mx-auto">
                {uniqueSources.map(source => (
                  <button
                    key={source}
                    onClick={() => toggleSource(source)}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all border ${
                      selectedSources.includes(source)
                        ? 'bg-juice-cream text-juice-orange border-juice-cream'
                        : 'bg-transparent text-juice-cream/60 border-juice-cream/20 hover:border-juice-cream/60 hover:text-juice-cream'
                    }`}
                  >
                    {source}
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Horizontal Scroll Container */}
          <div className="relative flex-grow flex items-center w-full">
            
            {/* Left Navigation Button */}
            <button 
              onClick={scrollLeft}
              className="absolute left-2 md:left-4 z-20 w-12 h-12 rounded-full bg-juice-cream text-juice-orange flex items-center justify-center shadow-xl hover:scale-110 hover:bg-white transition-all hidden md:flex"
              aria-label="Scroll Left"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
            </button>

            <div 
              ref={scrollContainerRef}
              className="flex-grow flex items-center overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-8 px-4 md:px-12 gap-8 w-full"
            >
              {loadingFeeds && (
                <div className="flex items-center justify-center w-full h-full min-h-[480px]">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-juice-cream"></div>
                </div>
              )}

              {!loadingFeeds && filteredStories.length === 0 && (
                <div className="flex flex-col items-center justify-center w-full h-full min-h-[480px] text-juice-cream">
                  <p className="text-2xl font-serif mb-6">
                    {stories.length === 0 ? "Your collection is empty." : "No stories match your filter."}
                  </p>
                  {stories.length === 0 && (
                    <button 
                      onClick={() => setIsAddFeedOpen(true)}
                      className="px-8 py-4 bg-juice-cream text-juice-orange rounded-full font-bold uppercase tracking-widest hover:bg-white transition-colors shadow-lg"
                    >
                      Add Your First Source
                    </button>
                  )}
                </div>
              )}

              {!loadingFeeds && filteredStories.map((story, index) => (
                <motion.div
                  key={story.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ 
                    delay: index * 0.05, 
                    type: "spring",
                    stiffness: 200,
                    damping: 20
                  }}
                  className="snap-center shrink-0 py-4"
                >
                  <div 
                    onClick={() => setReadingArticle(story)}
                    className="cursor-pointer block h-full"
                  >
                    <div className="w-[300px] md:w-[340px] bg-juice-cream rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-juice-green/5 flex flex-col h-auto min-h-[420px] relative overflow-hidden group">
                      
                      {/* Decorative Top Gradient */}
                      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-juice-orange/20 to-juice-green/20" />

                      {/* Header: Source & Date */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-white shadow-sm border border-juice-green/10 flex items-center justify-center text-juice-orange font-black text-xs">
                            {story.source.charAt(0)}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase tracking-widest text-juice-green">{story.source}</span>
                            <span className="text-[9px] font-bold text-juice-green/40 uppercase tracking-wide">{story.date}</span>
                          </div>
                        </div>
                        <div className="px-2 py-1 rounded-full bg-juice-green/5 border border-juice-green/10 text-[9px] font-bold uppercase tracking-widest text-juice-green/60">
                          {story.category}
                        </div>
                      </div>

                      {/* Body: Title */}
                      <h3 className="font-serif text-xl md:text-2xl font-bold text-juice-green mb-4 leading-tight group-hover:text-juice-orange transition-colors duration-300 line-clamp-3">
                        {story.title}
                      </h3>

                      {/* Image (Compact but Premium) */}
                      {story.imageUrl ? (
                        <div className="w-full h-32 rounded-xl overflow-hidden mb-4 relative shadow-inner shrink-0">
                          <img 
                            src={story.imageUrl} 
                            alt={story.title} 
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 ring-1 ring-inset ring-black/5 rounded-xl" />
                        </div>
                      ) : (
                        <div className="w-full h-32 rounded-xl overflow-hidden mb-4 relative shadow-inner shrink-0 bg-juice-green/5 flex items-center justify-center">
                           <span className="text-4xl font-black text-juice-green/10">{story.source.charAt(0)}</span>
                        </div>
                      )}

                      {/* Excerpt (Short) */}
                      <p className="text-juice-green/70 text-xs leading-relaxed line-clamp-3 mb-6 flex-grow font-medium">
                        {story.excerpt}
                      </p>

                      {/* Footer: Actions */}
                      <div className="flex items-center justify-between pt-6 border-t border-juice-green/10 mt-auto">
                        <div className="flex items-center gap-2 text-juice-green/40">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                          <span className="text-xs font-bold uppercase tracking-wider">{story.readTime}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleSaveForLater(story); }}
                            className="text-juice-green/40 hover:text-juice-orange transition-colors hover:scale-110 transform duration-200"
                            title="Read Later"
                          >
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); setReadingArticle(story); }}
                            className="text-juice-green/40 hover:text-juice-orange transition-colors hover:scale-110 transform duration-200"
                            title="Read Now"
                          >
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
              
              {/* Add Source / Load More Card */}
              <motion.div 
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="snap-center shrink-0 py-4"
              >
                <button 
                  onClick={() => setIsAddFeedOpen(true)}
                  className="w-[320px] md:w-[360px] h-full min-h-[480px] bg-juice-orange border-4 border-juice-cream rounded-3xl p-8 flex flex-col items-center justify-center text-juice-cream hover:bg-juice-cream hover:text-juice-orange hover:border-juice-orange transition-all duration-300 group shadow-xl"
                >
                  <span className="text-6xl mb-6 group-hover:scale-110 transition-transform duration-300">+</span>
                  <span className="font-black uppercase tracking-widest text-2xl">Add Source</span>
                  <span className="text-sm font-bold opacity-60 mt-2">Customize your feed</span>
                </button>
              </motion.div>
            </div>

            {/* Right Navigation Button */}
            <button 
              onClick={scrollRight}
              className="absolute right-2 md:right-4 z-20 w-12 h-12 rounded-full bg-juice-cream text-juice-orange flex items-center justify-center shadow-xl hover:scale-110 hover:bg-white transition-all hidden md:flex"
              aria-label="Scroll Right"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          </div>
        </div>
      </section>

      <div className="snap-start shrink-0">
        <Footer />
      </div>

      <ReadingModal 
        article={readingArticle} 
        isOpen={!!readingArticle} 
        onClose={() => setReadingArticle(null)} 
      />

      <AddFeedModal
        isOpen={isAddFeedOpen}
        onClose={() => setIsAddFeedOpen(false)}
        userId={profile?.id || ''}
        onSuccess={fetchFeeds}
      />
    </div>
  );
}
