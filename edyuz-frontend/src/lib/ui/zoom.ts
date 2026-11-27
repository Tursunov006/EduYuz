import { useSyncExternalStore } from 'react';

// Butun platforma masshtabi (foiz). Har bir foydalanuvchi o'zi uchun tanlaydi, brauzerda eslab qolinadi.
export const ZOOM_MIN = 60;
export const ZOOM_MAX = 150;
export const ZOOM_STEP = 10;
const KEY = 'eduyuz_ui_zoom';
const clamp = (v: number) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, v));

const listeners = new Set<() => void>();

export function readZoom(): number {
  try {
    const v = parseInt(localStorage.getItem(KEY) || '', 10);
    return Number.isFinite(v) ? clamp(v) : 100;
  } catch {
    return 100;
  }
}

export function writeZoom(v: number) {
  try {
    localStorage.setItem(KEY, String(clamp(v)));
  } catch {
    // brauzer saqlashga ruxsat bermasa ham masshtab shu sessiyada o'zgaradi
  }
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener('storage', cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener('storage', cb);
  };
}

export function useUiZoom(): number {
  return useSyncExternalStore(subscribe, readZoom, () => 100);
}
