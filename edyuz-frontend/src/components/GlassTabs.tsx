'use client';

import { useEffect, useRef, useState } from 'react';

type Tab<T extends string> = { id: T; label: React.ReactNode; icon?: React.ReactNode };

// Shisha (glassmorphism) uslubidagi tablar: faol tab ostida sirpanuvchi yorqin ko'rsatkich.
export default function GlassTabs<T extends string>({
  tabs,
  value,
  onChange,
  size = 'md',
  ariaLabel,
}: {
  tabs: Tab<T>[];
  value: T;
  onChange: (id: T) => void;
  size?: 'sm' | 'md';
  ariaLabel?: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [ind, setInd] = useState({ left: 0, width: 0, ready: false });

  useEffect(() => {
    const measure = () => {
      const el = refs.current[value];
      if (el) setInd({ left: el.offsetLeft, width: el.offsetWidth, ready: true });
    };
    const raf = requestAnimationFrame(measure);
    const ro = new ResizeObserver(measure);
    if (box.current) ro.observe(box.current);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [value, tabs.length]);

  const pad = size === 'sm' ? 'px-3 h-9 text-sm' : 'px-4 h-11 text-xs sm:text-sm';
  return (
    <div
      ref={box}
      role="tablist"
      aria-label={ariaLabel}
      className="relative inline-flex items-center gap-1 p-1.5 rounded-2xl w-fit bg-white/60 dark:bg-slate-900/50 backdrop-blur-md border border-white/70 dark:border-white/10 shadow-[0_8px_30px_-12px_rgba(79,70,229,0.35)]"
    >
      <span
        aria-hidden="true"
        className={`absolute top-1.5 bottom-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 shadow-lg shadow-indigo-500/35 transition-[left,width,opacity] duration-300 ease-out ${
          ind.ready ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ left: ind.left, width: ind.width }}
      />
      {tabs.map((t) => {
        const active = t.id === value;
        return (
          <button
            key={t.id}
            ref={(el) => {
              refs.current[t.id] = el;
            }}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.id)}
            className={`relative z-10 inline-flex items-center gap-2 rounded-xl font-bold transition-colors duration-200 cursor-pointer ${pad} ${
              active ? 'text-white' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            {t.icon}
            <span>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}
