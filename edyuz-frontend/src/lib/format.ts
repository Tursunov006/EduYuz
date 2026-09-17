export function formatMoney(amount: number | string | null | undefined): string {
  const num = Number(amount || 0);
  return Math.abs(num).toLocaleString('uz-UZ') + " so'm";
}
