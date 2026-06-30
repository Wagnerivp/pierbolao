import { useState, useEffect } from "react";
import axios from "axios";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "react-hot-toast";
import { Check, ShieldAlert } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";

interface Match {
  id: number;
  homeTeam: { name: string; nameCode: string };
  awayTeam: { name: string; nameCode: string };
  startTimestamp: number;
  status: { description: string };
}

export default function Dashboard() {
  const { user } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Store palpite: { matchId: { home: number, away: number } }
  const [palpites, setPalpites] = useState<
    Record<number, { home: string; away: string }>
  >({});
  const [savedStatus, setSavedStatus] = useState<Record<number, boolean>>({});

  useEffect(() => {
    fetchMatches();
    if (user) {
      fetchUserPalpites();
    }
  }, [user]);

  const fetchMatches = async () => {
    try {
      const res = await axios.get("/api/matches");
      if (res.data.success) {
        setMatches(res.data.events);

        // Ensure matches exist in supabase
        // In a real app, an admin syncs this. For this demo, we can silently upsert them here just so foreign keys work.
        const matchesToInsert = res.data.events.map((m: Match) => ({
          sofascore_match_id: m.id,
          time_casa: m.homeTeam.name,
          time_visitante: m.awayTeam.name,
          horario_inicio: new Date(m.startTimestamp * 1000).toISOString(),
          status: m.status.description,
        }));

        // We'll skip the actual insert here because without admin rights or an RPC it might fail RLS,
        // but let's assume the user has the db seeded or the schema allows inserts.
      }
    } catch (error) {
      toast.error("Erro ao carregar jogos.");
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPalpites = async () => {
    if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL.includes('placeholder')) {
        setPalpites({ 1: { home: '2', away: '1' } });
        setSavedStatus({ 1: true });
        return;
    }
    try {
      const { data, error } = await supabase
        .from("palpites")
        .select("partida_id, dados_palpites")
        .eq("usuario_id", user?.id);

      if (data) {
        const loaded: Record<number, { home: string; away: string }> = {};
        const statuses: Record<number, boolean> = {};
        data.forEach((p) => {
          // p.partida_id here is our internal serial, but we might have mapped it.
          // For simplicity, let's assume partida_id is sofascore_match_id
          loaded[p.partida_id] = p.dados_palpites;
          statuses[p.partida_id] = true;
        });
        setPalpites(loaded);
        setSavedStatus(statuses);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handlePalpiteChange = (
    matchId: number,
    team: "home" | "away",
    value: string,
  ) => {
    // Only allow numbers
    if (value !== "" && !/^\d+$/.test(value)) return;

    setPalpites((prev) => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        [team]: value,
      },
    }));
    setSavedStatus((prev) => ({ ...prev, [matchId]: false }));
  };

  const savePalpite = async (matchId: number) => {
    if (!user) return;

    const palpite = palpites[matchId];
    if (
      !palpite ||
      palpite.home === undefined ||
      palpite.away === undefined ||
      palpite.home === "" ||
      palpite.away === ""
    ) {
      return toast.error("Preencha os dois placares.");
    }

    setSaving(true);
    if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL.includes('placeholder')) {
        setTimeout(() => {
            setSaving(false);
            setSavedStatus(prev => ({ ...prev, [matchId]: true }));
            toast.success('Palpite salvo! (Modo de Teste)');
        }, 500);
        return;
    }
    try {
      // Upsert palpite (Requires RLS to allow update on own palpites)
      // Note: Supabase upsert on custom unique constraints can be tricky.
      // We will try insert, if error, we update.
      const { data: existing } = await supabase
        .from("palpites")
        .select("id")
        .eq("usuario_id", user.id)
        .eq("partida_id", matchId)
        .single();

      if (existing) {
        await supabase
          .from("palpites")
          .update({
            dados_palpites: palpite,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);
      } else {
        // Since we are referencing `partidas_id`, the match MUST exist in `partidas`.
        // If it doesn't, we might get a FK error.

        // Let's ensure match exists first for demo sake
        const match = matches.find((m) => m.id === matchId);
        if (match) {
          try {
            await supabase
              .from("partidas")
              .insert([
                {
                  id: match.id, // Force ID to match RapidAPI for simplicity in this demo
                  sofascore_match_id: match.id,
                  time_casa: match.homeTeam.name,
                  time_visitante: match.awayTeam.name,
                  horario_inicio: new Date(
                    match.startTimestamp * 1000,
                  ).toISOString(),
                },
              ])
              .select()
              .single();
          } catch (e) {
            // Ignore duplicate insert errors
          }
        }

        const { error } = await supabase.from("palpites").insert({
          usuario_id: user.id,
          partida_id: matchId, // Using rapidapi id as internal id
          dados_palpites: palpite,
        });

        if (error) throw error;
      }

      setSavedStatus((prev) => ({ ...prev, [matchId]: true }));
      toast.success("Palpite salvo!");
    } catch (error: any) {
      toast.error("Erro ao salvar palpite.");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-neutral-400 font-medium">
          Buscando jogos oficiais...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-6">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <h3 className="text-sm font-bold text-white">Regras do Bolão</h3>
          <p className="text-xs text-zinc-500 mt-1">
            Acerto exato: 10 pontos. Acerto do vencedor: 5 pontos. Salve seus
            palpites antes do início da partida.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {matches.map((match) => {
          const matchDate = new Date(match.startTimestamp * 1000);
          const hasStarted = match.status.description !== "Not started";
          const currentPalpite = palpites[match.id] || { home: "", away: "" };
          const isSaved = savedStatus[match.id];

          return (
            <div
              key={match.id}
              className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between"
            >
              <div className="px-6 py-4 flex items-center justify-between">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                  {format(matchDate, "dd 'de' MMM 'às' HH:mm", {
                    locale: ptBR,
                  })}
                </span>
                <span
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${hasStarted ? "bg-red-500/10 text-red-500 border border-red-500/20" : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"}`}
                >
                  {hasStarted ? "Em Andamento" : "Aberto"}
                </span>
              </div>

              <div className="px-6 py-2 flex items-center justify-between gap-4">
                {/* Home Team */}
                <div className="flex flex-col items-center gap-2 flex-1">
                  <div className="w-10 h-10 bg-zinc-800 rounded-lg flex items-center justify-center text-sm font-bold text-white shadow-inner border border-zinc-700/50">
                    {match.homeTeam.nameCode ||
                      match.homeTeam.name.substring(0, 3).toUpperCase()}
                  </div>
                  <span className="text-xs font-semibold text-center text-zinc-300 leading-tight">
                    {match.homeTeam.name}
                  </span>
                </div>

                {/* Score Input */}
                <div className="flex items-center gap-2 shrink-0">
                  <input
                    type="number"
                    disabled={hasStarted || saving}
                    value={currentPalpite.home}
                    placeholder="0"
                    onChange={(e) =>
                      handlePalpiteChange(match.id, "home", e.target.value)
                    }
                    className="w-12 h-12 bg-zinc-950 border border-zinc-800 rounded-lg text-center text-xl font-bold text-emerald-400 focus:outline-none focus:border-emerald-500/50 transition-colors disabled:opacity-50"
                  />
                  <span className="text-zinc-600 font-bold font-mono tracking-widest">:</span>
                  <input
                    type="number"
                    disabled={hasStarted || saving}
                    value={currentPalpite.away}
                    placeholder="0"
                    onChange={(e) =>
                      handlePalpiteChange(match.id, "away", e.target.value)
                    }
                    className="w-12 h-12 bg-zinc-950 border border-zinc-800 rounded-lg text-center text-xl font-bold text-emerald-400 focus:outline-none focus:border-emerald-500/50 transition-colors disabled:opacity-50"
                  />
                </div>

                {/* Away Team */}
                <div className="flex flex-col items-center gap-2 flex-1">
                  <div className="w-10 h-10 bg-zinc-800 rounded-lg flex items-center justify-center text-sm font-bold text-white shadow-inner border border-zinc-700/50">
                    {match.awayTeam.nameCode ||
                      match.awayTeam.name.substring(0, 3).toUpperCase()}
                  </div>
                  <span className="text-xs font-semibold text-center text-zinc-300 leading-tight">
                    {match.awayTeam.name}
                  </span>
                </div>
              </div>

              {!hasStarted && (
                <div className="px-6 pb-6 pt-4">
                  <button
                    onClick={() => savePalpite(match.id)}
                    disabled={
                      saving ||
                      currentPalpite.home === "" ||
                      currentPalpite.away === ""
                    }
                    className={`w-full py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors
                      ${
                        isSaved
                          ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                          : "bg-emerald-500 text-zinc-950 hover:bg-emerald-400 disabled:opacity-50 disabled:bg-zinc-800 disabled:text-zinc-500"
                      }`}
                  >
                    {isSaved ? (
                      <>
                        <Check className="w-4 h-4" /> Palpite Salvo
                      </>
                    ) : (
                      "Salvar Palpite"
                    )}
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {matches.length === 0 && (
          <div className="text-center py-10 bg-zinc-900/50 rounded-2xl border border-zinc-800 mt-4">
            <p className="text-zinc-500 text-sm">
              Nenhuma partida oficial encontrada.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
