'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { CalendarCheck, Check, X, Clock, Save, CheckCheck } from 'lucide-react';

interface Student {
  id: string;
  fullName: string;
  phone: string;
}

interface Group {
  id: string;
  name: string;
}

type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE';

export default function AttendancePage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const getHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // 1. Guruhlarni yuklab olish
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const res = await axios.get('http://localhost:3000/api/v1/groups', {
          headers: getHeaders(),
        });
        setGroups(res.data);
        if (res.data.length > 0) {
          setSelectedGroup(res.data[0].id);
        }
      } catch (err) {
        console.error('Guruhlarni yuklashda xatolik:', err);
      }
    };
    fetchGroups();
  }, []);

  // 2. Tanlangan guruh o'quvchilarini va o'sha kungi mavjud davomatni yuklash
  const fetchGroupStudents = async () => {
    if (!selectedGroup) return;
    try {
      setLoading(true);
      const [groupRes, studentsRes, prevAttendanceRes] = await Promise.all([
        axios.get(`http://localhost:3000/api/v1/groups/${selectedGroup}`, { headers: getHeaders() }).catch(() => null),
        axios.get('http://localhost:3000/api/v1/students', { headers: getHeaders() }).catch(() => ({ data: [] })),
        axios.get(`http://localhost:3000/api/v1/attendance/group/${selectedGroup}?date=${date}`, { headers: getHeaders() }).catch(() => ({ data: [] })),
      ]);

      let studentList: Student[] = [];
      if (groupRes?.data?.students && groupRes.data.students.length > 0) {
        studentList = groupRes.data.students.map((item: any) => item.student);
      } else {
        studentList = studentsRes.data;
      }
      setStudents(studentList);

      // Agar avval saqlangan davomat bo'lsa, o'shani ochamiz
      const initial: Record<string, AttendanceStatus> = {};
      const savedMap: Record<string, AttendanceStatus> = {};
      (prevAttendanceRes.data || []).forEach((rec: any) => {
        savedMap[rec.studentId] = rec.status.toUpperCase() as AttendanceStatus;
      });

      studentList.forEach((s: Student) => {
        initial[s.id] = savedMap[s.id] || 'PRESENT';
      });
      setAttendance(initial);
    } catch (err) {
      console.error("O'quvchilarni yuklashda xatolik:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroupStudents();
  }, [selectedGroup, date]);

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const markAllPresent = () => {
    const allPresent: Record<string, AttendanceStatus> = {};
    students.forEach((s) => {
      allPresent[s.id] = 'PRESENT';
    });
    setAttendance(allPresent);
  };

  // 3. Davomatni saqlash
  const handleSaveAttendance = async () => {
    try {
      setSaving(true);
      const payload = {
        groupId: selectedGroup,
        date: date,
        records: Object.entries(attendance).map(([studentId, status]) => ({
          studentId,
          status,
        })),
      };

      await axios.post('http://localhost:3000/api/v1/attendance/mark', payload, {
        headers: getHeaders(),
      });
      alert('Davomat muvaffaqiyatli saqlandi!');
    } catch (err: any) {
      console.error('Davomat saqlashda xatolik:', err);
      const msg = err.response?.data?.error || err.response?.data?.message || 'Davomat saqlashda xatolik yuz berdi!';
      alert(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setSaving(false);
    }
  };

  // Statistika hisobi
  const totalCount = students.length;
  const presentCount = Object.values(attendance).filter((s) => s === 'PRESENT').length;
  const absentCount = Object.values(attendance).filter((s) => s === 'ABSENT').length;
  const lateCount = Object.values(attendance).filter((s) => s === 'LATE').length;

  return (
    <div className="space-y-6">
      {/* Sarlavha */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <CalendarCheck className="text-indigo-500" /> Kunlik Davomat
          </h1>
          <p className="text-sm text-slate-400">Guruh bo‘yicha davomatni belgilash va saqlash</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={markAllPresent}
            disabled={students.length === 0}
            className="flex items-center gap-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 px-4 py-2.5 rounded-xl text-sm font-medium transition shadow-sm"
          >
            <CheckCheck size={18} className="text-emerald-400" /> Hammani "Keldi" qilish
          </button>

          <button
            onClick={handleSaveAttendance}
            disabled={saving || students.length === 0}
            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition shadow-lg shadow-indigo-600/20"
          >
            <Save size={18} /> {saving ? 'Saqlanmoqda...' : 'Davomatni saqlash'}
          </button>
        </div>
      </div>

      {/* Guruh, Sana va Jonli Statistika */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl md:col-span-1">
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Guruhni tanlang</label>
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
          >
            {groups.length === 0 ? (
              <option value="">Guruhlar topilmadi</option>
            ) : (
              groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))
            )}
          </select>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl md:col-span-1">
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Sana</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Jonli hisob-kitoblar */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl md:col-span-2 flex items-center justify-around text-center">
          <div>
            <span className="text-xs text-slate-400">Jami</span>
            <p className="text-xl font-bold text-white">{totalCount}</p>
          </div>
          <div className="border-r border-slate-800 h-8"></div>
          <div>
            <span className="text-xs text-emerald-400">Keldi</span>
            <p className="text-xl font-bold text-emerald-400">{presentCount}</p>
          </div>
          <div className="border-r border-slate-800 h-8"></div>
          <div>
            <span className="text-xs text-rose-400">Kelmadi</span>
            <p className="text-xl font-bold text-rose-400">{absentCount}</p>
          </div>
          <div className="border-r border-slate-800 h-8"></div>
          <div>
            <span className="text-xs text-amber-400">Kechikdi</span>
            <p className="text-xl font-bold text-amber-400">{lateCount}</p>
          </div>
        </div>
      </div>

      {/* Davomat jadvali */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400">
                <th className="p-4 font-medium">O‘quvchi</th>
                <th className="p-4 font-medium">Telefon</th>
                <th className="p-4 font-medium text-right">Holatni belgilash</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={3} className="p-12 text-center text-slate-500">
                    O'quvchilar yuklanmoqda...
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-12 text-center text-slate-500">
                    Ushbu guruhda o‘quvchilar mavjud emas
                  </td>
                </tr>
              ) : (
                students.map((student) => {
                  const currentStatus = attendance[student.id] || 'PRESENT';
                  return (
                    <tr key={student.id} className="hover:bg-slate-800/40 transition">
                      <td className="p-4 font-medium text-slate-100">{student.fullName}</td>
                      <td className="p-4 text-slate-400">{student.phone || '-'}</td>
                      <td className="p-4 text-right">
                        <div className="inline-flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
                          {/* Keldi */}
                          <button
                            type="button"
                            onClick={() => handleStatusChange(student.id, 'PRESENT')}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                              currentStatus === 'PRESENT'
                                ? 'bg-emerald-500 text-white shadow-sm'
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            <Check size={14} /> Keldi
                          </button>

                          {/* Kelmadi */}
                          <button
                            type="button"
                            onClick={() => handleStatusChange(student.id, 'ABSENT')}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                              currentStatus === 'ABSENT'
                                ? 'bg-rose-500 text-white shadow-sm'
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            <X size={14} /> Kelmadi
                          </button>

                          {/* Sababli / Kechikdi */}
                          <button
                            type="button"
                            onClick={() => handleStatusChange(student.id, 'LATE')}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                              currentStatus === 'LATE'
                                ? 'bg-amber-500 text-white shadow-sm'
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            <Clock size={14} /> Kechikdi
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
    </div>
  );
}
