"use client";

import React, { useState } from "react";
import { SplashScreen } from "@/components/SplashScreen";
import { StaticOrangeCompass } from "@/components/StaticOrangeCompass";
import Link from "next/link";
import { motion } from "framer-motion";

export default function LandingPage() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <>
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
      
      <div className="min-h-screen bg-juice-cream text-juice-green font-sans selection:bg-juice-orange selection:text-white overflow-hidden">
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-50 px-6 py-6 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <StaticOrangeCompass className="w-8 h-8" />
            <span className="font-serif font-bold text-xl tracking-wider">ODYSSEUS</span>
          </div>
          <Link 
            href="/login"
            className="px-6 py-2 rounded-full border border-juice-green/20 hover:bg-juice-green hover:text-juice-cream transition-all duration-300 font-mono text-sm uppercase tracking-widest"
          >
            Login
          </Link>
        </header>

        {/* Hero Section */}
        <main className="relative h-screen flex flex-col items-center justify-center">
          {/* Background Typography */}
          <div className="absolute inset-0 flex flex-col items-center justify-center z-0 pointer-events-none select-none overflow-hidden">
            <h1 className="text-[20vw] leading-[0.75] font-black tracking-tighter text-juice-green opacity-[0.03] text-center mix-blend-multiply whitespace-nowrap">
              EXPLORE
            </h1>
            <h1 className="text-[20vw] leading-[0.75] font-black tracking-tighter text-juice-green opacity-[0.03] text-center mix-blend-multiply whitespace-nowrap">
              DISCOVER
            </h1>
          </div>

          {/* Content */}
          <div className="z-10 relative text-center max-w-4xl px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: showSplash ? 0 : 1, y: showSplash ? 20 : 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <h1 className="font-serif text-6xl md:text-8xl font-bold mb-8 leading-tight">
                Your Personal<br/>
                <span className="text-juice-orange italic">Content Compass</span>
              </h1>
              
              <p className="text-lg md:text-xl font-mono opacity-60 mb-12 max-w-2xl mx-auto leading-relaxed">
                Navigate the noise. Curate your curiosity. <br/>
                A mindful reader for the modern web.
              </p>

              <div className="flex flex-col md:flex-row gap-6 justify-center items-center">
                <Link 
                  href="/feed"
                  className="group relative px-8 py-4 bg-juice-green text-juice-cream rounded-full font-bold tracking-widest overflow-hidden transition-all hover:scale-105 hover:shadow-xl hover:shadow-juice-green/20"
                >
                  <span className="relative z-10 flex items-center gap-3">
                    START JOURNEY
                    <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                  </span>
                </Link>
                
                <Link 
                  href="/about"
                  className="px-8 py-4 rounded-full border border-juice-green/20 hover:border-juice-orange hover:text-juice-orange transition-all duration-300 font-mono text-sm uppercase tracking-widest"
                >
                  Learn More
                </Link>
              </div>
            </motion.div>
          </div>
        </main>

        {/* Footer */}
        <footer className="absolute bottom-0 w-full py-6 text-center opacity-40 font-mono text-xs uppercase tracking-widest">
          © 2025 Odysseus • Navigate Wisely
        </footer>
      </div>
    </>
  );
}
