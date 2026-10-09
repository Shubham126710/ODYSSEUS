"use client";

import React, { useState, useRef } from 'react';
import { StaticOrangeCompass } from "@/components/StaticOrangeCompass";
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

interface SplashScreenProps {
  onComplete?: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const container = useRef<HTMLDivElement>(null);
  const compassRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLHeadingElement>(null);
  const msgRef = useRef<HTMLParagraphElement>(null);

  const messages = [
    "Calibrating Compass...",
    "Charting Course...",
    "Gathering Sources...",
    "Aligning Perspectives...",
    "Setting Sail..."
  ];

  const [messageIndex, setMessageIndex] = useState(0);

  useGSAP(() => {
    const tl = gsap.timeline({
      onComplete: () => {
        gsap.to(container.current, {
          opacity: 0,
          duration: 0.8,
          ease: "power2.inOut",
          onComplete: () => {
            if (onComplete) onComplete();
          }
        });
      }
    });

    // Animate compass
    tl.fromTo(compassRef.current,
      { scale: 0.8, opacity: 0, rotation: -45 },
      { scale: 1, opacity: 1, rotation: 0, duration: 1.2, ease: "back.out(1.7)" },
      0
    );

    // Continuous rotation for compass
    gsap.to(compassRef.current, {
      rotation: 360,
      duration: 8,
      repeat: -1,
      ease: "none"
    });

    // Split text animation for title (simple split by characters if we don't have SplitText)
    // Wait, since we don't have SplitText, we can just animate the whole text or split manually.
    const titleChars = textRef.current?.innerText.split('') || [];
    if (textRef.current) {
      textRef.current.innerHTML = '';
      titleChars.forEach(char => {
        const span = document.createElement('span');
        span.innerText = char;
        span.style.opacity = '0';
        span.style.display = 'inline-block';
        textRef.current!.appendChild(span);
      });

      tl.to(textRef.current.children, {
        opacity: 1,
        y: 0,
        startAt: { y: 20 },
        duration: 0.6,
        stagger: 0.05,
        ease: "power2.out"
      }, 0.4);
    }

    // Message interval animation
    let msgInterval = setInterval(() => {
      setMessageIndex(prev => {
        if (prev === messages.length - 1) {
          clearInterval(msgInterval);
          return prev;
        }
        return prev + 1;
      });
    }, 600);

    tl.fromTo(msgRef.current, 
      { opacity: 0, y: 10 },
      { opacity: 0.6, y: 0, duration: 0.5 },
      0.8
    );

    // Wait a bit before completing timeline
    tl.to({}, { duration: 2.5 });

    return () => clearInterval(msgInterval);
  }, { scope: container });

  return (
    <div 
      ref={container}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-juice-green text-juice-cream"
    >
      <div className="relative flex flex-col items-center">
        <div ref={compassRef}>
          <StaticOrangeCompass className="w-32 h-32 md:w-48 md:h-48 drop-shadow-2xl" />
        </div>
        
        <div className="mt-12 space-y-2 text-center">
          <h1 ref={textRef} className="font-serif text-4xl md:text-6xl font-bold tracking-widest">
            ODYSSEUS
          </h1>
          <p ref={msgRef} className="text-sm md:text-base font-mono uppercase tracking-[0.3em] min-w-[300px]">
            {messages[messageIndex]}
          </p>
        </div>
      </div>
    </div>
  );
};