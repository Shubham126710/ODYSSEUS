"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AppHeader } from '@/components/AppHeader';
import { Footer } from '@/components/Footer';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/lib/supabaseClient';

// Icons
const TargetIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

const BellIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </svg>
);

const SlidersIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="4" x2="20" y1="21" y2="21" />
    <line x1="20" x2="4" y1="3" y2="3" />
    <line x1="4" x2="20" y1="12" y2="12" />
    <line x1="4" x2="8" y1="8" y2="8" />
    <line x1="16" x2="20" y1="16" y2="16" />
  </svg>
);

export default function SettingsPage() {
  const { profile, loading } = useProfile();
  const [dailyGoal, setDailyGoal] = useState(15);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [headerTheme, setHeaderTheme] = useState<'light' | 'dark' | 'orange'>('light');

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      // If we are near the bottom (Footer is visible), switch to dark theme
      if (documentHeight - scrollPosition < 300) {
        setHeaderTheme('dark');
      } else {
        setHeaderTheme('light');
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Dummy settings state
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    weeklyDigest: false
  });
  
  const [preferences, setPreferences] = useState({
    darkMode: false,
    compactMode: false
  });

  useEffect(() => {
    if (profile) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDailyGoal(prev => {
        if (prev !== profile.daily_goal_minutes) return profile.daily_goal_minutes;
        return prev;
      });
    }
  }, [profile]);

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    setMessage('');

    const { error } = await supabase
      .from('profiles')
      .update({ daily_goal_minutes: dailyGoal })
      .eq('id', profile.id);

    if (error) {
      setMessage('Error saving settings.');
    } else {
      setMessage('Settings saved successfully!');
      // Simulate saving other settings
      setTimeout(() => setMessage(''), 3000);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-juice-cream flex items-center justify-center">
        <div className="animate-pulse text-juice-green font-serif text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-juice-cream text-juice-green font-sans flex flex-col">
      <div className="fixed top-0 left-0 right-0 z-50">
        <AppHeader theme={headerTheme} />
      </div>
      
      <motion.main 
        variants={{
          hidden: { opacity: 0 },
          show: {
            opacity: 1,
            transition: {
              staggerChildren: 0.15
            }
          }
        }}
        initial="hidden"
        animate="show"
        className="flex-grow max-w-3xl mx-auto px-4 md:px-8 py-12 w-full pt-32"
      >
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 20 },
            show: { opacity: 1, y: 0 }
          }}
        >
          <h1 className="font-serif text-4xl font-bold mb-2">Settings</h1>
          <p className="text-juice-green/60 mb-8">Manage your account preferences and reading goals.</p>
        </motion.div>

        <motion.div 
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: {
                staggerChildren: 0.1
              }
            }
          }}
          className="space-y-6"
        >
          
          {/* Reading Goal Section */}
          <motion.section 
            variants={{
              hidden: { opacity: 0, y: 20 },
              show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 50 } }
            }}
            className="bg-juice-green text-juice-cream p-8 rounded-3xl shadow-xl"
          >
            <h2 className="font-serif text-2xl font-bold mb-6 flex items-center gap-3">
              <TargetIcon className="w-8 h-8 text-juice-orange" /> Reading Goal
            </h2>
            
            <div className="space-y-6">
              <div>
                <label className="block font-bold text-lg mb-1">Daily Target</label>
                <p className="text-sm opacity-60 mb-4">Set your daily reading goal in minutes.</p>
                
                <div className="flex items-center gap-6">
                  <input 
                    type="range" 
                    min="5" 
                    max="120" 
                    step="5" 
                    value={dailyGoal} 
                    onChange={(e) => setDailyGoal(parseInt(e.target.value))}
                    className="flex-1 h-2 bg-juice-cream/20 rounded-lg appearance-none cursor-pointer accent-juice-orange"
                  />
                  <div className="w-24 text-center bg-juice-cream/10 py-2 rounded-lg">
                    <span className="font-mono text-xl font-bold text-juice-orange">{dailyGoal}</span>
                    <span className="text-xs font-bold uppercase ml-1 opacity-60">min</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Notifications Section */}
          <motion.section 
            variants={{
              hidden: { opacity: 0, y: 20 },
              show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 50 } }
            }}
            className="bg-juice-green text-juice-cream p-8 rounded-3xl shadow-xl"
          >
            <h2 className="font-serif text-2xl font-bold mb-6 flex items-center gap-3">
              <BellIcon className="w-8 h-8 text-juice-orange" /> Notifications
            </h2>
            
            <div className="space-y-4">
              {[
                { key: 'email', label: 'Email Notifications', desc: 'Receive updates about your progress via email.' },
                { key: 'push', label: 'Push Notifications', desc: 'Get reminded on your device to read daily.' },
                { key: 'weeklyDigest', label: 'Weekly Digest', desc: 'A summary of your reading stats every Monday.' }
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-bold">{item.label}</p>
                    <p className="text-sm opacity-60">{item.desc}</p>
                  </div>
                  <button 
                    onClick={() => setNotifications(prev => ({ ...prev, [item.key]: !prev[item.key as keyof typeof notifications] }))}
                    className={`w-12 h-7 rounded-full transition-colors relative ${notifications[item.key as keyof typeof notifications] ? 'bg-juice-orange' : 'bg-juice-cream/20'}`}
                  >
                    <div className={`absolute top-1 left-1 w-5 h-5 bg-juice-cream rounded-full shadow-sm transition-transform ${notifications[item.key as keyof typeof notifications] ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>
              ))}
            </div>
          </motion.section>

          {/* Preferences Section */}
          <motion.section 
            variants={{
              hidden: { opacity: 0, y: 20 },
              show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 50 } }
            }}
            className="bg-juice-green text-juice-cream p-8 rounded-3xl shadow-xl"
          >
            <h2 className="font-serif text-2xl font-bold mb-6 flex items-center gap-3">
              <SlidersIcon className="w-8 h-8 text-juice-orange" /> Preferences
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-bold">Dark Mode</p>
                  <p className="text-sm opacity-60">Switch to a darker theme for night reading.</p>
                </div>
                <button 
                  onClick={() => setPreferences(prev => ({ ...prev, darkMode: !prev.darkMode }))}
                  className={`w-12 h-7 rounded-full transition-colors relative ${preferences.darkMode ? 'bg-juice-orange' : 'bg-juice-cream/20'}`}
                >
                  <div className={`absolute top-1 left-1 w-5 h-5 bg-juice-cream rounded-full shadow-sm transition-transform ${preferences.darkMode ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>
          </motion.section>

          {/* Save Button */}
          <motion.div 
            variants={{
              hidden: { opacity: 0, y: 20 },
              show: { opacity: 1, y: 0 }
            }}
            className="sticky bottom-8 flex justify-end"
          >
            <div className="bg-juice-green/90 backdrop-blur-md p-2 rounded-full shadow-2xl border border-juice-cream/10 flex items-center gap-4 pr-2 pl-6">
              {message && (
                <span className={`text-sm font-bold ${message.includes('Error') ? 'text-red-400' : 'text-juice-cream'}`}>
                  {message}
                </span>
              )}
              <button 
                onClick={handleSave}
                disabled={saving}
                className="bg-juice-orange text-white px-8 py-3 rounded-full font-bold hover:bg-juice-orange/90 transition-all transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 shadow-lg shadow-juice-orange/20"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </motion.div>

        </motion.div>
      </motion.main>
      <Footer />
    </div>
  );
}
