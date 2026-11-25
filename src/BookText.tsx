import { Fragment } from 'react';

type Run = { text: string; emphasis?: boolean; strong?: boolean };

export function bookTextParts(text: string) {
  let spoken = /^\s*—/.test(text);
  let start = 0;
  const parts: { text: string; spoken: boolean }[] = [];
  // The current FB2 uses punctuation + dash for author insertions;
  // grammatical dashes ("всё, что остается — это работа") stay in speech.
  if (spoken) {
    for (const match of text.matchAll(/[,.!?…]\s+(—)\s+…*(?=[А-ЯЁа-яё])/g)) {
      const boundary = match.index + match[0].indexOf('—');
      const nextLetter = text[match.index + match[0].length];
      if (spoken && !/[а-яё]/.test(nextLetter)) continue;
      parts.push({ text: text.slice(start, boundary), spoken });
      start = boundary;
      spoken = !spoken;
    }
  }
  parts.push({ text: text.slice(start), spoken });
  return parts;
}

export default function BookText({ text, runs }: { text?: string; runs?: Run[] }) {
  const source = runs ?? [{ text: text ?? '' }];
  let offset = 0;
  const styledRuns = source.map(run => {
    const start = offset;
    offset += run.text.length;
    return { ...run, start, end: offset };
  });
  offset = 0;
  return bookTextParts(source.map(run => run.text).join('')).map((part, i) => {
    const start = offset;
    offset += part.text.length;
    const end = offset;
    return <span className={part.spoken ? 'spoken-text' : 'narration-text'} key={i}>
      {styledRuns.filter(run => run.end > start && run.start < end).map((run, j) => {
        const content = run.text.slice(Math.max(start - run.start, 0), end - run.start);
        if (run.emphasis) return <em key={j}>{content}</em>;
        if (run.strong) return <strong key={j}>{content}</strong>;
        return <Fragment key={j}>{content}</Fragment>;
      })}
    </span>;
  });
}
