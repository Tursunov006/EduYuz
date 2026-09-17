interface LogoProps {
  collapsed?: boolean;
}

export default function Logo({ collapsed = false }: LogoProps) {
  return (
    <div className="flex items-center gap-3 select-none">
      {/* Rasmiy EduYuz Ikona (O'quv kepkasi va o'quvchilar ramzi) */}
      <div className="relative flex-shrink-0 w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center shadow-lg shadow-blue-500/20 transition-all duration-200 hover:scale-105 group border border-slate-100/10">
        <img
          src="/logo-icon-transparent.png"
          alt="EduYuz"
          className="w-8 h-8 object-contain transition-transform duration-200 group-hover:scale-110"
        />
      </div>

      {/* Matn qismi (Sidebar ochiq bo'lganda) */}
      {!collapsed && (
        <div className="flex flex-col leading-tight">
          <div className="flex items-baseline text-[21px] font-black tracking-tight text-white">
            Edu<span className="text-blue-400">Yuz</span>
          </div>
          <span className="text-[9px] uppercase tracking-[0.22em] text-slate-400 font-bold -mt-0.5">
            CRM PLATFORM
          </span>
        </div>
      )}
    </div>
  );
}
