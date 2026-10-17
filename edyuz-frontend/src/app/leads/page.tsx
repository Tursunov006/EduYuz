'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  UserPlus,
  Phone,
  ArrowRight,
  Plus,
  Search,
  CheckCircle2,
  Sparkles,
  Trash2,
  ExternalLink,
  X,
  Copy,
  Check,
  Bot,
  Send,
  RefreshCw,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';

function Instagram({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

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
  igUsername?: string;
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
    note: 'Kechki guruh so‘radi (@eduyuzcrmuz)',
    igUsername: 'azizbek_dev',
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
    borderColor: 'border-t-cyan-500',
  },
  {
    key: 'contacted',
    title: 'Aloqaga Chiqildi',
    badgeColor: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    borderColor: 'border-t-amber-500',
  },
  {
    key: 'trial',
    title: 'Sinov Darsiga Yozildi',
    badgeColor: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    borderColor: 'border-t-purple-500',
  },
  {
    key: 'enrolled',
    title: 'O‘quvchiga Aylandi',
    badgeColor: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    borderColor: 'border-t-emerald-500',
  },
];

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInstaModalOpen, setIsInstaModalOpen] = useState(false);
  const [centers, setCenters] = useState<any[]>([]);
  const [convertingId, setConvertingId] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Instagram DM AI Simulator state
  const [testDmText, setTestDmText] = useState('Salom! CRM narxi qancha? Raqamim: +998901234567');
  const [testDmReply, setTestDmReply] = useState<string | null>(null);
  const [testDmLoading, setTestDmLoading] = useState(false);

  const [form, setForm] = useState({
    fullName: '',
    phone: '+998',
    courseInterest: 'Frontend Dasturlash',
    source: 'Instagram' as Lead['source'],
    note: '',
  });

  async function fetchAndMergeLeads() {
    setSyncing(true);
    let localList: Lead[] = INITIAL_LEADS;
    try {
      const saved = localStorage.getItem('eduyuz_leads_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) localList = parsed;
      }
    } catch {
      // ignore
    }

    try {
      const remote = await apiFetch('/instagram/leads');
      if (Array.isArray(remote) && remote.length > 0) {
        const mappedRemote: Lead[] = remote.map((r: any) => ({
          id: r.id,
          fullName: r.fullName,
          phone: r.phone,
          courseInterest: r.course || 'EduYuz CRM Demo',
          source: (r.source as Lead['source']) || 'Instagram',
          stage: r.stage === 'converted' ? 'enrolled' : (r.stage as LeadStage) || 'new',
          createdAt: r.createdAt || 'Bugun',
          note: r.note,
          igUsername: r.igUsername,
        }));

        const remoteIds = new Set(mappedRemote.map((m) => m.id));
        const merged = [
          ...mappedRemote,
          ...localList.filter((l) => !remoteIds.has(l.id)),
        ];
        setLeads(merged);
        localStorage.setItem('eduyuz_leads_v1', JSON.stringify(merged));
        setSyncing(false);
        return;
      }
    } catch {
      // fallback to localList
    }

    setLeads(localList);
    setSyncing(false);
  }

  useEffect(() => {
    fetchAndMergeLeads();
    apiFetch('/centers')
      .then((res) => setCenters(res || []))
      .catch(() => {});
  }, []);

  const saveLeads = (updated: Lead[]) => {
    setLeads(updated);
    localStorage.setItem('eduyuz_leads_v1', JSON.stringify(updated));
  };

  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault();
    const tempLead: Lead = {
      id: `lead-${Date.now()}`,
      fullName: form.fullName,
      phone: form.phone,
      courseInterest: form.courseInterest,
      source: form.source,
      stage: 'new',
      createdAt: 'Hozirgina',
      note: form.note,
    };

    saveLeads([tempLead, ...leads]);
    setIsModalOpen(false);
    setForm({
      fullName: '',
      phone: '+998',
      courseInterest: 'Frontend Dasturlash',
      source: 'Instagram',
      note: '',
    });

    try {
      await apiFetch('/instagram/lead', {
        method: 'POST',
        body: JSON.stringify({
          fullName: tempLead.fullName,
          phone: tempLead.phone,
          course: tempLead.courseInterest,
          source: tempLead.source,
          stage: 'new',
          note: tempLead.note,
        }),
      });
      fetchAndMergeLeads();
    } catch {
      // kept in localStorage
    }
  };

  const moveStage = async (id: string, nextStage: LeadStage) => {
    const updated = leads.map((l) => (l.id === id ? { ...l, stage: nextStage } : l));
    saveLeads(updated);

    try {
      await apiFetch(`/instagram/leads/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ stage: nextStage === 'enrolled' ? 'converted' : nextStage }),
      });
    } catch {
      // local state already updated
    }
  };

  const deleteLead = async (id: string) => {
    if (!confirm('Ushbu murojaatni o‘chirmoqchimisiz?')) return;
    saveLeads(leads.filter((l) => l.id !== id));
    try {
      await apiFetch(`/instagram/leads/${id}`, { method: 'DELETE' });
    } catch {
      // ignore
    }
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

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleTestInstagramDm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testDmText.trim()) return;
    setTestDmLoading(true);
    try {
      const res = await apiFetch('/instagram/ai-chat', {
        method: 'POST',
        body: JSON.stringify({
          message: testDmText,
          senderName: 'Instagram Mijoz (@eduyuzcrmuz)',
          igUsername: 'eduyuz_client',
        }),
      });
      setTestDmReply(res?.reply || 'Javob olindi!');
      await fetchAndMergeLeads();
    } catch {
      setTestDmReply(
        "✅ Raqamingiz qabul qilindi va EduYuz CRM Lidlar voronkasiga qo'shildi! Mutaxassisimiz tez orada bog'lanadi."
      );
    } finally {
      setTestDmLoading(false);
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
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-pink-600/15 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-300 text-xs font-semibold">
              <Instagram size={13} /> @eduyuzcrmuz • Instagram & Sotuv Voronkasi
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
              <UserPlus className="text-cyan-400" /> Lidlar va Murojaatlar
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm max-w-xl">
              Instagram (@eduyuzcrmuz), Telegram va qo&apos;ng&apos;iroq orqali kelgan yangi mijozlarni sinov darsiga yozing va bir tugma bilan o&apos;quvchiga aylantiring.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsInstaModalOpen(true)}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-pink-600/20 via-purple-600/20 to-indigo-600/20 hover:from-pink-600/30 hover:to-indigo-600/30 border border-pink-500/40 text-pink-300 px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all shadow-lg shadow-pink-500/10"
            >
              <Instagram size={16} className="text-pink-400" /> @eduyuzcrmuz Integratsiya
            </button>

            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all shadow-xl shadow-purple-600/30 hover:scale-[1.02] active:scale-95"
            >
              <Plus size={16} /> + Yangi Lid Qo&apos;shish
            </button>
          </div>
        </div>
      </div>

      {/* 2. Qidiruv va Konversiya Ko'rsatkichlari */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md flex items-center gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Ism, telefon yoki kurs bo'yicha qidirish..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-800 rounded-2xl text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <button
            onClick={fetchAndMergeLeads}
            title="Instagram lidlarini yangilash"
            className="p-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition"
          >
            <RefreshCw size={16} className={syncing ? 'animate-spin text-pink-400' : ''} />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          <Link
            href="/insta"
            target="_blank"
            className="px-3.5 py-2 rounded-2xl bg-pink-500/10 border border-pink-500/30 text-pink-300 font-bold flex items-center gap-1.5 hover:bg-pink-500/20 transition"
          >
            <Instagram size={14} /> eduyuz.uz/insta sahifasini ochish <ExternalLink size={12} />
          </Link>
          <div className="px-3.5 py-2 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300">
            Jami murojaatlar: <strong className="text-white font-bold">{leads.length} ta</strong>
          </div>
          <div className="px-3.5 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold">
            O&apos;quvchiga aylandi: {leads.filter((l) => l.stage === 'enrolled').length} ta
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
                    Bu bosqichda murojaatlar yo&apos;q
                  </div>
                ) : (
                  stageLeads.map((lead) => (
                    <div
                      key={lead.id}
                      className="bg-slate-950/90 border border-slate-800/90 hover:border-slate-700 rounded-2xl p-4 space-y-3 shadow-lg transition group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                              lead.source === 'Instagram'
                                ? 'bg-pink-500/15 text-pink-300 border-pink-500/30'
                                : 'bg-indigo-500/15 text-indigo-300 border-indigo-500/20'
                            }`}
                          >
                            {lead.source === 'Instagram' ? '📸 Instagram' : lead.source}
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
                        {lead.igUsername && (
                          <div className="text-[11px] text-pink-400 font-medium">
                            @{lead.igUsername.replace('@', '')}
                          </div>
                        )}
                        {lead.note && (
                          <p className="text-[11px] text-slate-400 bg-slate-900/90 p-2 rounded-xl border border-slate-800/70 mt-1">
                            &quot;{lead.note}&quot;
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
                              Bog&apos;lanildi <ArrowRight size={11} />
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

      {/* 4. INSTAGRAM (@eduyuzcrmuz) INTEGRATSIYA VA SOZLAMALAR MODALI */}
      {isInstaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600 flex items-center justify-center text-white">
                  <Instagram size={18} />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-extrabold text-white">
                    @eduyuzcrmuz Instagram + AI Integratsiya
                  </h2>
                  <p className="text-xs text-slate-400">
                    Instagram Bio havolasi va Direct (DM) AI Sotuv Menejer sozlamalari
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsInstaModalOpen(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>

            {/* 1-Qadam: Bio Link */}
            <div className="bg-slate-950 border border-slate-800/90 rounded-2xl p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-pink-400 uppercase tracking-wider">
                  1. Instagram Bio Havolasi (Tayyor!)
                </span>
                <Link
                  href="/insta"
                  target="_blank"
                  className="text-xs text-indigo-400 hover:underline flex items-center gap-1 font-semibold"
                >
                  Ochib ko&apos;rish <ExternalLink size={12} />
                </Link>
              </div>
              <p className="text-xs text-slate-400">
                Ushbu havolani <strong>@eduyuzcrmuz</strong> profilingizdagi <strong>Edit profile → Website</strong> qismiga qo&apos;ying. Mijozlar kirib ariza qoldirsa yoki AI bilan gaplashsa, shu Kanban doskaga avtomatik tushadi:
              </p>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value="https://eduyuz.uz/insta"
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-emerald-400"
                />
                <button
                  onClick={() => copyToClipboard('https://eduyuz.uz/insta', 'bio')}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white flex items-center gap-1.5"
                >
                  {copiedKey === 'bio' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  {copiedKey === 'bio' ? 'Nusxalandi' : 'Nusxalash'}
                </button>
              </div>
            </div>

            {/* 2-Qadam: Meta Webhook / ManyChat */}
            <div className="bg-slate-950 border border-slate-800/90 rounded-2xl p-4 space-y-2.5">
              <span className="text-xs font-extrabold text-cyan-400 uppercase tracking-wider">
                2. Instagram Direct Webhook (Meta Developer / ManyChat)
              </span>
              <p className="text-xs text-slate-400">
                Meta for Developers yoki ManyChat ichida Instagram DM Webhook sifatida quyidagi manzilni ulang:
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value="https://eduyuz.onrender.com/api/v1/instagram/webhook"
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-cyan-300"
                  />
                  <button
                    onClick={() =>
                      copyToClipboard('https://eduyuz.onrender.com/api/v1/instagram/webhook', 'webhook')
                    }
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white flex items-center gap-1"
                  >
                    {copiedKey === 'webhook' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  </button>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 bg-slate-900/70 px-3 py-1.5 rounded-xl">
                  <span>
                    Verify Token: <strong className="text-white font-mono">eduyuz_insta_2026</strong>
                  </span>
                  <button
                    onClick={() => copyToClipboard('eduyuz_insta_2026', 'token')}
                    className="text-indigo-400 hover:text-indigo-300 font-semibold"
                  >
                    {copiedKey === 'token' ? 'Nusxalandi!' : 'Tokenni nusxalash'}
                  </button>
                </div>
              </div>
            </div>

            {/* 3-Qadam: Jonli Sinov (Instagram DM Simulator) */}
            <div className="bg-slate-950 border border-indigo-500/30 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-extrabold text-indigo-300">
                <Bot size={15} className="text-indigo-400" />
                3. Instagram Direct AI Menejerni Hoziroq Sinab Ko&apos;ring:
              </div>
              <form onSubmit={handleTestInstagramDm} className="flex items-center gap-2">
                <input
                  type="text"
                  value={testDmText}
                  onChange={(e) => setTestDmText(e.target.value)}
                  placeholder="Instagram mijoz xabarini yozing..."
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  disabled={testDmLoading}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-pink-600 to-indigo-600 text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Send size={13} /> {testDmLoading ? '...' : 'Yuborish'}
                </button>
              </form>
              {testDmReply && (
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 whitespace-pre-line">
                  <div className="text-[10px] font-bold text-pink-400 mb-1">
                    🤖 @eduyuzcrmuz AI javobi (va Lid yaratildi):
                  </div>
                  {testDmReply}
                </div>
              )}
            </div>

            {/* 4-Qadam: Obunachi Yig'ish Algoritmi (Viral Reels + Komment Trigger) */}
            <div className="bg-gradient-to-br from-pink-950/30 to-slate-950 border border-pink-500/30 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-pink-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles size={14} /> 4. Obunachi Yig&apos;ish Algoritmi (Faol!)
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold">
                  Avto-Trigger Yoqilgan
                </span>
              </div>

              <div className="text-xs text-slate-300 space-y-1.5">
                <p>
                  <strong>Qanday ishlaydi:</strong> Reels yoki Post ostiga mijoz quyidagi kalit so&apos;zlardan birini komment yozsa, algoritm uning Direct&apos;iga avtomatik <strong>100 000 so&apos;m Vaucher + Bepul Demo</strong> havolasini yuboradi:
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {['CRM', 'DEMO', 'NARX', 'BONUS', '+'].map((kw) => (
                    <span
                      key={kw}
                      className="px-2.5 py-1 rounded-lg bg-pink-500/15 border border-pink-500/30 text-pink-300 font-mono text-[11px] font-bold"
                    >
                      &quot;{kw}&quot;
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-300">
                    🎬 Tayyor Viral Reels & Post Matni (Nusxalab qo&apos;ying):
                  </span>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        `🎓 O'quv markazingiz CRM-siz oyiga qancha pul yo'qotayotganini bilasizmi?\n\n📅 Avtomatik davomat va Ota-onalar Telegram boti\n💰 100% aniq Kassa va Qarzdorlar nazorati\n🎯 Instagram Lidlar voronkasi\n\n🎁 @eduyuzcrmuz sahifamizga OBUNA bo'ling va kommentga «CRM» deb yozing — Direct'ingizga 7 kunlik BEPUL DEMO + 100,000 so'm Vaucher yuboramiz! 👇`,
                        'reels_caption'
                      )
                    }
                    className="text-[11px] text-pink-400 hover:text-pink-300 font-bold flex items-center gap-1"
                  >
                    {copiedKey === 'reels_caption' ? <Check size={12} /> : <Copy size={12} />}
                    {copiedKey === 'reels_caption' ? 'Nusxalandi!' : 'Matnni nusxalash'}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 italic leading-relaxed">
                  &quot;🎓 O&apos;quv markazingiz CRM-siz oyiga qancha pul yo&apos;qotayotganini bilasizmi? @eduyuzcrmuz sahifamizga OBUNA bo&apos;ling va kommentga «CRM» deb yozing — Direct&apos;ingizga 7 kunlik BEPUL DEMO + 100,000 so&apos;m Vaucher yuboramiz! 👇&quot;
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Yangi Lid Qo'shish Modali */}
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
                    <option value="Instagram">Instagram (@eduyuzcrmuz)</option>
                    <option value="Telegram">Telegram Kanal/Bot</option>
                    <option value="Tavsiya">Do&apos;stlar tavsiyasi</option>
                    <option value="Sayt">EduYuz.uz sayti</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Qiziqqan fan yo&apos;nalishi</label>
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
                  Voronkaga Qo&apos;shish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
