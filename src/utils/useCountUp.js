import { useEffect, useRef, useState } from 'react';

// rAF-driven count-up tween. Returns the animated current value.
//
//   const { value } = useCountUp(target, { enabled, duration });
//
// `enabled` is the trigger — typically wired to `visible` from useReveal so
// the count-up only starts once the tile scrolls into view. If `target`
// changes mid-animation, the tween restarts from the current value (so a
// data refresh doesn't snap back to 0).
//
// Honours prefers-reduced-motion: returns `target` instantly.
export function useCountUp(target, { enabled = true, duration = 700 } = {}) {
  const reduced = typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const [value, setValue] = useState(reduced || !enabled ? target : 0);
  const startRef = useRef(null);
  const fromRef  = useRef(0);
  const rafRef   = useRef(0);

  useEffect(() => {
    if (reduced || !enabled) {
      setValue(target);
      return;
    }
    if (!Number.isFinite(target)) {
      setValue(target);
      return;
    }
    fromRef.current = value;
    startRef.current = null;
    const tick = (now) => {
      if (startRef.current == null) startRef.current = now;
      const t = Math.min(1, (now - startRef.current) / duration);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - t, 3);
      const next = fromRef.current + (target - fromRef.current) * eased;
      setValue(Math.round(next));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
    // value intentionally excluded — we only want this to re-fire on
    // target / enabled changes, not on every animation frame.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, enabled, duration, reduced]);

  return value;
}
