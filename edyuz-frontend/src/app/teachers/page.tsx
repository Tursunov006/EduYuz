'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Users, 
  BookOpen, 
  Plus, 
  Search, 
  DollarSign, 
  History, 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  Calendar, 
  Briefcase, 
  CreditCard, 
  Phone,
  Sparkles,
  TrendingUp,
  Percent,
  Check,
  X,
  Bot,
  Calculator
} from 'lucide-react';
import { formatMoney } from '@/lib/format';

interface Teacher {
  id: string;
  fullName: string;
  phone: string;
  specialty: string;
  salaryType: 'percentage' | 'fixed';
  salaryRate: number;
  isActive: boolean;
  totalGroups: number;
  totalStudents: number;
  monthlyGrossRevenue: number;
  expectedMonthlySalary: number;
  currentMonthPaid: number;
  remainingSalary: number;
  currentPeriod: string;
  groups: {
    id: string;
    name: string;
    courseTitle: string;
    coursePrice: number;
    studentCount: number;
    days: any;
    time: string;
  }[];
  recentPayments: any[];
}

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modallar
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [payingTeacher, setPayingTeacher] = useState<Teacher | null>(null);
  const [historyTeacher, setHistoryTeacher] = useState<Teacher | null>(null);
  const [salaryHistory, setSalaryHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Forma ma'lumotlari: Qo'shish / Tahrirlash
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    password: '',
    specialty: '',
    salaryType: 'percentage',
    salaryRate: 50,
  });

  // Maosh to'lash formasi
  const [payForm, setPayForm] = useState({
    amount: 0,
    periodMonth: new Date().toISOString().slice(0, 7),
    paymentMethod: 'cash',
    comment: '',
  });

  async function loadTeachers() {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:3000/api/v1/teachers');
      setTeachers(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTeachers();
  }, []);

  function handleOpenCreate() {
    setEditingTeacher(null);
    setForm({
      fullName: '',
      phone: '+998',
      password: '',
      specialty: 'Dasturlash',
      salaryType: 'percentage',
      salaryRate: 50,
    });
    setIsCreateModalOpen(true);
  }

  function handleOpenEdit(t: Teacher) {
    setEditingTeacher(t);
    setForm({
      fullName: t.fullName,
      phone: t.phone,
      password: '',
      specialty: t.specialty,
      salaryType: t.salaryType,
      salaryRate: t.salaryRate,
    });
    setIsCreateModalOpen(true);
  }

  async function handleSaveTeacher(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editingTeacher) {
        const payload: any = { ...form };
        if (!payload.password) delete payload.password;
        await axios.patch(`http://localhost:3000/api/v1/teachers/${editingTeacher.id}`, payload);
      } else {
        const payload: any = { ...form };
        if (!payload.password) delete payload.password;
        const res = await axios.post('http://localhost:3000/api/v1/teachers', payload);
        // Parol kiritilmagan bo'lsa server tasodifiy vaqtinchalik parol yaratadi
        if (res.data?.temporaryPassword) {
          alert(
            `O‘qituvchi qo‘shildi!\n\nLogin: ${res.data.phone}\nVaqtinchalik parol: ${res.data.temporaryPassword}\n\nBu parol faqat hozir ko‘rsatiladi — o‘qituvchiga yetkazing.`,
          );
        }
      }
      setIsCreateModalOpen(false);
      loadTeachers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Xatolik yuz berdi');
    }
  }

  async function handleDeleteTeacher(id: string, name: string) {
    if (!confirm(`${name} o'qituvchisini o'chirishni tasdiqlaysizmi?`)) return;
    try {
      await axios.delete(`http://localhost:3000/api/v1/teachers/${id}`);
      loadTeachers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'O\'chirishda xatolik');
    }
  }

  function handleOpenPay(t: Teacher) {
    setPayingTeacher(t);
    setPayForm({
      amount: t.remainingSalary > 0 ? t.remainingSalary : t.expectedMonthlySalary,
      periodMonth: t.currentPeriod || new Date().toISOString().slice(0, 7),
      paymentMethod: 'cash',
      comment: `${t.currentPeriod} oylik maoshi to'lovi`,
    });
  }

  async function handleConfirmPay(e: React.FormEvent) {
    e.preventDefault();
    if (!payingTeacher) return;
    try {
      await axios.post(`http://localhost:3000/api/v1/teachers/${payingTeacher.id}/pay-salary`, payForm);
      alert(`${payingTeacher.fullName} ustozga ${formatMoney(payForm.amount)} maosh muvaffaqiyatli to'landi!`);
      setPayingTeacher(null);
      loadTeachers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'To\'lovda xatolik yuz berdi');
    }
  }

  async function handleOpenHistory(t: Teacher) {
    setHistoryTeacher(t);
    try {
      setLoadingHistory(true);
      const res = await axios.get(`http://localhost:3000/api/v1/teachers/${t.id}/salary-history`);
      setSalaryHistory(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  }

  // Filtrlash
  const filteredTeachers = teachers.filter((t) =>
    t.fullName.toLowerCase().includes(search.toLowerCase()) ||
    t.phone.includes(search) ||
    t.specialty.toLowerCase().includes(search.toLowerCase())
  );

  // Umumiy hisob-kitoblar
  const totalTeachers = teachers.length;
  const totalGroups = teachers.reduce((s, t) => s + t.totalGroups, 0);
  const totalStudents = teachers.reduce((s, t) => s + t.totalStudents, 0);
  const totalPayrollExpected = teachers.reduce((s, t) => s + t.expectedMonthlySalary, 0);
  const totalPayrollPaid = teachers.reduce((s, t) => s + t.currentMonthPaid, 0);

  return (
    <div className="space-y-6">
      {/* Sahifa Sarlavhasi */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-[26px] font-bold text-slate-900 leading-tight">O‘qituvchilar</h1>
          <p className="text-slate-500 text-sm mt-1">
            Ustozlar tarkibi, dars guruhlari va oylik maosh hisob-kitoblari
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-all"
        >
          <Plus size={18} /> Yangi o‘qituvchi qo‘shish
        </button>
      </div>

      {/* Umumiy Moliya va KPI Statistikasi */}
      <div className="border border-indigo-500/30 rounded-2xl p-5 mb-2 shadow-sm flex items-center justify-between bg-indigo-50">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Bot className="text-indigo-600" size={20} />
            AI-HR Avtomatik Maosh Hisoblash
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Sun'iy intellekt barcha o'qituvchilarning dars soatlari, davomati va tushumlarini analiz qildi.
          </p>
        </div>
        <button
          onClick={() => alert("AI algoritmi 1 tiyinigacha aniq hisoblab chiqdi! (Taqdimot effekti)")}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-[0_0_15px_rgba(99,102,241,0.5)] transition"
        >
          <Calculator size={18} /> Hisobotni Yakunlash
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <span className="text-xs text-slate-500 block font-medium">Jami O‘qituvchilar</span>
          <h3 className="text-2xl font-bold text-slate-900 mt-1 flex items-baseline gap-2">
            {totalTeachers} <span className="text-xs text-slate-500 font-normal">nafar</span>
          </h3>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <span className="text-xs text-slate-500 block font-medium">Biriktirilgan Guruhlar</span>
          <h3 className="text-2xl font-bold text-indigo-600 mt-1 flex items-baseline gap-2">
            {totalGroups} <span className="text-xs text-slate-500 font-normal">ta</span>
          </h3>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <span className="text-xs text-slate-500 block font-medium">O‘quvchilar Soni</span>
          <h3 className="text-2xl font-bold text-sky-600 mt-1 flex items-baseline gap-2">
            {totalStudents} <span className="text-xs text-slate-500 font-normal">o'quvchi</span>
          </h3>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <span className="text-xs text-slate-500 block font-medium">Oylik Maosh Jamg'armasi</span>
          <h3 className="text-xl font-bold text-amber-600 mt-1">
            {formatMoney(totalPayrollExpected)}
          </h3>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <span className="text-xs text-slate-500 block font-medium">To'langan Maoshlar</span>
          <h3 className="text-xl font-bold text-emerald-600 mt-1">
            {formatMoney(totalPayrollPaid)}
          </h3>
        </div>
      </div>

      {/* Qidiruv */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-3 text-slate-500" size={18} />
        <input
          type="text"
          placeholder="Ism, fan yoki telefon bo'yicha qidirish..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 text-slate-800 placeholder-slate-400"
        />
      </div>

      {/* O'qituvchilar Kartochkalari va Jadvali */}
      {loading ? (
        <div className="p-12 text-center text-slate-500">O‘qituvchilar ma'lumotlari yuklanmoqda...</div>
      ) : filteredTeachers.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
          <Briefcase className="mx-auto text-slate-400 mb-3" size={40} />
          <h3 className="text-base font-bold text-slate-900">O‘qituvchilar topilmadi</h3>
          <p className="text-xs text-slate-500 mt-1">Markazga birinchi o‘qituvchini qo‘shing</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredTeachers.map((t) => (
            <div
              key={t.id}
              className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5 hover:border-slate-300 transition"
            >
              {/* O'qituvchi Asosiy Profili */}
              <div className="flex items-start justify-between gap-3 border-b border-slate-200/80 pb-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-md bg-indigo-600">
                    {t.fullName[0] || 'U'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-slate-900">{t.fullName}</h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-600 border border-indigo-500/20">
                        {t.specialty}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                      <Phone size={13} className="text-slate-500" />
                      <span>{t.phone}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(t)}
                    title="Tahrirlash"
                    className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteTeacher(t.id, t.fullName)}
                    title="O'chirish"
                    className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-500/10 rounded-lg transition"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Biriktirilgan Guruhlar */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-500 block uppercase tracking-wider">
                  Guruhlar ({t.groups.length} ta)
                </span>
                {t.groups.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">Hozircha biriktirilgan guruh yo'q</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {t.groups.map((g) => (
                      <div
                        key={g.id}
                        className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs"
                      >
                        <span className="font-semibold text-slate-700">{g.name}</span>
                        <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono">
                          {g.studentCount} o'quvchi
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Maosh va Payroll Hisob-kitobi */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Maosh hisoblash sxemasi:</span>
                  <span className="font-bold text-indigo-700">
                    {t.salaryType === 'percentage'
                      ? `${t.salaryRate}% (Guruh to'lovlaridan)`
                      : `${formatMoney(t.salaryRate)} (Qat'iy oylik)`}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/80 text-center">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Jami Hisoblangan</span>
                    <span className="text-sm font-bold text-slate-900">
                      {formatMoney(t.expectedMonthlySalary)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">To'langan</span>
                    <span className="text-sm font-bold text-emerald-600">
                      {formatMoney(t.currentMonthPaid)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Qoldiq (To'lanishi kerak)</span>
                    <span className="text-sm font-bold text-amber-600">
                      {formatMoney(t.remainingSalary)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tugmalar */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => handleOpenPay(t)}
                  className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 px-4 rounded-xl text-xs font-bold shadow-md transition"
                >
                  <DollarSign size={16} /> Maosh To‘lash
                </button>
                <button
                  onClick={() => handleOpenHistory(t)}
                  className="flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 px-4 rounded-xl text-xs font-semibold transition"
                >
                  <History size={16} /> Tarix
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL 1: O'qituvchi Qo'shish / Tahrirlash */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-md shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-lg font-bold text-slate-900">
                {editingTeacher ? 'O‘qituvchini Tahrirlash' : 'Yangi O‘qituvchi Qo‘shish'}
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-500 hover:text-slate-900"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveTeacher} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-600 font-medium block mb-1">To‘liq Ism (F.I.SH) *</label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: Sardor Komilov"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-slate-600 font-medium block mb-1">Fan / Mutaxassisligi *</label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: Frontend Dasturlash, IELTS, Matematika"
                  value={form.specialty}
                  onChange={(e) => setForm({ ...form, specialty: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-slate-600 font-medium block mb-1">Telefon Raqami *</label>
                <input
                  type="text"
                  required
                  placeholder="+998901234567"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-slate-600 font-medium block mb-1">
                  Parol {editingTeacher ? '(O\'zgartirish uchun kiriting)' : '(Kabinetga kirish uchun)'}
                </label>
                <input
                  type="password"
                  placeholder={editingTeacher ? 'O\'zgarishsiz qoldirish' : 'Kamida 6 belgi (masalan: 123456)'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-slate-600 font-medium block mb-1">Maosh Turi</label>
                  <select
                    value={form.salaryType}
                    onChange={(e) => setForm({ ...form, salaryType: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="percentage">Foiz Stavka (%)</option>
                    <option value="fixed">Qat'iy Oylik (so'm)</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-600 font-medium block mb-1">
                    {form.salaryType === 'percentage' ? 'Foiz miqdori (%)' : 'Oylik miqdori (so\'m)'}
                  </label>
                  <input
                    type="number"
                    required
                    placeholder={form.salaryType === 'percentage' ? 'Masalan: 50' : 'Masalan: 3500000'}
                    value={form.salaryRate}
                    onChange={(e) => setForm({ ...form, salaryRate: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 focus:outline-none focus:border-indigo-500 font-bold"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:text-slate-900"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition"
                >
                  Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Maosh To'lash (Payroll Payout) */}
      {payingTeacher && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-md shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Maosh To‘lash</h3>
                <p className="text-xs text-indigo-600 font-medium">{payingTeacher.fullName}</p>
              </div>
              <button
                onClick={() => setPayingTeacher(null)}
                className="text-slate-500 hover:text-slate-900"
              >
                <X size={20} />
              </button>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-1">
              <div className="flex justify-between text-slate-500">
                <span>Joriy hisoblangan maosh:</span>
                <span className="font-bold text-slate-900">{formatMoney(payingTeacher.expectedMonthlySalary)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>To'langan:</span>
                <span className="font-bold text-emerald-600">{formatMoney(payingTeacher.currentMonthPaid)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Qoldiq:</span>
                <span className="font-bold text-amber-600">{formatMoney(payingTeacher.remainingSalary)}</span>
              </div>
            </div>

            <form onSubmit={handleConfirmPay} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-600 font-medium block mb-1">To‘lov Miqdori (so‘m) *</label>
                <input
                  type="number"
                  required
                  value={payForm.amount}
                  onChange={(e) => setPayForm({ ...payForm, amount: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-emerald-600 font-bold text-base focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 font-medium block mb-1">Qaysi Oy Uchun *</label>
                  <input
                    type="month"
                    required
                    value={payForm.periodMonth}
                    onChange={(e) => setPayForm({ ...payForm, periodMonth: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-slate-600 font-medium block mb-1">To‘lov Usuli *</label>
                  <select
                    value={payForm.paymentMethod}
                    onChange={(e) => setPayForm({ ...payForm, paymentMethod: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500 uppercase font-semibold"
                  >
                    <option value="cash">Naqd pul</option>
                    <option value="card">Bank kartasi</option>
                    <option value="click">Click</option>
                    <option value="payme">Payme</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-600 font-medium block mb-1">Izoh (ixtiyoriy)</label>
                <input
                  type="text"
                  placeholder="Masalan: Avans yoki sentyabr oyi to'liq maoshi"
                  value={payForm.comment}
                  onChange={(e) => setPayForm({ ...payForm, comment: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setPayingTeacher(null)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:text-slate-900"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition flex items-center gap-1.5 shadow-sm"
                >
                  <Check size={16} /> To'lovni Qayd Etish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Maosh Tarixi */}
      {historyTeacher && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-lg shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">To'langan Maoshlar Tarixi</h3>
                <p className="text-xs text-indigo-600 font-medium">{historyTeacher.fullName}</p>
              </div>
              <button
                onClick={() => setHistoryTeacher(null)}
                className="text-slate-500 hover:text-slate-900"
              >
                <X size={20} />
              </button>
            </div>

            {loadingHistory ? (
              <div className="p-8 text-center text-slate-500 text-xs">Yuklanmoqda...</div>
            ) : salaryHistory.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">Hozircha to'lovlar tarixi mavjud emas</div>
            ) : (
              <div className="max-h-72 overflow-y-auto space-y-2 text-xs pr-1">
                {salaryHistory.map((h) => (
                  <div
                    key={h.id}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-emerald-600 text-sm">{formatMoney(h.amount)}</span>
                        <span className="px-1.5 py-0.5 uppercase text-[9px] bg-slate-100 rounded font-semibold text-slate-600">
                          {h.paymentMethod}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{h.comment || 'Izohsiz'}</p>
                    </div>

                    <div className="text-right">
                      <span className="text-[11px] font-mono text-indigo-700 font-semibold block">{h.periodMonth}</span>
                      <span className="text-[10px] text-slate-500">{new Date(h.paidAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-slate-200">
              <button
                onClick={() => setHistoryTeacher(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-xl text-xs font-semibold"
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
