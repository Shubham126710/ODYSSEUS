"use client";

import React, { useState } from 'react';
import { StaticOrangeCompass } from "@/components/StaticOrangeCompass";

export const Header = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  const scrollToSection = (id: string) => {
    setIsOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <header className="absolute top-0 left-0 w-full p-6 md:p-8 flex justify-between items-center z-50">
        <div className="flex items-center gap-3">
          <StaticOrangeCompass className="w-10 h-10" />
          <span className="font-serif text-xl font-bold tracking-wide uppercase text-foreground">Odysseus</span>
        </div>
        
        <div className="flex items-center gap-6">
          {/* Login/Register Button */}
          <button className="hidden md:block px-6 py-2 rounded-full border border-foreground/30 text-foreground font-bold uppercase text-xs tracking-widest hover:bg-foreground hover:text-juice-green transition-all duration-300">
            Login / Register
          </button>

          <button 
            onClick={toggleMenu}
            className="p-2 space-y-1.5 group cursor-pointer z-50 relative"
            aria-label="Toggle Menu"
          >
            <div className={`w-8 h-0.5 bg-foreground transition-all duration-300 ${isOpen ? 'rotate-45 translate-y-2' : 'group-hover:w-6 ml-auto'}`}></div>
            <div className={`w-8 h-0.5 bg-foreground transition-all duration-300 ${isOpen ? 'opacity-0' : ''}`}></div>
            <div className={`w-8 h-0.5 bg-foreground transition-all duration-300 ${isOpen ? '-rotate-45 -translate-y-2' : 'group-hover:w-6 ml-auto'}`}></div>
          </button>
        </div>
      </header>

      {/* Full Screen Menu Overlay */}
      <div className={`fixed inset-0 bg-background z-40 transition-transform duration-500 ease-in-out ${isOpen ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="flex flex-col items-center justify-center h-full space-y-8">
          <nav className="flex flex-col items-center gap-8">
            {[
              { name: 'Manifesto', id: 'manifesto' },
              { name: 'Features', id: 'features' },
              { name: 'Sources', id: 'sources' },
              { name: 'Contact', id: 'contact' }
            ].map((item) => (
              <button 
                key={item.name} 
                onClick={() => scrollToSection(item.id)}
                className="font-serif text-5xl md:text-7xl font-bold text-foreground hover:text-juice-orange transition-colors duration-300"
              >
                {item.name}
              </button>
            ))}
          </nav>
        </div>
      </div>
    </>
  );
};
