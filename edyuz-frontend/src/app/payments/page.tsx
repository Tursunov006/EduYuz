'use client';

import { useEffect, useState } from 'react';
import {
  Plus,
  Search,
  Filter,
  Download,
  Receipt,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertCircle,
  Wallet,
  CreditCard,
  Building2,
  Briefcase,
  Zap,
  Megaphone,
  Monitor,
  FileText,
  ShieldAlert,
  Trash2,
  PieChart,
  Brain,
  AlertTriangle,
  Send,
  Printer,
  X,
  BarChart3,
  Users,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { exportToExcel } from '@/lib/excelExport';

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

const COLORS = ['bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-purple-500', 'bg-pink-500'];

type FinanceTab = 'income' | 'debtors' | 'expenses' | 'reports';

export default function UnifiedFinancePage() {
  const [activeTab, setActiveTab] = useState<FinanceTab>('income');
  const [loading, setLoading] = useState(true);

  // Ma'lumotlar bazasi state'lari
  const [payments, setPayments] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);

  // Modallar
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isExpModalOpen, setIsExpModalOpen] = useState(false);
  const [receiptModal, setReceiptModal] = useState<any>(null);
  const [chargingMonthly, setChargingMonthly] = useState(false);

  // Filtrlar (Kirim uchun)
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState('ALL');
  const [periodFilter, setPeriodFilter] = useState<'ALL' | 'TODAY' | 'MONTH'>('ALL');

  // Filtrlar (Chiqim uchun)
  const [expSearch, setExpSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Formalar
  const [payForm, setPayForm] = useState({
    studentId: '',
    amount: '',
    paymentMethod: 'cash',
    comment: '',
  });

  const [expForm, setExpForm] = useState({
    title: '',
    amount: '',
    category: 'rent',
    paymentMethod: 'cash',
    comment: '',
  });

  async function loadAllFinanceData() {
    try {
      setLoading(true);
      const [pays, stds, exps, tchrs, grps] = await Promise.all([
        apiFetch('/payments').catch(() => []),
        apiFetch('/students').catch(() => []),
        apiFetch('/expenses').catch(() => []),
        apiFetch('/teachers').catch(() => []),
        apiFetch('/groups').catch(() => []),
      ]);

      setPayments(pays || []);
      setStudents(stds || []);
      setExpenses(exps || []);
      setTeachers(tchrs || []);
      setGroups(grps || []);

      if (stds && stds[0] && !payForm.studentId) {
        setPayForm((f) => ({ ...f, studentId: stds[0].id }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab') as FinanceTab | null;
      if (tabParam && ['income', 'debtors', 'expenses', 'reports'].includes(tabParam)) {
        setActiveTab(tabParam);
      }
    }
    loadAllFinanceData();
  }, []);

  // 1. Asosiy moliyaviy hisob-kitoblar (Faqat haqiqiy raqamlar!)
  const positivePayments = payments.filter((p) => Number(p.amount || 0) > 0);
  const totalIncome = positivePayments.reduce((acc, p) => acc + Number(p.amount || 0), 0);

  const cashIncome = positivePayments
    .filter((p) => p.paymentMethod === 'cash')
    .reduce((acc, p) => acc + Number(p.amount || 0), 0);
  const digitalIncome = totalIncome - cashIncome;

  const totalExpense = expenses.reduce((acc, e) => acc + Math.abs(Number(e.amount || 0)), 0);
  const netProfit = totalIncome - totalExpense;

  const debtors = students.filter((s) => Number(s.balance || 0) < 0);
  const totalDebt = debtors.reduce((acc, s) => acc + Math.abs(Number(s.balance || 0)), 0);

  // 2. Filtrlangan to'lovlar (Kassa tab'i)
  const filteredPayments = positivePayments.filter((p) => {
    const matchesSearch = p.student?.fullName?.toLowerCase().includes(search.toLowerCase());
    const matchesMethod = methodFilter === 'ALL' || p.paymentMethod === methodFilter;

    let matchesPeriod = true;
    if (periodFilter !== 'ALL' && p.paidAt) {
      const pd = new Date(p.paidAt);
      const now = new Date();
      if (periodFilter === 'TODAY') {
        matchesPeriod = pd.toDateString() === now.toDateString();
      } else if (periodFilter === 'MONTH') {
        matchesPeriod = pd.getMonth() === now.getMonth() && pd.getFullYear() === now.getFullYear();
      }
    }
    return matchesSearch && matchesMethod && matchesPeriod;
  });

  const filteredIncomeTotal = filteredPayments.reduce((acc, p) => acc + Number(p.amount || 0), 0);

  // 3. Filtrlangan xarajatlar (Chiqim tab'i)
  const filteredExpenses = expenses.filter((e) => {
    const matchesSearch =
      e.title?.toLowerCase().includes(expSearch.toLowerCase()) ||
      (e.comment && e.comment.toLowerCase().includes(expSearch.toLowerCase()));
    const matchesCat = selectedCategory === 'all' || e.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  // Kategoriya bo'yicha jami xarajatlar
  const categoryTotals: Record<string, number> = {};
  expenses.forEach((e) => {
    const cat = e.category || 'other';
    categoryTotals[cat] = (categoryTotals[cat] || 0) + Math.abs(Number(e.amount || 0));
  });

  // 4. To'lov qabul qilish funksiyasi
  async function handlePaymentSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const newPay = await apiFetch('/payments', {
        method: 'POST',
        body: JSON.stringify({
          ...payForm,
          amount: Number(payForm.amount),
        }),
      });
      setIsPayModalOpen(false);
      setReceiptModal(newPay);
      setPayForm({
        studentId: students[0]?.id || '',
        amount: '',
        paymentMethod: 'cash',
        comment: '',
      });
      loadAllFinanceData();
    } catch (err: any) {
      alert("To'lov qabul qilishda xatolik: " + err.message);
    }
  }

  // Qarzdor ustiga bosib 1-Click to'lov oynasini ochish
  function openQuickPayForDebtor(student: any) {
    setPayForm({
      studentId: student.id,
      amount: String(Math.abs(Number(student.balance || 0))),
      paymentMethod: 'cash',
      comment: "Qarzdorlik to'lovi",
    });
    setIsPayModalOpen(true);
  }

  // Qarzdorga Telegram orqali 1-Click eslatma yuborish
  function sendTelegramReminder(student: any) {
    const debt = Math.abs(Number(student.balance || 0)).toLocaleString('uz-UZ');
    const rawPhone = (student.parentPhone || student.phone || '').replace(/\D/g, '');
    const cleanPhone = rawPhone.startsWith('998') ? `+${rawPhone}` : `+998${rawPhone}`;
    const text = encodeURIComponent(
      `Assalomu alaykum! Farzandingiz ${student.fullName}ning o'quv kursi uchun ${debt} so'm qarzdorligi mavjud. Iltimos, to'lovni amalga oshirishingizni so'raymiz. Hurmat bilan, O'quv Markazi Ma'muriyati.`
    );
    window.open(`https://t.me/${cleanPhone}?text=${text}`, '_blank');
  }

  // Oylik abonent to'lovini yechish
  async function handleChargeMonthly() {
    if (
      !confirm(
        "Barcha faol o'quvchilarning balansidan oylik kurs to'lovini yechishni tasdiqlaysizmi?"
      )
    )
      return;
    try {
      setChargingMonthly(true);
      const res = await apiFetch('/payments/charge-monthly', { method: 'POST' });
      alert(res?.message || "Oylik kurs to'lovlari muvaffaqiyatli hisoblandi!");
      loadAllFinanceData();
    } catch (err: any) {
      alert(err.message || 'Xatolik yuz berdi');
    } finally {
      setChargingMonthly(false);
    }
  }

  // 5. Chiqim / Xarajat qo'shish funksiyasi
  async function handleExpenseSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await apiFetch('/expenses', {
        method: 'POST',
        body: JSON.stringify({
          ...expForm,
          amount: Number(expForm.amount),
        }),
      });
      setIsExpModalOpen(false);
      setExpForm({
        title: '',
        amount: '',
        category: 'rent',
        paymentMethod: 'cash',
        comment: '',
      });
      loadAllFinanceData();
    } catch (err: any) {
      alert('Xarajat kiritishda xatolik: ' + err.message);
    }
  }

  async function handleDeleteExpense(id: string, title: string) {
    if (!confirm(`"${title}" xarajatini o'chirishni tasdiqlaysizmi?`)) return;
    try {
      await apiFetch(`/expenses/${id}`, { method: 'DELETE' });
      loadAllFinanceData();
    } catch (err: any) {
      alert("O'chirishda xatolik: " + err.message);
    }
  }

  // Professional ko'p ustunli Excel (.xls) Eksport (Kassa, Qarzdorlar, Chiqimlar va KPI uchun)
  const METHOD_LABELS: Record<string, string> = {
    cash: 'Naqd pul',
    card: 'Plastik karta',
    click: 'Click',
    payme: 'Payme',
  };

  function exportPaymentsCSV() {
    const today = new Date().toISOString().split('T')[0];

    if (activeTab === 'debtors') {
      if (debtors.length === 0) return alert('Qarzdorlar ro‘yxati bo‘sh');
      exportToExcel(
        `EduYuz_Qarzdorlar_${today}`,
        [
          { header: "O'quvchi F.I.O", key: 'fullName', width: 240 },
          { header: 'Shaxsiy telefon', key: 'phone', width: 160, align: 'center' },
          { header: 'Ota-ona telefoni', key: 'parentPhone', width: 160, align: 'center' },
          {
            header: "Qarzdorlik summasi (so'm)",
            key: 'balance',
            width: 190,
            isCurrency: true,
            format: (v) => `-${Math.abs(Number(v || 0)).toLocaleString('uz-UZ')} so'm`,
          },
        ],
        debtors,
        {
          title: "EduYuz CRM — Qarzdor O'quvchilar Hisoboti",
          summaryLabel: 'JAMI QARZDORLIK SUMMASI:',
          summaryValue: `-${totalDebt.toLocaleString('uz-UZ')} so'm`,
        }
      );
      return;
    }

    if (activeTab === 'expenses') {
      if (filteredExpenses.length === 0) return alert('Eksport uchun xarajatlar topilmadi');
      const expTotal = filteredExpenses.reduce((acc, e) => acc + Math.abs(Number(e.amount || 0)), 0);
      exportToExcel(
        `EduYuz_Chiqimlar_${today}`,
        [
          { header: 'Xarajat nomi / Maqsadi', key: 'title', width: 240 },
          {
            header: 'Kategoriya',
            key: 'category',
            width: 180,
            format: (v) => CATEGORY_MAP[v]?.label || 'Boshqa xarajat',
          },
          {
            header: "To'lov usuli",
            key: 'paymentMethod',
            width: 140,
            align: 'center',
            format: (v) => METHOD_LABELS[v] || v || 'Naqd pul',
          },
          { header: 'Izoh', key: 'comment', width: 220 },
          {
            header: 'Sana',
            key: 'paidAt',
            width: 130,
            align: 'center',
            format: (v, row) => new Date(v || row.createdAt || new Date()).toLocaleDateString('uz-UZ'),
          },
          {
            header: "Chiqim summasi (so'm)",
            key: 'amount',
            width: 180,
            isCurrency: true,
            format: (v) => `-${Math.abs(Number(v || 0)).toLocaleString('uz-UZ')} so'm`,
          },
        ],
        filteredExpenses,
        {
          title: 'EduYuz CRM — Chiqim va Xarajatlar Hisoboti',
          summaryLabel: 'JAMI XARAJATLAR SUMMASI:',
          summaryValue: `-${expTotal.toLocaleString('uz-UZ')} so'm`,
        }
      );
      return;
    }

    if (activeTab === 'reports') {
      if (teacherStats.length === 0) return alert("O'qituvchilar ma'lumoti topilmadi");
      const totalKpi = teacherStats.reduce((acc, t) => acc + t.kpiSalary, 0);
      exportToExcel(
        `EduYuz_Ustozlar_KPI_${today}`,
        [
          { header: "O'qituvchi F.I.O", key: 'name', width: 240 },
          { header: 'Faol guruhlar soni', key: 'groups', width: 150, align: 'center' },
          { header: "Jami o'quvchilar soni", key: 'students', width: 160, align: 'center' },
          {
            header: "50% KPI Oylik Maosh (so'm)",
            key: 'kpiSalary',
            width: 200,
            isCurrency: true,
            format: (v) => `${Number(v || 0).toLocaleString('uz-UZ')} so'm`,
          },
        ],
        teacherStats,
        {
          title: "EduYuz CRM — O'qituvchilar KPI va Ish Haqi Hisoboti",
          summaryLabel: 'JAMI KPI MAOSH FONDI:',
          summaryValue: `${totalKpi.toLocaleString('uz-UZ')} so'm`,
        }
      );
      return;
    }

    // Default: Kassa va To'lovlar (income)
    if (filteredPayments.length === 0) return alert("Eksport uchun to'lovlar yo'q");
    exportToExcel(
      `EduYuz_Kassa_Tolovlar_${today}`,
      [
        {
          header: "O'quvchi F.I.O",
          key: 'student',
          width: 240,
          format: (_, row) => row.student?.fullName || "Noma'lum o'quvchi",
        },
        {
          header: 'Telefon',
          key: 'phone',
          width: 150,
          align: 'center',
          format: (_, row) => row.student?.phone || row.student?.parentPhone || '—',
        },
        {
          header: "To'lov usuli",
          key: 'paymentMethod',
          width: 150,
          align: 'center',
          format: (v) => METHOD_LABELS[v] || String(v || '').toUpperCase(),
        },
        {
          header: 'Izoh',
          key: 'comment',
          width: 230,
          format: (v) => v || "Kurs to'lovi",
        },
        {
          header: 'Sana',
          key: 'paidAt',
          width: 140,
          align: 'center',
          format: (v) => (v ? new Date(v).toLocaleDateString('uz-UZ') : '—'),
        },
        {
          header: "To'lov miqdori (so'm)",
          key: 'amount',
          width: 190,
          isCurrency: true,
          format: (v) => `+${Number(v || 0).toLocaleString('uz-UZ')} so'm`,
        },
      ],
      filteredPayments,
      {
        title: "EduYuz CRM — Kassa va Kirim To'lovlar Hisoboti",
        summaryLabel: 'JAMI KASSA TUSHUMI:',
        summaryValue: `+${filteredIncomeTotal.toLocaleString('uz-UZ')} so'm`,
      }
    );
  }

  // 6. Hisobotlar va Analitika (6 oylik grafik va O'qituvchilar KPI)
  const months = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyun', 'Iyul', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'];
  const monthlyChart: any[] = [];
  let maxChartVal = 0;

  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const m = d.getMonth();
    const y = d.getFullYear();

    const mIn = positivePayments
      .filter((p) => {
        const pd = new Date(p.paidAt);
        return pd.getMonth() === m && pd.getFullYear() === y;
      })
      .reduce((acc, p) => acc + Number(p.amount || 0), 0);

    const mExp = expenses
      .filter((e) => {
        const ed = new Date(e.paidAt || e.createdAt || new Date());
        return ed.getMonth() === m && ed.getFullYear() === y;
      })
      .reduce((acc, e) => acc + Math.abs(Number(e.amount || 0)), 0);

    if (mIn > maxChartVal) maxChartVal = mIn;
    if (mExp > maxChartVal) maxChartVal = mExp;

    monthlyChart.push({
      name: months[m],
      tushum: mIn,
      xarajat: mExp,
    });
  }

  // O'qituvchilar KPI va o'quvchi soni tahlili
  const teacherStats = teachers
    .map((t: any) => {
      const tGroups = groups.filter((g: any) => g.teacherId === t.id);
      const studentCount = tGroups.reduce(
        (acc: number, g: any) => acc + (g.students?.length || g._count?.students || 0),
        0
      );
      const estimatedRevenue = tGroups.reduce((acc: number, g: any) => {
        const count = g.students?.length || g._count?.students || 0;
        const price = Number(g.course?.price || 400000);
        return acc + count * price;
      }, 0);
      const kpiSalary = Math.round(estimatedRevenue * 0.5); // 50% KPI ulushi
      return {
        name: t.fullName,
        students: studentCount,
        groups: tGroups.length,
        kpiSalary,
      };
    })
    .sort((a, b) => b.students - a.students);

  const totalTeacherStudents = teacherStats.reduce((acc, t) => acc + t.students, 0);

  return (
    <div className="space-y-6 pb-12">
      {/* 1. HEADER BANNER VA TEZKOR TUGMALAR */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900/95 to-indigo-950/60 border border-slate-800/80 p-5 sm:p-7 shadow-2xl">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
              <Wallet size={13} /> Yagona Moliya va Buxgalteriya Markazi
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-2">
              Moliya, Kassa va Hisobotlar
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              Kirim to&apos;lovlar, qarzdorlar nazorati, markaz chiqimlari va moliyaviy analitika bitta oynada.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={exportPaymentsCSV}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition"
            >
              <Download size={15} /> Excel Eksport
            </button>
            <button
              onClick={() => setIsExpModalOpen(true)}
              className="flex items-center gap-2 bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300 px-4 py-2.5 rounded-2xl text-xs font-bold transition"
            >
              <TrendingDown size={15} /> - Chiqim kiritish
            </button>
            <button
              onClick={() => setIsPayModalOpen(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold shadow-lg shadow-emerald-600/25 transition"
            >
              <Plus size={16} /> + To&apos;lov qabul qilish
            </button>
          </div>
        </div>
      </div>

      {/* 2. UMUMIY MOLIYAVIY KO'RSATKICHLAR (4 TA ASOSIY KARTA) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Jami Kirim */}
        <div
          onClick={() => setActiveTab('income')}
          className="cursor-pointer bg-slate-900 border border-slate-800 hover:border-emerald-500/40 rounded-2xl p-5 space-y-2 transition"
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold">Jami Tushum (Kassa Kirim)</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <TrendingUp size={18} />
            </div>
          </div>
          <h3 className="text-2xl font-black text-emerald-400">
            {totalIncome.toLocaleString('uz-UZ')} <span className="text-xs font-normal">so&apos;m</span>
          </h3>
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
            <span>💵 Naqd: {cashIncome.toLocaleString('uz-UZ')}</span>
            <span>💳 Karta: {digitalIncome.toLocaleString('uz-UZ')}</span>
          </div>
        </div>

        {/* Jami Chiqim */}
        <div
          onClick={() => setActiveTab('expenses')}
          className="cursor-pointer bg-slate-900 border border-slate-800 hover:border-rose-500/40 rounded-2xl p-5 space-y-2 transition"
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold">Jami Chiqim (Xarajatlar)</span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <TrendingDown size={18} />
            </div>
          </div>
          <h3 className="text-2xl font-black text-rose-400">
            {totalExpense.toLocaleString('uz-UZ')} <span className="text-xs font-normal">so&apos;m</span>
          </h3>
          <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-800/80">
            Jami {expenses.length} ta xarajat hujjati
          </p>
        </div>

        {/* Sof Foyda */}
        <div
          onClick={() => setActiveTab('reports')}
          className={`cursor-pointer border rounded-2xl p-5 space-y-2 transition ${
            netProfit >= 0
              ? 'bg-gradient-to-br from-slate-900 to-indigo-950/40 border-indigo-500/30'
              : 'bg-gradient-to-br from-slate-900 to-rose-950/40 border-rose-500/30'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span className="font-bold">Haqiqiy Sof Foyda (Qoldiq)</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                netProfit >= 0 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
              }`}
            >
              {netProfit >= 0 ? 'Foydada' : 'Minusda'}
            </span>
          </div>
          <h3 className={`text-2xl font-black ${netProfit >= 0 ? 'text-indigo-400' : 'text-rose-400'}`}>
            {netProfit.toLocaleString('uz-UZ')} <span className="text-xs font-normal">so&apos;m</span>
          </h3>
          <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
            Kirim minus barcha xarajatlar
          </p>
        </div>

        {/* Qarzdorlar */}
        <div
          onClick={() => setActiveTab('debtors')}
          className="cursor-pointer bg-slate-900 border border-amber-500/30 hover:border-amber-500/60 rounded-2xl p-5 space-y-2 transition"
        >
          <div className="flex items-center justify-between text-xs text-amber-300">
            <span className="font-bold">Jami Qarzdorlik</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <AlertCircle size={18} />
            </div>
          </div>
          <h3 className="text-2xl font-black text-amber-400">
            {totalDebt.toLocaleString('uz-UZ')} <span className="text-xs font-normal">so&apos;m</span>
          </h3>
          <p className="text-[11px] text-amber-300/80 pt-1 border-t border-slate-800/80 font-medium">
            {debtors.length} nafar qarzdor o&apos;quvchi → Ko&apos;rish
          </p>
        </div>
      </div>

      {/* 3. 4 TA ICHKI BO'LIM (TAB SWITCHER) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800">
        {[
          { key: 'income', label: "💳 Kassa va To'lovlar", count: positivePayments.length },
          { key: 'debtors', label: '🔴 Qarzdorlar', count: debtors.length },
          { key: 'expenses', label: '📉 Chiqim va Xarajat', count: expenses.length },
          { key: 'reports', label: '📊 Hisobot va KPI', count: null },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as FinanceTab)}
            className={`py-3 px-3 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center justify-center gap-2 ${
              activeTab === tab.key
                ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-lg shadow-purple-600/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== null && (
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full ${
                  activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-300'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: KASSA VA TO'LOVLAR (KIRIM) */}
      {/* ========================================================================= */}
      {activeTab === 'income' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* Qidiruv */}
            <div className="relative md:col-span-2">
              <Search className="absolute left-3.5 top-3 text-slate-500" size={18} />
              <input
                type="text"
                placeholder="O'quvchi ismi bo'yicha qidiruv..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Davr filtri */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-2xl p-1">
              {[
                { k: 'ALL', l: 'Barchasi' },
                { k: 'MONTH', l: 'Shu oy' },
                { k: 'TODAY', l: 'Bugun' },
              ].map((p) => (
                <button
                  key={p.k}
                  onClick={() => setPeriodFilter(p.k as any)}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition ${
                    periodFilter === p.k ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {p.l}
                </button>
              ))}
            </div>

            {/* To'lov usuli filtri */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-2xl px-3 py-2">
              <Filter size={16} className="text-slate-500 mr-2" />
              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                className="w-full bg-transparent text-xs sm:text-sm text-slate-200 focus:outline-none"
              >
                <option value="ALL" className="bg-slate-900">Barcha usullar ({filteredIncomeTotal.toLocaleString()} so&apos;m)</option>
                <option value="cash" className="bg-slate-900">💵 Naqd pul (cash)</option>
                <option value="card" className="bg-slate-900">💳 Plastik karta (card)</option>
                <option value="click" className="bg-slate-900">🔵 Click</option>
                <option value="payme" className="bg-slate-900">🟢 Payme</option>
              </select>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-5 py-3.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 bg-slate-950/40">
              <span className="text-xs font-bold text-slate-300">
                Tanlangan filtr bo&apos;yicha jami: <strong className="text-emerald-400">{filteredIncomeTotal.toLocaleString('uz-UZ')} so&apos;m</strong> ({filteredPayments.length} ta to&apos;lov)
              </span>
              <button
                onClick={handleChargeMonthly}
                disabled={chargingMonthly}
                className="text-xs font-bold text-amber-300 hover:text-amber-200 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl transition"
              >
                ⚡ {chargingMonthly ? 'Hisoblanmoqda...' : "Oylik kurs to'lovini yechish"}
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-medium">
                  <tr>
                    <th className="py-3.5 px-5">O&apos;quvchi</th>
                    <th className="py-3.5 px-5">To&apos;lov miqdori</th>
                    <th className="py-3.5 px-5">To&apos;lov usuli</th>
                    <th className="py-3.5 px-5">Izoh</th>
                    <th className="py-3.5 px-5">Sana</th>
                    <th className="py-3.5 px-5 text-right">Chek</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-500">
                        Yuklanmoqda...
                      </td>
                    </tr>
                  ) : filteredPayments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-500">
                        To&apos;lovlar topilmadi
                      </td>
                    </tr>
                  ) : (
                    filteredPayments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-5 font-semibold text-white">
                          {p.student?.fullName || "Noma'lum"}
                        </td>
                        <td className="py-3.5 px-5 text-emerald-400 font-bold">
                          +{Math.abs(Number(p.amount)).toLocaleString('uz-UZ')} so&apos;m
                        </td>
                        <td className="py-3.5 px-5 uppercase text-xs">
                          <span className="px-2.5 py-1 bg-slate-800 border border-slate-700 text-indigo-300 font-semibold rounded-lg">
                            {p.paymentMethod}
                          </span>
                        </td>
                        <td className="py-3.5 px-5 text-slate-400">{p.comment || '-'}</td>
                        <td className="py-3.5 px-5 text-slate-400">
                          {new Date(p.paidAt).toLocaleDateString('uz-UZ')}
                        </td>
                        <td className="py-3.5 px-5 text-right">
                          <button
                            onClick={() => setReceiptModal(p)}
                            className="px-2.5 py-1.5 text-xs font-bold text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 rounded-xl inline-flex items-center gap-1 transition"
                          >
                            <Receipt size={14} /> Chek
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: QARZDORLAR VA UNDIRISH */}
      {/* ========================================================================= */}
      {activeTab === 'debtors' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
                <AlertCircle className="text-amber-400" size={20} />
                Qarzdor O&apos;quvchilar Ro&apos;yxati ({debtors.length} nafar)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                1 tugma bilan qarzdorlikni qabul qiling yoki ota-onasiga Telegram eslatma yuboring
              </p>
            </div>
            <div className="text-sm font-extrabold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-4 py-2 rounded-xl">
              Jami haqdorlik: {totalDebt.toLocaleString('uz-UZ')} so&apos;m
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-medium">
                <tr>
                  <th className="py-3.5 px-5">O&apos;quvchi F.I.SH</th>
                  <th className="py-3.5 px-5">Telefon / Ota-ona</th>
                  <th className="py-3.5 px-5">Qarz miqdori</th>
                  <th className="py-3.5 px-5 text-right">Tezkor Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {debtors.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-emerald-400 font-semibold">
                      🎉 Ajoyib! Hozirda qarzdor o&apos;quvchilar yo&apos;q!
                    </td>
                  </tr>
                ) : (
                  debtors.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-4 px-5 font-bold text-white">{s.fullName}</td>
                      <td className="py-4 px-5 text-xs text-slate-300">
                        <div>📱 {s.phone || '-'}</div>
                        <div className="text-slate-500">👨‍👩‍👦 Ota-ona: {s.parentPhone || '-'}</div>
                      </td>
                      <td className="py-4 px-5 font-extrabold text-rose-400 text-base">
                        {Number(s.balance).toLocaleString('uz-UZ')} so&apos;m
                      </td>
                      <td className="py-4 px-5 text-right space-x-2 whitespace-nowrap">
                        <button
                          onClick={() => sendTelegramReminder(s)}
                          className="px-3 py-1.5 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-300 text-xs font-bold inline-flex items-center gap-1.5 transition"
                        >
                          <Send size={13} /> Telegram eslatma
                        </button>
                        <button
                          onClick={() => openQuickPayForDebtor(s)}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold inline-flex items-center gap-1.5 transition shadow-md shadow-emerald-600/20"
                        >
                          <CreditCard size={13} /> Qarzni to&apos;lash
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: CHIQIMLAR VA XARAJATLAR */}
      {/* ========================================================================= */}
      {activeTab === 'expenses' && (
        <div className="space-y-5">
          {/* 8 ta Kategoriya kartochkalari */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <PieChart size={16} className="text-indigo-400" />
                Xarajatlarning Toifalar Bo&apos;yicha Taqsimoti
              </h3>
              <button
                onClick={() => setIsExpModalOpen(true)}
                className="text-xs font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1"
              >
                <Plus size={14} /> Yangi xarajat qo&apos;shish
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
              {Object.entries(CATEGORY_MAP).map(([key, cat]) => {
                const amount = categoryTotals[key] || 0;
                const Icon = cat.icon;
                return (
                  <div
                    key={key}
                    onClick={() => setSelectedCategory(selectedCategory === key ? 'all' : key)}
                    className={`cursor-pointer border rounded-xl p-3 text-center space-y-1 transition ${
                      selectedCategory === key
                        ? 'bg-indigo-950/60 border-indigo-500'
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 mx-auto rounded-lg border ${cat.bg} flex items-center justify-center ${cat.color}`}
                    >
                      <Icon size={14} />
                    </div>
                    <span className="text-[10px] text-slate-400 block font-medium truncate">
                      {cat.label}
                    </span>
                    <span className="text-xs font-bold text-white block truncate">
                      {amount.toLocaleString('uz-UZ')}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Qidiruv va Filtr */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3.5 top-3 text-slate-500" size={18} />
              <input
                type="text"
                placeholder="Xarajat nomi yoki izoh bo'yicha qidirish..."
                value={expSearch}
                onChange={(e) => setExpSearch(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full sm:w-auto bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200"
            >
              <option value="all">Barcha toifalar</option>
              {Object.entries(CATEGORY_MAP).map(([key, cat]) => (
                <option key={key} value={key}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Chiqimlar jadvali */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400">
                <tr>
                  <th className="py-3.5 px-5">Xarajat Nomi</th>
                  <th className="py-3.5 px-5">Toifa</th>
                  <th className="py-3.5 px-5">Summa</th>
                  <th className="py-3.5 px-5">Usul</th>
                  <th className="py-3.5 px-5">Sana</th>
                  <th className="py-3.5 px-5 text-right">Amal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      Xarajatlar kiritilmagan
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map((exp) => {
                    const cat = CATEGORY_MAP[exp.category] || CATEGORY_MAP.other;
                    return (
                      <tr key={exp.id} className="hover:bg-slate-800/40">
                        <td className="py-3.5 px-5">
                          <div className="font-bold text-white">{exp.title}</div>
                          {exp.comment && <div className="text-xs text-slate-500">{exp.comment}</div>}
                        </td>
                        <td className="py-3.5 px-5">
                          <span className={`px-2.5 py-1 rounded-lg border text-xs font-semibold ${cat.bg} ${cat.color}`}>
                            {cat.label}
                          </span>
                        </td>
                        <td className="py-3.5 px-5 font-bold text-rose-400">
                          -{Math.abs(Number(exp.amount)).toLocaleString('uz-UZ')} so&apos;m
                        </td>
                        <td className="py-3.5 px-5 uppercase text-xs text-slate-300">
                          {exp.paymentMethod}
                        </td>
                        <td className="py-3.5 px-5 text-slate-400 text-xs">
                          {new Date(exp.paidAt || exp.createdAt || new Date()).toLocaleDateString('uz-UZ')}
                        </td>
                        <td className="py-3.5 px-5 text-right">
                          <button
                            onClick={() => handleDeleteExpense(exp.id, exp.title)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: MOLIYAVIY HISOBOTLAR VA O'QITUVCHILAR KPI */}
      {/* ========================================================================= */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 6 Oylik Dinamika */}
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <BarChart3 size={18} className="text-indigo-400" />
                    Oxirgi 6 Oylik Kirim va Chiqim Dinamikasi
                  </h2>
                  <p className="text-xs text-slate-400">Oylar kesimida real tushum va xarajatlar solishtirmasi</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                    <span className="text-xs text-slate-400">Kirim</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-rose-500"></span>
                    <span className="text-xs text-slate-400">Chiqim</span>
                  </div>
                </div>
              </div>

              <div className="flex-1 flex items-end justify-between gap-3 h-[260px] pt-6 px-2">
                {monthlyChart.map((d, i) => {
                  const inPct = maxChartVal === 0 ? 5 : Math.max((d.tushum / maxChartVal) * 100, 4);
                  const expPct = maxChartVal === 0 ? 5 : Math.max((d.xarajat / maxChartVal) * 100, 4);
                  return (
                    <div key={i} className="flex flex-col items-center flex-1 h-full justify-end">
                      <div className="flex items-end justify-center w-full gap-1.5 h-full">
                        <div
                          className="w-full max-w-[26px] bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-md relative group"
                          style={{ height: `${d.tushum > 0 ? inPct : 2}%` }}
                        >
                          <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-800 text-[10px] text-emerald-300 px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none">
                            {d.tushum.toLocaleString('uz-UZ')}
                          </div>
                        </div>
                        <div
                          className="w-full max-w-[26px] bg-gradient-to-t from-rose-600 to-rose-400 rounded-t-md relative group"
                          style={{ height: `${d.xarajat > 0 ? expPct : 2}%` }}
                        >
                          <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-800 text-[10px] text-rose-300 px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none">
                            {d.xarajat.toLocaleString('uz-UZ')}
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-slate-400 mt-3 font-semibold">{d.name}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* O'qituvchilar KPI va Ulush Hisoblagichi */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Users size={18} className="text-indigo-400" />
                O&apos;qituvchilar Faolligi va KPI (50%)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5 mb-5">
                Guruhlardagi o&apos;quvchilar soni bo&apos;yicha taxminiy oylik ulush
              </p>

              <div className="space-y-4">
                {teacherStats.length === 0 ? (
                  <p className="text-sm text-slate-500">O&apos;qituvchilar topilmadi</p>
                ) : (
                  teacherStats.map((t, i) => {
                    const pct =
                      totalTeacherStudents === 0
                        ? 10
                        : Math.max((t.students / totalTeacherStudents) * 100, 6);
                    return (
                      <div key={i} className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white">
                            {i + 1}. {t.name}
                          </span>
                          <span className="text-xs font-bold text-indigo-400">
                            {t.students} o&apos;quvchi ({t.groups} guruh)
                          </span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full ${COLORS[i % COLORS.length]}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                          <span>Taxminiy 50% KPI ulushi:</span>
                          <strong className="text-emerald-400">
                            {t.kpiSalary.toLocaleString('uz-UZ')} so&apos;m
                          </strong>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: TO'LOV QABUL QILISH */}
      {/* ========================================================================= */}
      {isPayModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-lg font-extrabold text-white">To&apos;lov Qabul Qilish</h2>
              <button onClick={() => setIsPayModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">O&apos;quvchini tanlang</label>
                <select
                  required
                  value={payForm.studentId}
                  onChange={(e) => setPayForm({ ...payForm, studentId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-white"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} (Balans: {Number(s.balance).toLocaleString('uz-UZ')} so&apos;m)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  To&apos;lov miqdori (so&apos;mda)
                </label>
                <input
                  required
                  type="number"
                  placeholder="Masalan: 500000"
                  value={payForm.amount}
                  onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">To&apos;lov usuli</label>
                <select
                  value={payForm.paymentMethod}
                  onChange={(e) => setPayForm({ ...payForm, paymentMethod: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-white"
                >
                  <option value="cash">💵 Naqd pul (cash)</option>
                  <option value="card">💳 Plastik karta (card)</option>
                  <option value="click">🔵 Click</option>
                  <option value="payme">🟢 Payme</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Izoh</label>
                <input
                  type="text"
                  placeholder="Masalan: Oktabr oyi uchun"
                  value={payForm.comment}
                  onChange={(e) => setPayForm({ ...payForm, comment: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPayModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                >
                  Tasdiqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: CHIQIM / XARAJAT KIRITISH */}
      {/* ========================================================================= */}
      {isExpModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-lg font-extrabold text-white">Yangi Chiqim / Xarajat</h2>
              <button onClick={() => setIsExpModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleExpenseSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Xarajat nomi *</label>
                <input
                  required
                  type="text"
                  placeholder="Masalan: Bino ijarasi yoki O'qituvchi maoshi"
                  value={expForm.title}
                  onChange={(e) => setExpForm({ ...expForm, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Toifa</label>
                  <select
                    value={expForm.category}
                    onChange={(e) => setExpForm({ ...expForm, category: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                  >
                    {Object.entries(CATEGORY_MAP).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">To&apos;lov usuli</label>
                  <select
                    value={expForm.paymentMethod}
                    onChange={(e) => setExpForm({ ...expForm, paymentMethod: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                  >
                    <option value="cash">Naqd pul</option>
                    <option value="card">Plastik karta</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Summa (so&apos;mda) *</label>
                <input
                  required
                  type="number"
                  placeholder="Masalan: 1500000"
                  value={expForm.amount}
                  onChange={(e) => setExpForm({ ...expForm, amount: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Izoh</label>
                <input
                  type="text"
                  placeholder="Qo'shimcha ma'lumot..."
                  value={expForm.comment}
                  onChange={(e) => setExpForm({ ...expForm, comment: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsExpModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
                >
                  Chiqimni saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: RASMIY KVITANSIYA (CHEK CHOP ETISH) */}
      {/* ========================================================================= */}
      {receiptModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white text-slate-900 rounded-3xl p-6 w-full max-w-sm space-y-4 shadow-2xl">
            <div className="text-center border-b border-dashed border-slate-300 pb-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 size={28} />
              </div>
              <h3 className="text-lg font-black">EDUYUZ CRM</h3>
              <p className="text-xs text-slate-500">To&apos;lov Kvitansiyasi (Chek #{receiptModal.id?.slice(0, 6)})</p>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">O&apos;quvchi:</span>
                <strong className="font-bold">
                  {receiptModal.student?.fullName ||
                    students.find((s) => s.id === receiptModal.studentId)?.fullName ||
                    "O'quvchi"}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">To&apos;lov usuli:</span>
                <strong className="uppercase">{receiptModal.paymentMethod}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Sana:</span>
                <strong>{new Date(receiptModal.paidAt || new Date()).toLocaleString('uz-UZ')}</strong>
              </div>
              {receiptModal.comment && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Izoh:</span>
                  <strong>{receiptModal.comment}</strong>
                </div>
              )}
              <div className="border-t border-dashed border-slate-300 pt-2 flex justify-between text-sm">
                <span className="font-bold">JAMI TO&apos;LANDI:</span>
                <strong className="text-emerald-600 font-black">
                  {Math.abs(Number(receiptModal.amount)).toLocaleString('uz-UZ')} so&apos;m
                </strong>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <Printer size={14} /> Chop etish
              </button>
              <button
                onClick={() => setReceiptModal(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-200 text-slate-800 text-xs font-bold"
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
