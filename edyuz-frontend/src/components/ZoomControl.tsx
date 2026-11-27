'use client';

import { Minus, Plus, ZoomIn } from 'lucide-react';
import { useUiZoom, writeZoom, ZOOM_MAX, ZOOM_MIN, ZOOM_STEP } from '@/lib/ui/zoom';

// Zoom: − 100% + (butun platformadagi yozuvlar va bloklar birga kattalashadi/kichrayadi)
export default function ZoomControl({ className = '', showLabel = true }: { className?: string; showLabel?: boolean }) {
  const zoom = useUiZoom();
  const btn =
    'w-8 h-8 rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white flex items-center justify-center transition';
  return (
    <div
      role="group"
      aria-label="Platforma masshtabi"
      className={`flex items-center gap-2 pl-3 pr-1.5 h-[46px] bg-slate-50 border border-slate-200 rounded-xl w-fit ${className}`}
    >
      <ZoomIn size={16} className="text-slate-500" />
      {showLabel && <span className="text-sm font-medium text-slate-600 hidden sm:inline">Zoom</span>}
      <button type="button" onClick={() => writeZoom(zoom - ZOOM_STEP)} disabled={zoom <= ZOOM_MIN} aria-label="Kichraytirish" className={btn}>
        <Minus size={14} />
      </button>
      <span className="w-11 text-center text-sm font-semibold text-slate-800 tabular-nums">{zoom}%</span>
      <button type="button" onClick={() => writeZoom(zoom + ZOOM_STEP)} disabled={zoom >= ZOOM_MAX} aria-label="Kattalashtirish" className={btn}>
        <Plus size={14} />
      </button>
    </div>
  );
}
