export function formatMoney(amount: number | string | null | undefined): string {
  const num = Number(amount || 0);
  return Math.abs(num).toLocaleString('uz-UZ') + " so'm";
}

/**
 * Raqam maydoni (input type=number) qiymatini o'qiydi va boshidagi ortiqcha
 * nollarni maydonning o'zidan ham olib tashlaydi ("035" → "35").
 * React 0 qiymatli maydonga yozilganda "035" ko'rinishida qoldiradi, shu sababli kerak.
 */
export function numVal(e: { target: { value: string } }): number {
  const raw = e.target.value;
  const clean = raw.replace(/^(-?)0+(?=\d)/, '$1');
  if (clean !== raw) e.target.value = clean;
  return clean === '' ? 0 : Number(clean);
}
