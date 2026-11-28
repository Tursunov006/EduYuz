'use client';

import { useCallback, useEffect, useState } from 'react';
import { ShieldCheck, X, Send, Copy, CheckCircle2 } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import OtpInput from '@/components/OtpInput';

type Status = { enabled: boolean; linked: boolean; botLink: string | null };

// Xavfsizlik: 2 bosqichli kirish (kod Telegram botga yuboriladi). Har bir xodim o'zi yoqadi/o'chiradi.
export default function SecurityModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [st, setSt] = useState<Status | null>(null);
  const [qr, setQr] = useState('');
  const [challengeId, setChallengeId] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [askPassword, setAskPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    try {
      setSt(await apiFetch('/auth/2fa'));
    } catch (e: any) {
      setMsg({ ok: false, text: e?.message || 'Holatni olib bo‘lmadi' });
    }
  }, []);

  useEffect(() => {
    if (open) {
      setMsg(null);
      setChallengeId('');
      setCode('');
      setPassword('');
      setAskPassword(false);
      load();
    }
  }, [open, load]);

  useEffect(() => {
    if (!st?.botLink) {
      setQr('');
      return;
    }
    let cancelled = false;
    import('qrcode')
      .then((Q) => Q.toDataURL(st.botLink as string, { margin: 1, width: 320, color: { dark: '#111827', light: '#ffffff' } }))
      .then((u) => { if (!cancelled) setQr(u); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [st?.botLink]);

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setMsg(null);
    try {
      await fn();
    } catch (e: any) {
      setMsg({ ok: false, text: e?.message || 'Xatolik yuz berdi' });
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-xl p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Xavfsizlik"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="text-indigo-600" size={20} /> Xavfsizlik
          </h2>
          <button onClick={onClose} aria-label="Yopish" className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>

        {!st ? (
          <p className="text-sm text-slate-500 py-6 text-center">Yuklanmoqda...</p>
        ) : st.enabled ? (
          <div className="space-y-3">
            <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex items-center gap-2">
              <CheckCircle2 size={16} /> 2 bosqichli kirish yoqilgan: kirishda kod Telegram botga yuboriladi.
            </p>
            {askPassword ? (
              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-600">O‘chirish uchun parolingizni kiriting</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                  autoComplete="current-password"
                />
                <button
                  disabled={busy || !password}
                  onClick={() => run(async () => { await apiFetch('/auth/2fa/disable', { method: 'POST', body: JSON.stringify({ password }) }); setPassword(''); setAskPassword(false); await load(); setMsg({ ok: true, text: '2 bosqichli kirish o‘chirildi' }); })}
                  className="w-full h-10 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-sm font-semibold"
                >
                  O‘chirish
                </button>
              </div>
            ) : (
              <button onClick={() => setAskPassword(true)} className="text-sm font-semibold text-rose-600 hover:underline">
                2 bosqichli kirishni o‘chirish
              </button>
            )}
          </div>
        ) : !st.linked ? (
          <div className="space-y-3">
            <p className="text-sm text-slate-600">
              Kodlar Telegram botga yuboriladi. Avval hisobingizni botga ulang: QR kodni telefon bilan skaner qiling yoki tugmani bosib, botda <b>Start</b> ni bosing.
            </p>
            {qr && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qr} alt="Telegram botga ulanish QR kodi" className="mx-auto w-40 h-40 rounded-xl border border-slate-200" />
            )}
            {st.botLink && (
              <div className="flex gap-2">
                <a href={st.botLink} target="_blank" rel="noopener noreferrer" className="flex-1 h-10 inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold">
                  <Send size={15} /> Telegramda ochish
                </a>
                <button
                  onClick={() => { navigator.clipboard?.writeText(st.botLink as string); setCopied(true); setTimeout(() => setCopied(false), 1800); }}
                  aria-label="Havolani nusxalash"
                  className="w-10 h-10 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center justify-center"
                >
                  {copied ? <CheckCircle2 size={16} className="text-emerald-600" /> : <Copy size={16} />}
                </button>
              </div>
            )}
            <button onClick={() => run(load)} disabled={busy} className="w-full h-10 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
              Ulandimi? Tekshirish
            </button>
          </div>
        ) : challengeId ? (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">Telegram botga kelgan 6 xonali kodni kiriting.</p>
            <OtpInput value={code} onChange={setCode} disabled={busy} autoFocus />
            <button
              disabled={busy || code.length !== 6}
              onClick={() => run(async () => { await apiFetch('/auth/2fa/confirm', { method: 'POST', body: JSON.stringify({ challengeId, code }) }); setChallengeId(''); setCode(''); await load(); setMsg({ ok: true, text: '2 bosqichli kirish yoqildi' }); })}
              className="w-full h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold"
            >
              Tasdiqlash va yoqish
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-slate-600">
              Telegram bot ulangan. Yoqsangiz, har safar kirishda parolga qo‘shimcha Telegramga kelgan kod so‘raladi. Yoqish uchun sinov kodi yuboriladi.
            </p>
            <button
              disabled={busy}
              onClick={() => run(async () => { const r = await apiFetch('/auth/2fa/enable', { method: 'POST' }); setChallengeId(r.challengeId); setCode(''); })}
              className="w-full h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold"
            >
              Kod yuborish va yoqish
            </button>
          </div>
        )}

        {msg && (
          <p className={`text-xs rounded-lg p-2.5 ${msg.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{msg.text}</p>
        )}
      </div>
    </div>
  );
}
