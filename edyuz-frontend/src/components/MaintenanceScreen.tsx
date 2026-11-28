import { MAINTENANCE } from '@/lib/maintenance';

export default function MaintenanceScreen() {
  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-slate-50 p-6">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-full.png" alt="EduYuz" className="h-12 mx-auto w-auto object-contain" />
        <div className="mx-auto mt-6 w-14 h-14 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-2xl" aria-hidden="true">
          🛠
        </div>
        <h1 className="mt-4 text-xl font-bold text-slate-900">Texnik ishlar olib borilmoqda</h1>
        <p className="mt-2 text-sm text-slate-600">
          Platforma vaqtincha to‘xtatilgan. Taxminan <strong className="text-slate-900">{MAINTENANCE.until}</strong> da
          (Toshkent vaqti) qayta ishga tushadi.
        </p>
        <p className="mt-3 text-xs text-slate-500">
          Ma’lumotlaringiz saqlangan, hech narsa yo‘qolmaydi. Noqulaylik uchun uzr so‘raymiz.
        </p>
      </div>
    </main>
  );
}
