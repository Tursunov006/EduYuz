'use client';

import { useEffect, useState } from 'react';
import { Plus, Search, Phone, Edit2, Trash2, Download, Send, Smartphone, MessageSquare, FileSpreadsheet, Copy, CheckCircle2, Archive } from 'lucide-react';
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
  // Ro'yxat filtri: hammasi / o'quvchilar / talabalar
  const [kindFilter, setKindFilter] = useState<'all' | 'oquvchi' | 'talaba'>('all');
  // Faol / kursni tugatgan (nofaol) / barchasi
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  
  // Telegram havola uchun modal
  const [telegramLinkModal, setTelegramLinkModal] = useState({ isOpen: false, link: '', copied: false });

  // Forma ma'lumotlari
  const [form, setForm] = useState({
    centerId: '',
    fullName: '',
    middleName: '',
    kind: 'oquvchi',
    phone: '',
    parentPhone: '',
    balance: 0,
    status: 'active',
    passport: '',
    birthDate: '',
    address: '',
    notes: '',
  });

  async function fetchStudents() {
    try {
      setLoading(true);
      const data = await apiFetch(`/students${search ? `?search=${encodeURIComponent(search)}` : ''}`);
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

  // Yuqori paneldagi global qidiruvdan kelgan so'z (?search=...) bilan boshlash
  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get('search');
    if (fromUrl) setSearch(fromUrl);
    const onSearch = (e: Event) => setSearch((e as CustomEvent<string>).detail || '');
    window.addEventListener('eduyuz:search', onSearch);
    return () => window.removeEventListener('eduyuz:search', onSearch);
  }, []);

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
      middleName: '',
      kind: 'oquvchi',
      phone: '',
      parentPhone: '',
      balance: 0,
      status: 'active',
      passport: '',
      birthDate: '',
      address: '',
      notes: '',
    });
    setIsModalOpen(true);
  }

  function handleOpenEdit(student: any) {
    setEditingStudent(student);
    setForm({
      centerId: student.centerId || centers[0]?.id || '',
      fullName: student.fullName,
      middleName: student.middleName || '',
      kind: student.kind || 'oquvchi',
      phone: student.phone || '',
      parentPhone: student.parentPhone,
      balance: Number(student.balance) || 0,
      status: student.status || 'active',
      passport: student.passport || '',
      birthDate: student.birthDate ? String(student.birthDate).slice(0, 10) : '',
      address: student.address || '',
      notes: student.notes || '',
    });
    setIsModalOpen(true);
  }

  // Kursni tugatgan o'quvchi o'chirilmaydi, Arxivga olinadi (to'lov tarixi saqlanadi)
  async function handleArchive(s: any) {
    if (!confirm(`"${s.fullName}" kursni tugatdimi? O'quvchi Arxiv bo'limiga o'tkaziladi.`)) return;
    try {
      await apiFetch(`/students/${s.id}`, { method: 'PATCH', body: JSON.stringify({ status: 'inactive' }) });
      setStudents((prev) => prev.map((x) => (x.id === s.id ? { ...x, status: 'inactive' } : x)));
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function handleDelete(id: string, name: string) {
    const ok = confirm(
      `"${name}"ni butunlay o'chirmoqchimisiz?\n\n` +
        `Diqqat: o'quvchining barcha to'lovlari ham o'chadi va kassa hisobotidan chiqib ketadi ` +
        `(shaxsiy ma'lumotlari Arxivdagi "O'quvchilar bazasi"da saqlanib qoladi). ` +
        `Kursni tugatgan o'quvchini o'chirmasdan, "Arxivga olish" tugmasi bilan arxivga o'tkazish tavsiya etiladi.`,
    );
    if (!ok) return;
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
            middleName: form.middleName,
            kind: form.kind,
            phone: form.phone,
            parentPhone: form.parentPhone,
            balance: Number(form.balance),
            status: form.status,
            passport: form.passport,
            birthDate: form.birthDate || undefined,
            address: form.address,
            notes: form.notes,
          }),
        });
      } else {
        await apiFetch('/students', {
          method: 'POST',
          body: JSON.stringify({
            ...form,
            balance: Number(form.balance),
            birthDate: form.birthDate || undefined,
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
        { header: t('students.name', 'O‘quvchi F.I.SH'), key: 'fullName', width: 240 },
        { header: 'Otasining ismi', key: 'middleName', width: 160, format: (v) => v || '—' },
        { header: 'Turi', key: 'kind', width: 90, align: 'center', format: (v) => (v === 'talaba' ? 'Talaba' : 'O‘quvchi') },
        { header: t('students.phone', 'Shaxsiy Telefon'), key: 'phone', width: 160, align: 'center' },
        { header: 'Ota-ona telefoni', key: 'parentPhone', width: 160, align: 'center' },
        { header: 'Izoh', key: 'notes', width: 260, format: (v) => v || '—' },
        {
          header: t('students.balance', 'Hisob Balansi (so‘m)'),
          key: 'balance',
          width: 180,
          isCurrency: true,
          format: (val) => `${Number(val || 0).toLocaleString('uz-UZ')} so'm`,
        },
        {
          header: t('students.status', 'Holati'),
          key: 'status',
          width: 130,
          align: 'center',
          format: (val) => (val === 'active' ? 'Faol' : val === 'graduated' ? 'Bitirgan' : 'Nofaol'),
        },
      ],
      students,
      {
        title: "EduYuz CRM — Markaz O'quvchilari Bazasi",
        summaryLabel: "JAMI RO'YXATDAGI O'QUVCHILAR:",
        summaryValue: `${students.length} nafar`,
      }
    );
  }

  // Kursni tugatgan (nofaol) o'quvchilar Arxiv bo'limida
  const activeAll = students.filter((x) => x.status === 'active');
  const kindOf = (x: any) => (x.kind === 'talaba' ? 'talaba' : 'oquvchi');
  const visibleStudents = activeAll.filter((x) => kindFilter === 'all' || kindOf(x) === kindFilter);
  const archivedCount = students.length - activeAll.length;

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-10">
      {/* Sarlavha */}
      <div>
        <h1 className="text-2xl sm:text-[26px] font-bold text-slate-900 leading-tight">{t('students.title', 'O‘quvchilar')}</h1>
        <p className="text-sm text-slate-500 mt-1">
          Faol o‘quvchilar
          {archivedCount > 0 && (
            <>
              {' · '}
              <Link href="/archive" className="text-indigo-600 hover:underline">
                Arxivda {archivedCount} ta
              </Link>
            </>
          )}
        </p>
      </div>

      {/* Asboblar paneli: qidiruv va amallar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <label className="flex items-center gap-2.5 h-10 w-full sm:w-80 px-3.5 rounded-xl bg-white border border-slate-200 focus-within:border-indigo-400 transition-colors">
          <Search size={16} className="text-slate-500 shrink-0" />
          <input
            type="text"
            placeholder="Ism yoki telefon bo‘yicha qidirish"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-0 bg-transparent text-sm text-slate-800 placeholder:text-slate-500 focus:outline-none"
          />
        </label>
        <div className="sm:ml-auto flex gap-2.5">
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-white border border-slate-200 text-sm font-semibold text-slate-800 hover:bg-slate-50 transition"
          >
            <FileSpreadsheet size={16} /> Excel
          </button>
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-indigo-600 text-sm font-semibold text-white hover:bg-indigo-500 transition"
          >
            <Plus size={16} /> O‘quvchi qo‘shish
          </button>
        </div>
      </div>

      {/* O'quvchi / talaba */}
      <div className="flex flex-wrap items-center gap-2">
        {([
          { key: 'all', label: 'Barchasi', count: activeAll.length },
          { key: 'oquvchi', label: 'O‘quvchilar', count: activeAll.filter((x) => kindOf(x) === 'oquvchi').length },
          { key: 'talaba', label: 'Talabalar', count: activeAll.filter((x) => kindOf(x) === 'talaba').length },
        ] as const).map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setKindFilter(f.key)}
            className={`inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl text-sm font-medium border transition ${
              kindFilter === f.key
                ? 'bg-indigo-600 border-indigo-600 text-white'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {f.label}
            <span className={`text-xs ${kindFilter === f.key ? 'text-indigo-100' : 'text-slate-400'}`}>{f.count}</span>
          </button>
        ))}
      </div>

      {/* Jadval */}
      <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[760px]">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-500">
              <tr>
                <th className="h-11 px-5 font-semibold">O‘quvchi</th>
                <th className="h-11 px-5 font-semibold">Telefon</th>
                <th className="h-11 px-5 font-semibold">Ota-ona telefoni</th>
                <th className="h-11 px-5 font-semibold">Balans</th>
                <th className="h-11 px-5 font-semibold">Holat</th>
                <th className="h-11 px-5" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="py-24 text-center text-slate-500">Yuklanmoqda...</td></tr>
              ) : visibleStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-24 px-4 text-center">
                    <p className="text-[15px] font-semibold text-slate-600">
                      {search || kindFilter !== 'all' ? 'Hech narsa topilmadi' : 'Hali faol o‘quvchi yo‘q'}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {search
                        ? `«${search}» bo‘yicha o‘quvchi yo‘q. Boshqa ism yoki raqam bilan qidiring`
                        : kindFilter !== 'all'
                          ? `Bu bo‘limda hali ${kindFilter === 'talaba' ? 'talaba' : 'o‘quvchi'} yo‘q. Turini o‘quvchi tahrirlash oynasida belgilang`
                          : '«O‘quvchi qo‘shish» tugmasi bilan birinchi o‘quvchini kiriting'}
                    </p>
                    {!search && kindFilter === 'all' && (
                      <button onClick={handleOpenCreate} className="mt-3 text-xs font-semibold text-indigo-600 hover:underline">
                        O‘quvchi qo‘shish
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                visibleStudents.map((s) => {
                  const bal = Number(s.balance || 0);
                  return (
                    <tr key={s.id} className="border-t border-slate-200 hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <span className="w-9 h-9 rounded-full bg-indigo-500/10 text-indigo-700 flex items-center justify-center text-sm font-bold shrink-0">
                            {(s.fullName || '?')[0]}
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 min-w-0">
                              <Link href={`/students/${s.id}`} className="font-semibold text-slate-800 truncate hover:text-indigo-600">
                                {s.fullName}
                              </Link>
                              {kindOf(s) === 'talaba' && (
                                <span className="inline-flex items-center h-5 px-2 rounded-md bg-violet-500/10 text-violet-600 text-[11px] font-semibold shrink-0">Talaba</span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 truncate">
                              {s.groups?.[0]?.group?.name || 'Guruhsiz'}
                            </p>
                            {s.notes && (
                              <p className="text-xs text-amber-700 bg-amber-50 rounded px-1.5 py-0.5 mt-1 w-max min-w-0 max-w-[300px] whitespace-pre-wrap break-words">
                                Izoh: {s.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 whitespace-nowrap">{s.phone || '—'}</td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <p className="text-slate-600">{s.parentPhone || '—'}</p>
                        <p className={`text-xs ${s.parentChatId ? 'text-sky-600' : 'text-slate-500'}`}>
                          {s.parentChatId ? 'Telegram ulangan' : 'Telegram ulanmagan'}
                        </p>
                      </td>
                      <td className={`px-5 py-3.5 font-semibold whitespace-nowrap ${bal < 0 ? 'text-rose-600' : bal > 0 ? 'text-emerald-600' : 'text-slate-600'}`}>
                        {bal < 0 ? '-' : ''}{Math.abs(bal).toLocaleString('uz-UZ').replace(/,/g, ' ')} so‘m
                      </td>
                      <td className="px-5 py-3.5">
                        {bal < 0 ? (
                          <span className="inline-flex items-center h-6 px-2.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600">Qarzdor</span>
                        ) : s.status === 'active' ? (
                          <span className="inline-flex items-center h-6 px-2.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600">Faol</span>
                        ) : (
                          <span className="inline-flex items-center h-6 px-2.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-500">Kursni tugatgan</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/portal?studentId=${s.id}`}
                            target="_blank"
                            title="O‘quvchi portali"
                            className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition"
                          >
                            <Smartphone size={16} />
                          </Link>
                          <button
                            onClick={() => {
                              const botUser = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'Edyuz_crmbot';
                              const link = `https://t.me/${botUser}?start=student_${s.id}`;
                              setTelegramLinkModal({ isOpen: true, link, copied: false });
                            }}
                            title="Telegram botga ulash havolasi"
                            className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition"
                          >
                            <Send size={16} />
                          </button>
                          <button
                            onClick={async () => {
                              if (!s.parentPhone) return alert('Ota-ona telefon raqami kiritilmagan');
                              const msg = prompt(
                                `Ota-onaga (${s.parentPhone}) yuboriladigan SMS matni:`,
                                `EduYuz: Hurmatli ota-ona! Farzandingiz ${s.fullName} haqida ma'lumot olish uchun markaz ma'muriyatiga murojaat qilishingiz mumkin.`,
                              );
                              if (!msg) return;
                              try {
                                await axios.post('http://localhost:3000/api/v1/sms/send', { phone: s.parentPhone, message: msg });
                                alert('SMS yuborildi');
                              } catch (err: any) {
                                alert(err?.response?.data?.message || 'SMS yuborishda xatolik');
                              }
                            }}
                            title="Ota-onaga SMS"
                            className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition"
                          >
                            <MessageSquare size={16} />
                          </button>
                          <button
                            onClick={() => handleArchive(s)}
                            title="Arxivga olish (kursni tugatdi)"
                            aria-label="Arxivga olish"
                            className="p-2 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition"
                          >
                            <Archive size={16} />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(s)}
                            title="Tahrirlash"
                            className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(s.id, s.fullName)}
                            title="O‘chirish"
                            className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-500/10 transition"
                          >
                            <Trash2 size={16} />
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

      {/* O'quvchi qo'shish / tahrirlash Modali */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto space-y-4 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">
              {editingStudent ? "O'quvchini Tahrirlash" : "Yangi O'quvchi Qo'shish"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!editingStudent && (
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">O'quv markazi</label>
                  <select
                    required
                    value={form.centerId}
                    onChange={(e) => setForm({ ...form, centerId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm text-slate-900"
                  >
                    {centers.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Familiya va ism</label>
                <input
                  required
                  type="text"
                  placeholder="Masalan: Ali Valiyev"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm text-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Turi</label>
                <div className="grid grid-cols-2 gap-2">
                  {([['oquvchi', 'O‘quvchi'], ['talaba', 'Talaba']] as const).map(([val, label]) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setForm({ ...form, kind: val })}
                      className={`h-10 rounded-xl border text-sm font-semibold transition ${
                        form.kind === val ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Otasining ismi</label>
                <input
                  type="text"
                  placeholder="Masalan: Karimovich / Karimovna"
                  maxLength={100}
                  value={form.middleName}
                  onChange={(e) => setForm({ ...form, middleName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm text-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">O'quvchining telefoni (ixtiyoriy)</label>
                <input
                  type="text"
                  placeholder="+998901234567"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm text-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Ota-onaning telefoni</label>
                <input
                  required
                  type="text"
                  placeholder="+998901234567"
                  value={form.parentPhone}
                  onChange={(e) => setForm({ ...form, parentPhone: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm text-slate-900"
                />
              </div>
              {/* Shaxsiy ma'lumotlar: Arxivdagi o'quvchilar bazasiga avtomatik zaxiralanadi */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Pasport (seriya va raqam)</label>
                  <input
                    type="text"
                    placeholder="AA1234567"
                    maxLength={20}
                    value={form.passport}
                    onChange={(e) => setForm({ ...form, passport: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm text-slate-900 uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Tug‘ilgan sana</label>
                  <input
                    type="date"
                    value={form.birthDate}
                    onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm text-slate-900"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Manzil</label>
                <input
                  type="text"
                  placeholder="Shahar, tuman, ko‘cha"
                  maxLength={255}
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm text-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Izoh</label>
                <textarea
                  rows={3}
                  maxLength={2000}
                  placeholder="Masalan: to‘lovni kech qiladi, ota-onasi bilan gaplashish kerak"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm text-slate-900 resize-y"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Boshlang'ich balans</label>
                  <input
                    type="number"
                    value={form.balance}
                    onChange={(e) => setForm({ ...form, balance: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Holati</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm text-slate-900"
                  >
                    <option value="active">Faol</option>
                    <option value="inactive">Arxivda (kursni tugatgan)</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-500 hover:text-slate-900"
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

      {/* Telegram Link Modali */}
      {telegramLinkModal.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-md space-y-4 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Send className="text-sky-600" /> Telegram Havolasi
            </h2>
            <p className="text-sm text-slate-500">
              Ushbu havoladan nusxa oling va ota-onaga yuboring. Ota-ona havola ustiga bosib, Telegram botda <strong className="text-slate-900">/start</strong> buyrug'ini bersa, tizimga avtomatik ulanadi.
            </p>
            
            <div className="flex items-center gap-2 mt-4">
              <input 
                type="text" 
                readOnly 
                value={telegramLinkModal.link} 
                className="flex-1 bg-slate-50 border border-slate-200 text-slate-600 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-sky-500/50"
              />
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(telegramLinkModal.link);
                  setTelegramLinkModal(prev => ({ ...prev, copied: true }));
                  setTimeout(() => setTelegramLinkModal(prev => ({ ...prev, copied: false })), 2000);
                }}
                className={`p-2.5 rounded-xl transition flex items-center gap-2 ${
                  telegramLinkModal.copied 
                    ? 'bg-emerald-500/20 text-emerald-600' 
                    : 'bg-sky-600 hover:bg-sky-700 text-white'
                }`}
              >
                {telegramLinkModal.copied ? <CheckCircle2 size={18} /> : <Copy size={18} />}
              </button>
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={() => setTelegramLinkModal({ isOpen: false, link: '', copied: false })}
                className="bg-slate-100 hover:bg-slate-200 text-slate-900 px-5 py-2 rounded-xl text-sm font-medium transition"
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
