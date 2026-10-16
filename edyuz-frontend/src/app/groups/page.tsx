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
              <BookOpen className="text-cyan-400" /> Guruhlar va Kurslar
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm">
              Markazdagi barcha dars guruhlari, o'qituvchilar va fan yo'nalishlari jadvali
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

      {/* 2. Qidiruv va Tezkor Filtrlar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>Ko'rsatilmoqda: <strong className="text-white font-bold">{filteredGroups.length}</strong> ta guruh</span>
        </div>
      </div>

      {/* 3. Next-Gen EdTech Guruh Kartalari Grid */}
      {loading ? (
        <div className="p-16 text-center text-slate-500 text-sm">Guruhlar yuklanmoqda...</div>
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
