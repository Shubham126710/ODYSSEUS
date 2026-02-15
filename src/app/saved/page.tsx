"use client";

import React, { useState, useEffect } from 'react';
import { AppHeader } from '@/components/AppHeader';
import { Footer } from '@/components/Footer';
import { useProfile } from '@/hooks/useProfile';
import { useSavedStories } from '@/hooks/useSavedStories';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Toast } from '@/components/Toast';

export default function SavedPage() {
  const { profile } = useProfile();
  const { savedStories, loading, removeSavedStory } = useSavedStories(profile?.id);
  const [toast, setToast] = useState({ message: '', isVisible: false });
  const [headerTheme, setHeaderTheme] = useState<'light' | 'dark' | 'orange'>('light');

  useEffect(() => {
    console.log('SavedPage: savedStories updated', savedStories);
  }, [savedStories]);

  const handleRemove = async (story: any) => {
    try {
      await removeSavedStory(story);
      setToast({ message: 'Removed from saved stories', isVisible: true });
    } catch (e) {
      setToast({ message: 'Failed to remove story', isVisible: true });
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    const viewportHeight = e.currentTarget.clientHeight;
    const sectionIndex = Math.round(scrollTop / viewportHeight);

    // Section 0: Saved Stories (Cream) -> Light Theme
    // Section 1: Footer (Green) -> Dark Theme
    
    if (sectionIndex === 0) {
      setHeaderTheme('light');
    } else {
      setHeaderTheme('dark');
    }
  };

  return (
    <div 
      onScroll={handleScroll}
      className="h-screen w-full overflow-y-scroll snap-y snap-mandatory scroll-smooth bg-juice-cream text-juice-green font-sans selection:bg-juice-orange selection:text-juice-cream"
    >
      <div className="fixed top-0 left-0 right-0 z-50">
        <AppHeader theme={headerTheme} />
      </div>
      
      {/* Saved Stories Section */}
      <section className="min-h-screen snap-start pt-20 md:pt-24 pb-10 px-4 md:px-8 max-w-[1400px] mx-auto flex flex-col">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 md:mb-12"
        >
          <h1 className="font-serif text-3xl md:text-4xl lg:text-6xl font-bold mb-3 md:mb-4 text-juice-green">
            Saved Stories
          </h1>
          <p className="text-sm md:text-lg opacity-60 font-mono uppercase tracking-widest">
            Your personal collection
          </p>
        </motion.div>

        {loading ? (
           <div className="flex items-center justify-center flex-grow">
             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-juice-green"></div>
           </div>
        ) : savedStories.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-grow text-center opacity-60">
            <p className="text-2xl font-serif mb-4">No saved stories yet.</p>
            <Link href="/feed" className="text-juice-orange hover:underline font-bold uppercase tracking-widest">
              Explore the Feed
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8 pb-20">
            {savedStories.map((story, index) => (
              <motion.div
                key={story.id || story.url || index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ 
                  delay: index * 0.05, 
                  type: "spring",
                  stiffness: 200,
                  damping: 20
                }}
                className="group relative flex flex-col bg-juice-cream rounded-2xl md:rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-juice-green/5 hover:-translate-y-3 hover:rotate-1 hover:shadow-2xl transition-all duration-300 h-auto md:h-[480px]"
              >
                {/* Decorative Top Gradient */}
                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-juice-orange/20 to-juice-green/20" />

                {/* Header: Source & Date */}
                <div className="px-4 md:px-6 pt-4 md:pt-6 flex items-center justify-between mb-3 md:mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white shadow-sm border border-juice-green/10 flex items-center justify-center text-juice-orange font-black text-xs">
                      {(story.source || story.source_name || 'S').charAt(0)}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase tracking-widest text-juice-green truncate max-w-[100px]">{story.source || story.source_name}</span>
                      <span className="text-[9px] font-bold text-juice-green/40 uppercase tracking-wide">Saved</span>
                    </div>
                  </div>
                </div>

                {/* Body: Title */}
                <div className="px-4 md:px-6 mb-3 md:mb-4">
                  <h3 className="font-serif text-lg md:text-xl lg:text-2xl font-bold text-juice-green leading-tight group-hover:text-juice-orange transition-colors duration-300 line-clamp-2 md:line-clamp-3">
                    {story.title}
                  </h3>
                </div>

                {/* Image (Compact but Premium) */}
                <div className="px-4 md:px-6 mb-3 md:mb-4">
                  {story.image_url ? (
                    <div className="w-full h-24 md:h-32 rounded-xl overflow-hidden relative shadow-inner shrink-0">
                      <img 
                        src={story.image_url} 
                        alt={story.title} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 ring-1 ring-inset ring-black/5 rounded-xl" />
                    </div>
                  ) : (
                    <div className="w-full h-24 md:h-32 rounded-xl overflow-hidden relative shadow-inner shrink-0 bg-juice-green/5 flex items-center justify-center">
                       <span className="text-4xl font-black text-juice-green/10">{(story.source || story.source_name || 'S').charAt(0)}</span>
                    </div>
                  )}
                </div>

                {/* Excerpt (Short) */}
                <div className="px-4 md:px-6 flex-grow">
                  <p className="text-juice-green/70 text-xs leading-relaxed line-clamp-3 font-medium">
                    {story.excerpt}
                  </p>
                </div>

                {/* Footer: Actions */}
                <div className="px-4 md:px-6 pb-4 md:pb-6 pt-3 md:pt-4 mt-auto border-t border-juice-green/10 flex items-center justify-between">
                  <Link href={story.url || '#'} target="_blank" className="flex items-center gap-2 text-juice-green/40 hover:text-juice-orange transition-colors">
                    <span className="text-xs font-bold uppercase tracking-wider">Read Story</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                  </Link>
                  
                  <button 
                    onClick={() => handleRemove(story)}
                    className="text-juice-orange hover:text-red-500 transition-colors hover:scale-110 transform duration-200"
                    title="Remove from saved"
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>
      
      {/* Footer Section */}
      <section className="snap-start shrink-0">
        <Footer />
      </section>

      <Toast 
        message={toast.message} 
        isVisible={toast.isVisible} 
        onClose={() => setToast(prev => ({ ...prev, isVisible: false }))} 
      />
    </div>
  );
}
