"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { AppHeader } from '@/components/AppHeader';
import { Footer } from '@/components/Footer';
import { MOCK_STORIES } from '@/lib/mockData';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/lib/supabaseClient';

export default function StoryPage() {
  const params = useParams();
  const { profile } = useProfile();
  const [story, setStory] = useState<typeof MOCK_STORIES[0] | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [minutesTracked, setMinutesTracked] = useState(0);

  useEffect(() => {
    if (params.id) {
      const foundStory = MOCK_STORIES.find(s => s.id === Number(params.id));
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStory(prev => {
        if (prev?.id === foundStory?.id) return prev;
        return foundStory || null;
      });
    }
  }, [params.id]);

  // Reading Tracker Logic
  useEffect(() => {
    if (!profile) return;

    // Function to increment time
    const trackTime = async () => {
      try {
        const { error } = await supabase.rpc('increment_reading_time', {
          user_id: profile.id,
          minutes: 1
        });

        if (error) {
          console.error('Error tracking time:', error);
        } else {
          setMinutesTracked(prev => prev + 1);
          console.log('Tracked 1 minute of reading');
        }
      } catch (err) {
        console.error('Failed to track time:', err);
      }
    };

    // Set interval to run every 60 seconds (60000 ms)
    timerRef.current = setInterval(trackTime, 60000);

    // Cleanup on unmount
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [profile]);

  if (!story) {
    return (
      <div className="min-h-screen bg-juice-cream flex items-center justify-center">
        <div className="animate-pulse text-juice-green font-serif text-xl">Loading Story...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-juice-cream text-juice-green font-sans selection:bg-juice-orange selection:text-white flex flex-col">
      <AppHeader />
      
      <motion.main 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="flex-grow max-w-3xl mx-auto px-4 md:px-8 py-12 w-full"
      >
        
        {/* Header */}
        <header className="mb-12 text-center space-y-6">
          <div className="flex items-center justify-center gap-3 text-xs font-bold uppercase tracking-widest opacity-60">
            <span className="text-juice-orange">{story.source}</span>
            <span>•</span>
            <span>{story.date}</span>
            <span>•</span>
            <span>{story.readTime}</span>
          </div>
          
          <h1 className="font-serif text-4xl md:text-6xl font-bold leading-tight">
            {story.title}
          </h1>

          {story.imageUrl && (
            <div className="w-full aspect-video rounded-2xl overflow-hidden shadow-xl mt-8">
              <img src={story.imageUrl} alt={story.title} className="w-full h-full object-cover" />
            </div>
          )}
        </header>

        {/* Content */}
        <article className="prose prose-lg prose-headings:font-serif prose-headings:text-juice-green prose-p:text-juice-green/80 prose-a:text-juice-orange hover:prose-a:text-juice-green transition-colors mx-auto">
          <div dangerouslySetInnerHTML={{ __html: story.content || '' }} />
        </article>

        {/* Footer / Tracker Indicator */}
        <div className="mt-20 pt-8 border-t border-juice-green/10 flex items-center justify-between text-sm opacity-60">
          <p>Thanks for reading.</p>
          {minutesTracked > 0 && (
            <p className="flex items-center gap-2 text-juice-orange animate-pulse">
              <span>🔥</span> You&apos;ve read for {minutesTracked} min
            </p>
          )}
        </div>

      </motion.main>
      <Footer />
    </div>
  );
}
