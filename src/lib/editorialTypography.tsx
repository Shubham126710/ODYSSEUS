import React from 'react';

/**
 * Formats a headline in editorial magazine style:
 * Heavy grotesk sans display with a single emphasized word set in italic serif.
 */
export function EditorialHeadline({
  title,
  className = "",
}: {
  title: string;
  className?: string;
}) {
  if (!title) return null;

  const words = title.trim().split(/\s+/);
  if (words.length <= 2) {
    return <span className={className}>{title}</span>;
  }

  // Common stop words to avoid emphasizing
  const stopWords = new Set([
    'the', 'and', 'for', 'with', 'from', 'that', 'this', 'have', 'been', 
    'will', 'what', 'when', 'where', 'into', 'about', 'over', 'more', 'some',
    'after', 'before', 'their', 'there', 'could', 'would', 'should', 'here'
  ]);

  // Find a meaningful word to italicize in serif (ideally towards middle/end)
  let targetIndex = -1;
  for (let i = Math.min(words.length - 1, 5); i >= 1; i--) {
    const clean = words[i].replace(/[^a-zA-Z]/g, '').toLowerCase();
    if (clean.length >= 4 && !stopWords.has(clean)) {
      targetIndex = i;
      break;
    }
  }

  // Fallback to second-to-last word or last word
  if (targetIndex === -1) {
    targetIndex = words.length > 2 ? words.length - 2 : words.length - 1;
  }

  return (
    <span className={className}>
      {words.map((word, idx) => {
        if (idx === targetIndex) {
          return (
            <React.Fragment key={idx}>
              <span className="font-serif italic font-normal tracking-normal text-[#FAF6E8] inline-block">
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

/**
 * Formats a lead excerpt with a classical magazine drop cap on the first letter.
 */
export function EditorialDropCapText({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  if (!text) return null;
  const trimmed = text.trim();
  const firstLetter = trimmed.charAt(0);
  const remaining = trimmed.slice(1);

  return (
    <p className={`font-sans leading-relaxed text-[#FFFDD0]/80 text-sm sm:text-base ${className}`}>
      <span className="float-left text-4xl sm:text-5xl font-serif font-bold text-[#FFFDD0] mr-2.5 leading-[0.8] pt-1 select-none">
        {firstLetter}
      </span>
      {remaining}
    </p>
  );
}
