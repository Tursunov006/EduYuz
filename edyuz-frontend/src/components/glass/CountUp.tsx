'use client';

import { useEffect, useRef, useState } from 'react';

// Raqam 0 dan qiymatigacha silliq sanaladi (faqat `animate` yoqilganda, masalan Shisha mavzusida).
// Animatsiya o'chiq bo'lsa yoki foydalanuvchi "harakatni kamaytirish" ni tanlagan bo'lsa qiymat darhol chiqadi.
export default function CountUp({
  value,
  animate,
  format,
  duration = 900,
}: {
  value: number;
  animate: boolean;
  format: (n: number) => string;
  duration?: number;
}) {
  const [shown, setShown] = useState(value);
  const from = useRef(0);

  useEffect(() => {
    const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (!animate || reduce || !Number.isFinite(value)) {
      setShown(value);
      from.current = value;
      return;
    }
    const start = performance.now();
    const a = from.current;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setShown(a + (value - a) * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
      else from.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, animate, duration]);

  return <>{format(shown)}</>;
}
