"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from 'next/link';
import { useFeedFetcher } from "@/hooks/useFeedFetcher";
import { useProfile } from "@/hooks/useProfile";
import { useSavedStories } from "@/hooks/useSavedStories"; 
import { FeedLoadingScreen } from "@/components/FeedLoadingScreen";
import { StoryCard } from "@/components/StoryCard";
import { AppHeader } from "@/components/AppHeader";
import { Footer } from "@/components/Footer";
import { Toast } from "@/components/Toast";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

export default function CategoryFeedPage() {
  const { profile } = useProfile();
  const params = useParams();
  const router = useRouter();
  // Handle potentially encoded category from URL
  const rawCategory = params?.category;
  const category = rawCategory ? decodeURIComponent(typeof rawCategory === "string" ? rawCategory : "") : "";
  
  const { 
    stories, 
    loading: feedLoading, 
    error, 
    refetch 
  } = useFeedFetcher(profile?.id, { category });

  const { isSaved, addSavedStory, removeSavedStory } = useSavedStories(profile?.id);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [toast, setToast] = useState({ message: '', isVisible: false });

  // Eliminate flicker by enforcing minimum loading time
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsPageLoading(false);
    }, 500); // 500ms minimum loading time
    return () => clearTimeout(timer);
  }, []);

  const getCategoryDetails = (catString: string) => {
    const c = (catString || "").toLowerCase();
    
    if (c === "tech") {
      return {
        title: "Tech",
        subtitle: "THE LATEST IN TECHNOLOGY AND INNOVATION.",
        pills: ["TECHCRUNCH", "THE VERGE", "WIRED"],
        bgColor: "bg-[#5A874F]", // Deep Green
        textColor: "text-[#FEFBEA]", // Cream/White
        logoColor: "text-[#D96C4A]" // Orange
      };
    }
    if (c === "design") {
       return {
        title: "Design",
        subtitle: "TRENDS IN VISUAL AND INTERACTIVE DESIGN.",
        pills: ["SMASHING MAG", "UX COLLECTIVE", "A LIST APART"],
        bgColor: "bg-[#E6D5B8]", // Tan/Beige
        textColor: "text-[#2A4038]", // Dark Green
        logoColor: "text-[#D96C4A]"
      };
    }
    if (c === "culture") {
       return {
        title: "Culture",
        subtitle: "SOCIETY, ART, AND DIGITAL LIFE.",
        pills: ["THE ATLANTIC", "NEW YORKER", "VICE"],
        bgColor: "bg-[#F2E8DC]", // Light Cream
        textColor: "text-[#2A4038]",
        logoColor: "text-[#D96C4A]"
      };
    }
    if (c === "science") {
       return {
        title: "Science",
        subtitle: "DISCOVERING THE UNIVERSE AND BEYOND.",
        pills: ["NASA", "SCIENTIFIC AMERICAN", "NATURE"],
        bgColor: "bg-[#E0E8F0]", // Light Blue
        textColor: "text-[#1A202C]",
        logoColor: "text-[#D96C4A]"
      };
    }
    // Default
    return {
      title: catString ? catString.charAt(0).toUpperCase() + catString.slice(1) : "Stories",
      subtitle: "LATEST STORIES",
      pills: [],
      bgColor: "bg-juice-cream",
      textColor: "text-juice-green",
      logoColor: "text-juice-orange"
    };
  };

  const { title, subtitle, pills, bgColor, textColor } = getCategoryDetails(category);

  // Filter Logic
  const filteredStories = activeFilter 
    ? stories.filter(s => s.source.toUpperCase().includes(activeFilter) || s.title.toUpperCase().includes(activeFilter))
    : stories;

  // Combined loading state
  const showLoading = isPageLoading || (feedLoading && stories.length === 0);

  if (showLoading) {
    return <FeedLoadingScreen />;
  }

  if (error) {
    return (
      <div className={`flex flex-col min-h-screen ${bgColor}`}>
        <AppHeader />
        <main className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="text-center space-y-4">
            <p className="text-red-500 font-medium">Unable to load stories</p>
            <button 
              onClick={refetch}
              className="px-4 py-2 bg-juice-orange text-white rounded-full hover:bg-orange-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        </main>
      </div>
    );
  }

  const handleToggleSave = async (story: any) => {
    if (!profile) return;
    try {
      if (isSaved(story)) {
        await removeSavedStory(story);
        setToast({ message: 'Removed from saved stories', isVisible: true });
      } else {
        await addSavedStory(story);
        setToast({ message: 'Saved for later!', isVisible: true });
      }
    } catch (err) {
      console.error("Failed to toggle save:", err);
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

  return (
    <div className={`flex flex-col min-h-screen ${bgColor}`}> 
      <AppHeader />
      
      <main className="flex-1 pt-20 md:pt-24 pb-16 md:pb-20 px-4 md:px-12 lg:px-16 max-w-[1920px] mx-auto w-full">
        <div className="flex items-center gap-4 mb-4 md:hidden">
          <button 
            onClick={() => router.back()}
            className={`p-2 -ml-2 ${textColor} hover:opacity-70 rounded-full transition-colors`}
            aria-label="Go back"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
        </div>

        {/* Header Section */}
        <div className="mb-12">
            <div className="flex flex-col md:flex-row md:items-baseline gap-2 md:gap-6 mb-8">
                <h1 className={`text-4xl sm:text-6xl md:text-8xl font-serif font-bold ${textColor} tracking-tight`}>
                    {title}
                </h1>
                <div className={`h-auto md:h-16 w-1 ${category.toLowerCase() === 'tech' ? 'bg-white/30' : 'bg-juice-green/30'} hidden md:block`}></div>
                
                <div className="flex flex-col justify-center">
                    <p className={`text-sm md:text-base font-mono uppercase tracking-widest ${textColor} opacity-80 max-w-md`}>
                        {subtitle}
                    </p>
                </div>
            </div>
            
            {/* Pills */}
            <div className="flex flex-wrap gap-2 md:gap-3">
                {pills.map((pill) => {
                    const isActive = activeFilter === pill;
                    return (
                        <button 
                            key={pill}
                            onClick={() => setActiveFilter(isActive ? null : pill)}
                            className={`px-3 md:px-4 py-1.5 md:py-2 rounded-full border border-current text-[10px] md:text-xs font-bold uppercase tracking-widest transition-all duration-300 ${
                                isActive 
                                ? 'bg-current text-juice-cream opacity-100' 
                                : `${textColor} opacity-60 hover:opacity-100`
                            }`}
                        >
                            {pill}
                        </button>
                    );
                })}
            </div>
        </div>

        {filteredStories.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
            <AnimatePresence mode="popLayout">
              {filteredStories.map((story) => (
                <motion.div
                  key={story.id}
                  layout
                  className="h-full"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Link className="block h-full" href={`/story/${encodeURIComponent(String(story.id))}?url=${encodeURIComponent(story.link)}&title=${encodeURIComponent(story.title)}&source=${encodeURIComponent(story.source)}&date=${encodeURIComponent(story.date)}&imageUrl=${encodeURIComponent(story.imageUrl || '')}`}>
                    <StoryCard
                        {...story}
                        isSaved={isSaved(story)}
                        onToggleSave={() => handleToggleSave(story)}
                        onShare={() => handleShare(story)}
                    />
                  </Link>
                </motion.div>
                  ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className={`flex flex-col items-center justify-center py-24 text-center border-2 border-dashed border-current/20 rounded-3xl ${textColor}`}>
            <div className="w-20 h-20 bg-current/5 rounded-full flex items-center justify-center mb-6">
              <span className="text-4xl">📗</span>
            </div>
            <h3 className="text-2xl font-serif font-bold mb-3">
              No stories found
            </h3>
            <p className="opacity-70 max-w-md mx-auto">
              We couldn"t find any stories in this category right now. Check back later!
            </p>
          </div>
        )}
      </main>

      <Footer />

      <Toast 
        message={toast.message} 
        isVisible={toast.isVisible} 
        onClose={() => setToast({ message: '', isVisible: false })} 
      />
    </div>
  );
}
