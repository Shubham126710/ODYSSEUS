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

  // Reader preferences
  const [preferredTheme, setPreferredTheme] = useState<'dark' | 'sepia' | 'light'>('light');
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFFDD0] flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-3 border-[#5D8246]/20 border-t-[#FF6B4A] rounded-full animate-spin" />
        <p className="font-mono text-xs uppercase tracking-widest text-[#5D8246]/70">Loading Preferences...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFDD0] text-[#2F4522] font-sans antialiased selection:bg-[#FF6B4A] selection:text-[#FFFDD0] flex flex-col">
      <AppHeader theme="light" />
      
      {/* Settings Main Spread */}
      <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-10 page-header-offset pt-32 sm:pt-36 pb-20">
        
        {/* Editorial Masthead */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 md:mb-12 border-b border-[#5D8246]/15 pb-8 flex flex-col md:flex-row md:items-end justify-between gap-6"
        >
          <div>
            <div className="text-[10px] sm:text-xs font-mono uppercase tracking-[0.2em] text-[#FF6B4A] font-bold mb-2">
              THE ODYSSEUS ATELIER • CONFIGURATION
            </div>
            <h1 className="font-serif text-3xl sm:text-5xl font-bold text-[#2F4522] tracking-tight">
              Salon Preferences
            </h1>
            <p className="text-xs sm:text-sm text-[#5D8246]/80 mt-2 max-w-xl font-sans leading-relaxed">
              Calibrate your daily reading pace, desk subscriptions, purification filters, and reading chamber aesthetics.
            </p>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="self-start md:self-auto px-6 py-2.5 rounded-full bg-[#FF6B4A] hover:bg-[#E55A3A] disabled:opacity-50 text-[#FFFDD0] font-bold text-xs font-mono uppercase tracking-wider shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer shrink-0"
          >
            {saving ? (
              <span className="w-3.5 h-3.5 border-2 border-[#FFFDD0]/30 border-t-[#FFFDD0] rounded-full animate-spin" />
            ) : (
              <span>Save Preferences ✦</span>
            )}
          </button>
        </motion.div>

        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 rounded-2xl bg-white border border-[#5D8246]/20 text-[#2F4522] font-mono text-xs font-bold flex items-center gap-2 shadow-xs"
          >
            <span className="text-[#FF6B4A]">✦</span>
            <span>{message}</span>
          </motion.div>
        )}

        {/* 2-Column Core Preferences Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-10">
          
          {/* Card 1: Daily Reading Goal */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#5D8246]/15 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#FF6B4A] font-bold">
                  Reading Cadence
                </span>
                <span className="font-mono text-xs font-bold text-[#5D8246] uppercase">Pace</span>
              </div>

              <h3 className="font-serif text-2xl font-bold text-[#2F4522] mb-1">
                Daily Goal Commitment
              </h3>
              <p className="text-xs text-[#5D8246]/80 mb-6">
                Your target time spent immersed in high-signal articles each day.
              </p>

              <div className="space-y-4">
                <div className="flex items-baseline justify-between font-mono">
                  <span className="text-xs uppercase text-[#5D8246]/70">Selected Pace:</span>
                  <span className="text-3xl font-black text-[#FF6B4A]">{dailyGoal} <span className="text-xs font-normal text-[#5D8246]/60">min / day</span></span>
                </div>

                <div className="grid grid-cols-4 gap-2.5 pt-2">
                  {[10, 15, 30, 45].map((mins) => (
                    <button
                      key={mins}
                      onClick={() => setDailyGoal(mins)}
                      className={`py-3 rounded-xl font-mono text-xs font-bold uppercase transition-all cursor-pointer ${
                        dailyGoal === mins
                          ? 'bg-[#5D8246] text-[#FFFDD0] shadow-sm'
                          : 'bg-stone-50 text-[#2F4522] hover:bg-stone-100 border border-stone-200'
                      }`}
                    >
                      {mins}m
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-[#5D8246]/10 mt-6 flex items-center justify-between text-xs font-mono text-[#5D8246]/70">
              <span>Status</span>
              <span>Synchronised with Habit Ledger</span>
            </div>
          </div>

          {/* Card 2: Clean Reader Protocol */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#5D8246]/15 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#FF6B4A] font-bold">
                  Content Sanitation Protocol
                </span>
                <span className="font-mono text-base text-[#FF6B4A]">✦</span>
              </div>

              <h3 className="font-serif text-2xl font-bold text-[#2F4522] mb-1">
                Pure Prose Isolation
              </h3>
              <p className="text-xs text-[#5D8246]/80 mb-6">
                Instapaper & Pocket heuristics strip author bios, newsletter promos, sidebars, and ads.
              </p>

              <div className="space-y-4">
                <label className="flex items-center justify-between p-3.5 rounded-xl bg-stone-50 hover:bg-stone-100/80 border border-stone-200/80 cursor-pointer transition-colors">
                  <div>
                    <span className="font-sans font-bold text-xs text-[#2F4522] block">Automatic Prose Purification</span>
                    <span className="text-[10px] text-[#5D8246]/70 font-mono">Strip scrapers & marketing fluff</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoPurify}
                    onChange={(e) => setAutoPurify(e.target.checked)}
                    className="w-4 h-4 accent-[#FF6B4A] cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 rounded-xl bg-stone-50 hover:bg-stone-100/80 border border-stone-200/80 cursor-pointer transition-colors">
                  <div>
                    <span className="font-sans font-bold text-xs text-[#2F4522] block">Quiet Hours Mindful Notifications</span>
                    <span className="text-[10px] text-[#5D8246]/70 font-mono">Evening reminder before habit reset</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={streakReminders}
                    onChange={(e) => setStreakReminders(e.target.checked)}
                    className="w-4 h-4 accent-[#FF6B4A] cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 rounded-xl bg-stone-50 hover:bg-stone-100/80 border border-stone-200/80 cursor-pointer transition-colors">
                  <div>
                    <span className="font-sans font-bold text-xs text-[#2F4522] block">Early Bird Multiplier Prompt</span>
                    <span className="text-[10px] text-[#5D8246]/70 font-mono">Signal active 1.5x bonus hours (5-8:30 AM)</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={earlyBirdAlerts}
                    onChange={(e) => setEarlyBirdAlerts(e.target.checked)}
                    className="w-4 h-4 accent-[#FF6B4A] cursor-pointer"
                  />
                </label>
              </div>
            </div>

            <div className="pt-6 border-t border-[#5D8246]/10 mt-6 flex items-center justify-between text-xs font-mono text-[#5D8246]/70">
              <span>Sanitation</span>
              <span>Pocket & Readability Active</span>
            </div>
          </div>

        </div>

        {/* Curated Desk Subscriptions */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#5D8246]/15 shadow-sm mb-12">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#5D8246]/10 pb-4 mb-6 gap-2">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#FF6B4A] font-bold block">
                Editorial Channels
              </span>
              <h3 className="font-serif text-2xl font-bold text-[#2F4522] mt-0.5">
                Curated Desk Subscriptions
              </h3>
            </div>
            <span className="text-xs font-mono text-[#5D8246]/70">
              {selectedDesks.length} Active Desks
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {[
              { name: 'The Vanguard', category: 'Tech & Frontier AI', desc: 'Neural networks, autonomous systems & silicon frontiers.' },
              { name: 'The Atelier', category: 'Design & Spatial Form', desc: 'Industrial crafts, spatial computing & typography.' },
              { name: 'The Forum', category: 'Culture & Criticism', desc: 'Longform cultural essays, philosophy & modern discourse.' },
              { name: 'The Chronicle', category: 'Global Chronicle & Markets', desc: 'Geopolitics, macroeconomics & venture chronicles.' },
              { name: 'The Observatory', category: 'Science & Living Systems', desc: 'Astrophysics, biotech & deep ecology breakthroughs.' },
            ].map(desk => {
              const active = selectedDesks.includes(desk.name);
              return (
                <button
                  key={desk.name}
                  onClick={() => toggleDesk(desk.name)}
                  className={`p-4 rounded-2xl text-left border transition-all flex flex-col justify-between cursor-pointer ${
                    active
                      ? 'bg-stone-50 border-[#5D8246] ring-1 ring-[#5D8246] shadow-xs'
                      : 'bg-white border-stone-200/80 hover:border-stone-300 opacity-60'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[9px] font-mono uppercase tracking-wider text-[#5D8246]/80">{desk.category}</span>
                      <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        active ? 'bg-[#5D8246] text-[#FFFDD0]' : 'bg-stone-200 text-stone-500'
                      }`}>
                        {active ? '✓' : '+'}
                      </span>
                    </div>
                    <div className="font-serif font-bold text-base text-[#2F4522] mb-1">{desk.name}</div>
                    <p className="text-[11px] text-[#5D8246]/80 line-clamp-2 leading-relaxed">{desk.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
}
