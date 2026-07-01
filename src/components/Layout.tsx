import { Outlet, Link, useLocation } from "react-router-dom";
import { Trophy, Calendar, LogOut } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

export default function Layout() {
  const location = useLocation();
  const { logout, user } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex flex-col min-h-screen max-w-md mx-auto bg-[#09090b] text-zinc-100 border-x border-zinc-800/50 shadow-2xl relative pb-20">
      <header className="sticky top-0 z-10 bg-[#09090b]/80 backdrop-blur-md border-b border-zinc-800/50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.3)]">
            <Trophy className="w-6 h-6 text-zinc-950" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-yellow-400 animate-pulse drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]">
            PIER DO COSTA
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <span className="text-sm font-bold">{user?.nome}</span>
            <span className="text-xs text-zinc-500 font-medium">
              {user?.pontos_totais} pts
            </span>
          </div>
          <button
            onClick={logout}
            className="p-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-[#09090b] border-t border-zinc-800/50 px-6 py-3 flex items-center justify-between z-50">
        <Link
          to="/"
          className={`flex flex-col items-center gap-1 transition-colors ${isActive("/") ? "text-emerald-400" : "text-zinc-500 hover:text-zinc-300"}`}
        >
          <Calendar className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-widest">
            Jogos
          </span>
        </Link>
        <div className="absolute left-1/2 -translate-x-1/2 -top-5">
          <Link
            to="/admin"
            className="flex flex-col items-center group"
          >
            <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.4)] group-hover:scale-105 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-950">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
          </Link>
        </div>
        <Link
          to="/ranking"
          className={`flex flex-col items-center gap-1 transition-colors ${isActive("/ranking") ? "text-emerald-400" : "text-zinc-500 hover:text-zinc-300"}`}
        >
          <Trophy className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-widest">
            Ranking
          </span>
        </Link>
      </nav>
    </div>
  );
}
