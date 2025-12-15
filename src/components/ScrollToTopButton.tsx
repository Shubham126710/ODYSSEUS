import React from 'react';

interface ScrollToTopButtonProps {
  isVisible: boolean;
  onClick: () => void;
}

export const ScrollToTopButton = ({ isVisible, onClick }: ScrollToTopButtonProps) => {
  return (
    <button
      onClick={onClick}
      className={`fixed bottom-8 right-8 z-50 p-4 rounded-full bg-juice-orange text-juice-cream shadow-lg transition-all duration-500 transform hover:scale-110 hover:shadow-juice-orange/50 ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'
      }`}
      aria-label="Scroll to top"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
      </svg>
    </button>
  );
};