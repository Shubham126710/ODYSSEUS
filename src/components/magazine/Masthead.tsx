import React from 'react';

interface MastheadProps {
  todayFormatted: string;
  rankTitle: string;
  streakCount: number;
  categories: string[];
  activeCategory: string;
  onSelectCategory: (cat: string) => void;
}

export const Masthead: React.FC<MastheadProps> = ({
  todayFormatted,
  rankTitle,
  streakCount,
  categories,
  activeCategory,
  onSelectCategory,
}) => {
  return (
    <header className="w-full space-y-4">
      {/* Top Folio Bar with Double Hairline Rules */}
      <div className="border-t border-b border-[#FFFDD0]/20 py-2.5 px-2 sm:px-4 flex flex-wrap items-center justify-between gap-3 text-[9px] sm:text-[10px] font-mono uppercase tracking-[0.25em] text-[#FFFDD0]/70 select-none">
        
        {/* Folio Issue Metadata */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <span className="font-bold text-[#FFFDD0] tracking-[0.28em]">
            THE ODYSSEUS JOURNAL
          </span>
          <span className="text-[#EA580C]">•</span>
          <span className="font-semibold text-[#FFFDD0]/90">
            VOL. IV — NO. 108
          </span>
          <span className="text-white/20 hidden sm:inline">•</span>
          <span className="text-[#FFFDD0]/60 hidden sm:inline">
            {todayFormatted}
          </span>
        </div>

        {/* Discreet Streak & Rank Folio Stamp */}
        <div className="flex items-center gap-3 ml-auto text-[9px] sm:text-[10px]">
          <span className="text-white/40 hidden md:inline">EDITION: DISPATCH</span>
          <span className="text-white/20 hidden md:inline">•</span>
          <span className="text-[#EA580C] font-bold">
            {rankTitle}
          </span>
          <span className="text-[#FFFDD0]/80 font-bold border-l border-[#FFFDD0]/20 pl-3">
            [{streakCount}D STREAK]
          </span>
        </div>
      </div>

      {/* Slim Text Category Navigation Strip (with orange underline on active item, no heavy pills) */}
      <nav 
        aria-label="Editorial Desks Navigation"
        className="flex items-center gap-6 sm:gap-8 overflow-x-auto pb-2 pt-1 border-b border-[#FFFDD0]/10 scrollbar-hide text-xs font-mono uppercase tracking-[0.2em]"
      >
        {categories.map((cat) => {
          const isActive = activeCategory.toLowerCase() === cat.toLowerCase();
          return (
            <button
              key={cat}
              type="button"
              onClick={() => onSelectCategory(cat)}
              className={`relative py-1.5 transition-colors whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'text-[#FFFDD0] font-bold'
                  : 'text-[#FFFDD0]/50 hover:text-[#FFFDD0]'
              }`}
            >
              <span>{cat}</span>
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#EA580C] animate-in fade-in duration-200" />
              )}
            </button>
          );
        })}
      </nav>
    </header>
  );
};
