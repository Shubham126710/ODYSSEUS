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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#5D8246] flex flex-col items-center justify-center gap-4">
        <div className="w-9 h-9 border-2 border-[#FFFDD0]/30 border-t-[#FF6B4A] rounded-full animate-spin" />
        <p className="font-mono text-xs uppercase tracking-widest text-[#FFFDD0]/80">Loading Preferences...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#5D8246] text-[#FFFDD0] font-sans antialiased selection:bg-[#FF6B4A] selection:text-[#FFFDD0] flex flex-col">
      <AppHeader />
      
      {/* Settings Main Spread */}
      <main className="flex-1 max-w-[1240px] w-full mx-auto px-4 sm:px-6 lg:px-10 page-header-offset pt-36 sm:pt-40 md:pt-44 pb-20">
        
        {/* Editorial Masthead */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 md:mb-12 border-b border-[#FFFDD0]/20 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4"
        >
          <div>
            <div className="text-[10px] md:text-xs font-mono uppercase tracking-[0.2em] text-[#FF6B4A] font-bold mb-2">
              [ THE ODYSSEUS ATELIER • CONFIGURATION ]
            </div>
            <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl font-black text-[#FFFDD0] tracking-tight">
              Salon Preferences
            </h1>
            <p className="text-xs sm:text-sm text-[#FFFDD0]/80 mt-2 max-w-lg font-sans">
              Calibrate your daily reading pace, desk subscriptions, purification filters, and reading chamber aesthetics.
            </p>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="self-start md:self-auto px-6 py-3 rounded-xl bg-[#FF6B4A] hover:bg-[#E55A3A] disabled:opacity-50 text-[#FFFDD0] font-bold text-xs font-mono uppercase tracking-wider shadow-sm hover:shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            {saving ? (
              <span className="w-4 h-4 border-2 border-[#FFFDD0]/30 border-t-[#FFFDD0] rounded-full animate-spin" />
            ) : (
              <span>Save Preferences ✦</span>
            )}
          </button>
        </motion.div>

        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 rounded-xl bg-[#FFFDD0] border border-[#5D8246]/20 text-[#2F4522] text-xs font-mono font-bold flex items-center justify-between shadow-xs"
          >
            <span>{message}</span>
            <span className="text-[#FF6B4A] font-black">✓</span>
          </motion.div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          
          {/* Card 1: Daily Reading Pace */}
          <div 
            style={{ backgroundColor: '#FFFDD0', color: '#2F4522' }}
            className="p-6 sm:p-8 rounded-2xl sm:rounded-3xl border border-[#5D8246]/25 shadow-lg flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#FF6B4A] font-bold">
                  Reading Cadence
                </span>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#FF6B4A]">PACE</span>
              </div>

              <h3 className="font-serif text-2xl font-bold text-[#2F4522] mb-1">
                Daily Goal Commitment
              </h3>
              <p className="text-xs text-[#5D8246] mb-6">
                Your target time spent immersed in high-signal articles each day.
              </p>

              <div className="space-y-4">
                <div className="flex items-baseline justify-between font-mono">
                  <span className="text-xs uppercase text-[#5D8246]">Selected Pace:</span>
                  <span className="text-3xl font-black text-[#FF6B4A]">{dailyGoal} <span className="text-xs font-normal text-[#5D8246]">min / day</span></span>
                </div>

                <div className="grid grid-cols-4 gap-2 pt-2">
                  {[10, 15, 30, 45].map((mins) => (
                    <button
                      key={mins}
                      onClick={() => setDailyGoal(mins)}
                      className={`py-3 rounded-xl font-mono text-xs font-bold uppercase transition-all cursor-pointer ${
                        dailyGoal === mins
                          ? 'bg-[#5D8246] text-[#FFFDD0] shadow-sm'
                          : 'bg-[#5D8246]/10 text-[#2F4522] hover:bg-[#5D8246]/20 border border-[#5D8246]/20'
                      }`}
                    >
                      {mins}m
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-[#5D8246]/15 mt-6 flex items-center justify-between text-xs font-mono text-[#5D8246]">
              <span>Status</span>
              <span>Synchronised with Habit Ledger</span>
            </div>
          </div>

          {/* Card 2: Clean Reader Protocol */}
          <div 
            style={{ backgroundColor: '#FFFDD0', color: '#2F4522' }}
            className="p-6 sm:p-8 rounded-2xl sm:rounded-3xl border border-[#5D8246]/25 shadow-lg flex flex-col justify-between"
          >
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
              <p className="text-xs text-[#5D8246] mb-6">
                Heuristics strip author bios, newsletter promos, sidebars, and ads into pure prose.
              </p>

              <div className="space-y-3">
                <div 
                  onClick={() => setAutoPurify(!autoPurify)}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-[#5D8246]/5 hover:bg-[#5D8246]/10 cursor-pointer transition-all border border-[#5D8246]/15"
                >
                  <div>
                    <div className="text-xs font-serif font-bold text-[#2F4522]">Automatic Prose Purification</div>
                    <div className="text-[10px] text-[#5D8246] font-mono">Strip scrapers & marketing fluff</div>
                  </div>
                  <div className={`w-9 h-5 rounded-full p-0.5 transition-colors ${autoPurify ? 'bg-[#FF6B4A]' : 'bg-[#5D8246]/30'}`}>
                    <div className={`w-4 h-4 rounded-full bg-[#FFFDD0] transition-transform ${autoPurify ? 'translate-x-4' : 'translate-x-0'}`} />
                  </div>
                </div>

                <div 
                  onClick={() => setStreakReminders(!streakReminders)}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-[#5D8246]/5 hover:bg-[#5D8246]/10 cursor-pointer transition-all border border-[#5D8246]/15"
                >
                  <div>
                    <div className="text-xs font-serif font-bold text-[#2F4522]">Quiet Hours Mindful Notifications</div>
                    <div className="text-[10px] text-[#5D8246] font-mono">Evening reminder before habit reset</div>
                  </div>
                  <div className={`w-9 h-5 rounded-full p-0.5 transition-colors ${streakReminders ? 'bg-[#FF6B4A]' : 'bg-[#5D8246]/30'}`}>
                    <div className={`w-4 h-4 rounded-full bg-[#FFFDD0] transition-transform ${streakReminders ? 'translate-x-4' : 'translate-x-0'}`} />
                  </div>
                </div>

                <div 
                  onClick={() => setEarlyBirdAlerts(!earlyBirdAlerts)}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-[#5D8246]/5 hover:bg-[#5D8246]/10 cursor-pointer transition-all border border-[#5D8246]/15"
                >
                  <div>
                    <div className="text-xs font-serif font-bold text-[#2F4522]">Early Bird Multiplier Prompt</div>
                    <div className="text-[10px] text-[#5D8246] font-mono">Signal active 1.5x bonus hours (5–8:30 AM)</div>
                  </div>
                  <div className={`w-9 h-5 rounded-full p-0.5 transition-colors ${earlyBirdAlerts ? 'bg-[#FF6B4A]' : 'bg-[#5D8246]/30'}`}>
                    <div className={`w-4 h-4 rounded-full bg-[#FFFDD0] transition-transform ${earlyBirdAlerts ? 'translate-x-4' : 'translate-x-0'}`} />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-[#5D8246]/15 mt-6 flex items-center justify-between text-xs font-mono text-[#5D8246]">
              <span>Sanitation</span>
              <span>Pocket & Readability Active</span>
            </div>
          </div>

        </div>

        {/* Curated Desk Subscriptions */}
        <div 
          style={{ backgroundColor: '#FFFDD0', color: '#2F4522' }}
          className="p-6 sm:p-8 rounded-2xl sm:rounded-3xl border border-[#5D8246]/25 shadow-lg mb-12"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#5D8246]/15 pb-4 mb-6 gap-2">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#FF6B4A] font-bold block">
                [ EDITORIAL CHANNELS ]
              </span>
              <h3 className="font-serif text-2xl font-bold text-[#2F4522] mt-0.5">
                Curated Desk Subscriptions
              </h3>
            </div>
            <span className="text-xs font-mono text-[#5D8246]">
              {selectedDesks.length} Active Desks
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
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
                  className={`p-4 rounded-xl text-left border transition-all flex flex-col justify-between cursor-pointer ${
                    active
                      ? 'bg-[#5D8246]/10 border-[#5D8246] ring-1 ring-[#5D8246] shadow-xs'
                      : 'bg-white/60 border-[#5D8246]/20 hover:border-[#5D8246]/40 opacity-70'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[9px] font-mono uppercase tracking-wider text-[#5D8246]">{desk.category}</span>
                      <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        active ? 'bg-[#5D8246] text-[#FFFDD0]' : 'bg-[#5D8246]/10 text-[#5D8246]'
                      }`}>
                        {active ? '✓' : '+'}
                      </span>
                    </div>
                    <div className="font-serif font-bold text-base text-[#2F4522] mb-1">{desk.name}</div>
                    <p className="text-[11px] text-[#2F4522]/80 line-clamp-2 leading-relaxed">{desk.desc}</p>
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
