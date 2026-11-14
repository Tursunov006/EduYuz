'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import '@/lib/api'; // axios uchun API manzili va token sozlamalari
import { BookOpen, Users, Layers } from 'lucide-react';
import LmsView from '@/components/lms/LmsView';
import AcademicHubNav from '@/components/AcademicHubNav';

export default function LmsPage() {
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const getHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    async function fetchGroups() {
      try {
        setLoading(true);
        const res = await axios.get('/groups', { headers: getHeaders() });
        const list = res.data || [];
        setGroups(list);
        if (list.length > 0) {
          setSelectedGroupId(list[0].id);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchGroups();
  }, []);

  const selectedGroup = groups.find((g) => g.id === selectedGroupId);

  return (
    <div className="space-y-6">
      <AcademicHubNav />

      {/* Sarlavha va Guruh tanlash filtri */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-[26px] font-bold text-slate-900 leading-tight">Ta’lim va darslar</h1>
          <p className="text-xs text-slate-500 mt-1">
            Guruhlar bo'yicha video darslar, konspektlar va uyga vazifalar nazorati
          </p>
        </div>

        {/* Guruh tanlash dropdown */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-slate-500 whitespace-nowrap">Guruhni tanlang:</label>
          <select
            value={selectedGroupId}
            onChange={(e) => setSelectedGroupId(e.target.value)}
            className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 font-medium focus:outline-none focus:border-indigo-500 shadow-sm min-w-[200px]"
          >
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name} ({g.course?.title || 'Kurs'})
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-500">Guruhlar yuklanmoqda...</div>
      ) : groups.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3">
          <Layers size={36} className="mx-auto text-slate-400" />
          <h3 className="text-base font-semibold text-slate-900">Hozircha birorta ham guruh mavjud emas</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Avval "Guruhlar" bo'limida yangi guruh oching.
          </p>
        </div>
      ) : selectedGroup ? (
        <LmsView
          groupId={selectedGroup.id}
          groupName={selectedGroup.name}
          students={selectedGroup.students}
        />
      ) : null}
    </div>
  );
}
