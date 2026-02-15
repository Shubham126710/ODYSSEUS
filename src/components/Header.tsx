"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { StaticOrangeCompass } from "@/components/StaticOrangeCompass";

interface HeaderProps {
  onLogoClick?: () => void;
  theme?: 'light' | 'dark';
}

export const Header = ({ onLogoClick, theme = 'light' }: HeaderProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  const scrollToSection = (id: string) => {
    setIsOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const textColor = theme === 'light' ? 'text-juice-cream' : 'text-juice-green';
  const borderColor = theme === 'light' ? 'border-juice-cream/30' : 'border-juice-green/30';
  // When menu is open, we use the overlay colors (Green bg, Cream text/icon)
  const hamburgerColor = isOpen ? 'bg-juice-cream' : (theme === 'light' ? 'bg-juice-cream' : 'bg-juice-green');
  const hoverBg = theme === 'light' ? 'hover:bg-juice-cream hover:text-juice-green' : 'hover:bg-juice-green hover:text-juice-cream';

  return (
    <>
      <header className="absolute top-0 left-0 w-full p-6 md:p-8 flex justify-between items-center z-50 pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto cursor-pointer" onClick={onLogoClick}>
          <StaticOrangeCompass className="w-10 h-10" />
          <span className={`font-serif text-xl font-bold tracking-wide uppercase transition-colors duration-500 ${isOpen ? 'text-juice-cream' : textColor}`}>Odysseus</span>
        </div>
        
        <div className="flex items-center gap-6 pointer-events-auto">
          {/* Login/Register Button */}
          <Link href="/login">
            <button className={`hidden md:block px-6 py-2 rounded-full border font-bold uppercase text-xs tracking-widest transition-all duration-300 ${isOpen ? 'text-juice-cream border-juice-cream/30 hover:bg-juice-cream hover:text-juice-green' : `${textColor} ${borderColor} ${hoverBg}`}`}>
              Login / Register
            </button>
          </Link>

          <button 
            onClick={toggleMenu}
            className="p-2 space-y-1.5 group cursor-pointer z-50 relative"
            aria-label="Toggle Menu"
          >
            <div className={`w-8 h-0.5 transition-all duration-300 ${hamburgerColor} ${isOpen ? 'rotate-45 translate-y-2' : 'group-hover:w-6 ml-auto'}`}></div>
            <div className={`w-8 h-0.5 transition-all duration-300 ${hamburgerColor} ${isOpen ? 'opacity-0' : ''}`}></div>
            <div className={`w-8 h-0.5 transition-all duration-300 ${hamburgerColor} ${isOpen ? '-rotate-45 -translate-y-2' : 'group-hover:w-6 ml-auto'}`}></div>
          </button>
        </div>
      </header>

      {/* Full Screen Menu Overlay */}
      <div className={`fixed inset-0 bg-juice-green z-40 transition-transform duration-500 ease-in-out ${isOpen ? 'translate-y-0' : '-translate-y-full'}`}>
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
                className="font-serif text-5xl md:text-7xl font-bold text-juice-cream hover:text-juice-orange transition-colors duration-300"
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
