"use client";
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

const AVAILABLE_CATEGORIES = [
  'Tech', 'Design', 'Culture', 'Science', 'Business', 
  'Politics', 'Health', 'Sports', 'Entertainment', 
  'Travel', 'Food', 'Style', 'Finance', 'Startups',
  'Gaming', 'Art', 'Music', 'History', 'Programming',
  'Photography', 'Productivity', 'News'
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

  // Use Portal to render outside of parent stacking contexts
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={onClose} 
            className="fixed inset-0 bg-black/60 z-[100] backdrop-blur-md"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.96 }} 
            animate={{ opacity: 1, scale: 1 }} 
            exit={{ opacity: 0, scale: 0.96 }}
            className="fixed inset-0 flex items-center justify-center z-[110] pointer-events-none p-4"
          >
            <div className="bg-white w-full max-w-lg rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl pointer-events-auto border border-stone-200/90">
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#EA580C] font-bold block mb-1">
                ODYSSEUS NAVIGATION DESKS
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 mb-1.5">
                Customize Desks
              </h2>
              <p className="text-xs text-stone-500 mb-6">
                Pin up to 5 editorial desks to your primary navigation bar.
              </p>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-8 max-h-[48vh] overflow-y-auto pr-1">
                {AVAILABLE_CATEGORIES.map(category => (
                  <button
                    key={category}
                    onClick={() => toggleCategory(category)}
                    className={`px-3.5 py-2.5 rounded-xl font-mono font-bold uppercase tracking-wider text-xs transition-all flex items-center justify-between ${
                      selected.includes(category)
                        ? 'bg-[#131E15] text-white shadow-xs ring-1 ring-black'
                        : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border border-stone-200/80'
                    }`}
                  >
                    <span>{category}</span>
                    {selected.includes(category) && <span className="text-[#EA580C]">✓</span>}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-stone-100">
                <span className="text-xs font-mono text-stone-500">
                  {selected.length}/5 Selected
                </span>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={onClose} 
                    className="px-4 py-2 font-mono font-bold uppercase tracking-widest text-xs text-stone-500 hover:text-stone-900 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSave} 
                    className="px-6 py-2.5 bg-[#EA580C] hover:bg-[#C2410C] text-white font-mono font-bold uppercase tracking-widest text-xs rounded-xl shadow-xs hover:shadow-sm transition-all"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};
