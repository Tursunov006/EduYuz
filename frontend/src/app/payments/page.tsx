'use client';

import { useEffect, useState } from 'react';
import { Plus, Search, Filter, Download, Receipt, CheckCircle2 } from 'lucide-react';
import { apiFetch } from '@/lib/api';

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [receiptModal, setReceiptModal] = useState<any>(null);

  // Filtrlar
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState('ALL');

  const [form, setForm] = useState({
    studentId: '',
    amount: '',
    paymentMethod: 'cash',
    comment: '',
  });

  async function loadData() {
    try {
      setLoading(true);
      const [pays, stds] = await Promise.all([
        apiFetch('/payments').catch(() => []),
        apiFetch('/students').catch(() => []),
      ]);
      setPayments(pays || []);
      setStudents(stds || []);
      if (stds && stds[0]) setForm((f) => ({ ...f, studentId: stds[0].id }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const newPay = await apiFetch('/payments', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          amount: Number(form.amount),
        }),
      });
      setIsModalOpen(false);
      setReceiptModal(newPay);
      setForm({ studentId: students[0]?.id || '', amount: '', paymentMethod: 'cash', comment: '' });
      loadData();
    } catch (err: any) {
      alert("To'lov qabul qilishda xatolik: " + err.message);
    }
  }

  // Filtrlangan to'lovlar
  const filteredPayments = payments.filter((p) => {
    const matchesSearch = p.student?.fullName?.toLowerCase().includes(search.toLowerCase());
    const matchesMethod = methodFilter === 'ALL' || p.paymentMethod === methodFilter;
    return matchesSearch && matchesMethod;
  });

  const totalAmount = filteredPayments.reduce((acc, p) => acc + Number(p.amount || 0), 0);

  function exportToCSV() {
    if (filteredPayments.length === 0) return alert('Eksport uchun to\'lovlar yo\'q');
    const headers = ['O\'quvchi', 'Miqdor', 'Usul', 'Izoh', 'Sana'];
    const rows = filteredPayments.map((p) => [
      `"${p.student?.fullName || ''}"`,
      p.amount,
      p.paymentMethod,
      `"${p.comment || ''}"`,
      new Date(p.paidAt).toLocaleDateString(),
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `tolovlar_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Kassa va To‘lovlar</h1>
          <p className="text-slate-400 mt-1">To'lovlar qabul qilish, kvitansiyalar va moliyaviy hisobot</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 px-4 py-2.5 rounded-xl text-sm font-medium transition shadow-sm"
          >
            <Download size={16} /> Excel (CSV)
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium shadow-lg shadow-indigo-600/20 transition-all"
          >
            <Plus size={18} /> To'lov qabul qilish
          </button>
        </div>
      </div>

      {/* Filtrlar va Tushum bloki */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400">Filtr bo'yicha jami tushum</p>
            <h3 className="text-xl font-bold text-emerald-400 mt-1">{totalAmount.toLocaleString()} so'm</h3>
          </div>
          <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-lg border border-emerald-500/20 font-medium">
            {filteredPayments.length} ta to'lov
          </span>
        </div>

        {/* Qidiruv */}
        <div className="relative flex items-center">
          <Search className="absolute left-3.5 top-3.5 text-slate-500" size={18} />
          <input
            type="text"
            placeholder="O'quvchi ismi bo'yicha qidiruv..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-full bg-slate-900 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 text-slate-100"
          />
        </div>

        {/* Usul bo'yicha filtr */}
        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-2xl px-3 py-2">
          <Filter size={18} className="text-slate-500 mr-2" />
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="w-full bg-transparent text-sm text-slate-200 focus:outline-none"
          >
            <option value="ALL" className="bg-slate-900">Barcha usullar</option>
            <option value="cash" className="bg-slate-900">Naqd pul (cash)</option>
            <option value="card" className="bg-slate-900">Plastik karta (card)</option>
            <option value="click" className="bg-slate-900">Click</option>
            <option value="payme" className="bg-slate-900">Payme</option>
          </select>
        </div>
      </div>

      {/* Jadval */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-medium">
            <tr>
              <th className="py-4 px-5">O'quvchi</th>
              <th className="py-4 px-5">To'lov miqdori</th>
              <th className="py-4 px-5">To'lov usuli</th>
              <th className="py-4 px-5">Izoh</th>
              <th className="py-4 px-5">Sana</th>
              <th className="py-4 px-5 text-right">Chek</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {loading ? (
              <tr><td colSpan={6} className="py-12 text-center text-slate-500">Yuklanmoqda...</td></tr>
            ) : filteredPayments.length === 0 ? (
              <tr><td colSpan={6} className="py-12 text-center text-slate-500">To'lovlar topilmadi</td></tr>
            ) : (
              filteredPayments.map((p) => (
                <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-4 px-5 font-semibold text-white">{p.student?.fullName || 'Noma\'lum'}</td>
                  <td className="py-4 px-5 text-emerald-400 font-bold text-base">
                    {Math.abs(Number(p.amount)).toLocaleString('uz-UZ')} so'm
                  </td>
                  <td className="py-4 px-5 uppercase text-xs">
                    <span className="px-2.5 py-1 bg-slate-800 border border-slate-700 text-indigo-300 font-semibold rounded-lg">
                      {p.paymentMethod}
                    </span>
                  </td>
                  <td className="py-4 px-5 text-slate-400">{p.comment || '-'}</td>
                  <td className="py-4 px-5 text-slate-400">{new Date(p.paidAt).toLocaleDateString()}</td>
                  <td className="py-4 px-5 text-right">
                    <button
                      onClick={() => setReceiptModal(p)}
                      title="Kvitansiyani ko'rish"
                      className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition"
                    >
                      <Receipt size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* To'lov qabul qilish modali */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <h2 className="text-xl font-bold text-white">To'lov Qabul Qilish</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">O'quvchini tanlang</label>
                <select
                  required
                  value={form.studentId}
                  onChange={(e) => setForm({ ...form, studentId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-white"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>{s.fullName} (Balans: {Number(s.balance).toLocaleString()} so'm)</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">To'lov miqdori (so'mda)</label>
                <input
                  required
                  type="number"
                  placeholder="Masalan: 500000"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">To'lov usuli</label>
                <select
                  value={form.paymentMethod}
                  onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-white"
                >
                  <option value="cash">Naqd pul (cash)</option>
                  <option value="card">Plastik karta (card)</option>
                  <option value="click">Click</option>
                  <option value="payme">Payme</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Izoh (ixtiyoriy)</label>
                <input
                  type="text"
                  placeholder="Sentabr oyi to'lovi"
                  value={form.comment}
                  onChange={(e) => setForm({ ...form, comment: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-white"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-white"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl text-sm font-medium"
                >
                  To'lovni tasdiqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Kvitansiya (Receipt) Modali */}
      {receiptModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto">
              <CheckCircle2 size={24} />
            </div>
            <h3 className="text-xl font-bold text-white">To'lov Cheki</h3>
            <div className="p-4 bg-slate-950 rounded-xl space-y-2 text-sm text-left border border-slate-800">
              <div className="flex justify-between">
                <span className="text-slate-400">O'quvchi:</span>
                <span className="text-white font-medium">{receiptModal.student?.fullName || 'O\'quvchi'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Miqdor:</span>
                <span className="text-emerald-400 font-bold">{Math.abs(Number(receiptModal.amount)).toLocaleString('uz-UZ')} so'm</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">To'lov usuli:</span>
                <span className="uppercase text-indigo-300 font-medium">{receiptModal.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Sana:</span>
                <span className="text-slate-300">{new Date(receiptModal.paidAt || Date.now()).toLocaleString()}</span>
              </div>
              {receiptModal.comment && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Izoh:</span>
                  <span className="text-slate-300">{receiptModal.comment}</span>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-2 rounded-xl text-sm font-medium transition"
              >
                Chop etish (Print)
              </button>
              <button
                onClick={() => setReceiptModal(null)}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-xl text-sm font-medium transition"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
