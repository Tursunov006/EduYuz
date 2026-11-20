'use client';

import { useEffect, useState } from 'react';
import { X, AlertTriangle, RotateCcw } from 'lucide-react';
import { apiFetch } from '@/lib/api';

type Item = {
  studentId: string;
  fullName: string;
  groupName: string;
  price: number;
  discount: number;
  discountAmount: number;
  amount: number;
  status: 'charge' | 'already' | 'free';
};

const fmt = (n: number) => Math.round(Number(n) || 0).toLocaleString('uz-UZ').replace(/,/g, ' ');

/**
 * Oylik to'lovni yechish oynasi: avval har bir o'quvchidan qancha yechilishi ko'rsatiladi (hech narsa yozilmaydi),
 * admin tekshirib tasdiqlagandan keyingina yechiladi. Ota-onaga xabar faqat belgilansa yuboriladi.
 * groupId berilsa — faqat shu guruh; aks holda markazdagi barcha guruhlar.
 */
export default function ChargeMonthlyModal({
  groupId,
  onClose,
  onDone,
}: {
  groupId?: string;
  onClose: () => void;
  onDone?: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [items, setItems] = useState<Item[]>([]);
  const [total, setTotal] = useState(0);
  const [period, setPeriod] = useState('');
  const [notify, setNotify] = useState(false);
  const [busy, setBusy] = useState(false);

  async function loadPreview() {
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch('/payments/charge-monthly', {
        method: 'POST',
        body: JSON.stringify({ ...(groupId ? { groupId } : {}), dryRun: true }),
      });
      setItems(res?.items || []);
      setTotal(res?.totalCharged || 0);
      setPeriod(res?.period || '');
    } catch (e: any) {
      setError(e.message || 'Hisoblab bo‘lmadi');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  const toCharge = items.filter((i) => i.status === 'charge');
  const already = items.filter((i) => i.status === 'already');

  async function confirmCharge() {
    if (busy || toCharge.length === 0) return;
    setBusy(true);
    try {
      const res = await apiFetch('/payments/charge-monthly', {
        method: 'POST',
        body: JSON.stringify({ ...(groupId ? { groupId } : {}), notify }),
      });
      alert(res?.message || 'Yechildi');
      onDone?.();
      onClose();
    } catch (e: any) {
      alert('Yechishda xatolik: ' + e.message);
    } finally {
      setBusy(false);
    }
  }

  async function cancelThisMonth() {
    if (!groupId || busy) return;
    const sum = already.reduce((a, i) => a + i.amount, 0);
    if (
      !confirm(
        `Bu oy (${period}) shu guruhdan yechilgan oylik to'lovlar bekor qilinadi va summalar o'quvchilar balansiga qaytariladi.\n\nDIQQAT: agar shu o'quvchilarning balansini qo'lda to'g'rilagan bo'lsangiz, qaytarilgan summa ustiga qo'shiladi — bekor qilmang.\n\nKeyin to'g'ri summalar bilan qayta yechishingiz mumkin. Davom etilsinmi?`,
      )
    )
      return;
    setBusy(true);
    try {
      const res = await apiFetch('/payments/charge-monthly/cancel', { method: 'POST', body: JSON.stringify({ groupId }) });
      alert(res?.message || `Bekor qilindi (${fmt(sum)} so'm)`);
      onDone?.();
      await loadPreview();
    } catch (e: any) {
      alert('Bekor qilishda xatolik: ' + e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white border border-slate-200 rounded-2xl p-5 w-full max-w-2xl max-h-[90vh] flex flex-col gap-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Oylik to‘lovni yechish {period && `(${period})`}</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Avval tekshiring: har bir o‘quvchidan quyidagi summa yechiladi (kurs narxi − chegirma). Hali hech narsa yechilmadi.
            </p>
          </div>
          <button onClick={onClose} title="Yopish" className="text-slate-500 hover:text-slate-900">
            <X size={18} />
          </button>
        </div>

        {loading ? (
          <p className="py-10 text-center text-sm text-slate-500">Hisoblanmoqda...</p>
        ) : error ? (
          <p className="py-6 text-center text-sm text-rose-600">{error}</p>
        ) : (
          <>
            <div className="overflow-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 text-xs sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3">O‘quvchi</th>
                    {!groupId && <th className="py-2.5 px-3">Guruh</th>}
                    <th className="py-2.5 px-3 text-right">Narx</th>
                    <th className="py-2.5 px-3 text-right">Chegirma</th>
                    <th className="py-2.5 px-3 text-right">Yechiladi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500">
                        Yechiladigan o‘quvchi yo‘q (faol o‘quvchi yoki kurs narxi yo‘q)
                      </td>
                    </tr>
                  ) : (
                    items.map((i) => (
                      <tr key={i.studentId + i.groupName} className={i.status === 'charge' ? '' : 'text-slate-400'}>
                        <td className="py-2 px-3 font-medium">{i.fullName}</td>
                        {!groupId && <td className="py-2 px-3 text-xs">{i.groupName}</td>}
                        <td className="py-2 px-3 text-right">{fmt(i.price)}</td>
                        <td className="py-2 px-3 text-right text-emerald-700">
                          {[i.discount > 0 ? `${i.discount}%` : '', i.discountAmount > 0 ? `${fmt(i.discountAmount)} so‘m` : '']
                            .filter(Boolean)
                            .join(' + ') || '—'}
                        </td>
                        <td className="py-2 px-3 text-right font-bold">
                          {i.status === 'charge' ? (
                            <span className="text-rose-600">−{fmt(i.amount)}</span>
                          ) : i.status === 'already' ? (
                            <span className="text-xs font-semibold">bu oy yechilgan</span>
                          ) : (
                            <span className="text-xs font-semibold">100% chegirma</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span>
                Jami yechiladi: <strong className="text-rose-600">{fmt(total)} so‘m</strong> ({toCharge.length} ta o‘quvchi)
              </span>
              {already.length > 0 && (
                <span className="text-xs text-amber-700 flex items-center gap-1">
                  <AlertTriangle size={13} /> {already.length} ta o‘quvchidan bu oy avval yechilgan
                </span>
              )}
            </div>

            <label className="flex items-start gap-2 text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-xl p-3">
              <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} className="mt-0.5" />
              <span>
                Ota-onalarga Telegram/SMS orqali qarzdorlik xabarini yuborish
                <span className="block text-slate-400">Belgilanmasa hech kimga xabar ketmaydi</span>
              </span>
            </label>
          </>
        )}

        <div className="flex flex-wrap justify-between gap-2">
          {groupId && already.length > 0 ? (
            <button
              onClick={cancelThisMonth}
              disabled={busy}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-amber-300 bg-amber-50 text-amber-800 text-xs font-bold disabled:opacity-60"
            >
              <RotateCcw size={14} /> Bu oydagi yechishni bekor qilish
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold">
              Bekor qilish
            </button>
            <button
              onClick={confirmCharge}
              disabled={busy || loading || toCharge.length === 0}
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold disabled:opacity-50"
            >
              {busy ? 'Bajarilmoqda...' : `Tasdiqlash va ${fmt(total)} so‘m yechish`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
