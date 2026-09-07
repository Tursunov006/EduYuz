'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { 
  ArrowLeft, 
  UserPlus, 
  Users, 
  Calendar, 
  Clock, 
  User, 
  CreditCard, 
  Trash2, 
  Phone,
  Layers,
  Sparkles,
  BookOpen
} from 'lucide-react';
import LmsView from '@/components/lms/LmsView';

export default function GroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const groupId = resolvedParams.id;

  const [group, setGroup] = useState<any>(null);
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [billingLoading, setBillingLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'students' | 'lms'>('students');

  const getHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  async function loadGroupData() {
    try {
      setLoading(true);
      const [grpRes, stdsRes] = await Promise.all([
        axios.get(`http://localhost:3000/api/v1/groups/${groupId}`, { headers: getHeaders() }),
        axios.get('http://localhost:3000/api/v1/students', { headers: getHeaders() }),
      ]);
      setGroup(grpRes.data);
      setAllStudents(stdsRes.data || []);
      if (stdsRes.data && stdsRes.data[0]) {
        setSelectedStudentId(stdsRes.data[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadGroupData();
  }, [groupId]);

  async function handleAddStudent(e: React.FormEvent) {
    e.preventDefault();
    try {
      await axios.post(
        `http://localhost:3000/api/v1/groups/${groupId}/students`,
        { studentId: selectedStudentId },
        { headers: getHeaders() }
      );
      setIsAddModalOpen(false);
      loadGroupData();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'O\'quvchini biriktirishda xatolik';
      alert(Array.isArray(msg) ? msg.join(', ') : msg);
    }
  }

  async function handleRemoveStudent(studentId: string, studentName: string) {
    if (!confirm(`Haqiqatan ham "${studentName}"ni ushbu guruhdan chiqarmoqchimisiz?`)) return;
    try {
      await axios.delete(
        `http://localhost:3000/api/v1/groups/${groupId}/students/${studentId}`,
        { headers: getHeaders() }
      );
      loadGroupData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Xatolik yuz berdi');
    }
  }

  // Oylik to'lov yechish (Avtomatik Billing)
  async function handleChargeMonthly() {
    const price = Number(group?.course?.price || 0);
    const count = group?.students?.length || 0;
    if (count === 0) return alert('Guruhda o\'quvchilar yo\'q!');

    if (!confirm(`Ushbu guruhdagi ${count} ta o'quvchining har biridan ${price.toLocaleString()} so'm oylik to'lov yechilsinmi?`)) {
      return;
    }

    try {
      setBillingLoading(true);
      const res = await axios.post(
        'http://localhost:3000/api/v1/payments/charge-monthly',
        { groupId },
        { headers: getHeaders() }
      );
      alert(res.data.message);
      loadGroupData();
    } catch (err: any) {
      alert('To\'lov yechishda xatolik: ' + (err.response?.data?.message || err.message));
    } finally {
      setBillingLoading(false);
    }
  }

  if (loading) {
    return <div className="p-12 text-center text-slate-500">Guruh ma'lumotlari yuklanmoqda...</div>;
  }

  if (!group) {
    return <div className="p-12 text-center text-slate-500">Guruh topilmadi</div>;
  }

  // Guruhda hali mavjud bo'lmagan o'quvchilar
  const currentStudentIds = new Set((group.students || []).map((item: any) => item.studentId));
  const availableStudents = allStudents.filter((s) => !currentStudentIds.has(s.id));

  return (
    <div className="space-y-6">
      {/* Yuqori navigatsiya va Sarlavha */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link
            href="/groups"
            className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-indigo-400 transition mb-2"
          >
            <ArrowLeft size={14} /> Guruhlar ro'yxatiga qaytish
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            {group.name}
            <span className="text-xs font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-md">
              {group.course?.title || 'Kurs'}
            </span>
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleChargeMonthly}
            disabled={billingLoading}
            className="flex items-center gap-2 bg-amber-600/20 border border-amber-500/30 hover:bg-amber-600/30 text-amber-300 px-4 py-2.5 rounded-xl text-sm font-medium transition shadow-sm"
          >
            <Sparkles size={16} /> {billingLoading ? 'Yechilmoqda...' : 'Oylik to\'lovni yechish'}
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium shadow-lg shadow-indigo-600/20 transition-all"
          >
            <UserPlus size={18} /> O'quvchi biriktirish
          </button>
        </div>
      </div>

      {/* Guruh tafsilotlari kartasi */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
            <User size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-400">O'qituvchi</p>
            <p className="text-sm font-semibold text-white">{group.teacher?.fullName || 'Biriktirilmagan'}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-400">Dars vaqti</p>
            <p className="text-sm font-semibold text-white">{group.startTime} - {group.endTime}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
            <Calendar size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-400">Dars kunlari</p>
            <p className="text-sm font-semibold text-white">
              {Array.isArray(group.days) ? group.days.join(', ') : group.days}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
            <CreditCard size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-400">Oylik to'lov narxi</p>
            <p className="text-sm font-semibold text-emerald-400">
              {Number(group.course?.price || 0).toLocaleString()} so'm
            </p>
          </div>
        </div>
      </div>

      {/* Tab Navigatsiyasi: O'quvchilar vs LMS */}
      <div className="flex border-b border-slate-800 gap-2">
        <button
          onClick={() => setActiveTab('students')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition ${
            activeTab === 'students'
              ? 'border-indigo-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users size={18} />
          Guruh O'quvchilari ({group.students?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('lms')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition ${
            activeTab === 'lms'
              ? 'border-indigo-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen size={18} />
          Darslar & Uyga vazifalar (LMS)
        </button>
      </div>

      {activeTab === 'students' ? (
        /* Guruh O'quvchilari Jadvali */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm space-y-4 p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Layers size={18} className="text-indigo-400" />
              Guruhdagi O'quvchilar ({group.students?.length || 0})
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-medium">
                <tr>
                  <th className="py-3 px-4">O'quvchi F.I.SH</th>
                  <th className="py-3 px-4">Telefon</th>
                  <th className="py-3 px-4">Ota-onasi</th>
                  <th className="py-3 px-4">Balans</th>
                  <th className="py-3 px-4">Qo'shilgan sana</th>
                  <th className="py-3 px-4 text-right">Amal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {!group.students || group.students.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-500">
                      Ushbu guruhda hozircha o'quvchilar yo'q. "O'quvchi biriktirish" tugmasi orqali qo'shing.
                    </td>
                  </tr>
                ) : (
                  group.students.map((item: any) => {
                    const st = item.student;
                    if (!st) return null;
                    return (
                      <tr key={st.id} className="hover:bg-slate-800/30 transition">
                        <td className="py-4 px-4 font-semibold text-white">{st.fullName}</td>
                        <td className="py-4 px-4 text-slate-300">{st.phone || '-'}</td>
                        <td className="py-4 px-4 text-slate-300">
                          <span className="inline-flex items-center gap-1.5">
                            <Phone size={14} className="text-slate-500" />
                            {st.parentPhone}
                          </span>
                        </td>
                        <td className={`py-4 px-4 font-semibold ${Number(st.balance) < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {Number(st.balance).toLocaleString()} so'm
                        </td>
                        <td className="py-4 px-4 text-slate-400">
                          {new Date(item.joinedAt).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <button
                            onClick={() => handleRemoveStudent(st.id, st.fullName)}
                            title="Guruhdan chiqarish"
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <LmsView groupId={groupId} groupName={group.name} students={group.students} />
      )}

      {/* O'quvchi biriktirish Modali */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <h2 className="text-xl font-bold text-white">Guruhga O'quvchi Biriktirish</h2>
            <form onSubmit={handleAddStudent} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Mavjud o'quvchilardan birini tanlang
                </label>
                {availableStudents.length === 0 ? (
                  <p className="text-xs text-amber-400 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
                    Barcha mavjud o'quvchilar allaqachon ushbu guruhga biriktirilgan yoki bazada o'quvchilar yo'q.
                  </p>
                ) : (
                  <select
                    required
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    {availableStudents.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.fullName} ({s.phone || s.parentPhone})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-white"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={availableStudents.length === 0}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-5 py-2 rounded-xl text-sm font-medium transition"
                >
                  Biriktirish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
