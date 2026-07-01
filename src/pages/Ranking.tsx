import { useState, useEffect } from "react";
import { Medal } from "lucide-react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

interface RankingUser {
  id: string;
  nome: string;
  pontos_totais: number;
  acertos_placar_exato: number;
}

export default function Ranking() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<RankingUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRanking();
  }, []);

  const fetchRanking = async () => {
    try {
      if (!isSupabaseConfigured()) {
         setLoading(false);
         return;
      }
      const { data, error } = await supabase
        .from("usuarios")
        .select("id, nome, pontos_totais, acertos_placar_exato")
        .order("pontos_totais", { ascending: false })
        .order("acertos_placar_exato", { ascending: false });

      if (error) throw error;
      if (data) setUsers(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-6">
      <div className="flex justify-between items-end">
        <div>
           <h2 className="text-xl font-bold text-white tracking-tight">
             Ranking Geral
           </h2>
           <p className="text-sm text-zinc-500">Os melhores do bolão</p>
        </div>
        <Medal className="w-8 h-8 text-emerald-500" />
      </div>

      <div className="space-y-3">
        {users.map((user, index) => {
          const isCurrentUser = user.id === currentUser?.id;
          const position = index + 1;

          let rankClass = "bg-zinc-900/50 hover:bg-zinc-900 border-transparent";
          let posClass = "text-zinc-600 font-black italic";
          
          if (position === 1) {
            rankClass = "bg-gradient-to-r from-amber-500/10 to-transparent border-l-4 border-amber-500 rounded-r-xl";
            posClass = "text-amber-500 font-black italic";
          } else if (position === 2) {
            rankClass = "hover:bg-zinc-900 bg-zinc-900/50 rounded-xl";
            posClass = "text-zinc-400 font-black italic";
          } else if (position === 3) {
            rankClass = "hover:bg-zinc-900 bg-zinc-900/50 rounded-xl";
            posClass = "text-amber-700 font-black italic";
          } else if (isCurrentUser) {
            rankClass = "bg-zinc-900 border border-zinc-800 ring-1 ring-emerald-500/20 rounded-xl";
            posClass = "text-emerald-500 font-black italic";
          } else {
            rankClass = "hover:bg-zinc-900 bg-zinc-900/30 rounded-xl";
          }

          return (
            <div
              key={user.id}
              className={`flex items-center gap-4 p-4 transition-colors ${rankClass}`}
            >
              <span className={`text-lg w-6 text-center ${posClass}`}>
                {position.toString().padStart(2, '0')}
              </span>
              
              <div className="flex-1">
                <p className="text-sm font-bold text-white flex items-center gap-2">
                   {user.nome}
                   {isCurrentUser && (
                      <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20 uppercase">
                        Você
                      </span>
                   )}
                </p>
                <p className="text-xs text-zinc-500">{user.acertos_placar_exato} acertos exatos</p>
              </div>

              <div className="text-right">
                <p className={`text-sm font-bold ${position === 1 || isCurrentUser ? 'text-emerald-400' : 'text-white'}`}>
                   {user.pontos_totais}
                </p>
                <p className="text-[9px] text-zinc-500 uppercase">Pts</p>
              </div>
            </div>
          );
        })}

        {users.length === 0 && (
          <div className="p-8 text-center text-zinc-500 text-sm bg-zinc-900/50 rounded-2xl border border-zinc-800">
            Nenhum participante encontrado.
          </div>
        )}
      </div>
    </div>
  );
}
