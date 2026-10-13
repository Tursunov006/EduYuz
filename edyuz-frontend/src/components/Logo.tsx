interface LogoProps {
  collapsed?: boolean;
}

export default function Logo({ collapsed = false }: LogoProps) {
  return (
    <div className="flex items-center gap-3 select-none">
      {/* Yangi EduYuz Concept B Ikona */}
      <div className="relative flex-shrink-0 w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-500/20 via-purple-500/20 to-pink-500/20 p-0.5 flex items-center justify-center shadow-lg shadow-purple-500/30 transition-all duration-300 hover:scale-105 group border border-purple-500/30 overflow-hidden">
        <img
          src="/eduyuz-logo-b.jpg"
          alt="EduYuz AI"
          className="w-full h-full object-cover rounded-[14px] transition-transform duration-300 group-hover:scale-110"
        />
      </div>

      {/* Matn qismi */}
      {!collapsed && (
        <div className="flex flex-col leading-tight">
          <div className="flex items-baseline text-[21px] font-black tracking-tight text-white">
            Edu<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400">Yuz</span>
          </div>
          <span className="text-[9px] uppercase tracking-[0.24em] text-slate-400 font-bold -mt-0.5">
            CRM PLATFORM
          </span>
        </div>
      )}
    </div>
  );
}
