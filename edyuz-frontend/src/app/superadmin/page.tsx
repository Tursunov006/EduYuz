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
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';
import { apiFetch } from '@/lib/api';

export default function SuperAdminPage() {
  const [centers, setCenters] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalCenters: 0, totalIncome: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal yangi markaz qo'shish uchun
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [centerName, setCenterName] = useState('');
  const [directorPhone, setDirectorPhone] = useState('+998');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successInfo, setSuccessInfo] = useState<any>(null);

  useEffect(() => {
    // Auth tekshiruvi: agar login qilinmagan bo'lsa login sahifasiga qaytarish
    const token = localStorage.getItem('token');
    if (!token) {
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
      setStats({
        totalCenters: filtered.length,
        totalIncome: filtered.length * 500000, // Misol uchun har bir markaz 500k to'laydi
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function formatPhone(phone: string) {
    if (!phone) return '-';
    let p = phone.replace(/\D/g, '');
    if (p.startsWith('998') && p.length === 12) {
      return `+998 ${p.slice(3, 5)} ${p.slice(5, 8)} ${p.slice(8, 10)} ${p.slice(10, 12)}`;
    }
    return phone;
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
          phone: directorPhone.trim() 
        })
      });

      setSuccessInfo({
        name: centerName.trim(),
        id: newCenter.id,
        login: directorPhone.trim(),
        password: 'admin123',
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

  const filteredCenters = centers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone && c.phone.includes(search))
  );

  return (
    <div className="p-4 sm:p-8 space-y-8 bg-slate-950 min-h-screen text-slate-100 max-w-7xl mx-auto">
      {/* Yuqori Panel: Navigatsiya va Boshqaruv */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition"
              title="CRM Boshqaruv Paneliga qaytish"
            >
              <ArrowLeft size={18} />
            </Link>
            <div className="p-2 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
                EduYuz SaaS SuperAdmin
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Dasturchi Paneli
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Barcha mijoz o‘quv markazlarini yaratish, litsenziyalarni boshqarish va SaaS monitoringi
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition"
          >
            ← Boshqaruv Paneli
          </Link>
          <button
            onClick={() => {
              setSuccessInfo(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-purple-600/25 transition active:scale-95 cursor-pointer"
          >
            <Plus size={16} /> Yangi Markaz Qo‘shish
          </button>
        </div>
      </div>

      {/* Statistika Kartochkalari */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Jami O‘quv Markazlari</span>
            <Building2 className="text-purple-400" size={18} />
          </div>
          <h2 className="text-3xl font-black text-white mt-2">{stats.totalCenters} ta</h2>
          <p className="text-[11px] text-slate-500 mt-1">Platformada ro‘yxatdan o‘tgan</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Oylik SaaS Tushum</span>
            <Wallet className="text-emerald-400" size={18} />
          </div>
          <h2 className="text-3xl font-black text-emerald-400 mt-2">
            {stats.totalIncome.toLocaleString('uz-UZ')} so‘m
          </h2>
          <p className="text-[11px] text-slate-500 mt-1">Markazlar obunasi bo‘yicha</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Tizim va Server Holati</span>
            <CheckCircle className="text-indigo-400" size={18} />
          </div>
          <h2 className="text-2xl font-bold text-indigo-400 mt-2 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            100% Faol & Barqaror
          </h2>
          <p className="text-[11px] text-slate-500 mt-1">Supabase + Render Cloud</p>
        </div>
      </div>

      {/* Mijozlar Jadvali */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-white">Mijoz O‘quv Markazlari Ro‘yxati</h3>
            <p className="text-xs text-slate-400">Har bir markaz uchun alohida ma'lumotlar bazasi va direktor hisobi</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Markaz nomi yoki tel..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 rounded-xl text-xs bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>
            <button
              onClick={loadCenters}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              title="Yangilash"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800 text-xs font-semibold">
              <tr>
                <th className="py-4 px-6">Markaz Nomi</th>
                <th className="py-4 px-6">Direktor Telefoni</th>
                <th className="py-4 px-6">Holati</th>
                <th className="py-4 px-6">Qo‘shilgan Sana</th>
                <th className="py-4 px-6 text-right">Kompaniya ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500 text-xs">
                    Yuklanmoqda...
                  </td>
                </tr>
              ) : filteredCenters.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500 text-xs">
                    Hozircha markazlar mavjud emas
                  </td>
                </tr>
              ) : (
                filteredCenters.map((center) => (
                  <tr key={center.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-4 px-6 font-bold text-white flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-md">
                        {center.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-white">{center.name}</div>
                        <div className="text-[11px] text-slate-500 font-normal">SaaS Client</div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-slate-300 font-mono text-xs">
                      {formatPhone(center.phone)}
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-[11px] font-semibold border border-emerald-500/20 inline-flex items-center gap-1.5">
                        <CheckCircle size={13} /> Faol
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-400 text-xs">
                      {new Date(center.createdAt).toLocaleDateString('uz-UZ', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="py-4 px-6 text-right font-mono text-xs text-slate-500 truncate max-w-[120px]">
                      {center.id.slice(0, 8)}...
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Yangi Markaz Qo'shish Modali */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 w-full max-w-lg shadow-2xl text-slate-100">
            {!successInfo ? (
              <>
                <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
                  <div className="flex items-center gap-2 font-bold text-lg text-white">
                    <Building2 className="text-purple-400" size={22} />
                    <span>Yangi O‘quv Markazini Ro‘yxatdan O‘tkazish</span>
                  </div>
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleCreateCenter} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      O‘quv Markazi Nomi *
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="Masalan: Cambridge Education"
                      value={centerName}
                      onChange={(e) => setCenterName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Direktor Telefon Raqami (Login uchun) *
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="+998901234567"
                      value={directorPhone}
                      onChange={(e) => setDirectorPhone(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-purple-500"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      Ushbu raqam orqali direktor platformaga kiradi.
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300"
                    >
                      Bekor qilish
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-600/30 transition disabled:opacity-50"
                    >
                      {isSubmitting ? 'Yaratilmoqda...' : 'Markazni Yaratish'}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="space-y-5">
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
                    <CheckCircle size={28} />
                  </div>
                  <h3 className="text-lg font-bold text-white">
                    "{successInfo.name}" Muvaffaqiyatli Qo‘shildi! 🎉
                  </h3>
                  <p className="text-xs text-slate-400">
                    Ushbu ma'lumotlarni mijozga (o‘quv markaz direktoriga) yuboring:
                  </p>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2.5 font-mono text-xs">
                  <div className="flex justify-between items-center py-1 border-b border-slate-900">
                    <span className="text-slate-500">Sayt manzili:</span>
                    <span className="text-indigo-400 font-bold">https://eduyuz.uz</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-900">
                    <span className="text-slate-500">Login (Telefon):</span>
                    <span className="text-white font-bold">{successInfo.login}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-900">
                    <span className="text-slate-500">Parol (Vaqtincha):</span>
                    <span className="text-emerald-400 font-bold">{successInfo.password}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-500">Markaz ID:</span>
                    <span className="text-slate-300 truncate max-w-[180px]">{successInfo.id}</span>
                  </div>
                </div>

                <button
                  onClick={() => setIsModalOpen(false)}
                  className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition"
                >
                  Tushunarli, Yopish
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
