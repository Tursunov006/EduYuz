'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Search, 
  Trash2, 
  PieChart, 
  Sparkles, 
  Calendar, 
  Briefcase, 
  Building2, 
  Zap, 
  Megaphone, 
  Monitor, 
  FileText, 
  ShieldAlert, 
  X,
  CreditCard
} from 'lucide-react';
import { formatMoney } from '@/lib/format';

const CATEGORY_MAP: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  rent: { label: 'Bino Ijarasi', icon: Building2, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
  salary: { label: 'Oylik Maoshlar', icon: Briefcase, color: 'text-sky-400', bg: 'bg-sky-500/10 border-sky-500/20' },
  utilities: { label: 'Kommunal & Internet', icon: Zap, color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
  marketing: { label: 'Reklama & Marketing', icon: Megaphone, color: 'text-pink-400', bg: 'bg-pink-500/10 border-pink-500/20' },
  equipment: { label: 'Uskuna & Jihozlar', icon: Monitor, color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/20' },
  stationery: { label: 'Kanselyariya & Kitoblar', icon: FileText, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  tax: { label: 'Soliq & Bank Xizmati', icon: ShieldAlert, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
  other: { label: 'Boshqa Xarajatlar', icon: DollarSign, color: 'text-slate-400', bg: 'bg-slate-500/10 border-slate-500/20' },
};

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [form, setForm] = useState({
    title: '',
    amount: 0,
    category: 'rent',
    paymentMethod: 'cash',
    comment: '',
  });

  async function loadData() {
    try {
      setLoading(true);
      const [expRes, sumRes] = await Promise.all([
        axios.get('http://localhost:3000/api/v1/expenses'),
        axios.get('http://localhost:3000/api/v1/expenses/summary'),
      ]);
      setExpenses(expRes.data || []);
      setSummary(sumRes.data || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleCreateExpense(e: React.FormEvent) {
    e.preventDefault();
    try {
      await axios.post('http://localhost:3000/api/v1/expenses', form);
      setIsModalOpen(false);
      setForm({
        title: '',
        amount: 0,
        category: 'rent',
        paymentMethod: 'cash',
        comment: '',
      });
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Xatolik yuz berdi');
    }
  }

  async function handleDeleteExpense(id: string, title: string) {
    if (!confirm(`"${title}" xarajatini o'chirishni tasdiqlaysizmi?`)) return;
    try {
      await axios.delete(`http://localhost:3000/api/v1/expenses/${id}`);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'O\'chirishda xatolik');
    }
  }

  const filteredExpenses = expenses.filter((e) => {
    const matchesSearch = e.title.toLowerCase().includes(search.toLowerCase()) ||
      (e.comment && e.comment.toLowerCase().includes(search.toLowerCase()));
    const matchesCat = selectedCategory === 'all' || e.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6">
      {/* Sarlavha va Qo'shish tugmasi */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
            <DollarSign className="text-emerald-400" size={30} />
            Moliya, Xarajatlar va Sof Foyda
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Markaz tushumlari, barcha xarajatlar va haqiqiy sof daromad tahlili
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-rose-600/20 transition-all"
        >
          <Plus size={18} /> Yangi Chiqim / Xarajat kiritish
        </button>
      </div>

      {/* Asosiy Moliyaviy KPI Vidjetlari */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Kirim */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Jami Tushum (Kirim)</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <TrendingUp size={18} />
              </div>
            </div>
            <h3 className="text-2xl font-black text-emerald-400">
              {formatMoney(summary.totalIncome)}
            </h3>
            <span className="text-[10px] text-slate-500 block">Talabalardan qabul qilingan to'lovlar</span>
          </div>

          {/* Operatsion Chiqimlar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Markaz Xarajatlari</span>
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                <Building2 size={18} />
              </div>
            </div>
            <h3 className="text-2xl font-black text-purple-400">
              {formatMoney(summary.totalOperatingExpenses)}
            </h3>
            <span className="text-[10px] text-slate-500 block">Ijara, kommunal, marketing va jihozlar</span>
          </div>

          {/* O'qituvchilar Maoshi */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>To'langan Oyliklar</span>
              <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center">
                <Briefcase size={18} />
              </div>
            </div>
            <h3 className="text-2xl font-black text-sky-400">
              {formatMoney(summary.totalSalaryExpenses)}
            </h3>
            <span className="text-[10px] text-slate-500 block">O'qituvchilarga berilgan maoshlar</span>
          </div>

          {/* SOF FOYDA (NET PROFIT) */}
          <div className={`border rounded-2xl p-5 shadow-sm space-y-2 ${
            summary.isProfitable 
              ? 'bg-gradient-to-br from-slate-900 to-emerald-950/40 border-emerald-500/30' 
              : 'bg-gradient-to-br from-slate-900 to-rose-950/40 border-rose-500/30'
          }`}>
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Sparkles size={14} className={summary.isProfitable ? 'text-emerald-400' : 'text-rose-400'} />
                Haqiqiy Sof Foyda
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                summary.isProfitable ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
              }`}>
                {summary.isProfitable ? 'Foydali' : 'Zarar'}
              </span>
            </div>
            <h3 className={`text-2xl font-black ${summary.isProfitable ? 'text-emerald-400' : 'text-rose-400'}`}>
              {summary.netProfit < 0 ? '-' : '+'}{formatMoney(summary.netProfit)}
            </h3>
            <span className="text-[10px] text-slate-500 block">Kirim - Jami Chiqim (Oyliklar + Xarajatlar)</span>
          </div>
        </div>
      )}

      {/* Xarajatlar Toifalari Bo'yicha Taqsimot (Category Breakdown) */}
      {summary && summary.categoryTotals && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <PieChart size={16} className="text-indigo-400" />
            Xarajatlarning Toifalar Bo‘yicha Taqsimoti
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            {Object.entries(CATEGORY_MAP).map(([key, cat]) => {
              const amount = summary.categoryTotals[key] || 0;
              const Icon = cat.icon;
              return (
                <div key={key} className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-center space-y-1">
                  <div className={`w-7 h-7 mx-auto rounded-lg ${cat.bg} flex items-center justify-center ${cat.color}`}>
                    <Icon size={14} />
                  </div>
                  <span className="text-[10px] text-slate-400 block font-medium truncate">{cat.label}</span>
                  <span className="text-xs font-bold text-white block truncate">{formatMoney(amount)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Qidiruv va Filtrlar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3.5 top-3 text-slate-500" size={18} />
          <input
            type="text"
            placeholder="Xarajat nomi yoki izoh bo'yicha qidirish..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 text-slate-100 placeholder-slate-500"
          />
        </div>

        {/* Kategoriya Filtri */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full sm:w-auto bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
        >
          <option value="all">Barcha toifalar</option>
          {Object.entries(CATEGORY_MAP).map(([key, cat]) => (
            <option key={key} value={key}>{cat.label}</option>
          ))}
        </select>
      </div>

      {/* Xarajatlar Jadvali */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-medium">
            <tr>
              <th className="py-4 px-5">Xarajat Nomi</th>
              <th className="py-4 px-5">Toifa</th>
              <th className="py-4 px-5">To‘lov Usuli</th>
              <th className="py-4 px-5">Izoh</th>
              <th className="py-4 px-5">Sana</th>
              <th className="py-4 px-5 text-right">Miqdor</th>
              <th className="py-4 px-5 text-right">Amal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {loading ? (
              <tr><td colSpan={7} className="py-12 text-center text-slate-500">Yuklanmoqda...</td></tr>
            ) : filteredExpenses.length === 0 ? (
              <tr><td colSpan={7} className="py-12 text-center text-slate-500">Hozircha xarajatlar kiritilmagan</td></tr>
            ) : (
              filteredExpenses.map((e) => {
                const catInfo = CATEGORY_MAP[e.category] || CATEGORY_MAP.other;
                const Icon = catInfo.icon;
                return (
                  <tr key={e.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-5 font-bold text-white flex items-center gap-2.5">
                      <div className={`w-7 h-7 rounded-lg ${catInfo.bg} flex items-center justify-center ${catInfo.color}`}>
                        <Icon size={14} />
                      </div>
                      {e.title}
                    </td>
                    <td className="py-4 px-5">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${catInfo.bg} ${catInfo.color}`}>
                        {catInfo.label}
                      </span>
                    </td>
                    <td className="py-4 px-5 uppercase text-xs">
                      <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 text-slate-300 font-medium rounded-lg">
                        {e.paymentMethod}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-slate-400 text-xs">{e.comment || '-'}</td>
                    <td className="py-4 px-5 text-slate-400 text-xs">{new Date(e.paidAt).toLocaleDateString()}</td>
                    <td className="py-4 px-5 text-right font-black text-rose-400 text-base">
                      -{formatMoney(e.amount)}
                    </td>
                    <td className="py-4 px-5 text-right">
                      <button
                        onClick={() => handleDeleteExpense(e.id, e.title)}
                        title="O'chirish"
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL: Yangi Chiqim / Xarajat Qo'shish */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <DollarSign className="text-rose-400" size={20} />
                Yangi Xarajat Kiritish
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-medium block mb-1">Xarajat Nomi / Sababi *</label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: Bino oylik ijarasi, Elektr toki to'lovi"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Miqdori (so‘m) *</label>
                <input
                  type="number"
                  required
                  placeholder="Masalan: 2500000"
                  value={form.amount || ''}
                  onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-rose-400 font-black text-base focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Xarajat Toifasi *</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    {Object.entries(CATEGORY_MAP).map(([key, cat]) => (
                      <option key={key} value={key}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-medium block mb-1">To‘lov Usuli *</label>
                  <select
                    value={form.paymentMethod}
                    onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 uppercase font-semibold"
                  >
                    <option value="cash">Naqd pul</option>
                    <option value="card">Bank kartasi</option>
                    <option value="click">Click</option>
                    <option value="payme">Payme</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Izoh (ixtiyoriy)</label>
                <input
                  type="text"
                  placeholder="Qo'shimcha izoh yoki kvitansiya raqami"
                  value={form.comment}
                  onChange={(e) => setForm({ ...form, comment: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition shadow-lg shadow-rose-600/20"
                >
                  Xarajatni Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
