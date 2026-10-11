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
        number: "DESK I",
        glyph: "✦",
        name: "The Vanguard",
        title: "Tech & Frontier Computation",
        subtitle: "Artificial minds, cybernetics, chip architecture, and the digital frontier.",
        pills: ["TECHCRUNCH", "THE VERGE", "WIRED", "ARS TECHNICA"],
        bgGradient: "linear-gradient(135deg, #162B1D 0%, #0D1910 100%)",
        accentBorder: "#2A4833",
        foilColor: "#6EE7B7",
      };
    }
    if (c === "design" || c === "atelier") {
      return {
        number: "DESK II",
        glyph: "◈",
        name: "The Atelier",
        title: "Design & Visual Form",
        subtitle: "Spatial architecture, typographic discipline, tactile objects, and visual culture.",
        pills: ["DEZEEN", "EYE", "UX COLLECTIVE", "A LIST APART"],
        bgGradient: "linear-gradient(135deg, #3A2312 0%, #1E1208 100%)",
        accentBorder: "#5E3B21",
        foilColor: "#FDBA74",
      };
    }
    if (c === "culture" || c === "forum") {
      return {
        number: "DESK III",
        glyph: "◆",
        name: "The Forum",
        title: "Culture & Critical Thought",
        subtitle: "Philosophy, slow journalism, transatlantic commentary, and literary examination.",
        pills: ["THE ATLANTIC", "NEW YORKER", "AEON", "PARIS REVIEW"],
        bgGradient: "linear-gradient(135deg, #142236 0%, #0A121E 100%)",
        accentBorder: "#243B5C",
        foilColor: "#93C5FD",
      };
    }
    if (c === "chronicle" || c === "business" || c === "finance") {
      return {
        number: "DESK IV",
        glyph: "❖",
        name: "The Chronicle",
        title: "Finance & Global Statecraft",
        subtitle: "Market dynamics, macro structures, geopolitical analyses, and international chronicles.",
        pills: ["BLOOMBERG", "FINANCIAL TIMES", "WSJ", "REUTERS"],
        bgGradient: "linear-gradient(135deg, #2B1D3A 0%, #160D20 100%)",
        accentBorder: "#483161",
        foilColor: "#D8B4FE",
      };
    }
    if (c === "science" || c === "observatory") {
      return {
        number: "DESK V",
        glyph: "—",
        name: "The Observatory",
        title: "Science & Living Systems",
        subtitle: "Astrophysics, biology, quantum mechanics, and fundamental planetary discovery.",
        pills: ["QUANTA", "NATURE", "SCIENTIFIC AMERICAN", "MIT TECH REVIEW"],
        bgGradient: "linear-gradient(135deg, #361C14 0%, #1D0C07 100%)",
        accentBorder: "#5C3124",
        foilColor: "#FCA5A5",
      };
    }
    return {
      number: "SPECIAL DESK",
      glyph: "✦",
      name: catString ? catString.toUpperCase() : "STORIES",
      title: catString ? `${catString.charAt(0).toUpperCase() + catString.slice(1)} Desk` : "Curated Desk",
      subtitle: "Selected dispatches and longform editorial reads.",
      pills: [],
      bgGradient: "linear-gradient(135deg, #23201C 0%, #141311 100%)",
      accentBorder: "#433D35",
      foilColor: "#F59E0B",
    };
  };

  const { number: deskNumber, glyph, name: deskName, title, subtitle, pills, bgGradient, accentBorder, foilColor } = getCategoryDetails(category);

  const filteredStories = activeFilter 
    ? stories.filter(s => s.source.toUpperCase().includes(activeFilter) || s.title.toUpperCase().includes(activeFilter))
    : stories;

  const showLoading = isPageLoading || (feedLoading && stories.length === 0);

  if (showLoading) {
    return <FeedLoadingScreen />;
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-screen bg-vellum-texture text-[#181715]">
        <AppHeader />
        <main className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="text-center space-y-4 max-w-md p-8 bg-[#FCFAF7] border border-[#E0D9CC] rounded-2xl shadow-[0_4px_16px_rgba(40,30,20,0.04)]">
            <span className="text-2xl text-[#EA580C] font-mono">✦</span>
            <h3 className="text-xl font-serif font-bold text-[#181715]">Unable to Connect to Wire</h3>
            <p className="text-xs text-[#6B6355] font-sans leading-relaxed">
              The editorial network encountered a temporary delay. Please retry to reconnect with the RSS wires.
            </p>
            <button 
              onClick={refetch}
              className="px-6 py-2.5 bg-[#181715] text-[#FAF7F0] rounded-full font-mono text-xs uppercase tracking-wider hover:bg-[#2C2825] transition-colors shadow-sm"
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
    <div className="min-h-screen bg-vellum-texture text-[#181715] font-sans selection:bg-[#EA580C] selection:text-white">
      <AppHeader />
      
      <main className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-12 py-8 sm:py-12 space-y-10">
        
        {/* Top Folio & Return Navigation with Editorial Double Rule */}
        <div className="flex items-center justify-between gap-4 border-editorial-double pb-4">
          <Link 
            href="/feed"
            className="inline-flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-[#6B6355] hover:text-[#181715] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Broadsheet</span>
          </Link>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#7A7265]">
            <span className="font-bold text-[#EA580C]">{deskNumber}</span>
            <span>•</span>
            <span className="font-bold text-[#2A2723]">{glyph} {deskName}</span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline">{filteredStories.length} DISPATCHES ON WIRE</span>
          </div>
        </div>

        {/* Editorial Desk Bookplate Banner */}
        <div 
          className="relative overflow-hidden rounded-2xl p-7 sm:p-10 text-white shadow-[0_12px_36px_rgba(20,15,10,0.15)] border space-y-6"
          style={{ background: bgGradient, borderColor: accentBorder }}
        >
          {/* Subtle archival watermark pattern */}
          <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-5 pointer-events-none flex items-center justify-center font-serif text-[180px] font-black select-none">
            {glyph}
          </div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-mono uppercase tracking-widest font-bold bg-white/10 backdrop-blur-xs border border-white/15" style={{ color: foilColor }}>
                <span>{glyph}</span>
                <span>{deskNumber} • {deskName}</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-serif font-bold text-white tracking-tight leading-tight">
                {title}
              </h1>
              <p className="text-xs sm:text-sm font-sans text-white/80 max-w-xl leading-relaxed">
                {subtitle}
              </p>
            </div>

            <div className="hidden md:flex flex-col items-end text-right font-mono text-xs text-white/60 shrink-0">
              <span className="uppercase tracking-widest text-[10px] text-white/40">Broadsheet Desk</span>
              <span className="font-bold text-white/90 text-sm mt-0.5">{deskName}</span>
              <span className="text-[11px] mt-1 text-[#EA580C]">● Live Wire RSS</span>
            </div>
          </div>
          
          {/* Source Filter Letterpress Pills */}
          {pills.length > 0 && (
            <div className="relative z-10 pt-4 border-t border-white/10 flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
              <span className="text-[10px] font-mono uppercase tracking-widest text-white/60 mr-1 shrink-0 font-bold">
                Desk Filter:
              </span>
              <button
                onClick={() => setActiveFilter(null)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-bold uppercase tracking-wider transition-all shrink-0 ${
                  activeFilter === null
                    ? 'bg-white text-stone-900 shadow-sm'
                    : 'bg-white/10 text-white/80 hover:bg-white/20 border border-white/15'
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
                        ? 'bg-[#EA580C] text-white shadow-sm' 
                        : 'bg-white/10 text-white/80 hover:bg-white/20 border border-white/15'
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
          <div className="text-center py-24 bg-[#FCFAF7] rounded-2xl border border-[#E0D9CC] p-8 space-y-4 shadow-[0_4px_16px_rgba(40,30,20,0.04)]">
            <span className="text-2xl text-[#EA580C] font-mono">{glyph}</span>
            <h3 className="font-serif text-xl font-bold text-[#181715]">
              No dispatches currently on wire
            </h3>
            <p className="text-xs text-[#6B6355] max-w-sm mx-auto leading-relaxed">
              Our curators are surveying new dispatches for {deskName}. Refresh your wire or return to the broadsheet.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={refetch}
                className="px-5 py-2.5 rounded-full bg-[#181715] text-[#FAF7F0] font-mono text-xs uppercase tracking-wider hover:bg-[#2C2825] transition-colors"
              >
                Refresh Wire
              </button>
              <Link
                href="/feed"
                className="px-5 py-2.5 rounded-full bg-[#FCFAF7] border border-[#D5CDBD] text-[#2C2825] font-mono text-xs uppercase tracking-wider hover:border-[#181715] transition-colors"
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
