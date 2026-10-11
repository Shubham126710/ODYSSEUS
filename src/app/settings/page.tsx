"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AppHeader } from '@/components/AppHeader';
import { Footer } from '@/components/Footer';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/lib/supabaseClient';

export default function SettingsPage() {
  const { profile, loading } = useProfile();
  const [dailyGoal, setDailyGoal] = useState(15);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [headerTheme, setHeaderTheme] = useState<'light' | 'dark' | 'orange'>('light');

  // Magazine preferences
  const [preferredTheme, setPreferredTheme] = useState<'dark' | 'sepia' | 'light'>('dark');
  const [autoPurify, setAutoPurify] = useState(true);
  const [streakReminders, setStreakReminders] = useState(true);
  const [earlyBirdAlerts, setEarlyBirdAlerts] = useState(true);
  const [selectedDesks, setSelectedDesks] = useState<string[]>([
    'The Vanguard', 'The Atelier', 'The Forum', 'The Chronicle', 'The Observatory'
  ]);

  useEffect(() => {
    if (profile?.daily_goal_minutes) {
      setDailyGoal(profile.daily_goal_minutes);
    }
  }, [profile]);

  const toggleDesk = (desk: string) => {
    setSelectedDesks(prev => 
      prev.includes(desk) ? prev.filter(d => d !== desk) : [...prev, desk]
    );
  };

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    setMessage('');

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ daily_goal_minutes: dailyGoal })
        .eq('id', profile.id);

      if (error) throw error;
      setMessage('Preferences saved to your Traveler Dossier! ✦');
      setTimeout(() => setMessage(''), 3500);
    } catch {
      setMessage('Error saving preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    const viewportHeight = e.currentTarget.clientHeight;
    const sectionIndex = Math.round(scrollTop / viewportHeight);
    setHeaderTheme(sectionIndex === 0 ? 'light' : 'dark');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-juice-cream flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-3 border-juice-orange/20 border-t-juice-orange rounded-full animate-spin" />
        <p className="font-mono text-xs uppercase tracking-widest text-juice-green/60">Loading Preferences...</p>
      </div>
    );
  }

  return (
    <div 
      onScroll={handleScroll}
      data-lenis-prevent
      className="h-screen w-full overflow-y-scroll snap-y snap-mandatory scroll-smooth bg-juice-cream text-juice-green font-sans selection:bg-juice-orange selection:text-juice-cream"
    >
      <div className="fixed top-0 left-0 right-0 z-50">
        <AppHeader theme={headerTheme} />
      </div>
      
      {/* Settings Main Spread */}
      <section className="min-h-screen snap-start pt-20 md:pt-24 pb-16 px-4 md:px-8 lg:px-12 max-w-[1200px] mx-auto flex flex-col">
        
        {/* Editorial Masthead */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 md:mb-12 border-b border-juice-green/15 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4"
        >
          <div>
            <div className="text-[10px] md:text-xs font-mono uppercase tracking-[0.2em] text-juice-orange font-bold mb-2">
              THE ODYSSEUS ATELIER • CONFIGURATION
            </div>
            <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl font-bold text-juice-green">
              Salon Preferences
            </h1>
            <p className="text-xs sm:text-sm text-juice-green/70 mt-2 max-w-lg font-sans">
              Calibrate your daily reading pace, desk subscriptions, purification filters, and reading chamber aesthetics.
            </p>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="self-start md:self-auto px-6 py-3 rounded-2xl bg-juice-orange hover:bg-orange-600 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider shadow-md hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
          >
            {saving ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <span>Save Preferences ✦</span>
            )}
          </button>
        </motion.div>

        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 rounded-2xl bg-juice-green/10 border border-juice-green/20 text-juice-green text-xs font-mono font-bold flex items-center justify-between"
          >
            <span>{message}</span>
            <span className="text-juice-orange font-black">✓</span>
          </motion.div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          
          {/* Card 1: Daily Reading Pace (Juice Green Theme) */}
          <div className="p-6 md:p-8 rounded-3xl bg-juice-green text-juice-cream shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-juice-orange font-bold">
                  Reading Cadence
                </span>
                <span className="text-xl">⏱</span>
              </div>

              <h3 className="font-serif text-xl font-bold mb-1">
                Daily Goal Commitment
              </h3>
              <p className="text-xs text-juice-cream/70 mb-6">
                Your target time spent immersed in high-signal articles each day.
              </p>

              <div className="space-y-4">
                <div className="flex items-baseline justify-between font-mono">
                  <span className="text-xs uppercase text-juice-cream/60">Selected Pace:</span>
                  <span className="text-3xl font-black text-juice-orange">{dailyGoal} <span className="text-xs font-normal">min / day</span></span>
                </div>

                <div className="grid grid-cols-4 gap-2 pt-2">
                  {[10, 15, 30, 45].map((mins) => (
                    <button
                      key={mins}
                      onClick={() => setDailyGoal(mins)}
                      className={`py-3 rounded-2xl font-mono text-xs font-bold uppercase transition-all ${
                        dailyGoal === mins
                          ? 'bg-juice-orange text-white ring-2 ring-white/50 shadow-md scale-105'
                          : 'bg-white/10 text-juice-cream/80 hover:bg-white/20'
                      }`}
                    >
                      {mins}m
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-white/15 mt-6 flex items-center justify-between text-xs font-mono opacity-75">
              <span>Status</span>
              <span>Synchronised with Habit Ledger</span>
            </div>
          </div>

          {/* Card 2: Pocket & Instapaper Clean Reader Protocol (Juice Orange Theme) */}
          <div className="p-6 md:p-8 rounded-3xl bg-juice-orange text-white shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono uppercase tracking-widest opacity-80 font-bold">
                  Content Sanitation Protocol
                </span>
                <span className="text-xl">✦</span>
              </div>

              <h3 className="font-serif text-xl font-bold mb-1">
                Pure Prose Isolation
              </h3>
              <p className="text-xs text-white/80 mb-6">
                Instapaper & Pocket heuristics strip author bios, newsletter promos, sidebars, and ads.
              </p>

              <div className="space-y-3">
                <div 
                  onClick={() => setAutoPurify(!autoPurify)}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-white/15 cursor-pointer hover:bg-white/20 transition-all"
                >
                  <div className="space-y-0.5">
                    <span className="font-bold text-xs block">Aggressive Noise Filter</span>
                    <span className="text-[10px] text-white/80 block">Purge author bylines, tags & newsletter popups</span>
                  </div>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${autoPurify ? 'bg-white text-juice-orange' : 'bg-white/30 text-white'}`}>
                    {autoPurify ? '✓' : '—'}
                  </div>
                </div>

                <div 
                  onClick={() => setEarlyBirdAlerts(!earlyBirdAlerts)}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-white/15 cursor-pointer hover:bg-white/20 transition-all"
                >
                  <div className="space-y-0.5">
                    <span className="font-bold text-xs block">1.5x Multiplier Hour Signals</span>
                    <span className="text-[10px] text-white/80 block">Notify during Early Bird & Night Owl windows</span>
                  </div>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${earlyBirdAlerts ? 'bg-white text-juice-orange' : 'bg-white/30 text-white'}`}>
                    {earlyBirdAlerts ? '✓' : '—'}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-white/20 mt-6 flex items-center justify-between text-xs font-mono opacity-80">
              <span>Read Mode Heuristic</span>
              <span>100% Distraction Free</span>
            </div>
          </div>

          {/* Card 3: Reading Chamber Atmosphere */}
          <div className="p-6 md:p-8 rounded-3xl bg-white border border-juice-green/15 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-juice-orange font-bold block mb-1">
                Visual Atmosphere
              </span>
              <h3 className="font-serif text-xl font-bold text-juice-green mb-1">
                Zen Chamber Themes
              </h3>
              <p className="text-xs text-juice-green/70 mb-6">
                Choose the default lighting environment for longform reading.
              </p>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'dark', label: 'Zen Night', bg: 'bg-[#0f1117] text-gray-200 border-gray-700' },
                  { id: 'sepia', label: 'Parchment', bg: 'bg-[#f4ecd8] text-[#433422] border-[#e8dfc7]' },
                  { id: 'light', label: 'Gallery', bg: 'bg-white text-gray-900 border-gray-200' },
                ].map((th) => (
                  <button
                    key={th.id}
                    onClick={() => setPreferredTheme(th.id as any)}
                    className={`p-4 rounded-2xl border text-center transition-all ${th.bg} ${
                      preferredTheme === th.id ? 'ring-2 ring-juice-orange scale-105 shadow-md' : 'opacity-70 hover:opacity-100'
                    }`}
                  >
                    <span className="text-sm font-serif font-bold block mb-1">{th.label}</span>
                    <span className="text-[10px] font-mono opacity-60">
                      {preferredTheme === th.id ? 'Active ✓' : 'Select'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t border-juice-green/10 mt-6 text-xs text-juice-green/60 font-mono">
              Adjustable on the fly inside any article using the reading toolbar.
            </div>
          </div>

          {/* Card 4: Editorial Desks Subscriptions */}
          <div className="p-6 md:p-8 rounded-3xl bg-white border border-juice-green/15 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-juice-orange font-bold block mb-1">
                Curated Publication Desks
              </span>
              <h3 className="font-serif text-xl font-bold text-juice-green mb-1">
                The Editorial Desks
              </h3>
              <p className="text-xs text-juice-green/70 mb-4">
                Active desks providing slow journalism dispatches to your For You feed.
              </p>

              <div className="flex flex-wrap gap-2">
                {[
                  { name: 'The Vanguard', desk: 'Technology' },
                  { name: 'The Atelier', desk: 'Design & Visuals' },
                  { name: 'The Forum', desk: 'Culture & Thought' },
                  { name: 'The Chronicle', desk: 'Deep Investigative' },
                  { name: 'The Observatory', desk: 'Science & Cosmos' },
                ].map((d) => {
                  const isChecked = selectedDesks.includes(d.name);
                  return (
                    <button
                      key={d.name}
                      onClick={() => toggleDesk(d.name)}
                      className={`px-3 py-2 rounded-2xl border text-left transition-all ${
                        isChecked
                          ? 'bg-juice-green text-juice-cream border-juice-green shadow-xs'
                          : 'bg-juice-cream/60 text-juice-green/60 border-juice-green/15 hover:bg-white'
                      }`}
                    >
                      <span className="text-xs font-serif font-bold block">{d.name}</span>
                      <span className="text-[9px] font-mono opacity-70 block">{d.desk}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-6 border-t border-juice-green/10 mt-6 flex items-center justify-between text-xs font-mono text-juice-green/60">
              <span>Prestige Sources</span>
              <span>100+ Publications Linked</span>
            </div>
          </div>

        </div>
      </section>

      {/* Footer Section */}
      <section className="snap-start shrink-0">
        <Footer />
      </section>
    </div>
  );
}
