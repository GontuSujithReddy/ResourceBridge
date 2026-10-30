import { useEffect, useRef, useState } from 'react';

export const publicNavigationMotionStateEvent = 'resourcebridge:navigation-motion-state';

/** Start content motion after the navigation overlay clears, and only when in view. */
export function usePublicContentMotion(path: string) {
  const ref = useRef<HTMLElement>(null);
  const [blocked, setBlocked] = useState(true);

  useEffect(() => {
    const update = (event: Event) => {
      setBlocked((event as CustomEvent<{ active: boolean }>).detail.active);
    };
    window.addEventListener(publicNavigationMotionStateEvent, update);
    return () => window.removeEventListener(publicNavigationMotionStateEvent, update);
  }, []);

  useEffect(() => {
    const targets = Array.from(ref.current?.querySelectorAll<HTMLElement>('[data-public-reveal]') ?? []);
    targets.forEach(target => delete target.dataset.publicVisible);
    if (blocked) return;
    if (!('IntersectionObserver' in window)) {
      targets.forEach(target => { target.dataset.publicVisible = 'true'; });
      return;
    }
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        (entry.target as HTMLElement).dataset.publicVisible = 'true';
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.1 });
    targets.forEach(target => observer.observe(target));
    return () => observer.disconnect();
  }, [blocked, path]);

  return ref;
}
