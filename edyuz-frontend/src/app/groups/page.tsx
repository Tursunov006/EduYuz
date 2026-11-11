'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { 
  BookOpen, Plus, Calendar, Clock, User, Users, 
  Search, ArrowRight, X, GraduationCap, DollarSign, Pencil, Trash2
} from 'lucide-react';

interface Group {
  id: string;
  name: string;
  days: string[] | string;
  startTime: string;
  endTime: string;
  course?: { id: string; title: string; price: number };
  teacher?: { id: string; fullName: string };
  _count?: { students: number };
}

interface CourseItem {
  id: string;
  title: string;
  price: number;
}

interface TeacherItem {
  id: string;
  fullName: string;
  specialty?: string;
}

// Fanga qarab chiroyli piktogramma va rang tanlash
const getCourseBadge = (title: string = '') => {
  const t = title.toLowerCase();
  if (t.includes('front') || t.includes('react') || t.includes('web')) {
    return { icon: '', color: 'from-cyan-500/20 to-blue-500/20 text-cyan-700 border-cyan-500/30' };
  }
  if (t.includes('python') || t.includes('back')) {
    return { icon: '', color: 'from-emerald-500/20 to-teal-500/20 text-emerald-700 border-emerald-500/30' };
  }
  if (t.includes('ingliz') || t.includes('ielts') || t.includes('english')) {
    return { icon: '', color: 'from-purple-500/20 to-pink-500/20 text-purple-700 border-purple-500/30' };
  }
  if (t.includes('matem') || t.includes('fizik')) {
    return { icon: '', color: 'from-amber-500/20 to-orange-500/20 text-amber-700 border-amber-500/30' };
  }
  return { icon: '', color: 'from-indigo-500/20 to-blue-500/20 text-indigo-700 border-indigo-500/30' };
};

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'cards' | 'timetable'>('cards');
  // Tahrirlanayotgan guruh (null bo'lsa, yangi guruh ochiladi)
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);

  // Yangi guruh formasi
  const [formData, setFormData] = useState({
    name: '',
    courseId: '',
    teacherId: '',
    startTime: '14:00',
    endTime: '16:00',
    days: 'Dush-Chor-Jum',
  });

  // Yangi kurs formasi
  const [courseForm, setCourseForm] = useState({
    title: '',
    price: 500000,
  });

  const getHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [groupsRes, coursesRes, teachersRes] = await Promise.all([
        axios.get('http://localhost:3000/api/v1/groups', { headers: getHeaders() }).catch(() => ({ data: [] })),
        axios.get('http://localhost:3000/api/v1/courses', { headers: getHeaders() }).catch(() => ({ data: [] })),
        axios.get('http://localhost:3000/api/v1/teachers', { headers: getHeaders() }).catch(() => ({ data: [] })),
      ]);

      setGroups(groupsRes.data || []);
      const cList = coursesRes.data || [];
      const tList = teachersRes.data || [];
      setCourses(cList);
      setTeachers(tList);

      setFormData((prev) => ({
        ...prev,
        courseId: prev.courseId || (cList[0]?.id ?? ''),
        teacherId: prev.teacherId || (tList[0]?.id ?? ''),
      }));
    } catch (err) {
      console.error('Ma\'lumotlarni yuklashda xatolik:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const emptyForm = () => ({
    name: '',
    courseId: courses[0]?.id || '',
    teacherId: teachers[0]?.id || '',
    startTime: '14:00',
    endTime: '16:00',
    days: 'Dush-Chor-Jum',
  });

  const closeGroupModal = () => {
    setIsModalOpen(false);
    setEditingGroupId(null);
    setFormData(emptyForm());
  };

  const openCreateModal = () => {
    setEditingGroupId(null);
    setFormData(emptyForm());
    setIsModalOpen(true);
  };

  const openEditModal = (g: Group) => {
    setEditingGroupId(g.id);
    setFormData({
      name: g.name,
      courseId: g.course?.id || courses[0]?.id || '',
      teacherId: g.teacher?.id || teachers[0]?.id || '',
      startTime: g.startTime || '14:00',
      endTime: g.endTime || '16:00',
      days: Array.isArray(g.days) ? g.days.join('-') : String(g.days || 'Dush-Chor-Jum'),
    });
    setIsModalOpen(true);
  };

  const handleDeleteGroup = async (g: Group) => {
    const count = g._count?.students || 0;
    const ok = confirm(
      `"${g.name}" guruhini o'chirmoqchimisiz?\n\n` +
        (count > 0 ? `Guruhdagi ${count} ta o'quvchi o'chirilmaydi, faqat guruhdan chiqariladi.\n` : '') +
        `Shu guruhning davomat tarixi ham o'chadi. Bu amalni qaytarib bo'lmaydi.`,
    );
    if (!ok) return;
    try {
      await axios.delete(`http://localhost:3000/api/v1/groups/${g.id}`, { headers: getHeaders() });
      setGroups((prev) => prev.filter((x) => x.id !== g.id));
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Guruhni o‘chirib bo‘lmadi';
      alert(Array.isArray(msg) ? msg.join(', ') : msg);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingGroupId) {
        await axios.patch(`http://localhost:3000/api/v1/groups/${editingGroupId}`, formData, {
          headers: getHeaders(),
        });
      } else {
        await axios.post('http://localhost:3000/api/v1/groups', formData, {
          headers: getHeaders(),
        });
      }
      closeGroupModal();
      fetchData();
    } catch (err: any) {
      const msg = err.response?.data?.error || err.response?.data?.message || 'Guruhni saqlashda xatolik yuz berdi!';
      alert(Array.isArray(msg) ? msg.join(', ') : msg);
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const centersRes = await axios.get('http://localhost:3000/api/v1/centers', { headers: getHeaders() }).catch(() => ({ data: [] }));
      const centerId = centersRes.data?.[0]?.id;

      const res = await axios.post(
        'http://localhost:3000/api/v1/courses',
        {
          title: courseForm.title,
          price: Number(courseForm.price),
          ...(centerId ? { centerId } : {}),
        },
        { headers: getHeaders() }
      );
      setIsCourseModalOpen(false);
      setCourseForm({ title: '', price: 500000 });
      await fetchData();
      if (res.data?.id) {
        setFormData((prev) => ({ ...prev, courseId: res.data.id }));
      }
    } catch (err: any) {
      alert('Kurs yaratishda xatolik yuz berdi');
    }
  };

  const filteredGroups = groups.filter((g) => 
    g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (g.course?.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (g.teacher?.fullName || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Dars jadvali soatlari
  const TIME_SLOTS = [
    { start: '08:00', end: '10:00', label: 'Ertalab' },
    { start: '10:00', end: '12:00', label: 'Ertalab' },
    { start: '14:00', end: '16:00', label: 'Kunduzi' },
    { start: '16:00', end: '18:00', label: 'Kunduzi' },
    { start: '18:00', end: '20:00', label: 'Kechqurun' },
  ];

  const DAY_COLUMNS = [
    { type: 'odd' as const, title: 'Toq kunlar', days: 'Dushanba · Chorshanba · Juma', dot: 'bg-indigo-500', accent: 'border-l-indigo-500', formDays: 'Dush-Chor-Jum' },
    { type: 'even' as const, title: 'Juft kunlar', days: 'Seshanba · Payshanba · Shanba', dot: 'bg-emerald-500', accent: 'border-l-emerald-500', formDays: 'Sesh-Pay-Shan' },
  ];

  const toMinutes = (t?: string) => {
    const [h, m] = String(t || '14:00').split(':').map((x) => parseInt(x, 10));
    return (isNaN(h) ? 14 : h) * 60 + (isNaN(m) ? 0 : m);
  };

  // Har bir guruh faqat bitta qatorga tushadi: boshlanish vaqtidan oldingi eng yaqin smena
  const slotIndexOf = (g: Group) => {
    const start = toMinutes(g.startTime);
    let idx = 0;
    TIME_SLOTS.forEach((s, i) => {
      if (toMinutes(s.start) <= start) idx = i;
    });
    return idx;
  };

  const dayTypeMatches = (g: Group, dayType: 'odd' | 'even') => {
    const d = (Array.isArray(g.days) ? g.days.join(' ') : String(g.days || '')).toLowerCase();
    if (d.includes('har kuni')) return true;
    if (dayType === 'odd') return d.includes('dush') || d.includes('chor') || d.includes('jum') || d.includes('toq');
    return d.includes('sesh') || d.includes('pay') || d.includes('shan') || d.includes('juft') || d.includes('dam');
  };

  const getGroupsForSlot = (slotIdx: number, dayType: 'odd' | 'even') =>
    filteredGroups
      .filter((g) => slotIndexOf(g) === slotIdx && dayTypeMatches(g, dayType))
      .sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime));

  const scheduledCount = filteredGroups.filter((g) => dayTypeMatches(g, 'odd') || dayTypeMatches(g, 'even')).length;

  const openModalForSlot = (start: string, end: string, days: string) => {
    setEditingGroupId(null);
    setFormData(() => ({
      ...emptyForm(),
      startTime: start,
      endTime: end,
      days,
    }));
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-12">
      
      {/* 1. Header & Hero Bar */}
      <div className="relative">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-purple-600/15 rounded-full hidden pointer-events-none"></div>

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-[26px] font-bold text-slate-900 leading-tight">Guruhlar va jadval</h1>
            <p className="text-slate-500 text-xs sm:text-sm">
              Barcha guruhlar va haftalik dars jadvali
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsCourseModalOpen(true)}
              className="flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-white border border-slate-200 text-sm font-semibold text-slate-800 hover:bg-slate-50 transition"
            >
              <GraduationCap size={16} /> Yangi kurs
            </button>
            <button
              onClick={openCreateModal}
              className="flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-indigo-600 text-sm font-semibold text-white hover:bg-indigo-500 transition"
            >
              <Plus size={16} /> Yangi guruh
            </button>
          </div>
        </div>
      </div>

      {/* 2. Ichki Tablar (Guruhlar vs Dars Jadvali Shaxmatkasi) va Qidiruv */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 p-1.5 bg-white border border-slate-200 rounded-2xl w-fit">
          <button
            onClick={() => setActiveTab('cards')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'cards'
                ? 'text-white shadow-sm bg-indigo-600'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <BookOpen size={16} />
            <span>Barcha Guruhlar ({filteredGroups.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('timetable')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'timetable'
                ? 'text-white shadow-sm bg-indigo-600'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Calendar size={16} />
            <span>Dars jadvali</span>
          </button>
        </div>

        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Guruh nomi, fan yoki o'qituvchini qidirish..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-indigo-500/80 transition"
          />
        </div>
      </div>

      {/* 3. Kontent: Guruh Kartalari yoki Dars Jadvali Shaxmatkasi */}
      {loading ? (
        <div className="p-16 text-center text-slate-500 text-sm">Guruhlar yuklanmoqda...</div>
      ) : activeTab === 'timetable' ? (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          {/* Sarlavha */}
          <div className="px-5 sm:px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Haftalik dars jadvali</h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Bo‘sh katakni bosib, shu vaqtga yangi guruh qo‘shing</p>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-600">
              <span className="inline-flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> Toq kunlar
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Juft kunlar
              </span>
              <span className="text-slate-400">{scheduledCount} ta guruh jadvalda</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[720px]">
              {/* Ustun sarlavhalari */}
              <div className="grid grid-cols-[150px_1fr_1fr] bg-slate-50 border-b border-slate-200">
                <div className="px-5 py-3 text-xs font-semibold text-slate-500">Vaqt</div>
                {DAY_COLUMNS.map((col) => (
                  <div key={col.type} className="px-5 py-3 border-l border-slate-200">
                    <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                      <span className={`w-2 h-2 rounded-full ${col.dot}`} /> {col.title}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5 ml-4">{col.days}</p>
                  </div>
                ))}
              </div>

              {/* Qatorlar */}
              {TIME_SLOTS.map((slot, i) => (
                <div
                  key={slot.start}
                  className={`grid grid-cols-[150px_1fr_1fr] ${i > 0 ? 'border-t border-slate-200' : ''}`}
                >
                  <div className="px-5 py-4">
                    <p className="text-base font-bold text-slate-900 tabular-nums">{slot.start}</p>
                    <p className="text-xs text-slate-500 tabular-nums">{slot.end} gacha</p>
                    <span className="inline-block mt-2 px-2 py-0.5 rounded-md bg-slate-100 text-[11px] font-medium text-slate-600">
                      {slot.label}
                    </span>
                  </div>

                  {DAY_COLUMNS.map((col) => {
                    const list = getGroupsForSlot(i, col.type);
                    return (
                      <div key={col.type} className="p-3 border-l border-slate-200 flex flex-col gap-2">
                        {list.map((g) => (
                          <Link
                            key={g.id}
                            href={`/groups/${g.id}`}
                            className={`block px-3.5 py-3 rounded-xl border border-slate-200 border-l-4 ${col.accent} bg-white hover:bg-slate-50 transition`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-sm font-semibold text-slate-900 leading-snug">{g.name}</span>
                              <span className="shrink-0 text-xs font-medium text-slate-500 tabular-nums">
                                {g.startTime}–{g.endTime}
                              </span>
                            </div>
                            <div className="mt-1 flex items-center justify-between gap-2 text-xs text-slate-500">
                              <span className="truncate">{g.teacher?.fullName || 'O‘qituvchi biriktirilmagan'}</span>
                              <span className="shrink-0">{g._count?.students || 0} o‘quvchi</span>
                            </div>
                          </Link>
                        ))}
                        <button
                          type="button"
                          onClick={() => openModalForSlot(slot.start, slot.end, col.formDays)}
                          className={`w-full rounded-xl border border-dashed border-slate-200 text-xs font-medium text-slate-400 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 transition flex items-center justify-center gap-1.5 ${
                            list.length ? 'h-9' : 'flex-1 min-h-[64px]'
                          }`}
                        >
                          <Plus size={14} /> Guruh qo‘shish
                        </button>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className="p-16 text-center bg-white border border-slate-200 rounded-2xl space-y-3">
          <BookOpen className="mx-auto text-slate-400" size={40} />
          <p className="text-slate-600 font-bold">Guruhlar topilmadi</p>
          <p className="text-xs text-slate-500">Qidiruv so'zini o'zgartiring yoki yangi guruh yarating</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {filteredGroups.map((group) => {
            const badge = getCourseBadge(group.course?.title || group.name);
            const studentCount = group._count?.students || 0;
            const maxCapacity = 15;
            const fillPercent = Math.min(Math.round((studentCount / maxCapacity) * 100), 100);

            return (
              <div
                key={group.id}
                className="bg-white border border-slate-200 hover:border-slate-300/80 rounded-2xl p-5 sm:p-6 transition-all duration-300 shadow-sm hover:shadow-sm hover:-translate-y-1 backdrop-blur-md flex flex-col justify-between space-y-4 group"
              >
                {/* Tepasi: Fan Belgisi va O'quvchilar soni */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl ${badge.color} border text-xs font-bold`}>
                      <span>{badge.icon}</span>
                      <span className="truncate max-w-[140px]">{group.course?.title || 'Umumiy Kurs'}</span>
                    </span>
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-slate-100 text-slate-600 border border-slate-300/80">
                      {studentCount}/{maxCapacity} o'quvchi
                    </span>
                  </div>

                  {/* Guruh Nomi va Narxi */}
                  <div className="flex items-baseline justify-between gap-2">
                    <Link href={`/groups/${group.id}`} className="block flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-slate-900 group-hover:text-cyan-600 transition truncate">
                        {group.name}
                      </h3>
                    </Link>
                    {group.course?.price ? (
                      <span className="text-xs font-bold text-emerald-600 font-mono shrink-0">
                        {Number(group.course.price).toLocaleString('uz-UZ')} so'm
                      </span>
                    ) : null}
                  </div>

                  {/* O'quvchilar sig'imi progress bari */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                      <span>Guruh to'laligi:</span>
                      <span className={fillPercent >= 80 ? 'text-emerald-600 font-bold' : 'text-slate-600 font-bold'}>
                        {fillPercent}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          fillPercent >= 80 ? 'bg-emerald-400' : 'bg-cyan-600'
                        }`}
                        style={{ width: `${fillPercent}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Markazi: Kunlar, Vaqt va Ustoz */}
                <div className="space-y-2 pt-3 border-t border-slate-200/80 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-cyan-600 shrink-0" />
                    <span className="font-semibold text-slate-700">
                      {Array.isArray(group.days) ? group.days.join(', ') : group.days}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-amber-600 shrink-0" />
                    <span className="font-semibold text-slate-700">
                      {group.startTime} — {group.endTime}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User size={14} className="text-purple-600 shrink-0" />
                    <span className="text-slate-500 truncate">
                      Ustoz: <strong className="text-slate-700 font-bold">{group.teacher?.fullName || 'Biriktirilmagan'}</strong>
                    </span>
                  </div>
                </div>

                {/* Pasti: Amallar */}
                <div className="flex items-center gap-2 pt-2">
                  <Link
                    href={`/groups/${group.id}`}
                    className="flex-1 h-10 inline-flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                  >
                    O‘quvchilar va jurnal
                  </Link>
                  <Link
                    href={`/attendance?groupId=${group.id}`}
                    className="h-10 px-3 inline-flex items-center rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition"
                    title="Davomatga o'tish"
                  >
                    Davomat
                  </Link>
                  <button
                    type="button"
                    onClick={() => openEditModal(group)}
                    title="Guruhni tahrirlash"
                    aria-label="Guruhni tahrirlash"
                    className="w-10 h-10 inline-flex items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-300 transition"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteGroup(group)}
                    title="Guruhni o'chirish"
                    aria-label="Guruhni o'chirish"
                    className="w-10 h-10 inline-flex items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50 transition"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Yangi guruh qo'shish modali (Kurs va O'qituvchi tanlash bilan) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 sm:p-7 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <BookOpen size={18} className="text-cyan-600" /> {editingGroupId ? 'Guruhni tahrirlash' : 'Yangi guruh ochish'}
              </h2>
              <button 
                onClick={closeGroupModal}
                className="text-slate-500 hover:text-slate-900 p-1 rounded-lg hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Guruh nomi / kodi</label>
                <input
                  required
                  type="text"
                  placeholder="Masalan: Frontend DI-88 yoki IELTS 6.5"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 text-xs sm:text-sm focus:outline-none focus:border-indigo-500 transition"
                />
              </div>

              {/* Fan / Kurs tanlash */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-600">Fan yo'nalishi (Kurs)</label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      setIsCourseModalOpen(true);
                    }}
                    className="text-[11px] text-cyan-600 hover:underline font-semibold"
                  >
                    + Yangi fan qo'shish
                  </button>
                </div>
                <select
                  value={formData.courseId}
                  onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 text-xs sm:text-sm focus:outline-none focus:border-indigo-500"
                >
                  {courses.length === 0 ? (
                    <option value="">Standart Kurs (Avtomatik yaratiladi)</option>
                  ) : (
                    courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title} ({Number(c.price).toLocaleString('uz-UZ')} so'm)
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* O'qituvchi tanlash */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Mas'ul O'qituvchi (Ustoz)</label>
                <select
                  value={formData.teacherId}
                  onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 text-xs sm:text-sm focus:outline-none focus:border-indigo-500"
                >
                  {teachers.length === 0 ? (
                    <option value="">Bosh O'qituvchi (Avtomatik)</option>
                  ) : (
                    teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.fullName} ({t.specialty || 'Ustoz'})
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Boshlanish vaqti</label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 text-xs sm:text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Tugash vaqti</label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 text-xs sm:text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Dars kunlari</label>
                <select
                  value={formData.days}
                  onChange={(e) => setFormData({ ...formData, days: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 text-xs sm:text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value="Dush-Chor-Jum">Dushanba / Chorshanba / Juma (Toq kunlar)</option>
                  <option value="Sesh-Pay-Shan">Seshanba / Payshanba / Shanba (Juft kunlar)</option>
                  <option value="Har kuni">Har kuni (Dush - Shan)</option>
                  <option value="Dam olish kunlari">Dam olish kunlari (Shanba / Yakshanba)</option>
                  {!['Dush-Chor-Jum', 'Sesh-Pay-Shan', 'Har kuni', 'Dam olish kunlari'].includes(formData.days) && formData.days && (
                    <option value={formData.days}>{formData.days}</option>
                  )}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={closeGroupModal}
                  className="px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-750 text-slate-600 text-xs font-bold transition"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-2xl text-white text-xs font-bold transition shadow-sm bg-indigo-600 hover:bg-indigo-500"
                >
                  {editingGroupId ? 'O‘zgarishlarni saqlash' : 'Guruhni saqlash'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Yangi Fan (Kurs) Qo'shish Modali */}
      {isCourseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-sm w-full p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <GraduationCap size={18} className="text-cyan-600" /> Yangi fan (kurs) qo'shish
              </h2>
              <button 
                onClick={() => setIsCourseModalOpen(false)}
                className="text-slate-500 hover:text-slate-900 p-1 rounded-lg hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateCourse} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Fan / Kurs nomi</label>
                <input
                  required
                  type="text"
                  placeholder="Masalan: Ingliz tili (IELTS) yoki Python"
                  value={courseForm.title}
                  onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 text-xs sm:text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Oylik to'lov narxi (so'm)</label>
                <input
                  required
                  type="number"
                  step="10000"
                  value={courseForm.price}
                  onChange={(e) => setCourseForm({ ...courseForm, price: Number(e.target.value) })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 text-xs sm:text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsCourseModalOpen(false)}
                  className="px-4 py-2.5 rounded-2xl bg-slate-100 text-slate-600 text-xs font-bold"
                >
                  Yopish
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-sm"
                >
                  Qo'shish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
