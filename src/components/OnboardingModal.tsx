"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StaticOrangeCompass } from './StaticOrangeCompass';
import { supabase } from '@/lib/supabaseClient';
import gsap from 'gsap';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  userName?: string;
  onComplete?: () => void;
}

const TOPICS = [
  { id: 'tech', label: 'Technology & AI', icon: '🛰️', desc: 'Breakthroughs, models & computing' },
  { id: 'design', label: 'Design & Architecture', icon: '📐', desc: 'Craft, spatial design & typography' },
  { id: 'culture', label: 'Culture & Essays', icon: '🏛️', desc: 'Philosophy, longform & human condition' },
  { id: 'science', label: 'Science & Cosmos', icon: '🔭', desc: 'Astrophysics, biology & quantum realms' },
  { id: 'economy', label: 'Global Economy', icon: '🌐', desc: 'Markets, macro trends & geopolitics' },
  { id: 'nature', label: 'Earth & Ecology', icon: '🌿', desc: 'Climate, expeditions & living systems' },
];

const PRESTIGE_PUBLICATIONS = [
  { id: 'wired', name: 'Wired', category: 'Technology', monogram: 'WI' },
  { id: 'atlantic', name: 'The Atlantic', category: 'Culture', monogram: 'AT' },
  { id: 'dezeen', name: 'Dezeen', category: 'Architecture', monogram: 'DZ' },
  { id: 'quanta', name: 'Quanta Magazine', category: 'Science', monogram: 'QM' },
  { id: 'verge', name: 'The Verge', category: 'Technology', monogram: 'VG' },
  { id: 'mit', name: 'MIT Tech Review', category: 'AI & Research', monogram: 'TR' },
  { id: 'nice', name: "It's Nice That", category: 'Visual Culture', monogram: 'NT' },
  { id: 'bloomberg', name: 'Bloomberg', category: 'Global Chronicle', monogram: 'BB' },
];

const READING_PACES = [
  {
    minutes: 10,
    title: 'Casual Voyager',
    subtitle: '10 min / day',
    description: 'A focused morning briefing over coffee.',
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
    title: 'Grand Explorer',
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
  const [selectedPubs, setSelectedPubs] = useState<string[]>(['wired', 'atlantic', 'dezeen', 'quanta']);
  const [selectedGoal, setSelectedGoal] = useState<number>(20);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const compassNeedleRef = useRef<HTMLDivElement>(null);
  const waxSealRef = useRef<HTMLDivElement>(null);

  // Animate compass rotation when changing steps or topics
  useEffect(() => {
    if (compassNeedleRef.current) {
      gsap.to(compassNeedleRef.current, {
        rotation: (step - 1) * 90 + selectedTopics.length * 45,
        duration: 0.8,
        ease: 'back.out(1.4)',
      });
    }
  }, [step, selectedTopics.length]);

  // Animate wax seal stamp in Step 4
  useEffect(() => {
    if (step === 4 && waxSealRef.current) {
      gsap.fromTo(
        waxSealRef.current,
        { scale: 2.5, opacity: 0, rotate: -25 },
        { scale: 1, opacity: 1, rotate: 0, duration: 0.6, ease: 'bounce.out', delay: 0.2 }
      );
    }
  }, [step]);

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
      // Mark onboarding as completed in Supabase profiles
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
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 md:p-6 bg-black/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="relative w-full max-w-2xl bg-juice-cream rounded-3xl md:rounded-[32px] border border-juice-green/20 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Top Editorial Bar */}
          <div className="px-6 py-4 md:px-8 md:py-5 border-b border-juice-green/10 flex items-center justify-between bg-juice-green/5">
            <div className="flex items-center gap-3">
              <div ref={compassNeedleRef} className="w-6 h-6 md:w-7 md:h-7 shrink-0">
                <StaticOrangeCompass className="w-full h-full" />
              </div>
              <div>
                <span className="text-[10px] md:text-xs font-mono uppercase tracking-[0.2em] text-juice-green/60">
                  Odysseus • Editorial Guide
                </span>
                <h4 className="font-serif text-sm md:text-base font-bold text-juice-green">
                  {step === 1 && 'Step 1: Orient Your Curiosity'}
                  {step === 2 && 'Step 2: Curate Your Library'}
                  {step === 3 && 'Step 3: Define Your Daily Pace'}
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
                        ? 'w-6 bg-juice-orange'
                        : s < step
                        ? 'w-2.5 bg-juice-green'
                        : 'w-2 bg-juice-green/20'
                    }`}
                  />
                ))}
              </div>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-full flex items-center justify-center text-juice-green/50 hover:text-juice-green hover:bg-juice-green/10 transition-colors ml-2"
                title="Close Guide"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Modal Content Body */}
          <div className="p-6 md:p-8 overflow-y-auto flex-1 font-sans">
            {/* STEP 1: TOPIC CALIBRATION */}
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center max-w-lg mx-auto">
                  <h3 className="font-serif text-2xl md:text-3xl font-bold text-juice-green mb-2">
                    Orient Your Curiosity
                  </h3>
                  <p className="text-sm text-juice-green/70">
                    Select the intellectual territories you wish to explore. Odysseus shapes your daily magazine edition around your choices.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {TOPICS.map((topic) => {
                    const isSelected = selectedTopics.includes(topic.id);
                    return (
                      <button
                        key={topic.id}
                        onClick={() => toggleTopic(topic.id)}
                        className={`text-left p-4 rounded-2xl border transition-all duration-200 flex items-start gap-3.5 ${
                          isSelected
                            ? 'bg-juice-green text-juice-cream border-juice-green shadow-md scale-[1.01]'
                            : 'bg-white/60 hover:bg-white text-juice-green border-juice-green/15 hover:border-juice-green/40'
                        }`}
                      >
                        <span className="text-2xl shrink-0 p-2 rounded-xl bg-black/5">{topic.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-serif font-bold text-sm">{topic.label}</span>
                            {isSelected && (
                              <span className="text-xs bg-juice-orange text-white px-2 py-0.5 rounded-full font-bold">
                                ✓
                              </span>
                            )}
                          </div>
                          <p className={`text-xs mt-1 leading-snug line-clamp-1 ${isSelected ? 'text-juice-cream/80' : 'text-juice-green/60'}`}>
                            {topic.desc}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* STEP 2: PUBLICATION STAMPS */}
            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center max-w-lg mx-auto">
                  <h3 className="font-serif text-2xl md:text-3xl font-bold text-juice-green mb-2">
                    Curate Your Library
                  </h3>
                  <p className="text-sm text-juice-green/70">
                    Select prestigious global publications to inaugurate your collection. Tap to stamp with a wax seal.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  {PRESTIGE_PUBLICATIONS.map((pub) => {
                    const isSelected = selectedPubs.includes(pub.id);
                    return (
                      <button
                        key={pub.id}
                        onClick={() => togglePub(pub.id)}
                        className={`p-3.5 rounded-2xl border text-center transition-all duration-200 flex flex-col items-center justify-between relative overflow-hidden group ${
                          isSelected
                            ? 'bg-juice-green/10 border-juice-orange ring-2 ring-juice-orange/20 shadow-sm'
                            : 'bg-white/60 hover:bg-white border-juice-green/15 hover:border-juice-green/30'
                        }`}
                      >
                        <div className={`w-11 h-11 rounded-full flex items-center justify-center font-serif font-bold text-sm tracking-wider mb-2 transition-transform duration-300 group-hover:scale-105 ${
                          isSelected
                            ? 'bg-juice-orange text-white shadow-md'
                            : 'bg-juice-green/10 text-juice-green'
                        }`}>
                          {pub.monogram}
                        </div>
                        <span className="font-serif font-bold text-xs text-juice-green line-clamp-1">{pub.name}</span>
                        <span className="text-[10px] text-juice-green/60 uppercase tracking-widest mt-0.5">{pub.category}</span>

                        {isSelected && (
                          <div className="mt-2 text-[9px] font-bold uppercase tracking-wider text-juice-orange bg-juice-orange/10 px-2 py-0.5 rounded-full">
                            ★ Stamped
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
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center max-w-lg mx-auto">
                  <h3 className="font-serif text-2xl md:text-3xl font-bold text-juice-green mb-2">
                    Set Your Daily Pace
                  </h3>
                  <p className="text-sm text-juice-green/70">
                    Streaks form through steady, intentional ritual. Choose a daily commitment you can savor each day.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  {READING_PACES.map((pace) => {
                    const isSelected = selectedGoal === pace.minutes;
                    return (
                      <button
                        key={pace.minutes}
                        onClick={() => setSelectedGoal(pace.minutes)}
                        className={`text-left p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between relative ${
                          isSelected
                            ? 'bg-juice-green text-juice-cream border-juice-green shadow-xl scale-[1.02]'
                            : 'bg-white/60 hover:bg-white text-juice-green border-juice-green/15 hover:border-juice-green/40'
                        }`}
                      >
                        {pace.badge && (
                          <div className={`text-[9px] font-mono uppercase tracking-widest px-2.5 py-0.5 rounded-full inline-block w-fit mb-3 font-bold ${
                            isSelected ? 'bg-juice-orange text-white' : 'bg-juice-green/10 text-juice-green'
                          }`}>
                            {pace.badge}
                          </div>
                        )}
                        <div>
                          <div className="font-serif text-xl font-bold mb-1">{pace.title}</div>
                          <div className={`font-mono text-xs mb-3 font-semibold ${isSelected ? 'text-juice-orange' : 'text-juice-orange'}`}>
                            {pace.subtitle}
                          </div>
                          <p className={`text-xs leading-relaxed ${isSelected ? 'text-juice-cream/80' : 'text-juice-green/60'}`}>
                            {pace.description}
                          </p>
                        </div>

                        <div className="mt-5 pt-3 border-t border-current/10 flex items-center justify-between text-xs font-bold">
                          <span>Multiplier Eligible</span>
                          <span>1.5x 🌅 / 🦉</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* STEP 4: PASSPORT & WAX SEAL STAMP */}
            {step === 4 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-6 text-center"
              >
                <div className="max-w-md mx-auto">
                  <h3 className="font-serif text-2xl md:text-3xl font-bold text-juice-green mb-1">
                    Your Odyssey Begins
                  </h3>
                  <p className="text-xs md:text-sm text-juice-green/70">
                    Your reader credentials and inaugural rank have been minted.
                  </p>
                </div>

                {/* Passport Card */}
                <div className="relative max-w-md mx-auto bg-gradient-to-br from-[#F2ECE1] to-[#E5DDCB] p-6 rounded-3xl border-2 border-juice-green/30 shadow-xl text-left overflow-hidden">
                  {/* Watermark Compass */}
                  <div className="absolute right-[-20px] bottom-[-20px] opacity-10 pointer-events-none">
                    <StaticOrangeCompass className="w-56 h-56" />
                  </div>

                  <div className="flex items-center justify-between border-b border-juice-green/15 pb-4 mb-4">
                    <div>
                      <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-juice-green/60">
                        OFFICIAL TRAVELER’S PASSPORT
                      </span>
                      <h4 className="font-serif text-lg font-bold text-juice-green">{userName}</h4>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] font-mono uppercase tracking-widest text-juice-green/50">COMMITTED</span>
                      <div className="font-mono text-sm font-bold text-juice-orange">{selectedGoal} MIN / DAY</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs mb-4">
                    <div className="bg-white/50 p-2.5 rounded-xl border border-juice-green/10">
                      <span className="text-[9px] uppercase tracking-wider text-juice-green/60 block mb-0.5">Assigned Rank</span>
                      <span className="font-serif font-bold text-juice-green text-sm flex items-center gap-1">
                        🪶 Novice Wanderer
                      </span>
                    </div>
                    <div className="bg-white/50 p-2.5 rounded-xl border border-juice-green/10">
                      <span className="text-[9px] uppercase tracking-wider text-juice-green/60 block mb-0.5">Shield Inventory</span>
                      <span className="font-serif font-bold text-juice-green text-sm flex items-center gap-1">
                        🧊 1 Streak Freeze
                      </span>
                    </div>
                  </div>

                  {/* Wax Seal Stamp */}
                  <div className="flex items-center justify-center pt-2">
                    <div
                      ref={waxSealRef}
                      className="w-20 h-20 rounded-full bg-gradient-to-br from-[#E25838] to-[#C1381A] text-juice-cream flex flex-col items-center justify-center shadow-lg border-2 border-[#FFA185] rotate-[-5deg]"
                    >
                      <span className="text-[8px] font-mono tracking-widest uppercase">ODYSSEUS</span>
                      <span className="font-serif font-black text-sm tracking-widest">VERIFIED</span>
                      <span className="text-[8px] opacity-80">★ EDITION ★</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Modal Footer Controls */}
          <div className="px-6 py-4 md:px-8 md:py-5 border-t border-juice-green/10 flex items-center justify-between bg-juice-green/5">
            {step > 1 ? (
              <button
                onClick={() => setStep((s) => s - 1)}
                className="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider text-juice-green/70 hover:text-juice-green hover:bg-juice-green/10 transition-colors"
              >
                ← Back
              </button>
            ) : (
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider text-juice-green/40 hover:text-juice-green hover:bg-juice-green/10 transition-colors"
              >
                Skip Guide
              </button>
            )}

            {step < 4 ? (
              <button
                onClick={() => setStep((s) => s + 1)}
                className="px-6 py-2.5 rounded-full bg-juice-orange hover:bg-orange-600 text-white font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center gap-2 group"
              >
                Continue
                <span className="group-hover:translate-x-0.5 transition-transform">→</span>
              </button>
            ) : (
              <button
                onClick={handleFinish}
                disabled={isSubmitting}
                className="px-7 py-3 rounded-full bg-juice-green hover:bg-[#4d6d39] text-white font-serif font-bold text-sm tracking-wide shadow-lg hover:shadow-xl transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? 'Inaugurating...' : 'Begin Your Odyssey'}
                <span>✨</span>
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
