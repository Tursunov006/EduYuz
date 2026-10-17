'use client';

import { useState } from 'react';
import {
  CheckCircle2,
  Sparkles,
  Rocket,
  Crown,
  ShieldCheck,
  Clock,
  AlertTriangle,
  Send,
  RefreshCw,
  X,
  LogOut,
  CreditCard,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface SubscriptionModalProps {
  isOpen: boolean;
  isExpired: boolean;
  daysLeft: number;
  centerName?: string;
  centerId?: string;
  userPhone?: string;
  onClose?: () => void;
  onStatusRefreshed?: (newCenter: any) => void;
}

const PLANS = [
  {
    id: 'start',
    name: 'START',
    badge: 'Kichik Markazlar Uchun',
    monthlyPrice: 299000,
    yearlyPrice: 249000,
    limit: '100 tagacha faol o‘quvchi',
    icon: Rocket,
    accent: 'from-cyan-500/20 to-blue-500/20 border-cyan-500/30 text-cyan-300',
    btnClass: 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700',
    features: [
      '100 tagacha o‘quvchi va cheksiz guruhlar',
      'Toq / Juft kunlar Dars Jadvali (Shaxmatka)',
      'Kunlik Davomat va SMS eslatmalar',
      'Moliya, Kassa, Qarzdorlar va Chiqim nazorati',
      'Professional Excel (.xls) buxgalteriya eksporti',
      'O‘quvchi va Ota-onalar veb-portali (/portal)',
    ],
  },
  {
    id: 'pro',
    name: 'PRO BIZNES',
    badge: '🔥 Eng Ko‘p Tanlanadigan',
    popular: true,
    monthlyPrice: 499000,
    yearlyPrice: 399000,
    limit: '500 tagacha faol o‘quvchi',
    icon: Sparkles,
    accent: 'from-indigo-500/25 via-purple-500/25 to-pink-500/25 border-purple-500/50 text-purple-300',
    btnClass:
      'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white shadow-xl shadow-purple-600/30',
    features: [
      '500 tagacha o‘quvchi va barcha START imkoniyatlari',
      '🤖 24/7 Ota-onalar va Avto-Lid Telegram Boti',
      '📸 Instagram Voronka (/insta) + AI Sotuv Konsultanti',
      '🎓 LMS Video Darslar va Uyga Vazifalar tizimi',
      '🪙 EduCoin Gamifikatsiya, Reyting va Interaktiv O‘yinlar',
      '🏅 Avtomatik QR-kodli Rasmiy Sertifikatlar generatori',
      '📊 Ustozlar 50% KPI Maosh kalkulyatori va 6 oylik tahlil',
    ],
  },
  {
    id: 'vip',
    name: 'VIP / TARMOQ',
    badge: 'Yirik Akademiyalar Uchun',
    monthlyPrice: 899000,
    yearlyPrice: 749000,
    limit: 'Cheksiz o‘quvchilar va filiallar',
    icon: Crown,
    accent: 'from-amber-500/20 to-orange-500/20 border-amber-500/40 text-amber-300',
    btnClass:
      'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black shadow-lg shadow-amber-500/25',
    features: [
      'Cheksiz o‘quvchilar, guruhlar va o‘qituvchilar',
      'Barcha PRO BIZNES imkoniyatlari to‘liq paketda',
      'Ko‘p filialli o‘quv markazlarini yagona oynada boshqarish',
      'Markazning o‘z brendi ostida shaxsiy Telegram Bot ulash',
      'Eski bazani (Excel) bepul ko‘chirib o‘tkazib berish',
      '24/7 Shaxsiy VIP Dasturchi va Texnik Menejer yordami',
    ],
  },
];

export default function SubscriptionModal({
  isOpen,
  isExpired,
  daysLeft,
  centerName = 'O‘quv Markazi',
  centerId,
  userPhone = '',
  onClose,
  onStatusRefreshed,
}: SubscriptionModalProps) {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<(typeof PLANS)[0] | null>(null);
  const [checking, setChecking] = useState(false);

  if (!isOpen) return null;

  async function handleCheckLicense() {
    if (!centerId) {
      window.location.reload();
      return;
    }
    setChecking(true);
    try {
      const centerData = await apiFetch(`/centers/${centerId}`);
      if (centerData && centerData.subscriptionStatus) {
        const userRaw = localStorage.getItem('user');
        if (userRaw) {
          const user = JSON.parse(userRaw);
          user.subscriptionStatus = centerData.subscriptionStatus;
          user.trialEndsAt = centerData.trialEndsAt;
          localStorage.setItem('user', JSON.stringify(user));
        }
        if (onStatusRefreshed) {
          onStatusRefreshed(centerData);
        }
        if (centerData.subscriptionStatus === 'active') {
          alert('🎉 Tabriklaymiz! PRO Litsenziyangiz faollashtirildi!');
          window.location.reload();
          return;
        }
      }
      alert(
        'Hozircha to‘lov tasdiqlanishi kutilmoqda. Agar to‘lov qilgan bo‘lsangiz, Telegram orqali @Dasturchi_76 (Ibrohim Tursunov, +998 94 769 07 76) ga xabar bering — 1 daqiqada faollashtiriladi!',
      );
    } catch (e) {
      window.location.reload();
    } finally {
      setChecking(false);
    }
  }

  function openTelegramActivation(plan: (typeof PLANS)[0]) {
    const price = billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
    const periodText = billingCycle === 'monthly' ? '1 oylik' : 'Yillik (-20% chegirma bilan)';
    const msg = encodeURIComponent(
      `Assalomu alaykum, Ibrohim aka! Men EduYuz CRM bo'yicha obunani faollashtirmoqchiman:\n\n🏢 O'quv markazi: ${centerName}\n📞 Telefon: ${userPhone || 'Kiritilmagan'}\n💎 Tanlangan tarif: ${plan.name} (${periodText})\n💳 Summa: ${price.toLocaleString('uz-UZ')} so'm/oy\n\nIltimos, to'lov rekvizitlarini yuboring va litsenziyani faollashtirib bering.`,
    );
    window.open(`https://t.me/Dasturchi_76?text=${msg}`, '_blank');
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-xl p-3 sm:p-6 overflow-y-auto">
      <div className="relative bg-slate-900 border border-slate-800 rounded-3xl max-w-6xl w-full p-5 sm:p-8 shadow-2xl my-auto max-h-[94vh] overflow-y-auto space-y-6 text-slate-100">
        {/* Yuqori Yopish yoki Chiqish tugmasi */}
        <div className="flex items-center justify-between gap-3">
          {isExpired ? (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-extrabold">
              <AlertTriangle size={15} className="text-rose-400" />
              <span>14 kunlik bepul sinov muddatingiz yakunlandi!</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-extrabold">
              <Clock size={15} className="text-amber-400" />
              <span>14 kunlik bepul sinov davri faol • Yana {daysLeft} kun qoldi</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={handleCheckLicense}
              disabled={checking}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-bold transition cursor-pointer"
            >
              <RefreshCw size={14} className={checking ? 'animate-spin' : ''} />
              <span>{checking ? 'Tekshirilmoqda...' : 'Litsenziyani tekshirish'}</span>
            </button>

            {!isExpired && onClose ? (
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                title="Yopish"
              >
                <X size={18} />
              </button>
            ) : (
              <button
                onClick={() => {
                  localStorage.removeItem('token');
                  localStorage.removeItem('user');
                  window.location.href = '/login';
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 text-xs font-bold transition cursor-pointer"
              >
                <LogOut size={14} /> Chiqish
              </button>
            )}
          </div>
        </div>

        {/* Sarlavha va Oylik / Yillik Switcher */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {isExpired
              ? 'Tizimdan uzluksiz foydalanish uchun tarifni tanlang'
              : 'EduYuz CRM — Rasmiy Tariflar va Obuna Rejalari'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Barcha ma&apos;lumotlaringiz, o‘quvchilar bazasi va moliya tarixi 100% xavfsiz saqlangan. O‘quv markazingiz hajmiga mos tarifni tanlab, 1 daqiqada faollashtiring:
          </p>

          <div className="inline-flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-950 border border-slate-800 mt-2">
            <button
              type="button"
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                billingCycle === 'monthly'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Oylik to‘lov
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle('yearly')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer ${
                billingCycle === 'yearly'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Yillik to‘lov</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px]">
                -20% Chegirma
              </span>
            </button>
          </div>
        </div>

        {/* 3 TA TARIF KARTALARI */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {PLANS.map((plan) => {
            const Icon = plan.icon;
            const price = billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;

            return (
              <div
                key={plan.id}
                className={`relative rounded-3xl p-6 flex flex-col justify-between border transition-all ${
                  plan.popular
                    ? 'bg-gradient-to-b from-slate-900 via-indigo-950/40 to-slate-900 border-purple-500/60 shadow-2xl shadow-purple-600/20 scale-[1.01]'
                    : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-r ${plan.accent} border text-xs font-extrabold`}
                    >
                      <Icon size={14} />
                      <span>{plan.name}</span>
                    </span>
                    <span className="text-[11px] font-bold text-slate-400">{plan.badge}</span>
                  </div>

                  <div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl font-black text-white">
                        {price.toLocaleString('uz-UZ')}
                      </span>
                      <span className="text-xs text-slate-400 font-semibold">so‘m / oy</span>
                    </div>
                    <p className="text-xs text-cyan-400 font-bold mt-1">{plan.limit}</p>
                  </div>

                  <ul className="space-y-2.5 pt-3 border-t border-slate-800/80 text-xs text-slate-300">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 size={15} className="text-emerald-400 shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-6 space-y-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPlan(plan);
                      openTelegramActivation(plan);
                    }}
                    className={`w-full py-3 px-4 rounded-2xl text-xs sm:text-sm font-extrabold transition flex items-center justify-center gap-2 cursor-pointer active:scale-95 ${plan.btnClass}`}
                  >
                    <Send size={15} />
                    <span>{plan.name} Tarifni Faollashtirish</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pastki To'lov va Bog'lanish Bloki */}
        <div className="rounded-2xl bg-slate-950/90 border border-slate-800 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
              <CreditCard size={22} />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-extrabold text-white">
                Click, Payme, Uzcard / Humo yoki Pul o‘tkazish orqali 1 daqiqada faollashtirish
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Dasturchi va Bosh Menejer: <strong className="text-slate-200">Ibrohim Tursunov</strong> • Tel:{' '}
                <a href="tel:+998947690776" className="text-emerald-400 font-bold hover:underline">
                  +998 94 769 07 76
                </a>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <a
              href="tel:+998947690776"
              className="px-4 py-2.5 rounded-2xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-extrabold whitespace-nowrap transition"
            >
              📞 +998 94 769 07 76
            </a>
            <a
              href="https://t.me/Dasturchi_76"
              target="_blank"
              rel="noreferrer"
              className="px-5 py-2.5 rounded-2xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-300 text-xs font-extrabold whitespace-nowrap transition"
            >
              💬 Telegram: @Dasturchi_76
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
