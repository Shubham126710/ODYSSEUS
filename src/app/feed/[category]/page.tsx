"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { AppHeader } from '@/components/AppHeader';
import { useProfile } from '@/hooks/useProfile';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/lib/supabaseClient';
import { FeedLoadingScreen } from '@/components/FeedLoadingScreen';
import { ReadingModal } from '@/components/ReadingModal';

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
  const wordsPerMinute = 130; // Slower reading speed
  const words = text.trim().split(/\s+/).length;
  const minutes = Math.ceil(words / wordsPerMinute);
  return `${minutes} min`;
};

export default function CategoryFeedPage() {
  const params = useParams();
  const category = params.category as string;
  const { profile } = useProfile();
  const [stories, setStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [readingArticle, setReadingArticle] = useState<any>(null);
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

  useEffect(() => {
    const fetchFeeds = async () => {
      if (!profile) return;
      setLoading(true);
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
          const allStories = data.items.map((item: any, index: number) => {
            // Better image extraction logic
            let imageUrl = null;

            // 1. Check media:thumbnail (Common in Wired, Verge, etc)
            if (item['media:thumbnail']) {
               if (Array.isArray(item['media:thumbnail'])) {
                  imageUrl = item['media:thumbnail'][0]?.['$']?.url || item['media:thumbnail'][0]?.url;
               } else {
                  imageUrl = item['media:thumbnail']?.['$']?.url || item['media:thumbnail']?.url;
               }
            }

            // 2. Check media:content (Yahoo, Bing, etc)
            if (!imageUrl && item['media:content']) {
              if (Array.isArray(item['media:content'])) {
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
              imageUrl: imageUrl,
              link: item.link,
              content: item.content || item['content:encoded'] || item.description || item.summary
            };
          });

          // Filter by category
          const filtered = allStories.filter((story: any) => {
            const storyCategory = getCategoryForFeed(story.source);
            // Also allow if the category matches the requested one loosely
            return storyCategory === category.toLowerCase() || category.toLowerCase() === 'all';
          });

          setStories(filtered);
        }
      } catch (error) {
        console.error('Failed to fetch feeds', error);
      } finally {
        // Add a small delay to ensure the loading screen is visible for at least a moment
        // and to allow images to start loading
        setTimeout(() => setLoading(false), 1500);
      }
    };

    if (profile) {
      fetchFeeds();
    }
  }, [profile, category]);

  const handleSaveForLater = async (story: any) => {
    if (!profile) return;
    try {
      await fetch('/api/read-later', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: profile.id,
          url: story.link || story.id,
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

  return (
    <div className="min-h-screen bg-juice-cream text-juice-green font-sans selection:bg-juice-orange selection:text-white">
      <AppHeader />
      
      <main className="pt-32 px-4 md:px-12 max-w-7xl mx-auto">
        <AnimatePresence>
          {loading && <FeedLoadingScreen />}
        </AnimatePresence>

        <div className="mb-12">
          <h1 className="text-6xl md:text-8xl font-serif font-bold capitalize mb-4 text-juice-green">
            {category}
          </h1>
          <p className="text-xl opacity-60 font-mono uppercase tracking-widest">
            Curated Stories
          </p>

          {/* Source Filter */}
          {uniqueSources.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-8">
              {uniqueSources.map(source => (
                <button
                  key={source}
                  onClick={() => toggleSource(source)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all border ${
                    selectedSources.includes(source)
                      ? 'bg-juice-green text-juice-cream border-juice-green'
                      : 'bg-transparent text-juice-green/60 border-juice-green/20 hover:border-juice-green/60 hover:text-juice-green'
                  }`}
                >
                  {source}
                </button>
              ))}
            </div>
          )}
        </div>

        {filteredStories.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
            {filteredStories.map((story, index) => (
              <motion.article
                key={story.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group flex flex-col h-full"
              >
                <div className="relative aspect-[16/10] overflow-hidden rounded-2xl mb-6 bg-juice-green/5">
                  <img 
                    src={story.imageUrl} 
                    alt={story.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      handleSaveForLater(story);
                    }}
                    className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-juice-orange hover:text-white shadow-lg"
                    title="Save for later"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                    </svg>
                  </button>
                </div>

                <div className="flex items-center gap-3 text-xs font-mono uppercase tracking-widest opacity-60 mb-3">
                  <span className="font-bold text-juice-orange">{story.source}</span>
                  <span>•</span>
                  <span>{story.date}</span>
                </div>

                <div 
                  onClick={() => setReadingArticle(story)}
                  className="cursor-pointer block group-hover:text-juice-orange transition-colors duration-300"
                >
                  <h2 className="text-2xl font-serif font-bold leading-tight mb-3">
                    {story.title}
                  </h2>
                </div>

                <p className="text-base opacity-70 line-clamp-3 mb-4 flex-grow">
                  {story.excerpt}
                </p>

                <div className="pt-4 border-t border-juice-green/10 flex items-center justify-between mt-auto">
                  <span className="text-xs font-mono opacity-50">{story.readTime} read</span>
                  <button 
                    onClick={() => setReadingArticle(story)}
                    className="text-sm font-bold uppercase tracking-widest hover:text-juice-orange transition-colors"
                  >
                    Read Article →
                  </button>
                </div>
              </motion.article>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <h3 className="text-3xl font-serif font-bold mb-4">No stories found in {category}</h3>
            <p className="opacity-60">Try adding some feeds related to this category.</p>
          </div>
        )}
      </main>

      <ReadingModal 
        isOpen={!!readingArticle} 
        onClose={() => setReadingArticle(null)} 
        article={readingArticle} 
      />
    </div>
  );
}
