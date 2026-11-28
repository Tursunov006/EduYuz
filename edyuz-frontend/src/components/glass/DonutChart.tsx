'use client';

import { useEffect, useState } from 'react';

export type DonutSlice = { label: string; value: number; color: string };

// Halqa (donut) diagrammasi: bo'laklar chizilganda silliq to'ladi. Faqat haqiqiy qiymatlar bilan ishlaydi.
export default function DonutChart({
  slices,
  centerTop,
  centerBottom,
  size = 170,
}: {
  slices: DonutSlice[];
  centerTop: string;
  centerBottom: string;
  size?: number;
}) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setOn(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const total = slices.reduce((s, x) => s + x.value, 0);
  const stroke = 18;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="flex items-center gap-6 flex-wrap">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgb(255 255 255 / 0.08)" strokeWidth={stroke} />
          {total > 0 &&
            slices.map((s, i) => {
              const len = (s.value / total) * c;
              const gap = slices.length > 1 ? 3 : 0;
              const el = (
                <circle
                  key={s.label}
                  cx={size / 2}
                  cy={size / 2}
                  r={r}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={stroke}
                  strokeLinecap="round"
                  strokeDasharray={`${on ? Math.max(0, len - gap) : 0} ${c}`}
                  strokeDashoffset={-offset}
                  style={{ transition: `stroke-dasharray 900ms cubic-bezier(.22,1,.36,1) ${i * 120}ms` }}
                />
              );
              offset += len;
              return el;
            })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-xl font-bold text-slate-900 leading-tight">{centerTop}</span>
          <span className="text-[11px] text-slate-500">{centerBottom}</span>
        </div>
      </div>
      <ul className="space-y-2 min-w-[140px] flex-1">
        {slices.map((s) => (
          <li key={s.label} className="flex items-center gap-2.5 text-sm">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
            <span className="text-slate-600 flex-1">{s.label}</span>
            <span className="font-semibold text-slate-900">{total > 0 ? Math.round((s.value / total) * 100) : 0}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
