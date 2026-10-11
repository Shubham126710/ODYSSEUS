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

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsPageLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  const getCategoryDetails = (catString: string) => {
    const c = (catString || "").toLowerCase();
    
    if (c === "tech" || c === "vanguard") {
      return {
        number: "DESK 01",
        glyph: "✦",
        name: "The Vanguard",
        title: "Tech & Frontier Computation",
        subtitle: "Artificial minds, cybernetics, chip architecture, and the digital frontier.",
        pills: ["TECHCRUNCH", "THE VERGE", "WIRED", "ARS TECHNICA"],
      };
    }
    if (c === "design" || c === "atelier") {
      return {
        number: "DESK 02",
        glyph: "◈",
        name: "The Atelier",
        title: "Design & Visual Form",
        subtitle: "Spatial architecture, typographic discipline, tactile objects, and visual culture.",
        pills: ["DEZEEN", "EYE", "UX COLLECTIVE", "A LIST APART"],
      };
    }
    if (c === "culture" || c === "forum") {
      return {
        number: "DESK 03",
        glyph: "◆",
        name: "The Forum",
        title: "Culture & Critical Thought",
        subtitle: "Philosophy, slow journalism, transatlantic commentary, and literary examination.",
        pills: ["THE ATLANTIC", "NEW YORKER", "AEON", "PARIS REVIEW"],
      };
    }
    if (c === "chronicle" || c === "business" || c === "finance") {
      return {
        number: "DESK 04",
        glyph: "—",
        name: "The Chronicle",
        title: "Finance & Global Statecraft",
        subtitle: "Market dynamics, macro structures, geopolitical analyses, and international chronicles.",
        pills: ["BLOOMBERG", "FINANCIAL TIMES", "WSJ", "REUTERS"],
      };
    }
    if (c === "science" || c === "observatory") {
      return {
        number: "DESK 05",
        glyph: "❖",
        name: "The Observatory",
        title: "Science & Living Systems",
        subtitle: "Astrophysics, biology, quantum mechanics, and fundamental planetary discovery.",
        pills: ["QUANTA", "NATURE", "SCIENTIFIC AMERICAN", "MIT TECH REVIEW"],
      };
    }
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

  const filteredStories = activeFilter 
    ? stories.filter(s => s.source.toUpperCase().includes(activeFilter) || s.title.toUpperCase().includes(activeFilter))
    : stories;

  const showLoading = isPageLoading || (feedLoading && stories.length === 0);

  if (showLoading) {
    return <FeedLoadingScreen />;
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-screen bg-[#243B26] text-[#FAF7EE] relative">
        <AppHeader />
        <main className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
          <div className="text-center space-y-4 max-w-md p-8 bg-[#FAF7EE] text-[#131E15] border border-white/20 rounded-3xl shadow-2xl">
            <span className="text-2xl text-[#EA580C] font-mono">✦</span>
            <h3 className="text-xl font-serif font-bold text-[#131E15]">Unable to Connect to Wire</h3>
            <p className="text-xs text-[#37493A] font-sans leading-relaxed">
              The editorial network encountered a temporary delay. Please retry to reconnect with the RSS wires.
            </p>
            <button 
              onClick={refetch}
              className="px-6 py-2.5 bg-[#EA580C] hover:bg-[#C2410C] text-white rounded-full font-mono text-xs uppercase tracking-wider transition-colors shadow-md"
            >
              Retry Wire Connection
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
        setToast({ message: 'Removed from library', isVisible: true });
      } else {
        await addSavedStory(story);
        setToast({ message: 'Saved to library ✦', isVisible: true });
      }
    } catch {
      setToast({ message: 'Could not update library', isVisible: true });
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
      } catch {
        // user cancelled
      }
    } else {
      try {
        await navigator.clipboard.writeText(story.link);
        setToast({ message: 'Link copied to clipboard', isVisible: true });
      } catch {
        setToast({ message: 'Could not copy link', isVisible: true });
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#243B26] text-[#FAF7EE] font-sans selection:bg-[#EA580C] selection:text-white relative">
      
      {/* Tactile Archival Background Dot Pattern */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-20 z-0" 
        style={{
          backgroundImage: 'radial-gradient(rgba(255, 253, 208, 0.15) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }} 
      />

      <AppHeader />
      
      <main className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-12 py-8 sm:py-12 space-y-10 relative z-10">
        
        {/* Top Folio & Return Navigation */}
        <div className="flex items-center justify-between gap-4 border-b border-[#FFFDD0]/15 pb-4">
          <Link 
            href="/feed"
            className="inline-flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-[#FFFDD0]/70 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Broadsheet</span>
          </Link>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#FFFDD0]/60">
            <span className="font-bold text-[#EA580C]">{deskNumber}</span>
            <span>•</span>
            <span className="font-bold text-[#FFFDD0]">{glyph} {deskName}</span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline">{filteredStories.length} DISPATCHES</span>
          </div>
        </div>

        {/* Editorial Desk Masthead */}
        <div className="space-y-4 border-b border-[#FFFDD0]/15 pb-8">
          <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-[#EA580C] font-mono text-xs uppercase tracking-widest font-bold mb-2">
                <span>{glyph}</span>
                <span>{deskName}</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-serif font-bold text-[#FFFDD0] tracking-tight leading-tight">
                {title}
              </h1>
            </div>
            
            <p className="text-xs sm:text-sm font-sans text-[#FFFDD0]/80 max-w-md leading-relaxed">
              {subtitle}
            </p>
          </div>
          
          {/* Source Filter Letterpress Pills */}
          {pills.length > 0 && (
            <div className="flex items-center gap-2 pt-2 overflow-x-auto scrollbar-hide pb-1">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#FFFDD0]/60 mr-1 shrink-0 font-bold">
                Filter:
              </span>
              <button
                onClick={() => setActiveFilter(null)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-bold uppercase tracking-wider transition-all shrink-0 ${
                  activeFilter === null
                    ? 'bg-[#EA580C] text-white shadow-md'
                    : 'bg-[#182C1B] text-[#FFFDD0]/80 hover:text-[#FFFDD0] hover:bg-[#1f3723] border border-white/15'
                }`}
              >
                All Sources ({stories.length})
              </button>
              {pills.map((pill) => {
                const isActive = activeFilter === pill;
                return (
                  <button 
                    key={pill}
                    onClick={() => setActiveFilter(isActive ? null : pill)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-bold uppercase tracking-wider transition-all shrink-0 ${
                      isActive 
                        ? 'bg-[#EA580C] text-white shadow-md' 
                        : 'bg-[#182C1B] text-[#FFFDD0]/80 hover:text-[#FFFDD0] hover:bg-[#1f3723] border border-white/15'
                    }`}
                  >
                    {pill}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Stories Grid */}
        {filteredStories.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredStories.map((story) => (
                <motion.div
                  key={story.id}
                  layout
                  className="h-full"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
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
          <div className="text-center py-24 bg-[#FAF7EE] text-[#131E15] rounded-3xl border border-white/20 p-8 space-y-4 shadow-xl">
            <span className="text-2xl text-[#EA580C] font-mono">{glyph}</span>
            <h3 className="font-serif text-xl font-bold text-[#131E15]">
              No dispatches currently on wire
            </h3>
            <p className="text-xs text-[#37493A] max-w-sm mx-auto">
              Our curators are surveying new dispatches for {deskName}. Refresh your wire or return to the broadsheet.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={refetch}
                className="px-5 py-2.5 rounded-full bg-[#EA580C] hover:bg-[#C2410C] text-white font-mono text-xs uppercase tracking-wider transition-colors shadow-sm"
              >
                Refresh Wire
              </button>
              <Link
                href="/feed"
                className="px-5 py-2.5 rounded-full bg-white border border-[#131E15]/20 text-[#131E15] font-mono text-xs uppercase tracking-wider hover:bg-stone-50 transition-colors"
              >
                Return to Broadsheet
              </Link>
            </div>
          </div>
        )}
      </main>

      <Footer />

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
