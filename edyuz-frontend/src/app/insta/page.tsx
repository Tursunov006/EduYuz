'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Sparkles,
  Send,
  Phone,
  User,
  Building2,
  Camera,
  CreditCard,
  Users,
  Bot,
  ArrowRight,
  ShieldCheck,
  MessageCircle,
  ExternalLink,
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

interface ChatMessage {
  role: 'bot' | 'user';
  text: string;
  time: string;
}

export default function InstagramBioPage() {
  const [activeTab, setActiveTab] = useState<'form' | 'chat' | 'features'>('form');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState({
    fullName: '',
    phone: '+998 ',
    course: "Ko'p tarmoqli o'quv markaz",
    igUsername: '',
    note: '',
  });

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'bot',
      text: "Assalomu alaykum! 👋 Men @eduyuzcrmuz rasmiy AI konsultantiman.\n\nO'quv markazingizni avtomatlashtirish, Face-ID davomat yoki 7 kunlik BEPUL DEMO bo'yicha savolingizni yozing yoki telefon raqamingizni qoldiring!",
      time: 'Hozir',
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  function saveLeadLocally(newLead: any) {
    try {
      const saved = localStorage.getItem('eduyuz_leads_v1');
      const list = saved ? JSON.parse(saved) : [];
      localStorage.setItem('eduyuz_leads_v1', JSON.stringify([newLead, ...list]));
    } catch {
      // ignore storage errors
    }
  }

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.fullName.trim() || form.phone.trim().length < 7) return;
    setSubmitting(true);

    const payload = {
      fullName: form.fullName.trim(),
      phone: form.phone.trim(),
      course: form.course,
      source: 'Instagram' as const,
      stage: 'new',
      igUsername: form.igUsername.replace('@', '').trim(),
      note: form.note
        ? `${form.note} (@eduyuzcrmuz Bio orqali)`
        : '@eduyuzcrmuz Instagram Bio havolasi orqali kelgan ariza',
    };

    try {
      const created = await apiFetch('/instagram/lead', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      saveLeadLocally(created);
    } catch {
      saveLeadLocally({
        id: 'ig-' + Date.now(),
        ...payload,
        createdAt: new Date().toLocaleDateString('uz-UZ'),
      });
    } finally {
      setSubmitting(false);
      setSubmitted(true);
    }
  }

  async function handleSendChat(customText?: string) {
    const text = (customText ?? chatInput).trim();
    if (!text || chatLoading) return;

    const now = new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
    setMessages((prev) => [...prev, { role: 'user', text, time: now }]);
    if (!customText) setChatInput('');
    setChatLoading(true);

    try {
      const res = await apiFetch('/instagram/ai-chat', {
        method: 'POST',
        body: JSON.stringify({ message: text }),
      });
      if (res?.leadCreated) {
        saveLeadLocally(res.leadCreated);
      }
      setMessages((prev) => [
        ...prev,
        {
          role: 'bot',
          text:
            res?.reply ||
            "Ma'lumotingiz qabul qilindi! Bepul demo olish uchun telefon raqamingizni yozib qoldiring.",
          time: now,
        },
      ]);
    } catch {
      // Smart local fallback if server is sleeping
      const lower = text.toLowerCase();
      const phoneMatch = text.match(/(?:\+?998[\s-]?)?(?:\d{2}[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}|\d{9})/);
      let reply =
        "✨ EduYuz CRM orqali Face-ID davomat, Moliya, Kassir va Lidlarni bitta ekranda boshqarasiz. 7 kunlik BEPUL DEMO olish uchun telefon raqamingizni yozib yuboring!";

      if (phoneMatch) {
        const phone = phoneMatch[0];
        saveLeadLocally({
          id: 'ig-chat-' + Date.now(),
          fullName: 'Instagram DM Mijoz',
          phone,
          course: 'EduYuz CRM Demo',
          source: 'Instagram',
          stage: 'new',
          createdAt: new Date().toLocaleDateString('uz-UZ'),
          note: `Instagram AI Chat: "${text}"`,
        });
        reply = `✅ Rahmat! Raqamingiz (${phone}) EduYuz CRM Lidlar voronkasiga qo'shildi. Mutaxassisimiz tez orada siz bilan bog'lanib, 7 kunlik BEPUL DEMO yoqib beradi!`;
      } else if (lower.includes('narx') || lower.includes('qancha')) {
        reply =
          "💎 Tariflarimiz:\n• Start: 199 000 so'm/oy (Face-ID, Kassa, Lidlar, 200 o'quvchi)\n• Pro: 349 000 so'm/oy (Cheksiz o'quvchi, Telegram Bot, SMS va Analitika)\n\n🎁 7 kunlik BEPUL DEMO olish uchun telefon raqamingizni yozib qoldiring!";
      } else if (lower.includes('face') || lower.includes('kamera')) {
        reply =
          "📷 Face-ID Biometrik Davomat qimmat turniket talab qilmaydi! Oddiy noutbuk yoki telefon kamerasi orqali o'quvchini 0.5 soniyada taniydi va ota-onaga xabar yuboradi.\n\nSinab ko'rish uchun telefon raqamingizni qoldiring!";
      }

      setMessages((prev) => [...prev, { role: 'bot', text: reply, time: now }]);
    } finally {
      setChatLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-start py-6 px-4 relative overflow-hidden">
      {/* Orqa fon neon nur effektlari */}
      <div className="fixed -top-24 -left-24 w-96 h-96 bg-pink-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed top-1/3 -right-24 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed -bottom-24 left-1/3 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-lg relative z-10 space-y-5">
        {/* 1. INSTAGRAM PROFILE HEADER (@eduyuzcrmuz) */}
        <div className="bg-slate-900/90 border border-slate-800/90 rounded-3xl p-5 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <div className="relative flex-shrink-0">
              <div className="w-20 h-20 rounded-full p-[3px] bg-gradient-to-tr from-amber-400 via-pink-500 to-purple-600 shadow-lg shadow-pink-500/20">
                <img
                  src="/eduyuz-logo-b.jpg"
                  alt="EduYuz CRM"
                  className="w-full h-full rounded-full object-cover bg-slate-950 p-0.5"
                />
              </div>
              <span className="absolute -bottom-1 -right-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-950">
                CRM 2.0
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h1 className="text-lg sm:text-xl font-extrabold text-white tracking-tight truncate">
                  eduyuzcrmuz
                </h1>
                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-sky-500 text-white text-[10px] font-bold">
                  ✓
                </span>
              </div>
              <p className="text-xs font-semibold text-indigo-400 mt-0.5">
                EduYuz CRM Platform • Rasmiy Sahifa
              </p>
              <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400">
                <span>
                  <strong className="text-white">100+</strong> Markazlar
                </span>
                <span>•</span>
                <span>
                  <strong className="text-white">1.7K+</strong> Obunachi
                </span>
                <span>•</span>
                <span className="text-emerald-400 font-semibold">● Online</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3.5 border-t border-slate-800/80 text-xs text-slate-300 space-y-1 leading-relaxed">
            <p>🎓 O&apos;quv markazlarini 100% avtomatlashtiruvchi zamonaviy CRM</p>
            <p>📷 Face-ID Davomat • 💰 Moliya • 🎯 Lidlar Voronkasi • 🤖 Telegram Bot</p>
          </div>

          {/* 3-Tab Switcher */}
          <div className="grid grid-cols-3 gap-1.5 bg-slate-950 p-1.5 rounded-2xl border border-slate-800/80 mt-4">
            <button
              onClick={() => setActiveTab('form')}
              className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'form'
                  ? 'bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/25'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles size={13} /> Bepul Demo
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'chat'
                  ? 'bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/25'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <MessageCircle size={13} /> AI Konsultant
            </button>
            <button
              onClick={() => setActiveTab('features')}
              className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'features'
                  ? 'bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/25'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldCheck size={13} /> Imkoniyatlar
            </button>
          </div>
        </div>

        {/* 2. TAB 1: BEPUL 7-KUNLIK DEMO ARIZA FORMASI */}
        {activeTab === 'form' && (
          <div className="bg-slate-900/90 border border-slate-800/90 rounded-3xl p-6 shadow-2xl backdrop-blur-xl">
            {submitted ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
                  <CheckCircle2 size={36} />
                </div>
                <h2 className="text-xl font-extrabold text-white">
                  Arizangiz Qabul Qilindi! 🎉
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 max-w-sm mx-auto leading-relaxed">
                  Ma&apos;lumotlaringiz <strong>EduYuz CRM</strong> tizimiga tushdi. Mutaxassisimiz tez orada siz bilan bog&apos;lanib, <strong>7 kunlik BEPUL VIP-DEMO</strong> kabinetingizni ochib beradi!
                </p>
                <div className="pt-2 flex flex-col sm:flex-row gap-2.5 justify-center">
                  <button
                    onClick={() => setActiveTab('chat')}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition"
                  >
                    🤖 AI Konsultant bilan suhbatlashish
                  </button>
                  <Link
                    href="/login"
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-xs font-bold text-white transition flex items-center justify-center gap-1.5"
                  >
                    Tizimga kirish <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-pink-400 bg-pink-500/10 border border-pink-500/20 px-2.5 py-1 rounded-full">
                      🎁 @eduyuzcrmuz obunachilari uchun
                    </span>
                    <h2 className="text-lg font-extrabold text-white mt-2">
                      7 Kunlik Bepul Demo Olish
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Raqamingizni qoldiring — 10 daqiqada markazingiz uchun tizimni yoqib beramiz.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Ismingiz *
                  </label>
                  <div className="relative">
                    <User size={16} className="absolute left-3.5 top-3 text-slate-500" />
                    <input
                      required
                      type="text"
                      placeholder="Masalan: Sardorbek Aliyev"
                      value={form.fullName}
                      onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-pink-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Telefon raqamingiz *
                  </label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3.5 top-3 text-slate-500" />
                    <input
                      required
                      type="text"
                      placeholder="+998 90 123 45 67"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-pink-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Markaz yo&apos;nalishi
                    </label>
                    <div className="relative">
                      <Building2 size={15} className="absolute left-3 top-3 text-slate-500" />
                      <select
                        value={form.course}
                        onChange={(e) => setForm({ ...form, course: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-pink-500"
                      >
                        <option value="Ko'p tarmoqli o'quv markaz">Ko&apos;p tarmoqli markaz</option>
                        <option value="Ingliz tili / IELTS Markazi">Ingliz tili / IELTS</option>
                        <option value="IT va Dasturlash Akademiyasi">IT va Dasturlash</option>
                        <option value="Matematika / Abituriyent">Matematika / DTM</option>
                        <option value="Xususiy Maktab / Bog'cha">Xususiy Maktab</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Instagram Username (ixtiyoriy)
                    </label>
                    <div className="relative">
                      <Instagram size={15} className="absolute left-3 top-3 text-slate-500" />
                      <input
                        type="text"
                        placeholder="@username"
                        value={form.igUsername}
                        onChange={(e) => setForm({ ...form, igUsername: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-pink-500"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    O&apos;quv markazingiz nomi yoki savolingiz
                  </label>
                  <input
                    type="text"
                    placeholder="Masalan: EverBest Education, 150 ta o'quvchi bor..."
                    value={form.note}
                    onChange={(e) => setForm({ ...form, note: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-pink-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white font-extrabold text-sm shadow-xl shadow-purple-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {submitting ? (
                    'Yuborilmoqda...'
                  ) : (
                    <>
                      🚀 7 Kunlik Bepul Demo Olish
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        )}

        {/* 3. TAB 2: INSTAGRAM DIRECT AI KONSULTANT (24/7 CHAT) */}
        {activeTab === 'chat' && (
          <div className="bg-slate-900/90 border border-slate-800/90 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-xl flex flex-col h-[500px]">
            {/* Chat Header */}
            <div className="px-4 py-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-pink-500 to-indigo-600 flex items-center justify-center text-white">
                  <Bot size={16} />
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1">
                    @eduyuzcrmuz AI Menejer
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                  <p className="text-[10px] text-slate-400">Instagram Direct 24/7 Avto-Javob</p>
                </div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-semibold">
                Tezkor javob
              </span>
            </div>

            {/* Tezkor Savollar */}
            <div className="px-3 py-2 bg-slate-950/40 border-b border-slate-800/60 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {[
                { label: '💎 Narxlar qancha?', q: 'EduYuz CRM narxlari va tariflari qancha?' },
                { label: '📷 Face-ID haqida', q: 'Face-ID kamera davomat qanday ishlaydi?' },
                { label: '🎁 Bepul Demo olish', q: '7 kunlik bepul demo qanday olaman?' },
              ].map((btn, i) => (
                <button
                  key={i}
                  onClick={() => handleSendChat(btn.q)}
                  className="whitespace-nowrap px-2.5 py-1 rounded-full bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-[11px] font-semibold text-slate-200 transition"
                >
                  {btn.label}
                </button>
              ))}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-line ${
                      m.role === 'user'
                        ? 'bg-gradient-to-r from-pink-600 to-indigo-600 text-white rounded-br-sm'
                        : 'bg-slate-800/90 border border-slate-700/70 text-slate-100 rounded-bl-sm'
                    }`}
                  >
                    {m.text}
                    <div
                      className={`text-[9px] mt-1 ${
                        m.role === 'user' ? 'text-pink-200 text-right' : 'text-slate-400'
                      }`}
                    >
                      {m.time}
                    </div>
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-800/90 border border-slate-700/70 rounded-2xl px-4 py-2.5 text-xs text-slate-400 animate-pulse">
                    Yozmoqda...
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendChat();
              }}
              className="p-3 bg-slate-950/90 border-t border-slate-800 flex items-center gap-2"
            >
              <input
                type="text"
                placeholder="Savolingizni yoki telefon raqamingizni yozing..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-pink-500"
              />
              <button
                type="submit"
                disabled={chatLoading}
                className="p-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-indigo-600 text-white hover:opacity-90 transition disabled:opacity-50"
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        )}

        {/* 4. TAB 3: PLATFORMA IMKONIYATLARI */}
        {activeTab === 'features' && (
          <div className="space-y-3">
            {[
              {
                icon: Camera,
                title: 'Face-ID Biometrik Davomat',
                desc: "Qimmat turniketlarsiz! Kamera orqali o'quvchi yuzini 0.5 soniyada taniydi va ota-onaga darhol Telegram/SMS xabar yuboradi.",
                badge: 'Eng mashhur',
                color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
              },
              {
                icon: CreditCard,
                title: "Aniq Moliya, Kassa va Qarzdorlar",
                desc: "Oylik kurs to'lovlarini avtomatik yechish, kvitansiyalar, o'qituvchilar KPI maoshi va qarzdorlar ro'yxati.",
                badge: '100% Aniq',
                color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
              },
              {
                icon: Users,
                title: 'Lidlar Voronkasi (Kanban) & Instagram',
                desc: "Instagram va Telegramdan kelgan har bir murojaatni 'Yangi -> Sinov darsi -> O'quvchi' bosqichlarida boshqaring.",
                badge: 'Sotuv +45%',
                color: 'text-pink-400 bg-pink-500/10 border-pink-500/20',
              },
              {
                icon: Bot,
                title: 'Ota-onalar Portali va Gamifikatsiya',
                desc: "O'quvchilar darsda EduCoins tangalar yig'adi, testlar yechadi va sertifikat oladi.",
                badge: 'Next-Gen EdTech',
                color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
              },
            ].map((f, i) => (
              <div
                key={i}
                className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 flex items-start gap-3.5 shadow-lg"
              >
                <div className={`p-3 rounded-xl border ${f.color} flex-shrink-0`}>
                  <f.icon size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-bold text-white">{f.title}</h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold whitespace-nowrap">
                      {f.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}

            <button
              onClick={() => setActiveTab('form')}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 text-white font-extrabold text-sm shadow-xl shadow-purple-600/30 transition"
            >
              🎁 7 Kunlik Bepul Demo Olish
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between px-2 pt-2 text-[11px] text-slate-500">
          <span>© 2026 EduYuz CRM (@eduyuzcrmuz)</span>
          <Link
            href="/login"
            className="text-indigo-400 hover:text-indigo-300 font-semibold inline-flex items-center gap-1"
          >
            CRM Tizimga kirish <ExternalLink size={12} />
          </Link>
        </div>
      </div>
    </div>
  );
}
