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
import { ReadingModal } from "@/components/ReadingModal";
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
  const [activeArticle, setActiveArticle] = useState<any | null>(null);
  const [headerTheme, setHeaderTheme] = useState<'light' | 'dark' | 'orange'>('light');

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    const viewportHeight = e.currentTarget.clientHeight;
    const sectionIndex = Math.round(scrollTop / viewportHeight);
    setHeaderTheme(sectionIndex === 0 ? 'light' : 'dark');
  };

  // Eliminate flicker by enforcing minimum loading time
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsPageLoading(false);
    }, 500); // 500ms minimum loading time
    return () => clearTimeout(timer);
  }, []);

  const getCategoryDetails = (catString: string) => {
    const c = (catString || "").toLowerCase();
    
    if (c === "tech" || c === "vanguard") {
      return {
        number: "DESK 01",
        glyph: "◈",
        name: "The Vanguard",
        title: "Tech & Frontier Computation",
        subtitle: "Artificial minds, edge computing & the mechanics of digital civilization.",
        pills: ["TECHCRUNCH", "THE VERGE", "WIRED", "ARS TECHNICA"],
      };
    }
    if (c === "design" || c === "atelier") {
      return {
        number: "DESK 02",
        glyph: "◆",
        name: "The Atelier",
        title: "Design & Visual Form",
        subtitle: "Typographic discipline, ergonomic interfaces & aesthetic philosophy.",
        pills: ["SMASHING MAG", "UX COLLECTIVE", "A LIST APART", "IT'S NICE THAT"],
      };
    }
    if (c === "culture" || c === "forum") {
      return {
        number: "DESK 03",
        glyph: "✦",
        name: "The Forum",
        title: "Culture & Critical Thought",
        subtitle: "Modern essays, transatlantic commentary & literary examination.",
        pills: ["THE ATLANTIC", "NEW YORKER", "PARIS REVIEW", "HARPER'S"],
      };
    }
    if (c === "chronicle" || c === "business" || c === "finance") {
      return {
        number: "DESK 04",
        glyph: "❖",
        name: "The Chronicle",
        title: "Finance & Global Statecraft",
        subtitle: "Market dynamics, macro structures & institutional architecture.",
        pills: ["BLOOMBERG", "FINANCIAL TIMES", "WSJ", "REUTERS"],
      };
    }
    if (c === "science" || c === "observatory") {
      return {
        number: "DESK 05",
        glyph: "⬡",
        name: "The Observatory",
        title: "Science & Living Systems",
        subtitle: "Cosmic exploration, fundamental physics & biological frontiers.",
        pills: ["SCIENTIFIC AMERICAN", "NATURE", "QUANTA", "MIT TECH REVIEW"],
      };
    }
    // Default fallback
    return {
      number: "DESK SPECIAL",
      glyph: "✦",
      name: catString ? catString.toUpperCase() : "STORIES",
      title: catString ? `${catString.charAt(0).toUpperCase() + catString.slice(1)} Desk` : "Curated Desk",
      subtitle: "Selected dispatches and longform editorial reads.",
      pills: [],
    };
  };

  const { number: deskNumber, glyph, name: deskName, title, subtitle, pills } = getCategoryDetails(category);

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
      <div className="flex flex-col min-h-screen bg-juice-cream text-juice-green">
        <AppHeader theme="light" />
        <main className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="text-center space-y-4 max-w-md p-8 bg-white/70 border border-juice-green/15 rounded-3xl shadow-sm">
            <span className="text-2xl font-serif text-juice-orange">✦</span>
            <h3 className="text-xl font-serif font-bold text-juice-green">Unable to Load Desk Wire</h3>
            <p className="text-xs text-juice-green/70 font-sans">
              The editorial network encountered a temporary delay. Please retry to reconnect with the RSS wires.
            </p>
            <button 
              onClick={refetch}
              className="px-6 py-2.5 bg-juice-orange text-white rounded-full font-mono text-xs uppercase tracking-wider hover:bg-orange-600 transition-colors shadow-sm"
            >
              Retry Connection
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
    <div 
      onScroll={handleScroll}
      data-lenis-prevent
      className="h-screen w-full overflow-y-scroll snap-y snap-mandatory scroll-smooth bg-juice-cream text-juice-green font-sans selection:bg-juice-orange selection:text-juice-cream"
    > 
      <div className="fixed top-0 left-0 right-0 z-50">
        <AppHeader theme={headerTheme} />
      </div>
      
      <section className="min-h-screen snap-start pt-20 md:pt-24 pb-16 md:pb-20 px-4 md:px-12 lg:px-16 max-w-[1920px] mx-auto w-full flex flex-col justify-between">
        {/* Back link & Folio Meta */}
        <div className="flex items-center justify-between gap-4 mb-6 pt-2">
          <Link 
            href="/feed"
            className="inline-flex items-center gap-2 text-[11px] md:text-xs font-mono font-bold uppercase tracking-widest text-juice-green/60 hover:text-juice-orange transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Broadsheet</span>
          </Link>
          <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] md:text-xs font-mono uppercase tracking-widest text-juice-green/60">
            <span className="font-bold text-juice-orange">{deskNumber}</span>
            <span className="hidden sm:inline">•</span>
            <span className="font-bold hidden sm:inline">{glyph} {deskName}</span>
            <span>•</span>
            <span>{filteredStories.length} {filteredStories.length === 1 ? 'DISPATCH' : 'DISPATCHES'}</span>
          </div>
        </div>

        {/* Editorial Desk Header */}
        <div className="mb-8 md:mb-10 border-b border-juice-green/15 pb-6 md:pb-8">
          <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-3 md:gap-4 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl font-serif text-juice-orange">{glyph}</span>
                <span className="text-[11px] font-mono font-bold uppercase tracking-[0.25em] text-juice-green/70">
                  {deskName}
                </span>
              </div>
              <h1 className="text-3xl sm:text-5xl md:text-6xl font-serif font-black text-juice-green tracking-tight leading-tight">
                {title}
              </h1>
            </div>
            
            <p className="text-xs md:text-sm font-sans text-juice-green/70 max-w-md leading-relaxed">
              {subtitle}
            </p>
          </div>
          
          {/* Letterpress Source Filter Pills */}
          {pills.length > 0 && (
            <div className="flex flex-nowrap sm:flex-wrap items-center gap-2 pt-2 overflow-x-auto scrollbar-hide pb-1">
              <span className="text-[10px] font-mono uppercase tracking-widest text-juice-green/50 mr-1 shrink-0">
                Filter:
              </span>
              <button
                onClick={() => setActiveFilter(null)}
                className={`px-3 md:px-4 py-1.5 rounded-full text-[10px] md:text-xs font-mono font-bold uppercase tracking-wider transition-all duration-200 shrink-0 ${
                  activeFilter === null
                    ? 'bg-juice-green text-juice-cream shadow-xs'
                    : 'bg-white/70 text-juice-green/60 hover:text-juice-green hover:bg-white border border-juice-green/15'
                }`}
              >
                All Sources
              </button>
              {pills.map((pill) => {
                const isActive = activeFilter === pill;
                return (
                  <button 
                    key={pill}
                    onClick={() => setActiveFilter(isActive ? null : pill)}
                    className={`px-3 md:px-4 py-1.5 rounded-full text-[10px] md:text-xs font-mono font-bold uppercase tracking-wider transition-all duration-200 shrink-0 ${
                      isActive 
                        ? 'bg-juice-green text-juice-cream shadow-xs' 
                        : 'bg-white/70 text-juice-green/60 hover:text-juice-green hover:bg-white border border-juice-green/15'
                    }`}
                  >
                    {pill}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {filteredStories.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 lg:gap-8 pb-12">
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
                  <div className="block h-full cursor-pointer" onClick={() => setActiveArticle(story)}>
                    <StoryCard
                        {...story}
                        imageUrl={story.imageUrl || (story as any).enclosure?.url}
                        isSaved={isSaved(story)}
                        onToggleSave={() => handleToggleSave(story)}
                        onShare={() => handleShare(story)}
                    />
                  </div>
                </motion.div>
                  ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-juice-green/20 rounded-3xl bg-white/40 text-juice-green">
            <div className="w-16 h-16 bg-juice-orange/10 rounded-full flex items-center justify-center mb-4 text-juice-orange">
              <span className="text-2xl font-serif font-black">{glyph}</span>
            </div>
            <h3 className="text-2xl font-serif font-bold mb-2 text-juice-green">
              No dispatches currently on wire
            </h3>
            <p className="text-xs sm:text-sm text-juice-green/70 max-w-md mx-auto mb-6">
              Our curators are surveying new dispatches for {deskName}. Refresh your wire or return to the main broadsheet.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={refetch}
                className="px-5 py-2.5 rounded-full bg-juice-green text-juice-cream font-mono text-xs uppercase tracking-wider hover:bg-[#4b6a38] transition-colors"
              >
                Refresh Wire
              </button>
              <Link
                href="/feed"
                className="px-5 py-2.5 rounded-full bg-white border border-juice-green/20 text-juice-green font-mono text-xs uppercase tracking-wider hover:border-juice-green transition-colors"
              >
                Return to Feed
              </Link>
            </div>
          </div>
        )}
      </section>

      <section className="snap-start shrink-0">
        <Footer />
      </section>

      <ReadingModal 
        isOpen={!!activeArticle} 
        onClose={() => setActiveArticle(null)} 
        article={activeArticle} 
        onSave={handleToggleSave}
      />

      <Toast 
        message={toast.message} 
        isVisible={toast.isVisible} 
        onClose={() => setToast({ message: '', isVisible: false })} 
      />
    </div>
  );
}
