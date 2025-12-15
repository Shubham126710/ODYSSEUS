"use client";
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

const AVAILABLE_CATEGORIES = [
  'Tech', 'Design', 'Culture', 'Science', 'Business', 
  'Politics', 'Health', 'Sports', 'Entertainment', 
  'Travel', 'Food', 'Style'
];

interface CustomizeTabsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTabs: string[];
  onSave: (tabs: string[]) => void;
}

export const CustomizeTabsModal = ({ isOpen, onClose, currentTabs, onSave }: CustomizeTabsModalProps) => {
  const [selected, setSelected] = useState<string[]>(currentTabs);

  useEffect(() => {
    setSelected(currentTabs);
  }, [currentTabs]);

  const toggleCategory = (category: string) => {
    if (selected.includes(category)) {
      if (selected.length > 1) {
        setSelected(selected.filter(c => c !== category));
      }
    } else {
      if (selected.length < 5) {
        setSelected([...selected, category]);
      }
    }
  };

  const handleSave = () => {
    onSave(selected);
    onClose();
  };

  // Use Portal to render outside of parent stacking contexts (like sticky headers with backdrop-filter)
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="fixed inset-0 bg-black/50 z-[100] backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 flex items-center justify-center z-[110] pointer-events-none p-4"
          >
            <div className="bg-juice-cream w-full max-w-lg rounded-3xl p-8 shadow-2xl pointer-events-auto border-4 border-juice-orange">
              <h2 className="font-serif text-3xl font-bold text-juice-green mb-2">Customize Your Tabs</h2>
              <p className="text-juice-green/60 mb-6">Select up to 5 categories to pin to your navigation bar.</p>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
                {AVAILABLE_CATEGORIES.map(category => (
                  <button
                    key={category}
                    onClick={() => toggleCategory(category)}
                    className={`px-4 py-3 rounded-xl font-bold uppercase tracking-wider text-xs transition-all ${
                      selected.includes(category)
                        ? 'bg-juice-orange text-juice-cream shadow-lg scale-105'
                        : 'bg-juice-green/5 text-juice-green/60 hover:bg-juice-green/10'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>

              <div className="flex justify-end gap-4">
                <button onClick={onClose} className="px-6 py-3 font-bold uppercase tracking-widest text-xs text-juice-green/60 hover:text-juice-green">Cancel</button>
                <button onClick={handleSave} className="px-8 py-3 bg-juice-green text-juice-cream font-bold uppercase tracking-widest text-xs rounded-full hover:scale-105 transition-transform">Save Changes</button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};
