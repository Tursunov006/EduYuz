'use client';

import { useState } from 'react';
import { 
  CalendarCheck, CreditCard, Award, GraduationCap, 
  ExternalLink, CheckCircle, Clock, XCircle, Phone, ShieldCheck 
} from 'lucide-react';
import Link from 'next/link';

interface ProfileTabProps {
  student: any;
  attendances?: any[];
  payments?: any[];
  certificates?: any[];
  groupInfo?: any;
}

export default function ProfileTab({
  student,
  attendances = [],
  payments = [],
  certificates = [],
  groupInfo,
}: ProfileTabProps) {
  const [section, setSection] = useState<'attendance' | 'payments' | 'certificates'>('attendance');

  return (
    <div className="space-y-4 pb-6">
      {/* Profile Header Box */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-lg font-bold shadow-md bg-indigo-600">
            {student?.fullName?.charAt(0) || 'U'}
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">{student?.fullName}</h3>
            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
              <Phone className="w-3.5 h-3.5 text-slate-500" />
              <span>{student?.phone || '+998 -- ---'}</span>
            </p>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
          <span>Guruh: <strong className="text-slate-700">{groupInfo?.name || 'Guruh'}</strong></span>
          <span className="flex items-center gap-1 text-emerald-600 font-semibold">
            <ShieldCheck className="w-4 h-4" /> Faol O‘quvchi
          </span>
        </div>
      </div>

      {/* Pill switcher for Sub-sections */}
      <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-white border border-slate-200 text-xs font-semibold text-center">
        <button
          onClick={() => setSection('attendance')}
          className={`py-2 rounded-xl transition ${
            section === 'attendance'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Davomat
        </button>
        <button
          onClick={() => setSection('payments')}
          className={`py-2 rounded-xl transition ${
            section === 'payments'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          To‘lovlar
        </button>
        <button
          onClick={() => setSection('certificates')}
          className={`py-2 rounded-xl transition ${
            section === 'certificates'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Sertifikat
        </button>
      </div>

      {/* 1. Davomat Tarixi */}
      {section === 'attendance' && (
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
            Davomat jurnali ({attendances.length} dars)
          </h4>

          {attendances.length === 0 ? (
            <div className="p-6 rounded-2xl bg-white border border-slate-200 text-center text-xs text-slate-500">
              Hali davomat qilinmagan
            </div>
          ) : (
            <div className="space-y-2">
              {attendances.map((att) => {
                const isPresent = att.status === 'present';
                const isLate = att.status === 'late';

                return (
                  <div
                    key={att.id}
                    className="p-3.5 rounded-2xl bg-white border border-slate-200 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-900">
                        {new Date(att.date).toLocaleDateString('uz-UZ', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </span>
                      <p className="text-[11px] text-slate-500 mt-0.5">{groupInfo?.name}</p>
                    </div>

                    <span
                      className={`px-3 py-1 rounded-full font-bold text-[11px] inline-flex items-center gap-1 ${
                        isPresent
                          ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/30'
                          : isLate
                          ? 'bg-amber-500/10 text-amber-600 border border-amber-500/30'
                          : 'bg-rose-500/10 text-rose-600 border border-rose-500/30'
                      }`}
                    >
                      {isPresent ? 'Keldi (+10)' : isLate ? 'Kechikdi' : 'Kelmadi'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 2. To'lov Tarixi */}
      {section === 'payments' && (
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
            To‘lov kvitansiyalari
          </h4>

          {payments.length === 0 ? (
            <div className="p-6 rounded-2xl bg-white border border-slate-200 text-center text-xs text-slate-500">
              To‘lovlar tarixi mavjud emas
            </div>
          ) : (
            <div className="space-y-2">
              {payments.map((p) => {
                const isCharge = Number(p.amount) < 0;
                const formattedAmount =
                  Math.abs(Number(p.amount)).toLocaleString('uz-UZ') + " so'm";

                return (
                  <div
                    key={p.id}
                    className="p-3.5 rounded-2xl bg-white border border-slate-200 flex items-center justify-between text-xs"
                  >
                    <div className="space-y-0.5">
                      <span className="font-bold text-slate-900">
                        {isCharge ? 'Oylik To‘lov Yechildi' : 'To‘lov Qabul Qilindi'}
                      </span>
                      <p className="text-[11px] text-slate-500">
                        {new Date(p.paidAt).toLocaleDateString('uz-UZ')} • {p.paymentMethod}
                      </p>
                    </div>

                    <div className="text-right">
                      <span
                        className={`font-bold text-xs ${
                          isCharge ? 'text-rose-600' : 'text-emerald-600'
                        }`}
                      >
                        {isCharge ? '-' : '+'}{formattedAmount}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 3. Sertifikatlar */}
      {section === 'certificates' && (
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
            Rasmiy QR-Sertifikatlar
          </h4>

          {certificates.length === 0 ? (
            <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center text-xs text-slate-500 space-y-2">
              <Award className="w-8 h-8 mx-auto text-slate-700" />
              <p>Hozircha sertifikat mavjud emas</p>
              <p className="text-[10px] text-slate-400">Kursni muvaffaqiyatli tamomlagach taqdim etiladi</p>
            </div>
          ) : (
            <div className="space-y-3">
              {certificates.map((cert) => (
                <div
                  key={cert.id}
                  className="p-5 rounded-2xl border-2 border-amber-500/40 text-center space-y-3 shadow-sm bg-amber-50"
                >
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-600 flex items-center justify-center mx-auto shadow-md">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-slate-900">{cert.courseTitle}</h5>
                    <p className="text-xs font-mono text-amber-600 mt-0.5 font-semibold">
                      {cert.certificateNumber}
                    </p>
                  </div>

                  <span className="inline-block px-3 py-1 bg-amber-500/10 rounded-full text-amber-700 font-bold text-xs border border-amber-500/30">
                    Baho: {cert.grade}
                  </span>

                  <div className="pt-1">
                    <Link
                      href={`/verify/${cert.certificateNumber}`}
                      target="_blank"
                      className="w-full py-2.5 px-4 rounded-xl text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition active:scale-98 bg-indigo-600"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Sertifikatni Ochish & Tekshirish</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
