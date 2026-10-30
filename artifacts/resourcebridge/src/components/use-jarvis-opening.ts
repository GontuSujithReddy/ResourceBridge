import { useCallback, useEffect, useRef, useState } from 'react';

export function useJarvisOpening() {
  const [opening, setOpening] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sequence = useRef(0);
  const clearTimer = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }, []);
  const finishOpening = useCallback(() => {
    clearTimer();
    setOpening(0);
  }, [clearTimer]);
  const beginOpening = useCallback(() => {
    clearTimer();
    setOpening(++sequence.current);
    timer.current = setTimeout(finishOpening, 4000);
  }, [clearTimer, finishOpening]);
  useEffect(() => clearTimer, [clearTimer]);
  useEffect(() => {
    if (!opening) return;
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') { event.preventDefault(); finishOpening(); } };
    const hide = () => { if (document.hidden) finishOpening(); };
    document.addEventListener('keydown', escape);
    document.addEventListener('visibilitychange', hide);
    return () => {
      document.removeEventListener('keydown', escape);
      document.removeEventListener('visibilitychange', hide);
    };
  }, [opening, finishOpening]);
  return { opening, beginOpening, finishOpening };
}
