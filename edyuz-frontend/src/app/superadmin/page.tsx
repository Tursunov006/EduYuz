'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  Plus,
  Users,
  Wallet,
  CheckCircle,
  XCircle,
  ArrowLeft,
  ShieldCheck,
  LogOut,
  RefreshCw,
  Search,
  KeyRound,
  Trash2,
  Bot,
  Ban,
  Sparkles,
  Copy,
  Check,
  Clock,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import SubscriptionModal from '@/components/SubscriptionModal';

export default function SuperAdminPage() {
  const [centers, setCenters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);

  // Modal yangi markaz qo'shish uchun
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [centerName, setCenterName] = useState('');
  const [directorPhone, setDirectorPhone] = useState('+998');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successInfo, setSuccessInfo] = useState<any>(null);

  // Telegram Bot Token yangilash modali
  const [isBotModalOpen, setIsBotModalOpen] = useState(false);
  const [newBotToken, setNewBotToken] = useState('');
  const [botSaving, setBotSaving] = useState(false);

  // Tariflar oynasini ko'rish modali
  const [isPreviewPricingOpen, setIsPreviewPricingOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
      return;
    }
    // Bu panel faqat superadmin uchun (server ham buni alohida tekshiradi)
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.role !== 'superadmin') {
        window.location.href = '/';
        return;
      }
    } catch {
      window.location.href = '/login';
      return;
    }
    loadCenters();
  }, []);

  async function loadCenters() {
    setLoading(true);
    try {
      const data = await apiFetch('/centers');
      const filtered = Array.isArray(data)
        ? data.filter((c: any) => c.name !== 'EduYuz System')
        : [];
      setCenters(filtered);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function formatPhone(phone: string) {
    if (!phone) return '-';
    const p = phone.replace(/\D/g, '');
    if (p.startsWith('998') && p.length === 12) {
      return `+998 ${p.slice(3, 5)} ${p.slice(5, 8)} ${p.slice(8, 10)} ${p.slice(10, 12)}`;
    }
    return phone;
  }

  function copyText(text: string) {
    navigator.clipboard.writeText(text);
    setCopiedPhone(text);
    setTimeout(() => setCopiedPhone(null), 1500);
  }

  async function handleCreateCenter(e: React.FormEvent) {
    e.preventDefault();
    if (!centerName.trim() || !directorPhone.trim()) return;

    setIsSubmitting(true);
    try {
      const newCenter = await apiFetch('/centers', {
        method: 'POST',
        body: JSON.stringify({
          name: centerName.trim(),
          phone: directorPhone.trim(),
        }),
      });

      setSuccessInfo({
        name: centerName.trim(),
        id: newCenter.id,
        login: newCenter.directorLogin || directorPhone.trim(),
        // Parol serverda tasodifiy yaratiladi va faqat shu yerda bir marta ko'rsatiladi
        password:
          newCenter.directorPassword ||
          'Yaratilmadi — bu raqam boshqa hisobga biriktirilgan. «Parolni tiklash» tugmasidan foydalaning.',
      });

      setCenterName('');
      setDirectorPhone('+998');
      loadCenters();
    } catch (error: any) {
      alert('Xatolik yuz berdi: ' + (error.message || 'Balki bu raqam oldin kiritilgandir?'));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleToggleStatus(center: any) {
    const currentStatus = center.subscriptionStatus || 'trial';
    const nextStatus = currentStatus === 'expired' ? 'active' : 'expired';
    const confirmMsg =
      nextStatus === 'expired'
        ? `"${center.name}" markazining obunasini BLOKLASHNI tasdiqlaysizmi?`
        : `"${center.name}" markaziga +30 kunlik PRO OBUNA yoqishni tasdiqlaysizmi?`;

    if (!confirm(confirmMsg)) return;

    try {
      await apiFetch(`/centers/${center.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus, days: 30 }),
      });
      loadCenters();
    } catch (err: any) {
      alert('Holatni o‘zgartirishda xatolik: ' + err.message);
    }
  }

  async function handleActivatePro(center: any) {
    try {
      await apiFetch(`/centers/${center.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'active', days: 30 }),
      });
      alert(`"${center.name}" markazi uchun 30 kunlik PRO litsenziya faollashtirildi!`);
      loadCenters();
    } catch (err: any) {
      alert('Xatolik: ' + err.message);
    }
  }

  async function handleResetPassword(center: any) {
    const customPass = prompt(
      `"${center.name}" direktori (${center.phone}) uchun yangi parolni kiriting (kamida 8 belgi).\nBo‘sh qoldirsangiz, tizim tasodifiy xavfsiz parol yaratadi:`,
      '',
    );
    if (customPass === null) return;
    if (customPass.trim() && customPass.trim().length < 8) {
      alert('Parol kamida 8 belgidan iborat bo‘lishi kerak');
      return;
    }

    try {
      const res = await apiFetch(`/centers/${center.id}/reset-password`, {
        method: 'POST',
        body: JSON.stringify(customPass.trim() ? { password: customPass.trim() } : {}),
      });
      alert(
        `Parol yangilandi!\n\nMarkaz: ${center.name}\nLogin: ${res.login}\nYangi parol: ${res.password}`,
      );
    } catch (err: any) {
      alert('Parolni tiklashda xatolik: ' + err.message);
    }
  }

  async function handleDeleteCenter(center: any) {
    if (
      !confirm(
        `DIQQAT! Haqiqatan ham "${center.name}" o‘quv markazini va uning barcha ma’lumotlarini o‘chirib tashlamoqchimisiz?`,
      )
    )
      return;

    try {
      await apiFetch(`/centers/${center.id}`, { method: 'DELETE' });
      loadCenters();
    } catch (err: any) {
      alert('O‘chirishda xatolik: ' + err.message);
    }
  }

  async function handleUpdateBotToken(e: React.FormEvent) {
    e.preventDefault();
    if (!newBotToken.trim().includes(':')) {
      alert('Iltimos, @BotFather bergan to‘g‘ri tokenni kiriting!');
      return;
    }
    setBotSaving(true);
    try {
      const res = await apiFetch('/telegram/set-token', {
        method: 'POST',
        body: JSON.stringify({ token: newBotToken.trim() }),
      });
      alert(res.message || 'Telegram Bot Token muvaffaqiyatli yangilandi!');
      setNewBotToken('');
      setIsBotModalOpen(false);
    } catch (err: any) {
      alert('Xatolik: ' + err.message);
    } finally {
      setBotSaving(false);
    }
  }

  const filteredCenters = centers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.phone && c.phone.includes(search)),
  );

  const activeCentersCount = centers.filter((c) => c.subscriptionStatus !== 'expired').length;
  const totalStudentsAcrossSaaS = centers.reduce(
    (acc, c) => acc + (c._count?.students || 0),
    0,
  );
  const totalGroupsAcrossSaaS = centers.reduce((acc, c) => acc + (c._count?.groups || 0), 0);
  const monthlySaasRevenue = activeCentersCount * 500000;

  return (
    <div className="p-4 sm:p-8 space-y-8 bg-slate-50 min-h-screen text-slate-800 max-w-7xl mx-auto">
      {/* 1. Yuqori Panel: Navigatsiya va Boshqaruv */}
      <div className="relative">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-purple-600/20 text-purple-600 border border-purple-500/30 shadow-sm">
              <ShieldCheck size={28} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-[26px] font-bold text-slate-900 leading-tight">EduYuz SaaS SuperAdmin</h1>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-purple-500/20 text-purple-700 border border-purple-500/30">
                  Dasturchi Paneli
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Mijoz o‘quv markazlarini ochish, litsenziyalarni boshqarish, parollarni tiklash va Bot himoyasi
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/"
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-bold transition"
            >
              <ArrowLeft size={15} /> CRM Panelga O‘tish
            </Link>

            <button
              onClick={() => setIsPreviewPricingOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-700 text-xs font-bold transition cursor-pointer"
            >
              <Sparkles size={16} /> Tariflar Oyna
            </button>

            <button
              onClick={() => setIsBotModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-700 text-xs font-bold transition cursor-pointer"
            >
              <Bot size={16} /> Telegram Bot Token
            </button>

            <button
              onClick={() => {
                setSuccessInfo(null);
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2 text-white px-5 py-2.5 rounded-2xl text-xs font-bold shadow-sm transition active:scale-95 cursor-pointer bg-indigo-600 hover:bg-indigo-500"
            >
              <Plus size={16} /> + Yangi Markaz Qo‘shish
            </button>

            <button
              onClick={() => {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/login';
              }}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-600 text-xs font-bold transition active:scale-95 cursor-pointer"
              title="Tizimdan chiqish"
            >
              <LogOut size={15} /> Chiqish
            </button>
          </div>
        </div>
      </div>

      {/* 2. Statistika Kartochkalari (4 ta) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Jami O‘quv Markazlari</span>
            <Building2 className="text-purple-600" size={18} />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mt-2">{centers.length} ta</h2>
          <p className="text-[11px] text-emerald-600 mt-1 font-semibold">
            {activeCentersCount} ta faol • {centers.length - activeCentersCount} ta bloklangan
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Jami O‘quvchilar (SaaS)</span>
            <Users className="text-cyan-600" size={18} />
          </div>
          <h2 className="text-3xl font-bold text-cyan-600 mt-2">
            {totalStudentsAcrossSaaS} nafar
          </h2>
          <p className="text-[11px] text-slate-500 mt-1">
            Jami {totalGroupsAcrossSaaS} ta faol guruhda
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Oylik SaaS Obuna Tushumi</span>
            <Wallet className="text-emerald-600" size={18} />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-emerald-600 mt-2">
            {monthlySaasRevenue.toLocaleString('uz-UZ')} <span className="text-xs font-normal">so‘m</span>
          </h2>
          <p className="text-[11px] text-slate-500 mt-1">Har bir markaz obunasi: 500,000 so‘m</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Server & Bot Himoyasi</span>
            <CheckCircle className="text-indigo-600" size={18} />
          </div>
          <h2 className="text-xl font-bold text-indigo-600 mt-2 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
            100% Himoyalangan
          </h2>
          <p className="text-[11px] text-slate-500 mt-1">Anti-Webhook & PostgreSQL Cloud</p>
        </div>
      </div>

      {/* 3. Mijoz Markazlar Jadvali */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-5 sm:p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              Mijoz O‘quv Markazlari Boshqaruvi
            </h3>
            <p className="text-xs text-slate-500">
              Har bir markazning litsenziyasi, direktor paroli va bazasini 1-klikda boshqaring
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Markaz nomi yoki telefon..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2.5 rounded-2xl text-xs bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-purple-500 w-60"
              />
            </div>
            <button
              onClick={loadCenters}
              className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer"
              title="Ro‘yxatni yangilash"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[900px]">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 text-xs font-bold uppercase tracking-wider">
              <tr>
                <th className="py-4 px-6">O‘quv Markazi</th>
                <th className="py-4 px-5">Direktor Logini (Tel)</th>
                <th className="py-4 px-5">Baza Hajmi</th>
                <th className="py-4 px-5">Obuna Holati</th>
                <th className="py-4 px-5">Qo‘shilgan Sana</th>
                <th className="py-4 px-6 text-right">Dasturchi Amallari</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-14 text-center text-slate-500 text-xs">
                    Markazlar yuklanmoqda...
                  </td>
                </tr>
              ) : filteredCenters.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-14 text-center text-slate-500 text-xs">
                    Hozircha markazlar topilmadi
                  </td>
                </tr>
              ) : (
                filteredCenters.map((center) => {
                  const status = center.subscriptionStatus || 'trial';
                  const isBlocked = status === 'expired';
                  const isPro = status === 'active';

                  return (
                    <tr key={center.id} className="hover:bg-slate-50 transition">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-2xl text-slate-900 flex items-center justify-center font-bold text-sm shadow-md ${
                              isBlocked
                                ? 'bg-slate-100 text-slate-500'
                                : 'bg-indigo-600'
                            }`}
                          >
                            {center.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{center.name}</div>
                            <div className="text-[11px] text-slate-500 font-mono">
                              ID: {center.id.slice(0, 8)}...
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-5">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs text-slate-700">
                          <span>{formatPhone(center.phone)}</span>
                          <button
                            onClick={() => copyText(center.phone)}
                            className="text-slate-500 hover:text-slate-900 transition cursor-pointer"
                            title="Nusxalash"
                          >
                            {copiedPhone === center.phone ? (
                              <Check size={13} className="text-emerald-600" />
                            ) : (
                              <Copy size={13} />
                            )}
                          </button>
                        </div>
                      </td>

                      <td className="py-4 px-5 text-xs text-slate-600">
                        <div className="font-bold text-slate-900">
                          {center._count?.students || 0} o‘quvchi
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {center._count?.groups || 0} guruh • {center._count?.users || 1} xodim
                        </div>
                      </td>

                      <td className="py-4 px-5">
                        {isBlocked ? (
                          <span className="px-3 py-1 bg-rose-500/10 text-rose-600 rounded-full text-xs font-bold border border-rose-500/20 inline-flex items-center gap-1.5">
                            <XCircle size={13} /> Bloklangan
                          </span>
                        ) : isPro ? (
                          <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 rounded-full text-xs font-bold border border-emerald-500/20 inline-flex items-center gap-1.5">
                            <CheckCircle size={13} /> PRO Faol
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-amber-500/10 text-amber-700 rounded-full text-xs font-bold border border-amber-500/20 inline-flex items-center gap-1.5">
                            <Clock size={13} /> 14-kunlik Trial
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-5 text-slate-500 text-xs">
                        {new Date(center.createdAt).toLocaleDateString('uz-UZ', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>

                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!isPro && (
                            <button
                              onClick={() => handleActivatePro(center)}
                              className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-700 text-xs font-bold transition cursor-pointer"
                              title="30 kunlik PRO litsenziyani yoqish"
                            >
                              + PRO Yoqish
                            </button>
                          )}

                          <button
                            onClick={() => handleResetPassword(center)}
                            className="p-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 text-amber-700 transition cursor-pointer"
                            title="Direktor parolini yangilash"
                          >
                            <KeyRound size={15} />
                          </button>

                          <button
                            onClick={() => handleToggleStatus(center)}
                            className={`p-2 rounded-xl border transition cursor-pointer ${
                              isBlocked
                                ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-600 hover:bg-emerald-500/20'
                                : 'bg-rose-500/10 border-rose-500/25 text-rose-600 hover:bg-rose-500/20'
                            }`}
                            title={isBlocked ? 'Blokdan chiqarish' : 'Markazni bloklash'}
                          >
                            <Ban size={15} />
                          </button>

                          <button
                            onClick={() => handleDeleteCenter(center)}
                            className="p-2 rounded-xl bg-slate-100 hover:bg-rose-600/20 border border-slate-300 hover:border-rose-500/40 text-slate-500 hover:text-rose-600 transition cursor-pointer"
                            title="Markazni butunlay o‘chirish"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Yangi Markaz Qo'shish Modali */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 w-full max-w-lg shadow-sm text-slate-800">
            {!successInfo ? (
              <>
                <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-5">
                  <div className="flex items-center gap-2 font-bold text-lg text-slate-900">
                    <Building2 className="text-purple-600" size={22} />
                    <span>Yangi O‘quv Markazini Ochish</span>
                  </div>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="text-slate-500 hover:text-slate-900"
                  >
                    
                  </button>
                </div>

                <form onSubmit={handleCreateCenter} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      O‘quv Markazi Nomi *
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="Masalan: Registon Ta'lim Markazi"
                      value={centerName}
                      onChange={(e) => setCenterName(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      Direktor Telefon Raqami (Login uchun) *
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="+998901234567"
                      value={directorPhone}
                      onChange={(e) => setDirectorPhone(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-purple-500"
                    />
                    <p className="text-[11px] text-slate-500 mt-1.5">
                      Tizim ushbu raqam uchun <b>tasodifiy boshlang‘ich parol</b> yaratadi va uni keyingi oynada bir marta ko‘rsatadi.
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2.5 rounded-2xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-600"
                    >
                      Bekor qilish
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-6 py-2.5 rounded-2xl text-white text-xs font-bold shadow-sm transition disabled:opacity-50 bg-indigo-600 hover:bg-indigo-500"
                    >
                      {isSubmitting ? 'Yaratilmoqda...' : 'Markaz va Login Yaratish'}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="space-y-5">
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-500/30">
                    <CheckCircle size={28} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">
                    &ldquo;{successInfo.name}&rdquo; Muvaffaqiyatli Yaratildi! 
                  </h3>
                  <p className="text-xs text-slate-500">
                    Ushbu kirish ma&apos;lumotlarini o‘quv markaz direktoriga yuboring:
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5 font-mono text-xs">
                  <div className="flex justify-between items-center py-1 border-b border-slate-200">
                    <span className="text-slate-500">Kirish manzili:</span>
                    <span className="text-indigo-600 font-bold">https://eduyuz.uz/login</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-200">
                    <span className="text-slate-500">Login (Telefon):</span>
                    <span className="text-slate-900 font-bold">{successInfo.login}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-200">
                    <span className="text-slate-500">Boshlang‘ich Parol:</span>
                    <span className="text-emerald-600 font-bold">{successInfo.password}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-500">Litsenziya:</span>
                    <span className="text-amber-700 font-bold">14-kunlik Bepul Sinov (Free Trial)</span>
                  </div>
                </div>

                <button
                  onClick={() => setIsModalOpen(false)}
                  className="w-full py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition"
                >
                  Tushunarli, Yopish
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. Telegram Bot Tokenni Yangilash Modali */}
      {isBotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 w-full max-w-md shadow-sm space-y-5 text-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2 font-bold text-base text-slate-900">
                <Bot className="text-cyan-600" size={20} />
                <span>Telegram Bot Tokenni Yangilash</span>
              </div>
              <button
                onClick={() => setIsBotModalOpen(false)}
                className="text-slate-500 hover:text-slate-900"
              >
                
              </button>
            </div>

            <form onSubmit={handleUpdateBotToken} className="space-y-4">
              <p className="text-xs text-slate-500 leading-relaxed">
                Agar <b>@BotFather</b> orqali <code>/revoke</code> qilib yangi token olgan bo‘lsangiz (begona reklamalarni uzish uchun), yangi tokenni shu yerga kiriting:
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">
                  Yangi Bot Token (@BotFather)
                </label>
                <input
                  required
                  type="text"
                  placeholder="Masalan: 123456789:AAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  value={newBotToken}
                  onChange={(e) => setNewBotToken(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsBotModalOpen(false)}
                  className="px-4 py-2.5 rounded-2xl bg-slate-100 text-slate-600 text-xs font-bold"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={botSaving}
                  className="px-5 py-2.5 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-sm"
                >
                  {botSaving ? 'Ulanmoqda...' : 'Tokenni Saqlash va Himoyalash'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. 14 kundan keyin chiqadigan Tariflar Ro'yxati oynasini ko'rish */}
      <SubscriptionModal
        isOpen={isPreviewPricingOpen}
        isExpired={false}
        daysLeft={14}
        centerName="EduYuz SaaS Demo"
        onClose={() => setIsPreviewPricingOpen(false)}
      />
    </div>
  );
}
