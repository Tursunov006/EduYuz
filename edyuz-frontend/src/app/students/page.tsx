'use client';

import { useEffect, useState } from 'react';
import { Plus, Search, Phone, Edit2, Trash2, Download, Send, Smartphone, MessageSquare, FileSpreadsheet } from 'lucide-react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import axios from 'axios';
import { useTranslation } from '@/lib/i18n/LanguageContext';
import { exportToExcel } from '@/lib/excelExport';

export default function StudentsPage() {
  const { t } = useTranslation();
  const [students, setStudents] = useState<any[]>([]);
  const [centers, setCenters] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null);

  // Forma ma'lumotlari
  const [form, setForm] = useState({
    centerId: '',
    fullName: '',
    phone: '',
    parentPhone: '',
    balance: 0,
    status: 'active',
  });

  async function fetchStudents() {
    try {
      setLoading(true);
      const data = await apiFetch(`/students${search ? `?search=${search}` : ''}`);
      setStudents(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStudents();
  }, [search]);

  useEffect(() => {
    apiFetch('/centers').then((res) => {
      setCenters(res || []);
      if (res && res.length > 0) setForm((f) => ({ ...f, centerId: res[0].id }));
    }).catch(() => {});
  }, []);

  function handleOpenCreate() {
    setEditingStudent(null);
    setForm({
      centerId: centers[0]?.id || '',
      fullName: '',
      phone: '',
      parentPhone: '',
      balance: 0,
      status: 'active',
    });
    setIsModalOpen(true);
  }

  function handleOpenEdit(student: any) {
    setEditingStudent(student);
    setForm({
      centerId: student.centerId || centers[0]?.id || '',
      fullName: student.fullName,
      phone: student.phone || '',
      parentPhone: student.parentPhone,
      balance: Number(student.balance) || 0,
      status: student.status || 'active',
    });
    setIsModalOpen(true);
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Haqiqatan ham "${name}"ni o'chirmoqchimisiz?`)) return;
    try {
      await apiFetch(`/students/${id}`, { method: 'DELETE' });
      fetchStudents();
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editingStudent) {
        await apiFetch(`/students/${editingStudent.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            fullName: form.fullName,
            phone: form.phone,
            parentPhone: form.parentPhone,
            balance: Number(form.balance),
            status: form.status,
          }),
        });
      } else {
        await apiFetch('/students', {
          method: 'POST',
          body: JSON.stringify({
            ...form,
            balance: Number(form.balance),
          }),
        });
      }
      setIsModalOpen(false);
      fetchStudents();
    } catch (err: any) {
      alert(err.message);
    }
  }

  function handleExportExcel() {
    if (students.length === 0) return alert(t('dash.exportExcel', 'Eksport qilish uchun ma’lumot topilmadi'));
    exportToExcel(
      `EduYuz_Oquvchilar_${new Date().toISOString().split('T')[0]}`,
      [
        { header: 'ID', key: 'id' },
        { header: t('students.name', 'F.I.SH'), key: 'fullName' },
        { header: t('students.phone', 'Telefon'), key: 'phone' },
        { header: 'Ota-ona telefoni', key: 'parentPhone' },
        { header: t('students.balance', 'Balans'), key: 'balance', format: (val) => `${val || 0} so'm` },
        { header: t('students.coins', 'EduCoins'), key: 'coins', format: (val) => val || 0 },
        { header: t('students.status', 'Holat'), key: 'status' },
      ],
      students
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('students.title', 'O‘quvchilar Bazasi')}</h1>
          <p className="text-slate-400 mt-1">O‘quvchilar ro‘yxati, aloqa raqamlari va hisob balansi</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 px-4 py-2.5 rounded-xl text-sm font-semibold transition shadow-sm active:scale-95"
            title="Excel formatida yuklab olish"
          >
            <FileSpreadsheet size={16} /> {t('dash.exportExcel', 'Excel (.xlsx)')}
          </button>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium shadow-lg shadow-indigo-600/20 transition-all"
          >
            <Plus size={18} /> {t('students.add', 'Yangi o‘quvchi')}
          </button>
        </div>
      </div>

      {/* Qidiruv */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-3 text-slate-500" size={18} />
        <input
          type="text"
          placeholder={t('students.search', 'Ism yoki telefon orqali qidirish...')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 text-slate-100 placeholder-slate-500"
        />
      </div>

      {/* Jadval */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-medium">
            <tr>
              <th className="py-4 px-5">{t('students.name', 'F.I.SH')}</th>
              <th className="py-4 px-5">{t('students.phone', 'Telefon')}</th>
              <th className="py-4 px-5">Ota-ona telefoni</th>
              <th className="py-4 px-5">{t('students.balance', 'Balans')}</th>
              <th className="py-4 px-5">{t('students.status', 'Holat')}</th>
              <th className="py-4 px-5 text-right">{t('students.actions', 'Amallar')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {loading ? (
              <tr><td colSpan={6} className="py-12 text-center text-slate-500">Yuklanmoqda...</td></tr>
            ) : students.length === 0 ? (
              <tr><td colSpan={6} className="py-12 text-center text-slate-500">O'quvchilar topilmadi</td></tr>
            ) : (
              students.map((s) => (
                <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-4 px-5 font-semibold text-white">{s.fullName}</td>
                  <td className="py-4 px-5 text-slate-300">{s.phone || '-'}</td>
                  <td className="py-4 px-5 text-slate-300">
                    <div className="flex flex-col">
                      <span className="inline-flex items-center gap-1.5">
                        <Phone size={14} className="text-slate-500" />
                        {s.parentPhone || '-'}
                      </span>
                      {s.parentChatId ? (
                        <span className="text-[11px] text-sky-400 inline-flex items-center gap-1 mt-0.5 font-medium">
                          <Send size={11} /> Telegram faol
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-500 mt-0.5">
                          Telegram ulanmagan
                        </span>
                      )}
                    </div>
                  </td>
                  <td className={`py-4 px-5 font-semibold ${Number(s.balance) < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {Number(s.balance).toLocaleString()} so'm
                  </td>
                  <td className="py-4 px-5">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      s.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}>
                      {s.status === 'active' ? 'Faol' : 'Nofaol'}
                    </span>
                  </td>
                  <td className="py-4 px-5 text-right">
                    <div className="inline-flex items-center gap-2">
                      <Link
                        href={`/portal?studentId=${s.id}`}
                        target="_blank"
                        title="O'quvchi kabinetini ochish (Portal)"
                        className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition"
                      >
                        <Smartphone size={16} />
                      </Link>
                      <button
                        onClick={() => {
                          const botUser = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'Edyuz_crmbot';
                          const link = `https://t.me/${botUser}?start=student_${s.id}`;
                          navigator.clipboard.writeText(link);
                          alert(`Ota-ona uchun Telegram Bot havolasi nusxalandi:\n${link}\n\nUshbu havolani ota-onaga yuborsangiz, ular botga kirib /start bosishi bilan tizimga avtomatik ulanadi!`);
                        }}
                        title="Telegram Botga ulash havolasi"
                        className="p-1.5 text-slate-400 hover:text-sky-400 hover:bg-sky-500/10 rounded-lg transition"
                      >
                        <Send size={16} />
                      </button>
                      <button
                        onClick={async () => {
                          if (!s.parentPhone) return alert("Ota-ona telefon raqami kiritilmagan");
                          const msg = prompt(`Ota-onaga (${s.parentPhone}) yuboriladigan SMS xabar matnini kiriting:`, `EduYuz: Hurmatli ota-ona! Farzandingiz ${s.fullName} haqida ma'lumot olish uchun markaz ma'muriyatiga murojaat qilishingiz mumkin.`);
                          if (!msg) return;
                          try {
                            await axios.post('http://localhost:3000/api/v1/sms/send', {
                              phone: s.parentPhone,
                              message: msg,
                            });
                            alert(`✅ ${s.parentPhone} raqamiga SMS muvaffaqiyatli jo'natildi!`);
                          } catch (err) {
                            alert("SMS yuborishda xatolik yuz berdi");
                          }
                        }}
                        title="Ota-onaga tezkor SMS jo'natish"
                        className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition"
                      >
                        <MessageSquare size={16} />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(s)}
                        title="Tahrirlash"
                        className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(s.id, s.fullName)}
                        title="O'chirish"
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* O'quvchi qo'shish / tahrirlash Modali */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <h2 className="text-xl font-bold text-white">
              {editingStudent ? "O'quvchini Tahrirlash" : "Yangi O'quvchi Qo'shish"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!editingStudent && (
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">O'quv markazi</label>
                  <select
                    required
                    value={form.centerId}
                    onChange={(e) => setForm({ ...form, centerId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-white"
                  >
                    {centers.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">To'liq ism-familiyasi</label>
                <input
                  required
                  type="text"
                  placeholder="Masalan: Ali Valiyev"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">O'quvchining telefoni (ixtiyoriy)</label>
                <input
                  type="text"
                  placeholder="+998901234567"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Ota-onaning telefoni</label>
                <input
                  required
                  type="text"
                  placeholder="+998901234567"
                  value={form.parentPhone}
                  onChange={(e) => setForm({ ...form, parentPhone: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Boshlang'ich balans</label>
                  <input
                    type="number"
                    value={form.balance}
                    onChange={(e) => setForm({ ...form, balance: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Holati</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-white"
                  >
                    <option value="active">Faol</option>
                    <option value="inactive">Nofaol</option>
                  </select>
                </div>
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
                  Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
