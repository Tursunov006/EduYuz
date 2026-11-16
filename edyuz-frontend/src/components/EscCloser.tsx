'use client';

import { useEffect } from 'react';

/**
 * Butun platforma bo'yicha: Esc tugmasi bosilganda eng ustdagi ochiq oyna (modal) yopiladi.
 * Oynaning o'zidagi "Yopish / Bekor qilish / ✕" tugmasi bosiladi — shu sababli har bir oyna
 * o'zining odatiy yopilish mantiqi bilan yopiladi. "Chiqish" kabi boshqa tugmalar hech qachon bosilmaydi.
 *
 * Sahifa Esc ni o'zi qayta ishlasa (masalan ochiq ro'yxatni yopsa), e.preventDefault() chaqiradi —
 * unda bu yerda hech narsa qilinmaydi.
 */
const CLOSE_TEXTS = ['yopish', 'bekor qilish', 'bekor', 'cancel', 'close', '×', '✕'];

function isVisible(el: HTMLElement) {
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden';
}

function findCloseButton(overlay: HTMLElement): HTMLElement | null {
  const buttons = Array.from(overlay.querySelectorAll<HTMLElement>('button, [role="button"]')).filter(
    (b) => isVisible(b) && !(b as HTMLButtonElement).disabled && b.getAttribute('type') !== 'submit',
  );
  // 1) Aniq belgilangan yopish tugmasi
  const marked = buttons.find((b) => b.hasAttribute('data-modal-close'));
  if (marked) return marked;
  // 2) title / aria-label "Yopish"
  const titled = buttons.find((b) => {
    const t = `${b.getAttribute('title') || ''} ${b.getAttribute('aria-label') || ''}`.toLowerCase();
    return t.includes('yopish') || t.includes('close') || t.includes('bekor');
  });
  if (titled) return titled;
  // 3) Faqat ✕ (lucide X) belgisi bor tugma
  const iconOnly = buttons.find((b) => !(b.textContent || '').trim() && b.querySelector('svg.lucide-x'));
  if (iconOnly) return iconOnly;
  // 4) Matni "Yopish", "Bekor qilish" ...
  const texted = buttons.find((b) => CLOSE_TEXTS.includes((b.textContent || '').trim().toLowerCase()));
  return texted || null;
}

export default function EscCloser() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.defaultPrevented) return;
      const overlays = Array.from(document.querySelectorAll<HTMLElement>('.fixed.inset-0')).filter(isVisible);
      // Faqat eng ustdagi oyna yopiladi; uning yopish tugmasi bo'lmasa (masalan obuna tugaganda) hech narsa qilinmaydi
      const top = overlays[overlays.length - 1];
      if (!top) return;
      if (!top.children.length) {
        // Bo'sh fon (telefondagi yon menyu foni) — o'zi bosilganda yopiladi
        e.preventDefault();
        top.click();
        return;
      }
      const btn = findCloseButton(top);
      if (btn) {
        e.preventDefault();
        btn.click();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  return null;
}
