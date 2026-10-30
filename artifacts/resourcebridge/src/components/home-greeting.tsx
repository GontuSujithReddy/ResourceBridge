import { useEffect, useState } from 'react';

const greetings = [
  { text: 'नमस्ते,', language: 'hi' },
  { text: 'నమస్కారం,', language: 'te' },
  { text: 'Hello,', language: 'en' },
];
const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
const letters = greetings.map(({ text }) =>
  Array.from(segmenter.segment(text), ({ segment }) => segment),
);

export function HomeGreeting() {
  const [display, setDisplay] = useState(greetings[0]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let word = 0;
    let count = letters[0].length;
    let deleting = true;

    const tick = () => {
      count += deleting ? -1 : 1;
      setDisplay({
        text: letters[word].slice(0, count).join(''),
        language: greetings[word].language,
      });

      if (deleting && count === 0) {
        word = (word + 1) % greetings.length;
        deleting = false;
        timer = setTimeout(tick, 120);
      } else if (!deleting && count === letters[word].length) {
        deleting = true;
        timer = setTimeout(tick, 2400);
      } else {
        timer = setTimeout(tick, deleting ? 90 : 120);
      }
    };

    // This text-only reference effect intentionally runs without spatial motion,
    // including when reduced-motion preferences disable the site's other effects.
    timer = setTimeout(tick, 900);
    return () => clearTimeout(timer);
  }, []);

  return (
    <p className="rb-home-greeting" aria-label="Hello" data-testid="text-home-greeting">
      <span lang={display.language} aria-hidden="true">{display.text || '\u00a0'}</span>
    </p>
  );
}
