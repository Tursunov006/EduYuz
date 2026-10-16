'use client';

import { useState, useEffect } from 'react';
import { 
  UserPlus, Phone, MessageSquare, ArrowRight, Plus, Search, 
  CheckCircle2, Clock, Sparkles, Filter, Trash2, Send, ExternalLink, X
} from 'lucide-react';
import { apiFetch } from '@/lib/api';

type LeadStage = 'new' | 'contacted' | 'trial' | 'enrolled';

interface Lead {
  id: string;
  fullName: string;
  phone: string;
  courseInterest: string;
  source: 'Instagram' | 'Telegram' | 'Tavsiya' | 'Sayt';
  stage: LeadStage;
  createdAt: string;
  note?: string;
}

const INITIAL_LEADS: Lead[] = [
  {
    id: 'l-1',
    fullName: 'Azizbek Normurodov',
    phone: '+998901239988',
    courseInterest: 'Frontend Dasturlash (React)',
    source: 'Instagram',
    stage: 'new',
    createdAt: 'Bugun, 10:30',
    note: 'Kechki guruh so‘radi',
  },
  {
    id: 'l-2',
    fullName: 'Malika Raximova',
    phone: '+998934447711',
    courseInterest: 'Ingliz tili (IELTS)',
    source: 'Telegram',
    stage: 'contacted',
    createdAt: 'Kecha, 16:45',
    note: 'Narxlar haqida ma’lumot berildi',
  },
  {
    id: 'l-3',
    fullName: 'Javohir Tursunov',
    phone: '+998998882233',
    courseInterest: 'Python Backend',
    source: 'Tavsiya',
    stage: 'trial',
    createdAt: '2 kun oldin',
    note: 'Shanba kuni soat 14:00 da sinov darsiga keladi',
  },
];

const STAGES: { key: LeadStage; title: string; badgeColor: string; borderColor: string }[] = [
  { 
    key: 'new', 
    title: 'Yangi Murojaatlar', 
    badgeColor: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
    borderColor: 'border-t-cyan-500'
  },
  { 
    key: 'contacted', 
    title: 'Aloqaga Chiqildi', 
    badgeColor: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    borderColor: 'border-t-amber-500'
  },
  { 
    key: 'trial', 
    title: 'Sinov Darsiga Yozildi', 
    badgeColor: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    borderColor: 'border-t-purple-500'
  },
  { 
    key: 'enrolled', 
    title: 'O‘quvchiga Aylandi', 
    badgeColor: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    borderColor: 'border-t-emerald-500'
  },
];

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [centers, setCenters] = useState<any[]>([]);
  const [convertingId, setConvertingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    fullName: '',
    phone: '+998',
    courseInterest: 'Frontend Dasturlash',
    source: 'Instagram' as Lead['source'],
    note: '',
  });

  useEffect(() => {
    const saved = localStorage.getItem('eduyuz_leads_v1');
    if (saved) {
      try {
        setLeads(JSON.parse(saved));
      } catch {
        setLeads(INITIAL_LEADS);
      }
    } else {
      setLeads(INITIAL_LEADS);
    }

    apiFetch('/centers').then((res) => setCenters(res || [])).catch(() => {});
  }, []);

  const saveLeads = (updated: Lead[]) => {
    setLeads(updated);
    localStorage.setItem('eduyuz_leads_v1', JSON.stringify(updated));
  };

  const handleAddLead = (e: React.FormEvent) => {
    e.preventDefault();
    const newLead: Lead = {
      id: `lead-${Date.now()}`,
      fullName: form.fullName,
      phone: form.phone,
      courseInterest: form.courseInterest,
      source: form.source,
      stage: 'new',
      createdAt: 'Hozirgina',
      note: form.note,
    };
    saveLeads([newLead, ...leads]);
    setIsModalOpen(false);
    setForm({ fullName: '', phone: '+998', courseInterest: 'Frontend Dasturlash', source: 'Instagram', note: '' });
  };

  const moveStage = (id: string, nextStage: LeadStage) => {
    const updated = leads.map((l) => (l.id === id ? { ...l, stage: nextStage } : l));
    saveLeads(updated);
  };

  const deleteLead = (id: string) => {
    if (!confirm('Ushbu murojaatni o‘chirmoqchimisiz?')) return;
    saveLeads(leads.filter((l) => l.id !== id));
  };

  // Lidni haqiqiy O'quvchiga aylantirish (Bazaga yozish)
  const convertToStudent = async (lead: Lead) => {
    try {
      setConvertingId(lead.id);
      const centerId = centers[0]?.id;
      if (!centerId) {
        alert('Markaz topilmadi, iltimos tizimni yangilang');
        return;
      }

      await apiFetch('/students', {
        method: 'POST',
        body: JSON.stringify({
          centerId,
          fullName: lead.fullName,
          phone: lead.phone,
          parentPhone: lead.phone,
          balance: 0,
          status: 'active',
        }),
      });

      moveStage(lead.id, 'enrolled');
      alert(`🎉 ${lead.fullName} muvaffaqiyatli O'quvchilar bazasiga qo'shildi!`);
    } catch (err: any) {
      alert(err.message || 'O‘quvchiga aylantirishda xatolik');
    } finally {
      setConvertingId(null);
    }
  };

  const filteredLeads = leads.filter(
    (l) =>
      l.fullName.toLowerCase().includes(search.toLowerCase()) ||
      l.phone.includes(search) ||
      l.courseInterest.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 sm:space-y-8 pb-12">
      
      {/* 1. Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900/95 to-indigo-950/60 border border-slate-800/80 p-5 sm:p-8 shadow-2xl backdrop-blur-xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-cyan-600/15 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-semibold">
              <Sparkles size={13} /> Sotuv va Marketing Voronkasi (Kanban)
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
              <UserPlus className="text-cyan-400" /> Lidlar va Murojaatlar
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm max-w-xl">
              Instagram, Telegram va qo'ng'iroq orqali kelgan yangi mijozlarni sinov darsiga yozing va bir tugma bilan o'quvchiga aylantiring.
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all shadow-xl shadow-purple-600/30 hover:scale-[1.02] active:scale-95"
          >
            <Plus size={16} /> + Yangi Lid Qo'shish
          </button>
        </div>
      </div>

      {/* 2. Qidiruv va Konversiya Ko'rsatkichlari */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Ism, telefon yoki kurs bo'yicha qidirish..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-800 rounded-2xl text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="px-3.5 py-2 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300">
            Jami murojaatlar: <strong className="text-white font-bold">{leads.length} ta</strong>
          </div>
          <div className="px-3.5 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold">
            O'quvchiga aylandi: {leads.filter((l) => l.stage === 'enrolled').length} ta
          </div>
        </div>
      </div>

      {/* 3. KANBAN DOSKASI (4 ta Ustun) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {STAGES.map((stage) => {
          const stageLeads = filteredLeads.filter((l) => l.stage === stage.key);

          return (
            <div
              key={stage.key}
              className={`bg-slate-900/75 border border-slate-800/90 border-t-4 ${stage.borderColor} rounded-3xl p-4 flex flex-col gap-3 min-h-[420px] backdrop-blur-md`}
            >
              {/* Ustun Sarlavhasi */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                <span className="text-xs font-extrabold text-white tracking-wide uppercase">
                  {stage.title}
                </span>
                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${stage.badgeColor}`}>
                  {stageLeads.length}
                </span>
              </div>

              {/* Ustun Ichidagi Kartalar */}
              <div className="space-y-3 flex-1">
                {stageLeads.length === 0 ? (
                  <div className="h-44 flex items-center justify-center text-center text-xs text-slate-600 border border-dashed border-slate-800/80 rounded-2xl p-4">
                    Bu bosqichda murojaatlar yo'q
                  </div>
                ) : (
                  stageLeads.map((lead) => (
                    <div
                      key={lead.id}
                      className="bg-slate-950/90 border border-slate-800/90 hover:border-slate-700 rounded-2xl p-4 space-y-3 shadow-lg transition group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-500/15 text-indigo-300 border border-indigo-500/20">
                            {lead.source}
                          </span>
                          <h4 className="text-sm font-extrabold text-white mt-1.5">{lead.fullName}</h4>
                        </div>
                        <button
                          onClick={() => deleteLead(lead.id)}
                          className="text-slate-600 hover:text-rose-400 p-1 opacity-0 group-hover:opacity-100 transition"
                          title="O'chirish"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <div className="text-xs space-y-1 text-slate-300">
                        <div className="font-semibold text-cyan-400">{lead.courseInterest}</div>
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <Phone size={12} /> {lead.phone}
                        </div>
                        {lead.note && (
                          <p className="text-[11px] text-slate-400 bg-slate-900/90 p-2 rounded-xl border border-slate-800/70 mt-1">
                            "{lead.note}"
                          </p>
                        )}
                      </div>

                      {/* Bosqichni o'zgartirish tugmalari */}
                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-1.5">
                        <span className="text-[10px] text-slate-500">{lead.createdAt}</span>

                        <div className="flex items-center gap-1">
                          {stage.key === 'new' && (
                            <button
                              onClick={() => moveStage(lead.id, 'contacted')}
                              className="px-2.5 py-1 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-[11px] font-bold flex items-center gap-1 transition"
                            >
                              Bog'lanildi <ArrowRight size={11} />
                            </button>
                          )}

                          {stage.key === 'contacted' && (
                            <button
                              onClick={() => moveStage(lead.id, 'trial')}
                              className="px-2.5 py-1 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/30 text-[11px] font-bold flex items-center gap-1 transition"
                            >
                              Sinov darsi <ArrowRight size={11} />
                            </button>
                          )}

                          {stage.key === 'trial' && (
                            <button
                              disabled={convertingId === lead.id}
                              onClick={() => convertToStudent(lead)}
                              className="px-2.5 py-1 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[11px] font-extrabold flex items-center gap-1 transition"
                            >
                              <CheckCircle2 size={12} />
                              {convertingId === lead.id ? 'Qo‘shilmoqda...' : 'O‘quvchi qilish'}
                            </button>
                          )}

                          {stage.key === 'enrolled' && (
                            <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                              <CheckCircle2 size={12} /> Qabul qilingan
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. Yangi Lid Qo'shish Modali */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
                <UserPlus size={18} className="text-cyan-400" /> Yangi Murojaat (Lid)
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddLead} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">F.I.SH (Mijoz ismi)</label>
                <input
                  required
                  type="text"
                  placeholder="Masalan: Sardorbek Aliyev"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-slate-200 text-xs sm:text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Telefon raqami</label>
                  <input
                    required
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-slate-200 text-xs sm:text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Qayerdan keldi?</label>
                  <select
                    value={form.source}
                    onChange={(e) => setForm({ ...form, source: e.target.value as Lead['source'] })}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-slate-200 text-xs sm:text-sm focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Instagram">Instagram Target</option>
                    <option value="Telegram">Telegram Kanal/Bot</option>
                    <option value="Tavsiya">Do'stlar tavsiyasi</option>
                    <option value="Sayt">EduYuz.uz sayti</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Qiziqqan fan yo'nalishi</label>
                <input
                  required
                  type="text"
                  placeholder="Masalan: Ingliz tili (IELTS) yoki Frontend"
                  value={form.courseInterest}
                  onChange={(e) => setForm({ ...form, courseInterest: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-slate-200 text-xs sm:text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Izoh (ixtiyoriy)</label>
                <input
                  type="text"
                  placeholder="Masalan: Tushdan keyingi vaqt qulay..."
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-slate-200 text-xs sm:text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-2xl bg-slate-800 text-slate-300 text-xs font-bold"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white text-xs font-bold shadow-lg shadow-purple-600/30"
                >
                  Voronkaga Qo'shish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
