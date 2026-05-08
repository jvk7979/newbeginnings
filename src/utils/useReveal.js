import { useEffect, useRef, useState } from 'react';

// One-shot scroll-reveal hook. Returns { ref, visible }; attach `ref` to
// the element and toggle a `.is-visible` class when `visible === true`.
//
// The observer disconnects on the first intersect — we never want a
// reveal to *replay* when the user scrolls back, that reads as a flicker.
//
// Honours prefers-reduced-motion: under reduced motion we skip the observer
// entirely and report `visible: true` from the first render so callers
// never animate.
export function useReveal({ threshold = 0.12, rootMargin = '0px 0px -40px 0px' } = {}) {
  const ref = useRef(null);
  const reduced = typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const [visible, setVisible] = useState(reduced);

  useEffect(() => {
    if (reduced) return; // already visible, nothing to observe
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }
    const obs = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
          return;
        }
      }
    }, { threshold, rootMargin });
    obs.observe(el);
    return () => obs.disconnect();
  }, [reduced, threshold, rootMargin]);

  return { ref, visible };
}
