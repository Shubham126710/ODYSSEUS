"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StaticOrangeCompass } from './StaticOrangeCompass';
import { supabase } from '@/lib/supabaseClient';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  userName?: string;
  onComplete?: () => void;
}

// Prestige Publication Vector Logos
const VergeLogo = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg viewBox="0 0 100 100" fill="currentColor" className={className}>
    <polygon points="10,20 34,20 48,62 62,20 86,20 56,82 40,82" />
  </svg>
);

const WiredLogo = ({ className = "w-12 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 110 32" fill="currentColor" className={className}>
    <text x="55" y="24" textAnchor="middle" fontFamily="ui-monospace, monospace" fontWeight="900" fontSize="24" letterSpacing="2">WIRED</text>
  </svg>
);

const AtlanticLogo = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg viewBox="0 0 100 100" fill="currentColor" className={className}>
    <text x="50" y="80" textAnchor="middle" fontFamily="Georgia, serif" fontWeight="bold" fontSize="88" fontStyle="italic">A</text>
  </svg>
);

const NYTimesLogo = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg viewBox="0 0 100 100" fill="currentColor" className={className}>
    <text x="50" y="78" textAnchor="middle" fontFamily="Georgia, 'Times New Roman', serif" fontWeight="900" fontSize="82">T</text>
  </svg>
);

const TechCrunchLogo = ({ className = "w-8 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 100 60" fill="currentColor" className={className}>
    <rect x="6" y="6" width="88" height="48" rx="8" fill="currentColor" fillOpacity="0.12" />
    <text x="50" y="42" textAnchor="middle" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="36" letterSpacing="-1">TC</text>
  </svg>
);

const BloombergLogo = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg viewBox="0 0 100 100" fill="currentColor" className={className}>
    <text x="50" y="76" textAnchor="middle" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="80" letterSpacing="-2">B</text>
  </svg>
);

const DezeenLogo = ({ className = "w-8 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 100 60" fill="currentColor" className={className}>
    <text x="50" y="44" textAnchor="middle" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="42" letterSpacing="-1">dz</text>
  </svg>
);

const QuantaLogo = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg viewBox="0 0 100 100" fill="currentColor" className={className}>
    <circle cx="48" cy="46" r="28" fill="none" stroke="currentColor" strokeWidth="10" />
    <line x1="56" y1="56" x2="82" y2="82" stroke="currentColor" strokeWidth="12" strokeLinecap="round" />
  </svg>
);

const TOPICS = [
  { id: 'tech', label: 'Technology & AI', glyph: '✦', desc: 'Frontier models, cybernetics & computing' },
  { id: 'design', label: 'Design & Architecture', glyph: '◈', desc: 'Spatial craft, typography & aesthetic form' },
  { id: 'culture', label: 'Culture & Essays', glyph: '◆', desc: 'Philosophy, longform criticism & human affairs' },
  { id: 'science', label: 'Science & Cosmos', glyph: '❖', desc: 'Astrophysics, biology & quantum realms' },
  { id: 'economy', label: 'Global Chronicle', glyph: '—', desc: 'Markets, macro trends & geopolitics' },
  { id: 'nature', label: 'Earth & Ecology', glyph: '•', desc: 'Expeditions, climate & living systems' },
];

const PRESTIGE_PUBLICATIONS = [
  { id: 'theverge', name: 'The Verge', category: 'Technology', Logo: VergeLogo },
  { id: 'wired', name: 'Wired', category: 'Technology', Logo: WiredLogo },
  { id: 'atlantic', name: 'The Atlantic', category: 'Culture', Logo: AtlanticLogo },
  { id: 'nytimes', name: 'NY Times', category: 'Global Chronicle', Logo: NYTimesLogo },
  { id: 'techcrunch', name: 'TechCrunch', category: 'Frontier AI', Logo: TechCrunchLogo },
  { id: 'bloomberg', name: 'Bloomberg', category: 'Markets', Logo: BloombergLogo },
  { id: 'dezeen', name: 'Dezeen', category: 'Architecture', Logo: DezeenLogo },
  { id: 'quanta', name: 'Quanta Magazine', category: 'Science', Logo: QuantaLogo },
];

const READING_PACES = [
  {
    minutes: 10,
    title: 'Casual Voyager',
    subtitle: '10 min / day',
    description: 'A focused morning briefing over quiet contemplation.',
    badge: 'Light Digest',
  },
  {
    minutes: 20,
    title: 'Dedicated Scholar',
    subtitle: '20 min / day',
    description: 'Balanced intellectual depth with multiple perspectives.',
    badge: 'Recommended',
    isPopular: true,
  },
  {
    minutes: 35,
    title: 'Grand Master',
    subtitle: '35 min / day',
    description: 'Uninterrupted long-form immersion and deep essays.',
    badge: 'Deep Dive',
  },
];

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  userId,
  userName = 'Traveler',
  onComplete,
}) => {
  const [step, setStep] = useState(1);
  const [selectedTopics, setSelectedTopics] = useState<string[]>(['tech', 'design', 'culture']);
  const [selectedPubs, setSelectedPubs] = useState<string[]>(['theverge', 'wired', 'atlantic', 'nytimes', 'dezeen']);
  const [selectedGoal, setSelectedGoal] = useState<number>(20);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Smooth background scroll to guide traveler through salon sections behind the modal
  useEffect(() => {
    if (!isOpen || typeof window === 'undefined') return;

    if (step === 1) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (step === 2) {
      window.scrollTo({ top: 600, behavior: 'smooth' });
    } else if (step === 3) {
      window.scrollTo({ top: 1200, behavior: 'smooth' });
    } else if (step === 4) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [step, isOpen]);

  if (!isOpen) return null;

  const toggleTopic = (id: string) => {
    setSelectedTopics((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const togglePub = (id: string) => {
    setSelectedPubs((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    try {
      if (userId) {
        await supabase
          .from('profiles')
          .update({
            daily_goal_minutes: selectedGoal,
            has_completed_onboarding: true,
          })
          .eq('id', userId);
      }
    } catch {
      // fallback
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem('odysseus_onboarding_completed', 'true');
      localStorage.setItem('odysseus_onboarding_topics', JSON.stringify(selectedTopics));
      localStorage.setItem('odysseus_onboarding_pubs', JSON.stringify(selectedPubs));
      localStorage.setItem('odysseus_daily_goal', selectedGoal.toString());
    }

    setIsSubmitting(false);
    if (onComplete) onComplete();
    onClose();
  };

  return (
    <AnimatePresence>
      <div 
        style={{ zIndex: 9999 }}
        className="fixed inset-0 z-modal flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          style={{ backgroundColor: '#FAF7EE', color: '#131E15' }}
          className="relative w-full max-w-2xl rounded-2xl sm:rounded-3xl border border-[#131E15]/15 shadow-2xl overflow-hidden flex flex-col max-h-[88vh]"
        >
          {/* Top Editorial Bar */}
          <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/70 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 shrink-0">
                <StaticOrangeCompass className="w-full h-full" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#EA580C] font-bold block">
                  ODYSSEUS • SALON ORIENTATION
                </span>
                <h4 className="font-serif text-sm sm:text-base font-bold text-stone-900">
                  {step === 1 && 'Step 1: Orient Your Curiosity'}
                  {step === 2 && 'Step 2: Curate Prestige Publications'}
                  {step === 3 && 'Step 3: Define Daily Reading Pace'}
                  {step === 4 && 'Step 4: The Traveler’s Passport'}
                </h4>
              </div>
            </div>

            {/* Step Indicators & Close Button */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4].map((s) => (
                  <div
                    key={s}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      s === step
                        ? 'w-6 bg-[#EA580C]'
                        : s < step
                        ? 'w-2.5 bg-stone-900'
                        : 'w-2 bg-stone-200'
                    }`}
                  />
                ))}
              </div>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-900 hover:bg-stone-100 transition-colors ml-1 font-mono text-xs"
                title="Close Guide"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Modal Content Body */}
          <div className="p-6 sm:p-8 overflow-y-auto flex-1 font-sans space-y-6">
            
            {/* STEP 1: TOPIC CALIBRATION */}
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                className="space-y-5"
              >
                <div className="text-center max-w-lg mx-auto">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#EA580C] font-bold">
                    TERRITORY ORIENTATION
                  </span>
                  <h3 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 mt-0.5 mb-1.5">
                    Orient Your Curiosity
                  </h3>
                  <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                    Select the intellectual territories you wish to explore. Odysseus shapes your daily broadside around your choices.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {TOPICS.map((topic) => {
                    const isSelected = selectedTopics.includes(topic.id);
                    return (
                      <button
                        key={topic.id}
                        onClick={() => toggleTopic(topic.id)}
                        className={`text-left p-3.5 rounded-xl border transition-all duration-200 flex items-start gap-3 cursor-pointer ${
                          isSelected
                            ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                            : 'bg-white hover:bg-stone-50 text-stone-900 border-stone-200 hover:border-stone-300'
                        }`}
                      >
                        <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${
                          isSelected ? 'bg-white/15 text-white' : 'bg-stone-100 text-stone-700 font-mono'
                        }`}>
                          {topic.glyph}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-serif font-bold text-sm truncate">{topic.label}</span>
                            {isSelected && (
                              <span className="text-[10px] font-mono font-bold bg-[#EA580C] text-white px-2 py-0.5 rounded-full shrink-0 ml-1">
                                ✓
                              </span>
                            )}
                          </div>
                          <p className={`text-[11px] mt-0.5 leading-snug line-clamp-1 ${isSelected ? 'text-white/70' : 'text-stone-500'}`}>
                            {topic.desc}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* STEP 2: PRESTIGE PUBLICATION SEALS WITH REAL SVG LOGOS */}
            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                className="space-y-5"
              >
                <div className="text-center max-w-lg mx-auto">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#EA580C] font-bold">
                    PRESTIGE REPOSITORY
                  </span>
                  <h3 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 mt-0.5 mb-1.5">
                    Curate Your Library
                  </h3>
                  <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                    Select authoritative global publications to inaugurate your library. Tap to stamp with a verified salon seal.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                  {PRESTIGE_PUBLICATIONS.map((pub) => {
                    const isSelected = selectedPubs.includes(pub.id);
                    const Logo = pub.Logo;
                    return (
                      <button
                        key={pub.id}
                        onClick={() => togglePub(pub.id)}
                        className={`p-3.5 rounded-xl border text-center transition-all duration-200 flex flex-col items-center justify-between relative group ${
                          isSelected
                            ? 'bg-white border-[#EA580C] ring-2 ring-[#EA580C]/20 shadow-xs'
                            : 'bg-stone-50 hover:bg-stone-100 border-stone-200/80 hover:border-stone-300'
                        }`}
                      >
                        <div className={`w-11 h-11 rounded-lg flex items-center justify-center mb-2 transition-all ${
                          isSelected
                            ? 'bg-[#EA580C]/10 text-[#EA580C]'
                            : 'bg-stone-200/50 text-stone-700'
                        }`}>
                          <Logo className="w-6 h-6 object-contain" />
                        </div>
                        <span className="font-serif font-bold text-xs text-stone-900 line-clamp-1">{pub.name}</span>
                        <span className="text-[9px] font-mono text-stone-500 uppercase tracking-wider mt-0.5">{pub.category}</span>

                        {isSelected ? (
                          <div className="mt-2 text-[8px] font-mono font-bold uppercase tracking-wider text-[#EA580C] bg-[#EA580C]/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <span>✦</span>
                            <span>Stamped</span>
                          </div>
                        ) : (
                          <div className="mt-2 text-[8px] font-mono text-stone-400 uppercase tracking-wider px-2 py-0.5">
                            Select
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* STEP 3: DAILY READING PACE */}
            {step === 3 && (
              <motion.div
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                className="space-y-5"
              >
                <div className="text-center max-w-lg mx-auto">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#EA580C] font-bold">
                    HABIT COMMITMENT
                  </span>
                  <h3 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 mt-0.5 mb-1.5">
                    Define Your Daily Pace
                  </h3>
                  <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                    Reading habits form through steady, intentional ritual. Choose a daily commitment that suits your contemplative rhythm.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
                  {READING_PACES.map((pace) => {
                    const isSelected = selectedGoal === pace.minutes;
                    return (
                      <button
                        key={pace.minutes}
                        onClick={() => setSelectedGoal(pace.minutes)}
                        className={`text-left p-4 sm:p-5 rounded-xl border transition-all duration-200 flex flex-col justify-between relative cursor-pointer ${
                          isSelected
                            ? 'bg-stone-900 text-white border-stone-900 shadow-md'
                            : 'bg-white hover:bg-stone-50 text-stone-900 border-stone-200 hover:border-stone-300'
                        }`}
                      >
                        {pace.badge && (
                          <div className={`text-[9px] font-mono uppercase tracking-widest px-2.5 py-0.5 rounded-full inline-block w-fit mb-2 font-bold ${
                            isSelected ? 'bg-[#EA580C] text-white' : 'bg-stone-200/80 text-stone-700'
                          }`}>
                            {pace.badge}
                          </div>
                        )}
                        <div>
                          <div className="font-serif text-lg font-bold mb-0.5">{pace.title}</div>
                          <div className={`font-mono text-xs mb-2 font-bold ${isSelected ? 'text-[#EA580C]' : 'text-[#EA580C]'}`}>
                            {pace.subtitle}
                          </div>
                          <p className={`text-xs leading-relaxed ${isSelected ? 'text-white/70' : 'text-stone-600'}`}>
                            {pace.description}
                          </p>
                        </div>

                        <div className="mt-4 pt-2.5 border-t border-current/10 flex items-center justify-between text-[11px] font-mono font-bold">
                          <span>Bonus Hours</span>
                          <span className="text-[#EA580C]">1.5x Multiplier</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* STEP 4: PASSPORT & PERMANENT MINTED SEAL */}
            {step === 4 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="space-y-5 text-center"
              >
                <div className="max-w-md mx-auto">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#EA580C] font-bold">
                    CREDENTIAL INAUGURATION
                  </span>
                  <h3 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 mt-0.5 mb-1">
                    Your Odyssey Begins
                  </h3>
                  <p className="text-xs sm:text-sm text-stone-600">
                    Your salon credentials and inaugural rank have been minted.
                  </p>
                </div>

                {/* Minted Passport Card */}
                <div className="relative max-w-md mx-auto bg-stone-50 p-5 sm:p-6 rounded-2xl border border-stone-200 shadow-md text-left overflow-hidden">
                  
                  {/* Header Dateline */}
                  <div className="flex items-center justify-between border-b border-stone-200 pb-3 mb-3">
                    <div>
                      <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-stone-500 block">
                        OFFICIAL TRAVELER’S PASSPORT
                      </span>
                      <h4 className="font-serif text-lg font-bold text-stone-900">{userName}</h4>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] font-mono uppercase tracking-widest text-stone-400 block">COMMITTED</span>
                      <div className="font-mono text-xs sm:text-sm font-bold text-[#EA580C]">{selectedGoal} MIN / DAY</div>
                    </div>
                  </div>

                  {/* Badges Grid */}
                  <div className="grid grid-cols-2 gap-2.5 text-xs mb-4">
                    <div className="bg-white p-3 rounded-xl border border-stone-200/80">
                      <span className="text-[9px] font-mono uppercase tracking-wider text-stone-500 block mb-0.5">Assigned Rank</span>
                      <span className="font-serif font-bold text-stone-900 text-sm flex items-center gap-1.5">
                        <span className="text-[#EA580C] font-mono">✦</span>
                        <span>Novice Wanderer</span>
                      </span>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-stone-200/80">
                      <span className="text-[9px] font-mono uppercase tracking-wider text-stone-500 block mb-0.5">Shield Inventory</span>
                      <span className="font-serif font-bold text-stone-900 text-sm flex items-center gap-1.5">
                        <span className="text-[#EA580C] font-mono">◈</span>
                        <span>1 Active Shield</span>
                      </span>
                    </div>
                  </div>

                  {/* Minted Wax Seal Stamp */}
                  <div className="flex items-center justify-center pt-2">
                    <div className="w-18 h-18 rounded-full bg-gradient-to-br from-[#EA580C] to-[#C2410C] text-white flex flex-col items-center justify-center shadow-lg border-2 border-white/60 select-none shrink-0 ring-4 ring-stone-200/50">
                      <span className="text-[8px] font-mono tracking-widest uppercase opacity-80">ODYSSEUS</span>
                      <span className="font-serif font-black text-xs tracking-widest text-white">MINTED</span>
                      <span className="text-[7px] font-mono tracking-wider opacity-90 uppercase">SALON PASS</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Modal Footer Controls */}
          <div className="px-6 py-4 border-t border-stone-100 flex items-center justify-between bg-stone-50/70 shrink-0">
            {step > 1 ? (
              <button
                onClick={() => setStep((s) => s - 1)}
                className="px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider text-stone-600 hover:text-stone-900 hover:bg-stone-200/50 transition-colors"
              >
                ← Back
              </button>
            ) : (
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider text-stone-400 hover:text-stone-900 transition-colors"
              >
                Skip Guide
              </button>
            )}

            {step < 4 ? (
              <button
                onClick={() => setStep((s) => s + 1)}
                className="px-6 py-2.5 rounded-xl bg-[#EA580C] hover:bg-[#C2410C] text-white font-mono font-bold text-xs uppercase tracking-wider shadow-sm hover:shadow-md transition-all flex items-center gap-2 group"
              >
                <span>Continue</span>
                <span className="group-hover:translate-x-0.5 transition-transform font-sans">→</span>
              </button>
            ) : (
              <button
                onClick={handleFinish}
                disabled={isSubmitting}
                className="px-7 py-2.5 rounded-xl bg-[#131E15] hover:bg-black text-white font-mono font-bold text-xs uppercase tracking-widest shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <span>{isSubmitting ? 'Inaugurating...' : 'Enter Odysseus Salon'}</span>
                <span>→</span>
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
