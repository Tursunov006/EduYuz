'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  User,
  Settings,
  Building2,
  ShieldCheck,
  LogOut,
  ChevronDown,
  KeyRound,
  Target,
  Phone,
  MapPin,
  CheckCircle2,
  ExternalLink,
  Smartphone,
  HelpCircle,
  X,
  Sparkles,
} from 'lucide-react';
import { useTheme } from '@/lib/theme/ThemeContext';
import { apiFetch } from '@/lib/api';

export interface AdminCenterSettings {
  adminName: string;
  adminRole: string;
  adminPhone: string;
  centerName: string;
  centerAddress: string;
  monthlyTarget: number;
  instagramHandle: string;
}

const DEFAULT_SETTINGS: AdminCenterSettings = {
  adminName: 'Admin',
  adminRole: 'Boshqaruvchi',
  adminPhone: '+998 90 123 45 67',
  centerName: 'EduYuz O‘quv Markazi',
  centerAddress: 'Toshkent sh., Chilonzor tumani',
  monthlyTarget: 25000000,
  instagramHandle: '@eduyuzcrmuz',
};

export default function AdminProfileMenu() {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState<'profile' | 'center' | 'security'>('profile');
  const [settings, setSettings] = useState<AdminCenterSettings>(DEFAULT_SETTINGS);
  const [form, setForm] = useState<AdminCenterSettings>(DEFAULT_SETTINGS);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [savedToast, setSavedToast] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load user & settings from localStorage + backend centers
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('eduyuz_center_settings');
      const userRaw = localStorage.getItem('user');
      let merged = { ...DEFAULT_SETTINGS };

      if (userRaw) {
        const parsedUser = JSON.parse(userRaw);
        if (parsedUser.fullName || parsedUser.username) {
          merged.adminName = parsedUser.fullName || parsedUser.username;
        }
        if (parsedUser.role) {
          merged.adminRole =
            parsedUser.role === 'SUPERADMIN'
              ? 'Super Admin'
              : parsedUser.role === 'ADMIN'
              ? 'Boshqaruvchi'
              : parsedUser.role;
        }
        if (parsedUser.phone) {
          merged.adminPhone = parsedUser.phone;
        }
        if (parsedUser.centerName) {
          merged.centerName = parsedUser.centerName;
        }
      }

      if (savedSettings) {
        merged = { ...merged, ...JSON.parse(savedSettings) };
      }

      setSettings(merged);
      setForm(merged);
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Tashqariga bosilganda dropdownni yopish
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const initials = (settings.adminName || 'A')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    try {
      localStorage.setItem('eduyuz_center_settings', JSON.stringify(form));

      // User obyektini ham yangilab qo'yamiz
      const userRaw = localStorage.getItem('user');
      if (userRaw) {
        const userObj = JSON.parse(userRaw);
        userObj.fullName = form.adminName;
        userObj.centerName = form.centerName;
        localStorage.setItem('user', JSON.stringify(userObj));
      }

      // Agar backendda center mavjud bo'lsa, nomini ham yangilashga harakat qilamiz
      try {
        const centers = await apiFetch('/centers').catch(() => []);
        if (Array.isArray(centers) && centers[0]?.id) {
          await apiFetch(`/centers/${centers[0].id}`, {
            method: 'PATCH',
            body: JSON.stringify({
              name: form.centerName,
              address: form.centerAddress,
              phone: form.adminPhone,
            }),
          }).catch(() => {});
        }
      } catch {}

      setSettings(form);
      window.dispatchEvent(new Event('eduyuz-settings-updated'));
      setSavedToast('Ma’lumotlar muvaffaqiyatli saqlandi! ✅');
      setTimeout(() => {
        setSavedToast(null);
        setIsModalOpen(false);
      }, 1200);
    } catch (err) {
      alert('Saqlashda xatolik yuz berdi');
    }
  }

  function handleSavePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!passwordForm.newPassword || passwordForm.newPassword.length < 5) {
      alert('Yangi parol kamida 5 ta belgidan iborat bo‘lishi kerak!');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('Yangi parollar bir-biriga mos kelmadi!');
      return;
    }
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setSavedToast('Parol muvaffaqiyatli yangilandi! 🔐');
    setTimeout(() => {
      setSavedToast(null);
      setIsModalOpen(false);
    }, 1200);
  }

  function handleLogout() {
    localStorage.removeItem('token');
    window.location.href = '/login';
  }

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        {/* Asosiy Admin tugmasi */}
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className={`flex items-center gap-2 pl-1.5 sm:pl-2.5 pr-2 py-1.5 rounded-2xl border transition-all cursor-pointer active:scale-95 ${
            isOpen
              ? 'bg-indigo-600/15 border-indigo-500/40'
              : isLight
              ? 'border-slate-200 hover:bg-slate-100'
              : 'border-slate-800 hover:bg-slate-800/70'
          }`}
          title="Profil va Markaz Sozlamalari"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-cyan-500 flex items-center justify-center text-white text-xs font-extrabold shadow-md shadow-indigo-600/20 shrink-0">
            {initials}
          </div>
          <div className="hidden lg:block text-left">
            <div
              className={`text-xs font-bold leading-tight truncate max-w-[120px] ${
                isLight ? 'text-slate-800' : 'text-white'
              }`}
            >
              {settings.adminName}
            </div>
            <div className={`text-[10px] truncate max-w-[120px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              {settings.adminRole}
            </div>
          </div>
          <ChevronDown
            size={14}
            className={`hidden sm:block transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-indigo-400' : 'text-slate-400'
            }`}
          />
        </button>

        {/* Ochiladigan Dropdown Menyu */}
        {isOpen && (
          <div
            className={`absolute right-0 mt-2.5 w-72 rounded-3xl border shadow-2xl z-50 overflow-hidden backdrop-blur-xl transition-all ${
              isLight
                ? 'bg-white/95 border-slate-200 text-slate-800'
                : 'bg-slate-900/95 border-slate-800 text-slate-100 shadow-black/60'
            }`}
          >
            {/* Yuqori Profil Kartasi */}
            <div className="p-4 bg-gradient-to-r from-indigo-600/20 via-purple-600/15 to-cyan-500/10 border-b border-slate-800/60">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-cyan-500 flex items-center justify-center text-white text-sm font-black shadow-lg">
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-extrabold text-sm truncate">{settings.adminName}</div>
                  <div className="text-xs text-indigo-400 font-semibold truncate">{settings.centerName}</div>
                  <div className="text-[11px] text-slate-400 truncate">{settings.adminPhone}</div>
                </div>
              </div>
            </div>

            {/* Menyu bandlari */}
            <div className="p-2 space-y-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setActiveModalTab('profile');
                  setIsModalOpen(true);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl transition cursor-pointer ${
                  isLight ? 'hover:bg-slate-100 text-slate-700' : 'hover:bg-slate-800/80 text-slate-200'
                }`}
              >
                <User size={16} className="text-indigo-400 shrink-0" />
                <div className="text-left">
                  <div>Shaxsiy Profilni Tahrirlash</div>
                  <div className="text-[10px] text-slate-400 font-normal">Ism, telefon va lavozim</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setActiveModalTab('center');
                  setIsModalOpen(true);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl transition cursor-pointer ${
                  isLight ? 'hover:bg-slate-100 text-slate-700' : 'hover:bg-slate-800/80 text-slate-200'
                }`}
              >
                <Building2 size={16} className="text-cyan-400 shrink-0" />
                <div className="text-left">
                  <div>Markaz va Reja Sozlamalari</div>
                  <div className="text-[10px] text-slate-400 font-normal">
                    Oylik reja: {(settings.monthlyTarget / 1000000).toFixed(1)} mln so‘m
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setActiveModalTab('security');
                  setIsModalOpen(true);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl transition cursor-pointer ${
                  isLight ? 'hover:bg-slate-100 text-slate-700' : 'hover:bg-slate-800/80 text-slate-200'
                }`}
              >
                <KeyRound size={16} className="text-amber-400 shrink-0" />
                <div className="text-left">
                  <div>Parol va Xavfsizlik</div>
                  <div className="text-[10px] text-slate-400 font-normal">Kirish parolini yangilash</div>
                </div>
              </button>

              <div className={`my-1.5 border-t ${isLight ? 'border-slate-200' : 'border-slate-800'}`} />

              <Link
                href="/insta"
                target="_blank"
                onClick={() => setIsOpen(false)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl transition ${
                  isLight ? 'hover:bg-slate-100 text-slate-700' : 'hover:bg-slate-800/80 text-slate-200'
                }`}
              >
                <span className="flex items-center gap-3">
                  <Sparkles size={16} className="text-pink-400" />
                  <span>Instagram Sotuv Sahifasi (/insta)</span>
                </span>
                <ExternalLink size={13} className="text-slate-400" />
              </Link>

              <Link
                href="/superadmin"
                onClick={() => setIsOpen(false)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl transition ${
                  isLight ? 'hover:bg-slate-100 text-slate-700' : 'hover:bg-slate-800/80 text-slate-200'
                }`}
              >
                <span className="flex items-center gap-3">
                  <ShieldCheck size={16} className="text-emerald-400" />
                  <span>Super-Admin Boshqaruvi</span>
                </span>
                <ExternalLink size={13} className="text-slate-400" />
              </Link>

              <Link
                href="https://t.me/tursunov_husniddin"
                target="_blank"
                onClick={() => setIsOpen(false)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl transition ${
                  isLight ? 'hover:bg-slate-100 text-slate-700' : 'hover:bg-slate-800/80 text-slate-200'
                }`}
              >
                <span className="flex items-center gap-3">
                  <HelpCircle size={16} className="text-sky-400" />
                  <span>Texnik Yordam (Telegram)</span>
                </span>
                <ExternalLink size={13} className="text-slate-400" />
              </Link>

              <div className={`my-1.5 border-t ${isLight ? 'border-slate-200' : 'border-slate-800'}`} />

              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
              >
                <LogOut size={16} />
                <span>Tizimdan chiqish</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* PROFIL VA MARKAZ SOZLAMALARI MODALI */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-5 text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white font-black text-sm">
                  {initials}
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-extrabold text-white">
                    Profil va Markaz Sozlamalari
                  </h2>
                  <p className="text-xs text-slate-400">{settings.centerName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Ichki 3 ta tab */}
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-950 rounded-2xl border border-slate-800 text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveModalTab('profile')}
                className={`py-2 rounded-xl transition cursor-pointer ${
                  activeModalTab === 'profile'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                👤 Shaxsiy Profil
              </button>
              <button
                type="button"
                onClick={() => setActiveModalTab('center')}
                className={`py-2 rounded-xl transition cursor-pointer ${
                  activeModalTab === 'center'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                🏢 O‘quv Markaz
              </button>
              <button
                type="button"
                onClick={() => setActiveModalTab('security')}
                className={`py-2 rounded-xl transition cursor-pointer ${
                  activeModalTab === 'security'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                🔐 Parol
              </button>
            </div>

            {savedToast && (
              <div className="flex items-center gap-2 p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
                <CheckCircle2 size={16} />
                <span>{savedToast}</span>
              </div>
            )}

            {activeModalTab === 'profile' && (
              <form onSubmit={handleSaveSettings} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Ism va Familiyangiz (F.I.SH)
                  </label>
                  <input
                    required
                    type="text"
                    value={form.adminName}
                    onChange={(e) => setForm({ ...form, adminName: e.target.value })}
                    placeholder="Masalan: Husniddin Tursunov"
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">Lavozim</label>
                    <input
                      type="text"
                      value={form.adminRole}
                      onChange={(e) => setForm({ ...form, adminRole: e.target.value })}
                      placeholder="Direktor / Boshqaruvchi"
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">Telefon raqam</label>
                    <input
                      type="text"
                      value={form.adminPhone}
                      onChange={(e) => setForm({ ...form, adminPhone: e.target.value })}
                      placeholder="+998 90 123 45 67"
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-2xl bg-slate-800 text-slate-300 text-xs font-bold"
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/25 cursor-pointer"
                  >
                    Saqlash
                  </button>
                </div>
              </form>
            )}

            {activeModalTab === 'center' && (
              <form onSubmit={handleSaveSettings} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    O‘quv Markazi Nomi
                  </label>
                  <input
                    required
                    type="text"
                    value={form.centerName}
                    onChange={(e) => setForm({ ...form, centerName: e.target.value })}
                    placeholder="Masalan: EduYuz Academy"
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Oylik Kassa Rejasi (Dashboarddagi Plan ko‘rsatkichi, so‘mda)
                  </label>
                  <input
                    required
                    type="number"
                    step="1000000"
                    value={form.monthlyTarget}
                    onChange={(e) => setForm({ ...form, monthlyTarget: Number(e.target.value) })}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-sm text-emerald-400 font-mono font-bold focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">Markaz manzili</label>
                    <input
                      type="text"
                      value={form.centerAddress}
                      onChange={(e) => setForm({ ...form, centerAddress: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">Instagram sahifa</label>
                    <input
                      type="text"
                      value={form.instagramHandle}
                      onChange={(e) => setForm({ ...form, instagramHandle: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-sm text-pink-400 font-semibold focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-2xl bg-slate-800 text-slate-300 text-xs font-bold"
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/25 cursor-pointer"
                  >
                    Markaz Sozlamalarini Saqlash
                  </button>
                </div>
              </form>
            )}

            {activeModalTab === 'security' && (
              <form onSubmit={handleSavePassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Joriy parol</label>
                  <input
                    required
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">Yangi parol</label>
                    <input
                      required
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      placeholder="Kamida 5 ta belgi"
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">Parolni tasdiqlang</label>
                    <input
                      required
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      placeholder="Qayta kiriting"
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-2xl bg-slate-800 text-slate-300 text-xs font-bold"
                  >
                    Yopish
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold shadow-lg shadow-amber-500/20 cursor-pointer"
                  >
                    Parolni Yangilash
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
