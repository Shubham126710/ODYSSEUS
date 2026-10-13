import React from 'react';
import { Playfair_Display } from 'next/font/google';
import { sanitizeText } from './textUtils';

const playfair = Playfair_Display({
  subsets: ['latin'],
  style: ['normal', 'italic'],
});

/**
 * Renders the lead story headline in the hero's heavy grotesk,
 * with exactly ONE key word accented in italic serif.
 * Accents only on the lead headline, never auto-italicizing other headlines.
 */
export function LeadHeadline({
  title,
  className = "",
}: {
  title: string;
  className?: string;
}) {
  const clean = sanitizeText(title);
  if (!clean) return null;

  const words = clean.split(/\s+/);
  if (words.length <= 2) {
    return <span className={className}>{clean}</span>;
  }

  // Common stop words to avoid emphasizing
  const stopWords = new Set([
    'the', 'and', 'for', 'with', 'from', 'that', 'this', 'have', 'been',
    'will', 'what', 'when', 'where', 'into', 'about', 'over', 'more', 'some',
    'after', 'before', 'their', 'there', 'could', 'would', 'should', 'here',
    'said', 'says', 'than', 'them', 'then', 'they', 'are', 'was', 'were',
    'how', 'why', 'who', 'its', 'not', 'but', 'out', 'new', 'all'
  ]);

  // Pick a meaningful word towards the end of the headline
  let targetIndex = -1;
  for (let i = words.length - 1; i >= 1; i--) {
    const wordClean = words[i].replace(/[^a-zA-Z]/g, '').toLowerCase();
    if (wordClean.length >= 4 && !stopWords.has(wordClean)) {
      targetIndex = i;
      break;
    }
  }

  // Fallback to the last word if no long word matched
  if (targetIndex === -1) {
    targetIndex = words.length - 1;
  }

  return (
    <span className={className}>
      {words.map((word, idx) => {
        if (idx === targetIndex) {
          return (
            <React.Fragment key={idx}>
              <span className={`${playfair.className} italic font-normal tracking-normal text-juice-cream inline-block`}>
                {word}
              </span>{' '}
            </React.Fragment>
          );
        }
        return <React.Fragment key={idx}>{word} </React.Fragment>;
      })}
    </span>
  );
}

export const EditorialHeadline = LeadHeadline;

