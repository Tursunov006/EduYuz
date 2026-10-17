'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { 
  BookOpen, Plus, Calendar, Clock, User, Users, 
  Search, ArrowRight, X, GraduationCap, DollarSign
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
    return { icon: '⚛️', color: 'from-cyan-500/20 to-blue-500/20 text-cyan-300 border-cyan-500/30' };
  }
  if (t.includes('python') || t.includes('back')) {
    return { icon: '🐍', color: 'from-emerald-500/20 to-teal-500/20 text-emerald-300 border-emerald-500/30' };
  }
  if (t.includes('ingliz') || t.includes('ielts') || t.includes('english')) {
    return { icon: '🇬🇧', color: 'from-purple-500/20 to-pink-500/20 text-purple-300 border-purple-500/30' };
  }
  if (t.includes('matem') || t.includes('fizik')) {
    return { icon: '📐', color: 'from-amber-500/20 to-orange-500/20 text-amber-300 border-amber-500/30' };
  }
  return { icon: '📚', color: 'from-indigo-500/20 to-blue-500/20 text-indigo-300 border-indigo-500/30' };
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:3000/api/v1/groups', formData, {
        headers: getHeaders(),
      });
      setIsModalOpen(false);
      setFormData({
        name: '',
        courseId: courses[0]?.id || '',
        teacherId: teachers[0]?.id || '',
        startTime: '14:00',
        endTime: '16:00',
        days: 'Dush-Chor-Jum',
      });
      fetchData();
    } catch (err: any) {
      const msg = err.response?.data?.error || err.response?.data?.message || 'Guruh yaratishda xatolik yuz berdi!';
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

  // Shaxmatka (Dars jadvali) soatlari
  const TIME_SLOTS = [
    { start: '08:00', end: '10:00', label: '08:00 — 10:00 (Ertalabki 1-smena)' },
    { start: '10:00', end: '12:00', label: '10:00 — 12:00 (Ertalabki 2-smena)' },
    { start: '14:00', end: '16:00', label: '14:00 — 16:00 (Kunduzgi 1-smena)' },
    { start: '16:00', end: '18:00', label: '16:00 — 18:00 (Kunduzgi 2-smena)' },
    { start: '18:00', end: '20:00', label: '18:00 — 20:00 (Kechki smena)' },
  ];

  const getGroupsForSlot = (slotStart: string, dayType: 'odd' | 'even') => {
    const slotHour = parseInt(slotStart.split(':')[0], 10);
    return filteredGroups.filter((g) => {
      const daysStr = (Array.isArray(g.days) ? g.days.join(' ') : String(g.days || '')).toLowerCase();
      const isOdd = daysStr.includes('dush') || daysStr.includes('toq') || daysStr.includes('har kuni');
      const isEven = daysStr.includes('sesh') || daysStr.includes('juft') || daysStr.includes('har kuni') || daysStr.includes('dam');
      const matchesDay = dayType === 'odd' ? isOdd : isEven;
      if (!matchesDay) return false;

      const groupHour = parseInt((g.startTime || '14:00').split(':')[0], 10);
      return Math.abs(groupHour - slotHour) <= 1;
    });
  };

  const openModalForSlot = (start: string, end: string, days: string) => {
    setFormData((prev) => ({
      ...prev,
      startTime: start,
      endTime: end,
      days,
    }));
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-12">
      
      {/* 1. Header & Hero Bar */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900/95 to-indigo-950/60 border border-slate-800/80 p-5 sm:p-8 shadow-2xl backdrop-blur-xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-purple-600/15 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              Jami {groups.length} ta faol guruh • {courses.length} ta fan yo'nalishi
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
              <BookOpen className="text-cyan-400" /> Guruhlar va Dars Jadvali
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm">
              Markazdagi barcha dars guruhlari, fan yo'nalishlari va Toq / Juft kunlar shaxmatkasi
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsCourseModalOpen(true)}
              className="flex items-center justify-center gap-2 bg-slate-800/90 hover:bg-slate-750 text-cyan-300 border border-cyan-500/30 px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all active:scale-95"
            >
              <GraduationCap size={16} /> + Yangi Fan (Kurs)
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all shadow-xl shadow-purple-600/30 hover:scale-[1.02] active:scale-95"
            >
              <Plus size={16} /> Yangi Guruh Ochish
            </button>
          </div>
        </div>
      </div>

      {/* 2. Ichki Tablar (Guruhlar vs Dars Jadvali Shaxmatkasi) va Qidiruv */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 p-1.5 bg-slate-900/90 border border-slate-800 rounded-2xl w-fit">
          <button
            onClick={() => setActiveTab('cards')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'cards'
                ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-lg shadow-indigo-600/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <BookOpen size={16} />
            <span>📚 Barcha Guruhlar ({filteredGroups.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('timetable')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'timetable'
                ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-lg shadow-indigo-600/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Calendar size={16} />
            <span>🗓 Dars Jadvali (Shaxmatka)</span>
          </button>
        </div>

        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Guruh nomi, fan yoki o'qituvchini qidirish..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-800 rounded-2xl text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/80 transition"
          />
        </div>
      </div>

      {/* 3. Kontent: Guruh Kartalari yoki Dars Jadvali Shaxmatkasi */}
      {loading ? (
        <div className="p-16 text-center text-slate-500 text-sm">Guruhlar yuklanmoqda...</div>
      ) : activeTab === 'timetable' ? (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
          <div className="p-5 sm:p-6 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/50">
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
                <Calendar className="text-cyan-400" size={20} />
                Haftalik Dars Jadvali (Toq va Juft kunlar Shaxmatkasi)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Bo‘sh vaqt katakchalarini bosib, o‘sha soatga 1-klikda yangi guruh biriktirishingiz mumkin
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-bold">
                🟦 Toq kunlar: Dush / Chor / Jum
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-bold">
                🟩 Juft kunlar: Sesh / Pay / Shan
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[780px]">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/80 text-xs font-extrabold uppercase tracking-wider text-slate-400">
                  <th className="py-4 px-5 w-52 border-r border-slate-800">🕒 Dars Vaqti (Smena)</th>
                  <th className="py-4 px-5 w-1/2 border-r border-slate-800 text-indigo-300">
                    📅 Toq kunlar (Dushanba • Chorshanba • Juma)
                  </th>
                  <th className="py-4 px-5 w-1/2 text-emerald-300">
                    📅 Juft kunlar (Seshanba • Payshanba • Shanba)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-sm">
                {TIME_SLOTS.map((slot) => {
                  const oddGroups = getGroupsForSlot(slot.start, 'odd');
                  const evenGroups = getGroupsForSlot(slot.start, 'even');

                  return (
                    <tr key={slot.start} className="hover:bg-slate-800/20 transition">
                      {/* Vaqt ustuni */}
                      <td className="p-4 sm:p-5 border-r border-slate-800 align-top bg-slate-950/30">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 font-mono text-xs font-extrabold">
                          <Clock size={14} />
                          {slot.start} — {slot.end}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1.5 font-medium">{slot.label}</p>
                      </td>

                      {/* Toq kunlar ustuni */}
                      <td className="p-4 border-r border-slate-800 align-top">
                        <div className="space-y-2.5">
                          {oddGroups.map((g) => {
                            const badge = getCourseBadge(g.course?.title || g.name);
                            return (
                              <Link
                                key={g.id}
                                href={`/groups/${g.id}`}
                                className="block p-3.5 rounded-2xl bg-slate-950/90 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/50 transition group"
                              >
                                <div className="flex items-center justify-between gap-2 mb-1">
                                  <span className="font-extrabold text-white group-hover:text-cyan-400 transition text-sm">
                                    {badge.icon} {g.name}
                                  </span>
                                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                                    {g.startTime}–{g.endTime}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between text-xs text-slate-400">
                                  <span>👨‍🏫 {g.teacher?.fullName || 'Ustoz'}</span>
                                  <span className="text-slate-300 font-semibold">
                                    👥 {g._count?.students || 0} o‘quvchi
                                  </span>
                                </div>
                              </Link>
                            );
                          })}
                          <button
                            onClick={() => openModalForSlot(slot.start, slot.end, 'Dush-Chor-Jum')}
                            className="w-full py-2 px-3 rounded-xl border border-dashed border-slate-800 hover:border-indigo-500/50 text-slate-500 hover:text-indigo-300 text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Plus size={14} /> Shu vaqtga guruh qo‘shish
                          </button>
                        </div>
                      </td>

                      {/* Juft kunlar ustuni */}
                      <td className="p-4 align-top">
                        <div className="space-y-2.5">
                          {evenGroups.map((g) => {
                            const badge = getCourseBadge(g.course?.title || g.name);
                            return (
                              <Link
                                key={g.id}
                                href={`/groups/${g.id}`}
                                className="block p-3.5 rounded-2xl bg-slate-950/90 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/50 transition group"
                              >
                                <div className="flex items-center justify-between gap-2 mb-1">
                                  <span className="font-extrabold text-white group-hover:text-emerald-400 transition text-sm">
                                    {badge.icon} {g.name}
                                  </span>
                                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                                    {g.startTime}–{g.endTime}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between text-xs text-slate-400">
                                  <span>👨‍🏫 {g.teacher?.fullName || 'Ustoz'}</span>
                                  <span className="text-slate-300 font-semibold">
                                    👥 {g._count?.students || 0} o‘quvchi
                                  </span>
                                </div>
                              </Link>
                            );
                          })}
                          <button
                            onClick={() => openModalForSlot(slot.start, slot.end, 'Sesh-Pay-Shan')}
                            className="w-full py-2 px-3 rounded-xl border border-dashed border-slate-800 hover:border-emerald-500/50 text-slate-500 hover:text-emerald-300 text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Plus size={14} /> Shu vaqtga guruh qo‘shish
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className="p-16 text-center bg-slate-900/50 border border-slate-800 rounded-3xl space-y-3">
          <BookOpen className="mx-auto text-slate-600" size={40} />
          <p className="text-slate-300 font-bold">Guruhlar topilmadi</p>
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
                className="bg-slate-900/90 border border-slate-800 hover:border-slate-700/80 rounded-3xl p-5 sm:p-6 transition-all duration-300 shadow-xl hover:shadow-2xl hover:-translate-y-1 backdrop-blur-md flex flex-col justify-between space-y-4 group"
              >
                {/* Tepasi: Fan Belgisi va O'quvchilar soni */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-r ${badge.color} border text-xs font-bold`}>
                      <span>{badge.icon}</span>
                      <span className="truncate max-w-[140px]">{group.course?.title || 'Umumiy Kurs'}</span>
                    </span>
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-slate-800 text-slate-300 border border-slate-700/80">
                      {studentCount}/{maxCapacity} o'quvchi
                    </span>
                  </div>

                  {/* Guruh Nomi va Narxi */}
                  <div className="flex items-baseline justify-between gap-2">
                    <Link href={`/groups/${group.id}`} className="block flex-1 min-w-0">
                      <h3 className="text-lg font-extrabold text-white group-hover:text-cyan-400 transition truncate">
                        {group.name}
                      </h3>
                    </Link>
                    {group.course?.price ? (
                      <span className="text-xs font-extrabold text-emerald-400 font-mono shrink-0">
                        {Number(group.course.price).toLocaleString('uz-UZ')} so'm
                      </span>
                    ) : null}
                  </div>

                  {/* O'quvchilar sig'imi progress bari */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                      <span>Guruh to'laligi:</span>
                      <span className={fillPercent >= 80 ? 'text-emerald-400 font-bold' : 'text-slate-300 font-bold'}>
                        {fillPercent}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          fillPercent >= 80 ? 'bg-emerald-400' : 'bg-gradient-to-r from-cyan-500 to-blue-500'
                        }`}
                        style={{ width: `${fillPercent}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Markazi: Kunlar, Vaqt va Ustoz */}
                <div className="space-y-2 pt-3 border-t border-slate-800/80 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-cyan-400 shrink-0" />
                    <span className="font-semibold text-slate-200">
                      {Array.isArray(group.days) ? group.days.join(', ') : group.days}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-amber-400 shrink-0" />
                    <span className="font-semibold text-slate-200">
                      {group.startTime} — {group.endTime}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User size={14} className="text-purple-400 shrink-0" />
                    <span className="text-slate-400 truncate">
                      Ustoz: <strong className="text-slate-200 font-bold">{group.teacher?.fullName || 'Biriktirilmagan'}</strong>
                    </span>
                  </div>
                </div>

                {/* Pasti: Tezkor Amallar Tugmalari */}
                <div className="flex items-center gap-2 pt-2">
                  <Link
                    href={`/groups/${group.id}`}
                    className="flex-1 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-bold border border-slate-700/80 text-center transition active:scale-95"
                  >
                    Jurnal & O'quvchilar
                  </Link>
                  <Link
                    href="/attendance"
                    className="py-2.5 px-3.5 rounded-2xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 text-xs font-bold transition active:scale-95"
                    title="Davomatga o'tish"
                  >
                    Davomat
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Yangi guruh qo'shish modali (Kurs va O'qituvchi tanlash bilan) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
                <BookOpen size={18} className="text-cyan-400" /> Yangi guruh ochish
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Guruh nomi / kodi</label>
                <input
                  required
                  type="text"
                  placeholder="Masalan: Frontend DI-88 yoki IELTS 6.5"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-slate-200 text-xs sm:text-sm focus:outline-none focus:border-indigo-500 transition"
                />
              </div>

              {/* Fan / Kurs tanlash */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-300">Fan yo'nalishi (Kurs)</label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      setIsCourseModalOpen(true);
                    }}
                    className="text-[11px] text-cyan-400 hover:underline font-semibold"
                  >
                    + Yangi fan qo'shish
                  </button>
                </div>
                <select
                  value={formData.courseId}
                  onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-slate-200 text-xs sm:text-sm focus:outline-none focus:border-indigo-500"
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
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Mas'ul O'qituvchi (Ustoz)</label>
                <select
                  value={formData.teacherId}
                  onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-slate-200 text-xs sm:text-sm focus:outline-none focus:border-indigo-500"
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
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Boshlanish vaqti</label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-slate-200 text-xs sm:text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Tugash vaqti</label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-slate-200 text-xs sm:text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Dars kunlari</label>
                <select
                  value={formData.days}
                  onChange={(e) => setFormData({ ...formData, days: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-slate-200 text-xs sm:text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value="Dush-Chor-Jum">Dushanba / Chorshanba / Juma (Toq kunlar)</option>
                  <option value="Sesh-Pay-Shan">Seshanba / Payshanba / Shanba (Juft kunlar)</option>
                  <option value="Har kuni">Har kuni (Dush - Shan)</option>
                  <option value="Dam olish kunlari">Dam olish kunlari (Shanba / Yakshanba)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-bold transition"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white text-xs font-bold transition shadow-lg shadow-purple-600/30"
                >
                  Guruhni Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Yangi Fan (Kurs) Qo'shish Modali */}
      {isCourseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                <GraduationCap size={18} className="text-cyan-400" /> Yangi fan (kurs) qo'shish
              </h2>
              <button 
                onClick={() => setIsCourseModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateCourse} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Fan / Kurs nomi</label>
                <input
                  required
                  type="text"
                  placeholder="Masalan: Ingliz tili (IELTS) yoki Python"
                  value={courseForm.title}
                  onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-slate-200 text-xs sm:text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Oylik to'lov narxi (so'm)</label>
                <input
                  required
                  type="number"
                  step="10000"
                  value={courseForm.price}
                  onChange={(e) => setCourseForm({ ...courseForm, price: Number(e.target.value) })}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-slate-200 text-xs sm:text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCourseModalOpen(false)}
                  className="px-4 py-2.5 rounded-2xl bg-slate-800 text-slate-300 text-xs font-bold"
                >
                  Yopish
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg shadow-cyan-600/20"
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
