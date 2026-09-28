'use client';

import React, { useState, useEffect } from 'react';
import { 
  Megaphone, 
  Plus, 
  Search, 
  Filter, 
  Pin, 
  Send, 
  Trash2, 
  Edit3, 
  Users, 
  GraduationCap, 
  Calendar, 
  AlertCircle, 
  CheckCircle2, 
  Bell, 
  Sparkles,
  Share2,
  X
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n/LanguageContext';
import { useTheme } from '@/lib/theme/ThemeContext';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  target: 'all' | 'students' | 'teachers' | 'parents';
  priority: 'low' | 'medium' | 'high';
  isPinned: boolean;
  createdAt: string;
  author: string;
  viewsCount?: number;
}

const initialAnnouncements: Announcement[] = [
  {
    id: 'ann-1',
    title: 'Navro‘z bayrami munosabati bilan dam olish kunlari',
    content: 'Hurmatli o‘quvchilar va o‘qituvchilar! 21-23 mart kunlari markazimizda darslar bo‘lmaydi. Barcha mashg‘ulotlar 24-mart dushanba kunidan odatdagi dars jadvali asosida davom etadi.',
    target: 'all',
    priority: 'high',
    isPinned: true,
    createdAt: '2026-03-18 10:30',
    author: 'EduYuz Rahbariyati',
    viewsCount: 142
  },
  {
    id: 'ann-2',
    title: 'Yangi "Full-Stack Dasturlash" guruhi uchun qabul ochildi',
    content: 'Markazimizda yangi amaliy Full-Stack (Next.js & NestJS) o‘quv kursi start olmoqda. Darslar haftasiga 3 kun bo‘lib o‘tadi. O‘z tanishlaringizni taklif qiling va 100 EduCoin bonusga ega bo‘ling!',
    target: 'students',
    priority: 'medium',
    isPinned: false,
    createdAt: '2026-03-22 15:45',
    author: 'Administrator',
    viewsCount: 98
  },
  {
    id: 'ann-3',
    title: 'O‘qituvchilar uchun haftalik metodik yig‘ilish',
    content: 'Shanba kuni soat 17:00 da o‘qituvchilar xonasida oylik yakuniy o‘zlashtirish va yangi interaktiv o‘yinlar bo‘yicha seminar bo‘lib o‘tadi. Barcha mentorlar qatnashishi shart.',
    target: 'teachers',
    priority: 'medium',
    isPinned: false,
    createdAt: '2026-03-24 09:15',
    author: 'O‘quv Bo‘limi Boshlig‘i',
    viewsCount: 35
  }
];

export default function AnnouncementsPage() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [targetFilter, setTargetFilter] = useState<'all' | 'students' | 'teachers' | 'parents'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newTarget, setNewTarget] = useState<'all' | 'students' | 'teachers' | 'parents'>('all');
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [sendTelegram, setSendTelegram] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load from localStorage or initial
  useEffect(() => {
    try {
      const saved = localStorage.getItem('eduyuz_announcements');
      if (saved) {
        setAnnouncements(JSON.parse(saved));
      } else {
        setAnnouncements(initialAnnouncements);
        localStorage.setItem('eduyuz_announcements', JSON.stringify(initialAnnouncements));
      }
    } catch {
      setAnnouncements(initialAnnouncements);
    }
  }, []);

  const saveAnnouncements = (data: Announcement[]) => {
    setAnnouncements(data);
    localStorage.setItem('eduyuz_announcements', JSON.stringify(data));
  };

  const handleCreateAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    const newAnn: Announcement = {
      id: 'ann-' + Date.now(),
      title: newTitle.trim(),
      content: newContent.trim(),
      target: newTarget,
      priority: newPriority,
      isPinned: false,
      createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
      author: 'Administrator',
      viewsCount: 0
    };

    const updated = [newAnn, ...announcements];
    saveAnnouncements(updated);

    setIsModalOpen(false);
    setNewTitle('');
    setNewContent('');

    // Trigger toast
    if (sendTelegram) {
      showToast('E‘lon saqlandi va Telegram orqali xabarnoma yuborildi! 🚀');
    } else {
      showToast('Yangi e‘lon muvaffaqiyatli chop etildi! ✅');
    }
  };

  const togglePin = (id: string) => {
    const updated = announcements.map(ann => 
      ann.id === id ? { ...ann, isPinned: !ann.isPinned } : ann
    );
    saveAnnouncements(updated);
  };

  const handleDelete = (id: string) => {
    if (confirm('Ushbu e‘lonni o‘chirmoqchimisiz?')) {
      const updated = announcements.filter(ann => ann.id !== id);
      saveAnnouncements(updated);
      showToast('E‘lon o‘chirildi');
    }
  };

  const handleSendTelegram = (ann: Announcement) => {
    showToast(`"${ann.title}" e‘loni Telegram bot orqali o‘quvchilar va guruhlarga yuborildi! 📲`);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Filter & Search logic
  const filtered = announcements.filter(ann => {
    const matchesSearch = 
      ann.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ann.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTarget = targetFilter === 'all' || ann.target === targetFilter;
    const matchesPriority = priorityFilter === 'all' || ann.priority === priorityFilter;
    return matchesSearch && matchesTarget && matchesPriority;
  }).sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const totalCount = announcements.length;
  const urgentCount = announcements.filter(a => a.priority === 'high').length;
  const studentCount = announcements.filter(a => a.target === 'students' || a.target === 'all').length;
  const teacherCount = announcements.filter(a => a.target === 'teachers' || a.target === 'all').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-emerald-400/30 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-200" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Sarlavha va Harakat tugmasi */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-600/10 text-indigo-500 border border-indigo-500/20">
              <Megaphone className="w-6 h-6" />
            </div>
            <h1 className={`text-2xl font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
              E‘lonlar va Yangiliklar Markazi
            </h1>
          </div>
          <p className={`text-sm mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            O‘quv markazining barcha muhim xabarlari, dam olish kunlari va yangiliklarini boshqaring
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/25 transition active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Yangi E‘lon Berish</span>
        </button>
      </div>

      {/* Statistika Kartochkalari */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className={`p-4 rounded-2xl border transition-all ${
          isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/60 border-slate-800'
        }`}>
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Jami E‘lonlar</span>
            <Bell className="w-4 h-4 text-indigo-400" />
          </div>
          <div className={`text-2xl font-bold mt-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>{totalCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Platformada faol</div>
        </div>

        <div className={`p-4 rounded-2xl border transition-all ${
          isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/60 border-slate-800'
        }`}>
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Shoshilinch Xabarlar</span>
            <AlertCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className={`text-2xl font-bold mt-2 ${isLight ? 'text-rose-600' : 'text-rose-400'}`}>{urgentCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Yuqori muhimlikda</div>
        </div>

        <div className={`p-4 rounded-2xl border transition-all ${
          isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/60 border-slate-800'
        }`}>
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>O‘quvchilar Uchun</span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <div className={`text-2xl font-bold mt-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>{studentCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Mobil ilovada ko‘rinadi</div>
        </div>

        <div className={`p-4 rounded-2xl border transition-all ${
          isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/60 border-slate-800'
        }`}>
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>O‘qituvchilar Uchun</span>
            <GraduationCap className="w-4 h-4 text-amber-400" />
          </div>
          <div className={`text-2xl font-bold mt-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>{teacherCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Mentorlar kabinetida</div>
        </div>
      </div>

      {/* Qidiruv va Filterlar */}
      <div className={`p-4 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-4 ${
        isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/60 border-slate-800'
      }`}>
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="E‘lonlarni qidirish..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-indigo-500/40 ${
              isLight 
                ? 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400' 
                : 'bg-slate-800/80 border-slate-700 text-white placeholder-slate-500'
            }`}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Auditoriya filteri */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-800/40 border border-slate-700/50 text-xs">
            <button
              onClick={() => setTargetFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                targetFilter === 'all' 
                  ? 'bg-indigo-600 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Barchasi
            </button>
            <button
              onClick={() => setTargetFilter('students')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                targetFilter === 'students' 
                  ? 'bg-indigo-600 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              O‘quvchilarga
            </button>
            <button
              onClick={() => setTargetFilter('teachers')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                targetFilter === 'teachers' 
                  ? 'bg-indigo-600 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              O‘qituvchilarga
            </button>
          </div>

          {/* Muhimlik filteri */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as any)}
            className={`px-3 py-2 rounded-xl text-xs font-medium border focus:outline-none ${
              isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-slate-800 border-slate-700 text-slate-300'
            }`}
          >
            <option value="all">Barcha muhimlik</option>
            <option value="high">🔴 Shoshilinch</option>
            <option value="medium">🟡 Muhim</option>
            <option value="low">🔵 Oddiy</option>
          </select>
        </div>
      </div>

      {/* E‘lonlar Ro‘yxati */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className={`p-12 text-center rounded-3xl border ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900/40 border-slate-800'
          }`}>
            <Megaphone className="w-12 h-12 text-slate-500 mx-auto mb-3 opacity-40" />
            <h3 className={`text-base font-semibold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
              E‘lonlar topilmadi
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Qidiruv so‘rovingiz bo‘yicha e‘lon mavjud emas yoki hali e‘lon qo‘shilmagan
            </p>
          </div>
        ) : (
          filtered.map((ann) => {
            const isHigh = ann.priority === 'high';
            const isMedium = ann.priority === 'medium';

            return (
              <div
                key={ann.id}
                className={`p-5 md:p-6 rounded-2xl border transition-all duration-200 relative overflow-hidden group ${
                  ann.isPinned
                    ? isLight 
                      ? 'bg-indigo-50/70 border-indigo-200 shadow-md shadow-indigo-100' 
                      : 'bg-indigo-950/20 border-indigo-500/40 shadow-lg shadow-indigo-950/20'
                    : isLight
                      ? 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                      : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Tepada qadalganlik indikatori */}
                {ann.isPinned && (
                  <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[10px] font-bold px-3 py-0.5 rounded-bl-xl flex items-center gap-1">
                    <Pin className="w-3 h-3 fill-white" />
                    <span>Qadalgan</span>
                  </div>
                )}

                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    {/* Teglar qatori */}
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Priority Badge */}
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold flex items-center gap-1 ${
                        isHigh
                          ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                          : isMedium
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          isHigh ? 'bg-rose-500' : isMedium ? 'bg-amber-400' : 'bg-blue-400'
                        }`}></span>
                        {isHigh ? 'Shoshilinch' : isMedium ? 'Muhim' : 'Oddiy xabar'}
                      </span>

                      {/* Target Badge */}
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                        isLight ? 'bg-slate-100 text-slate-600' : 'bg-slate-800 text-slate-300'
                      }`}>
                        {ann.target === 'all' && '👥 Barcha uchun'}
                        {ann.target === 'students' && '🎓 O‘quvchilarga'}
                        {ann.target === 'teachers' && '👨‍🏫 O‘qituvchilarga'}
                        {ann.target === 'parents' && '👨‍👩‍👧 Ota-onalarga'}
                      </span>

                      {/* Sana */}
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {ann.createdAt}
                      </span>
                    </div>

                    {/* Sarlavha */}
                    <h2 className={`text-lg font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      {ann.title}
                    </h2>

                    {/* Matn */}
                    <p className={`text-sm leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                      {ann.content}
                    </p>

                    <div className="pt-2 text-xs text-slate-500 flex items-center gap-4">
                      <span>Muallif: <b className={isLight ? 'text-slate-700' : 'text-slate-400'}>{ann.author}</b></span>
                      {ann.viewsCount !== undefined && (
                        <span>Ko‘rishlar: <b>{ann.viewsCount} ta</b></span>
                      )}
                    </div>
                  </div>

                  {/* Amallar tugmalari */}
                  <div className="flex items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800 shrink-0">
                    <button
                      onClick={() => togglePin(ann.id)}
                      className={`p-2 rounded-xl border text-xs transition ${
                        ann.isPinned
                          ? 'bg-indigo-600/20 text-indigo-400 border-indigo-500/30'
                          : isLight 
                            ? 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200' 
                            : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:text-white'
                      }`}
                      title={ann.isPinned ? 'Qadalishni bekor qilish' : 'Tepaga qadash'}
                    >
                      <Pin className={`w-4 h-4 ${ann.isPinned ? 'fill-indigo-400' : ''}`} />
                    </button>

                    <button
                      onClick={() => handleSendTelegram(ann)}
                      className="p-2 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-400 text-xs transition"
                      title="Telegram orqali tarqatish"
                    >
                      <Send className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDelete(ann.id)}
                      className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs transition"
                      title="O‘chirish"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Yangi E‘lon Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden ${
            isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
          }`}>
            <div className={`p-5 border-b flex items-center justify-between ${
              isLight ? 'border-slate-200' : 'border-slate-800'
            }`}>
              <div className="flex items-center gap-2 font-bold text-base">
                <Megaphone className="w-5 h-5 text-indigo-500" />
                <span>Yangi E‘lon Chop Etish</span>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAnnouncement} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-400">
                  E‘lon Sarlavhasi *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: Navro‘z bayrami munosabati bilan dam olish..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-800/80 border-slate-700 text-white'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-400">
                    Kimlar Uchun (Auditoriya)
                  </label>
                  <select
                    value={newTarget}
                    onChange={(e) => setNewTarget(e.target.value as any)}
                    className={`w-full px-3 py-2.5 rounded-xl text-xs border focus:outline-none ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-800/80 border-slate-700 text-white'
                    }`}
                  >
                    <option value="all">👥 Barcha (Umumiy)</option>
                    <option value="students">🎓 Faqat O‘quvchilar</option>
                    <option value="teachers">👨‍🏫 Faqat O‘qituvchilar</option>
                    <option value="parents">👨‍👩‍👧 Faqat Ota-onalar</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-400">
                    Muhimlik Darajasi
                  </label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    className={`w-full px-3 py-2.5 rounded-xl text-xs border focus:outline-none ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-800/80 border-slate-700 text-white'
                    }`}
                  >
                    <option value="medium">🟡 Muhim</option>
                    <option value="high">🔴 Shoshilinch</option>
                    <option value="low">🔵 Oddiy xabar</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-400">
                  Batafsil Matn / Xabar *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="E‘lonning to‘liq matnini shu yerga yozing..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className={`w-full p-3.5 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-800/80 border-slate-700 text-white'
                  }`}
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="telegramCheck"
                  checked={sendTelegram}
                  onChange={(e) => setSendTelegram(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-700 bg-slate-800"
                />
                <label htmlFor="telegramCheck" className="text-xs text-slate-400 cursor-pointer select-none">
                  Telegram Bot orqali ota-onalar va o‘quvchilarga ham darhol yetkazilsin
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800/60">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold ${
                    isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  Bekor qilish
                </button>

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 active:scale-95 transition"
                >
                  E‘lonni Chop Etish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
