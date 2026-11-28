'use client';

import { useRef } from 'react';

// 6 xonali bir martalik kod kiritish: shisha uslubidagi katakchalar, qo'yib (paste) kiritish va Backspace bilan orqaga qaytish
export default function OtpInput({
  value,
  onChange,
  disabled,
  autoFocus,
  length = 6,
  label = 'Tasdiqlash kodi',
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  length?: number;
  label?: string;
}) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = Array.from({ length }, (_, i) => value[i] || '');

  const setAt = (i: number, raw: string) => {
    const d = raw.replace(/\D/g, '');
    if (!d) return;
    const next = (value.slice(0, i) + d).slice(0, length);
    onChange(next);
    refs.current[Math.min(next.length, length - 1)]?.focus();
  };

  return (
    <div role="group" aria-label={label} className="flex items-center justify-center gap-2 sm:gap-2.5">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          maxLength={length}
          disabled={disabled}
          autoFocus={autoFocus && i === 0}
          value={d}
          aria-label={`${label}: ${i + 1}-raqam`}
          onChange={(e) => setAt(i, e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Backspace') {
              e.preventDefault();
              if (d) onChange(value.slice(0, i) + value.slice(i + 1));
              else if (i > 0) {
                onChange(value.slice(0, i - 1) + value.slice(i));
                refs.current[i - 1]?.focus();
              }
            } else if (e.key === 'ArrowLeft' && i > 0) refs.current[i - 1]?.focus();
            else if (e.key === 'ArrowRight' && i < length - 1) refs.current[i + 1]?.focus();
          }}
          onPaste={(e) => {
            e.preventDefault();
            const t = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
            if (t) {
              onChange(t);
              refs.current[Math.min(t.length, length - 1)]?.focus();
            }
          }}
          className={`w-11 h-14 sm:w-12 sm:h-14 text-center text-xl font-bold rounded-xl bg-white/80 text-slate-900 border transition-all duration-200 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/15 focus:-translate-y-0.5 disabled:opacity-50 ${
            d ? 'border-indigo-300 shadow-sm' : 'border-slate-200'
          }`}
        />
      ))}
    </div>
  );
}
