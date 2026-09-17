'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { BookOpen, Plus, Calendar, Clock, User, Layers } from 'lucide-react';

interface Group {
  id: string;
  name: string;
  days: string[] | string;
  startTime: string;
  endTime: string;
  course?: { title: string; price: number };
  teacher?: { fullName: string };
  _count?: { students: number };
}

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Yangi guruh formasi
  const [formData, setFormData] = useState({
    name: '',
    startTime: '14:00',
    endTime: '16:00',
    days: 'Dush-Chor-Jum',
  });

  const getHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:3000/api/v1/groups', {
        headers: getHeaders(),
      });
      setGroups(res.data);
    } catch (err) {
      console.error('Guruhlarni yuklashda xatolik:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:3000/api/v1/groups', formData, {
        headers: getHeaders(),
      });
      setIsModalOpen(false);
      setFormData({ name: '', startTime: '14:00', endTime: '16:00', days: 'Dush-Chor-Jum' });
      fetchGroups();
    } catch (err: any) {
      const msg = err.response?.data?.error || err.response?.data?.message || 'Guruh yaratishda xatolik yuz berdi!';
      alert(Array.isArray(msg) ? msg.join(', ') : msg);
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Sarlavha va Guruh ochish tugmasi */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <BookOpen className="text-indigo-500" /> Guruhlar Jadvali
          </h1>
          <p className="text-sm text-slate-400">Markazdagi barcha faol guruhlar va dars vaqtlari</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition shadow-lg shadow-indigo-600/20"
        >
          <Plus size={18} /> Yangi guruh ochish
        </button>
      </div>

      {/* Guruhlar grid ko'rinishida */}
      {loading ? (
        <div className="p-12 text-center text-slate-500">Guruhlar yuklanmoqda...</div>
      ) : groups.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/50 border border-slate-800 rounded-2xl">
          <BookOpen className="mx-auto text-slate-600 mb-3" size={36} />
          <p className="text-slate-400 font-medium">Hozircha faol guruhlar mavjud emas</p>
          <p className="text-xs text-slate-600 mt-1">Yangi guruh ochish tugmasi orqali birinchi guruhni qo'shing</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {groups.map((group) => (
            <Link
              key={group.id}
              href={`/groups/${group.id}`}
              className="block bg-slate-900 border border-slate-800 hover:border-indigo-500/50 p-5 rounded-2xl transition shadow-sm space-y-4 group cursor-pointer"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <span className="inline-block whitespace-nowrap text-xs font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-md">
                    {group.course?.title || 'Umumiy Kurs'}
                  </span>
                  <h3 className="text-lg font-bold text-slate-100 mt-2.5 group-hover:text-indigo-300 transition" title={group.name}>
                    {group.name}
                  </h3>
                </div>
                <div className="shrink-0 flex items-center gap-1.5 text-xs text-slate-300 bg-slate-800/90 border border-slate-700/50 px-2.5 py-1.5 rounded-lg whitespace-nowrap shadow-inner">
                  <Layers size={14} className="text-indigo-400 shrink-0" />
                  <span>{group._count?.students || 0} o‘quvchi</span>
                </div>
              </div>

              <div className="space-y-2.5 pt-3 border-t border-slate-800/80 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <Calendar size={15} className="text-indigo-400/80 shrink-0" />
                  <span className="font-medium text-slate-300">
                    {Array.isArray(group.days) ? group.days.join(', ') : group.days}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={15} className="text-amber-400/80 shrink-0" />
                  <span className="font-medium text-slate-300">
                    {group.startTime} - {group.endTime}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <User size={15} className="text-slate-400 shrink-0" />
                  <span className="text-slate-400">
                    O‘qituvchi: <strong className="text-slate-200 font-semibold">{group.teacher?.fullName || 'Biriktirilmagan'}</strong>
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Yangi guruh qo'shish modali */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-slate-100">Yangi guruh yaratish</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Guruh nomi / kodi</label>
                <input
                  required
                  type="text"
                  placeholder="Masalan: Frontend 04"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Dars kunlari</label>
                <select
                  value={formData.days}
                  onChange={(e) => setFormData({ ...formData, days: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value="Dush-Chor-Jum">Dushanba / Chorshanba / Juma</option>
                  <option value="Sesh-Pay-Shan">Seshanba / Payshanba / Shanba</option>
                  <option value="Har kuni">Har kuni (Intensiv)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Boshlanish vaqti</label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Tugash vaqti</label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-800 text-slate-300 rounded-xl text-sm hover:bg-slate-700 transition"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition"
                >
                  Yaratish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
