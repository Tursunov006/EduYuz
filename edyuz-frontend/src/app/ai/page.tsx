'use client';

import { useState } from 'react';
import { Bot, Sparkles, Instagram, Send, MessageSquare, Copy, CheckCircle2, Loader2, Video } from 'lucide-react';
import { apiFetch } from '@/lib/api';

export default function AiMarketingPage() {
  const [topic, setTopic] = useState('');
  const [platform, setPlatform] = useState('instagram_post');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const platforms = [
    { id: 'instagram_post', name: 'Instagram Post', icon: Instagram, desc: 'Rasmli postlar uchun jozibali matnlar' },
    { id: 'reels_scenario', name: 'Reels Ssenariysi', icon: Video, desc: 'Qisqa videolar uchun tayyor ssenariy' },
    { id: 'telegram_ad', name: 'Telegram E\'lon', icon: Send, desc: 'Kanal va guruhlar uchun qabul e\'loni' },
    { id: 'sms_text', name: 'SMS Xabarnoma', icon: MessageSquare, desc: 'Ota-onalarga yuborish uchun qisqa SMS' },
  ];

  const handleGenerate = async () => {
    if (!topic.trim()) return alert('Iltimos, mavzuni kiriting (Masalan: Ingliz tili kurslari)');
    
    setLoading(true);
    setResult(null);
    setCopied(false);
    
    try {
      const response = await apiFetch('/ai/marketing', {
        method: 'POST',
        body: JSON.stringify({ platform, topic }),
      });
      setResult(response.data);
    } catch (error: any) {
      alert(error.message || 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!result) return;
    const textToCopy = `${result.title}\n\n${result.content}\n\n${result.suggestedHashtags}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto pb-10 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center">
          <Bot size={28} />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            AI Marketing Yordamchisi <Sparkles size={20} className="text-amber-400" />
          </h1>
          <p className="text-slate-400 mt-1">Sotuvni oshirish uchun ijtimoiy tarmoqlarga tayyor postlar yarating</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        
        {/* Chap panel: Sozlamalar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Qaysi tarmoq uchun?</label>
              <div className="space-y-2">
                {platforms.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPlatform(p.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                      platform === p.id 
                        ? 'bg-indigo-600/10 border-indigo-500 text-indigo-300' 
                        : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700 hover:bg-slate-800/50'
                    }`}
                  >
                    <p.icon size={20} className={platform === p.id ? 'text-indigo-400' : 'text-slate-500'} />
                    <div>
                      <div className="font-semibold text-sm text-slate-200">{p.name}</div>
                      <div className="text-xs opacity-70">{p.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Mavzu yoki g'oya</label>
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Masalan: Yosh bolalar uchun Mental Arifmetika kursiga yangi qabul boshlandi. Birinchi dars bepul..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 min-h-[120px] resize-none"
              ></textarea>
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold py-3 rounded-xl transition shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {loading ? (
                <><Loader2 size={18} className="animate-spin" /> Yozilmoqda...</>
              ) : (
                <><Sparkles size={18} /> Yaratish</>
              )}
            </button>
          </div>
        </div>

        {/* O'ng panel: Natija */}
        <div className="lg:col-span-2">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 min-h-[500px] h-full flex flex-col relative shadow-sm">
            {!result && !loading && (
              <div className="m-auto text-center space-y-4 max-w-sm">
                <div className="w-16 h-16 bg-slate-800/50 rounded-2xl flex items-center justify-center mx-auto text-slate-500">
                  <Bot size={32} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-300">Natija bu yerda chiqadi</h3>
                  <p className="text-sm text-slate-500 mt-2">Chap tomondan kerakli ijtimoiy tarmoqni tanlang va mavzuni kiriting. Sun'iy intellekt sizga eng yaxshi matnni yozib beradi.</p>
                </div>
              </div>
            )}

            {loading && (
              <div className="m-auto text-center space-y-4">
                <div className="relative w-16 h-16 mx-auto">
                  <div className="absolute inset-0 border-t-2 border-indigo-500 rounded-full animate-spin"></div>
                  <Bot size={24} className="absolute inset-0 m-auto text-indigo-400" />
                </div>
                <p className="text-sm text-indigo-400 animate-pulse font-medium">Sun'iy intellekt o'ylamoqda...</p>
              </div>
            )}

            {result && (
              <div className="flex flex-col h-full animate-in fade-in zoom-in-95 duration-300">
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-800">
                  <h2 className="text-lg font-bold text-white">{result.title}</h2>
                  <button
                    onClick={copyToClipboard}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      copied 
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20' 
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                    }`}
                  >
                    {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                    {copied ? 'Nusxa olindi!' : 'Nusxa olish'}
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar text-slate-300 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                  {result.content}
                </div>

                <div className="mt-4 pt-4 border-t border-slate-800">
                  <p className="text-xs text-indigo-400 font-semibold">{result.suggestedHashtags}</p>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
