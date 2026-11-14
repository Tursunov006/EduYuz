'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import axios from 'axios';
import '@/lib/api'; // axios uchun API manzili va token sozlamalari
import { 
  BookOpen, Plus, Calendar, Clock, User, Users, 
  Search, ArrowRight, X, GraduationCap, DollarSign, Pencil, Archive
} from 'lucide-react';

interface Group {
  id: string;
  name: string;
  days: string[] | string;
  startTime: string;
  endTime: string;
  course?: { id: string; title: string; price: number };
  teacher?: { id: string; fullName: string };
  room?: string | null;
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

// Hafta kunlari. Guruh kunlari turli ko'rinishda saqlangan: ["Dush","Chor"], "Dush-Chor-Jum",
// ["Dushanba"], "toq kunlar", "har kuni". Hammasi shu qisqa nomlarga keltiriladi.
const WEEK = [
  { key: 'Dush', full: 'Dushanba' },
  { key: 'Sesh', full: 'Seshanba' },
  { key: 'Chor', full: 'Chorshanba' },
  { key: 'Pay', full: 'Payshanba' },
  { key: 'Jum', full: 'Juma' },
  { key: 'Shan', full: 'Shanba' },
  { key: 'Yak', full: 'Yakshanba' },
];
const WEEK_KEYS = WEEK.map((w) => w.key);

function parseDays(raw: any): string[] {
  const text = (Array.isArray(raw) ? raw.join(' ') : String(raw || '')).toLowerCase();
  const set = new Set<string>();
  if (text.includes('har kuni')) ['Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan'].forEach((k) => set.add(k));
  // So'zlar boshidan solishtiriladi: "Dushanba" ichidagi "shan" Shanba deb adashmasligi uchun
  text.split(/[^a-z]+/).filter(Boolean).forEach((t) => {
    if (t.startsWith('dush')) set.add('Dush');
    else if (t.startsWith('sesh')) set.add('Sesh');
    else if (t.startsWith('chor')) set.add('Chor');
    else if (t.startsWith('pay')) set.add('Pay');
    else if (t.startsWith('jum')) set.add('Jum');
    else if (t.startsWith('shan')) set.add('Shan');
    else if (t.startsWith('yak')) set.add('Yak');
    else if (t === 'toq') ['Dush', 'Chor', 'Jum'].forEach((k) => set.add(k));
    else if (t === 'juft') ['Sesh', 'Pay', 'Shan'].forEach((k) => set.add(k));
    else if (t === 'dam') ['Shan', 'Yak'].forEach((k) => set.add(k));
  });
  return WEEK_KEYS.filter((k) => set.has(k));
}
const TODAY_KEY = () => ['Yak', 'Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan'][new Date().getDay()];

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
  // Dars jadvali: tanlangan hafta kuni
  const [dayKey, setDayKey] = useState<string>(() => TODAY_KEY());

  // Yangi guruh formasi
  const [formData, setFormData] = useState({
    name: '',
    room: '',
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
        axios.get('/groups', { headers: getHeaders() }).catch(() => ({ data: [] })),
        axios.get('/courses', { headers: getHeaders() }).catch(() => ({ data: [] })),
        axios.get('/teachers', { headers: getHeaders() }).catch(() => ({ data: [] })),
      ]);

      // Arxivdagi guruhlar alohida bo'limda
      setGroups((groupsRes.data || []).filter((g: any) => !g.archivedAt));
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
    room: '',
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
      room: g.room || '',
      courseId: g.course?.id || courses[0]?.id || '',
      teacherId: g.teacher?.id || teachers[0]?.id || '',
      startTime: g.startTime || '14:00',
      endTime: g.endTime || '16:00',
      days: parseDays(g.days).join('-') || 'Dush-Chor-Jum',
    });
    setIsModalOpen(true);
  };

  // Kursi tugagan guruh o'chirilmaydi, Arxivga olinadi (Arxiv bo'limidan qaytarish yoki o'chirish mumkin)
  const handleArchiveGroup = async (g: Group) => {
    const ok = confirm(
      `"${g.name}" guruhini arxivga olasizmi?\n\n` +
        `Guruh ro'yxat va dars jadvalidan olinadi, undan oylik to'lov yechilmaydi. ` +
        `Kerak bo'lsa uni "Arxiv" bo'limidan qaytarishingiz yoki butunlay o'chirishingiz mumkin.`,
    );
    if (!ok) return;
    try {
      await axios.patch(`/groups/${g.id}`, { archived: true }, { headers: getHeaders() });
      setGroups((prev) => prev.filter((x) => x.id !== g.id));
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Guruhni arxivga olib bo‘lmadi';
      alert(Array.isArray(msg) ? msg.join(', ') : msg);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (parseDays(formData.days).length === 0) {
      alert('Kamida bitta dars kunini tanlang');
      return;
    }
    try {
      if (editingGroupId) {
        await axios.patch(`/groups/${editingGroupId}`, formData, {
          headers: getHeaders(),
        });
      } else {
        await axios.post('/groups', formData, {
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
      const centersRes = await axios.get('/centers', { headers: getHeaders() }).catch(() => ({ data: [] }));
      const centerId = centersRes.data?.[0]?.id;

      const res = await axios.post(
        '/courses',
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

  // --- Dars jadvali: xonalar ustun, soatlar qator, dars bloklari vaqtga qarab joylashadi ---
  const HOUR_H = 64; // bir soat balandligi (px)
  const NO_ROOM = 'Xona belgilanmagan';
  const BLOCK_COLORS = [
    'bg-rose-500', 'bg-emerald-500', 'bg-indigo-500', 'bg-amber-500',
    'bg-sky-500', 'bg-violet-500', 'bg-teal-500', 'bg-pink-500',
  ];

  const toMinutes = (t?: string) => {
    const [h, m] = String(t || '14:00').split(':').map((x) => parseInt(x, 10));
    return (isNaN(h) ? 14 : h) * 60 + (isNaN(m) ? 0 : m);
  };
  const fmtHour = (h: number) => `${String(h).padStart(2, '0')}:00`;

  // Bir kursning guruhlari bir xil rangda chiqadi
  const colorOf = (g: Group) => {
    const key = String(g.course?.id || g.course?.title || g.name);
    let h = 0;
    for (const ch of key) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    return BLOCK_COLORS[h % BLOCK_COLORS.length];
  };

  const dayGroups = filteredGroups.filter((g) => parseDays(g.days).includes(dayKey));
  const scheduledCount = dayGroups.length;

  // Ustunlar: barcha ma'lum xonalar (toq va juft kunlarda bir xil turadi) + xonasiz guruhlar uchun
  const knownRooms = Array.from(new Set(groups.map((g) => (g.room || '').trim()).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b),
  );
  const needsNoRoom = knownRooms.length === 0 || dayGroups.some((g) => !(g.room || '').trim());
  const roomColumns = needsNoRoom ? [...knownRooms, NO_ROOM] : knownRooms;

  const gridStartHour = Math.min(8, ...dayGroups.map((g) => Math.floor(toMinutes(g.startTime) / 60)));
  const gridEndHour = Math.min(24, Math.max(20, ...dayGroups.map((g) => Math.ceil(toMinutes(g.endTime) / 60))));
  const hours = Array.from({ length: gridEndHour - gridStartHour }, (_, i) => gridStartHour + i);
  const gridHeight = hours.length * HOUR_H;

  // Bir xonada vaqti ustma-ust tushgan guruhlar yonma-yon joylashadi
  const layoutRoom = (list: Group[]) => {
    const items = list
      .map((g) => {
        const sMin = toMinutes(g.startTime);
        return { g, s: sMin, e: Math.max(toMinutes(g.endTime), sMin + 30), lane: 0, lanes: 1 };
      })
      .sort((a, b) => a.s - b.s || a.e - b.e);
    let cluster: typeof items = [];
    let clusterEnd = -1;
    const laneEnds: number[] = [];
    const flush = () => {
      const n = Math.max(...cluster.map((c) => c.lane)) + 1;
      cluster.forEach((c) => (c.lanes = n));
      cluster = [];
    };
    items.forEach((it) => {
      if (cluster.length && it.s >= clusterEnd) {
        flush();
        laneEnds.length = 0;
        clusterEnd = -1;
      }
      let lane = laneEnds.findIndex((end) => end <= it.s);
      if (lane === -1) {
        lane = laneEnds.length;
        laneEnds.push(it.e);
      } else {
        laneEnds[lane] = it.e;
      }
      it.lane = lane;
      cluster.push(it);
      clusterEnd = Math.max(clusterEnd, it.e);
    });
    if (cluster.length) flush();
    return items;
  };

  const openModalForSlot = (start: string, end: string, days: string, room = '') => {
    setEditingGroupId(null);
    setFormData(() => ({
      ...emptyForm(),
      startTime: start,
      endTime: end,
      days,
      room,
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
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Xonalar bo‘yicha. Bo‘sh joyni bosib, shu vaqtga yangi guruh qo‘shing
                <span className="text-slate-400"> · {scheduledCount} ta guruh</span>
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-50 border border-slate-200 rounded-xl w-fit">
              {WEEK.map((w) => (
                <button
                  key={w.key}
                  type="button"
                  onClick={() => setDayKey(w.key)}
                  className={`h-9 px-3 rounded-lg text-sm font-semibold transition ${
                    dayKey === w.key ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-white'
                  }`}
                  title={w.full}
                >
                  {w.key}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <div style={{ minWidth: 70 + roomColumns.length * 190 }}>
              {/* Xonalar */}
              <div className="flex border-b border-slate-200 bg-slate-50">
                <div className="w-[70px] shrink-0 px-3 py-3 text-xs font-semibold text-slate-500">Vaqt</div>
                {roomColumns.map((room) => (
                  <div key={room} className="flex-1 min-w-[190px] px-4 py-3 border-l border-slate-200 text-sm font-semibold text-slate-900 truncate">
                    {room}
                  </div>
                ))}
              </div>

              {/* Jadval */}
              <div className="flex">
                {/* Soatlar */}
                <div className="w-[70px] shrink-0 relative" style={{ height: gridHeight }}>
                  {hours.map((h, i) => (
                    <div
                      key={h}
                      className="absolute left-0 right-0 px-3 text-xs font-medium text-slate-500 tabular-nums"
                      style={{ top: i * HOUR_H + 6 }}
                    >
                      {fmtHour(h)}
                    </div>
                  ))}
                </div>

                {roomColumns.map((room) => {
                  const inRoom = dayGroups.filter((g) => ((g.room || '').trim() || NO_ROOM) === room);
                  const items = layoutRoom(inRoom);
                  const roomValue = room === NO_ROOM ? '' : room;
                  const formDays = dayKey;
                  return (
                    <div key={room} className="flex-1 min-w-[190px] relative border-l border-slate-200" style={{ height: gridHeight }}>
                      {/* Soat chiziqlari va bo'sh joylar (bosilsa guruh qo'shiladi) */}
                      {hours.map((h, i) => (
                        <button
                          key={h}
                          type="button"
                          onClick={() => openModalForSlot(fmtHour(h), fmtHour(Math.min(h + 2, 23)), formDays, roomValue)}
                          title={`${fmtHour(h)} ga guruh qo‘shish`}
                          className="group absolute left-0 right-0 border-t border-slate-100 hover:bg-indigo-50 transition flex items-start justify-end"
                          style={{ top: i * HOUR_H, height: HOUR_H }}
                        >
                          <Plus size={14} className="m-1.5 text-indigo-400 opacity-0 group-hover:opacity-100 transition" />
                        </button>
                      ))}

                      {/* Dars bloklari */}
                      {items.map(({ g, s: sMin, e: eMin, lane, lanes }) => (
                        <Link
                          key={g.id}
                          href={`/groups/${g.id}`}
                          className={`absolute rounded-lg px-2.5 py-1.5 text-white overflow-hidden shadow-sm hover:brightness-110 transition ${colorOf(g)}`}
                          style={{
                            top: ((sMin - gridStartHour * 60) / 60) * HOUR_H + 2,
                            height: Math.max(((eMin - sMin) / 60) * HOUR_H - 4, 34),
                            left: `calc(${(lane / lanes) * 100}% + 4px)`,
                            width: `calc(${100 / lanes}% - 8px)`,
                          }}
                          title={`${g.name} · ${g.teacher?.fullName || ''}`}
                        >
                          <p className="text-[13px] font-bold leading-tight truncate">{g.name}</p>
                          <p className="text-[11px] opacity-90 leading-tight truncate">
                            {g.teacher?.fullName || 'O‘qituvchi biriktirilmagan'}
                          </p>
                          <p className="text-[11px] opacity-90 leading-tight tabular-nums">
                            {g.startTime}–{g.endTime} · {g._count?.students || 0} o‘quvchi
                          </p>
                        </Link>
                      ))}
                    </div>
                  );
                })}
              </div>
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
                  {group.room && (
                    <div className="flex items-center gap-2">
                      <Users size={14} className="text-emerald-600 shrink-0" />
                      <span className="text-slate-500 truncate">
                        Xona: <strong className="text-slate-700 font-bold">{group.room}</strong>
                      </span>
                    </div>
                  )}
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
                    onClick={() => handleArchiveGroup(group)}
                    title="Arxivga olish (kurs tugadi)"
                    aria-label="Guruhni arxivga olish"
                    className="w-10 h-10 inline-flex items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:text-amber-600 hover:border-amber-300 hover:bg-amber-50 transition"
                  >
                    <Archive size={15} />
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

              {/* Xona */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Xona (ixtiyoriy)</label>
                <input
                  type="text"
                  list="room-options"
                  maxLength={60}
                  placeholder="Masalan: Cambridge xonasi"
                  value={formData.room}
                  onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 text-xs sm:text-sm focus:outline-none focus:border-indigo-500 transition"
                />
                <datalist id="room-options">
                  {knownRooms.map((r) => (
                    <option key={r} value={r} />
                  ))}
                </datalist>
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
                <div className="flex flex-wrap gap-2">
                  {WEEK.map((w) => {
                    const on = parseDays(formData.days).includes(w.key);
                    return (
                      <button
                        key={w.key}
                        type="button"
                        title={w.full}
                        aria-pressed={on}
                        onClick={() => {
                          const cur = new Set(parseDays(formData.days));
                          if (on) cur.delete(w.key);
                          else cur.add(w.key);
                          setFormData({ ...formData, days: WEEK_KEYS.filter((k) => cur.has(k)).join('-') });
                        }}
                        className={`h-10 min-w-[52px] px-3 rounded-xl border text-sm font-bold transition ${
                          on ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {w.key}
                      </button>
                    );
                  })}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[11px] font-semibold text-indigo-600">
                  <button type="button" onClick={() => setFormData({ ...formData, days: 'Dush-Chor-Jum' })} className="hover:underline">Toq kunlar</button>
                  <button type="button" onClick={() => setFormData({ ...formData, days: 'Sesh-Pay-Shan' })} className="hover:underline">Juft kunlar</button>
                  <button type="button" onClick={() => setFormData({ ...formData, days: 'Dush-Sesh-Chor-Pay-Jum-Shan' })} className="hover:underline">Har kuni</button>
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  {parseDays(formData.days).length
                    ? parseDays(formData.days).map((k) => WEEK.find((w) => w.key === k)!.full).join(', ')
                    : 'Kamida bitta kunni tanlang'}
                </p>
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
