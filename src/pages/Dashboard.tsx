import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "react-hot-toast";
import { Check, ShieldAlert } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

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
    Record<number, { home: string; away: string; primeiro_gol_autor?: string; primeiro_cartao_vermelho?: string }>
  >({});
  const [savedStatus, setSavedStatus] = useState<Record<number, boolean>>({});
  const [lineupsCache, setLineupsCache] = useState<Record<number, any>>({});

  useEffect(() => {
    fetchMatches();
    if (user) {
      fetchUserPalpites();
    }
  }, [user]);

  const fetchMatches = async () => {
    try {
      if (!isSupabaseConfigured()) {
        setMatches([]);
        return;
      }
      
      const { data, error } = await supabase
        .from('partidas')
        .select('*')
        .order('horario_inicio', { ascending: true });
        
      if (error) {
        throw error;
      }
      
      const formattedMatches = (data || []).map(p => ({
        id: p.sofascore_match_id,
        homeTeam: { name: p.time_casa, nameCode: p.time_casa.substring(0, 3).toUpperCase() },
        awayTeam: { name: p.time_visitante, nameCode: p.time_visitante.substring(0, 3).toUpperCase() },
        startTimestamp: Math.floor(new Date(p.horario_inicio).getTime() / 1000),
        status: { description: p.status || "Not started" }
      }));
      
      setMatches(formattedMatches);

    } catch (error: any) {
      console.error("Erro ao buscar partidas:", error);
      toast.error(`Erro ao carregar jogos: ${error?.message || "Falha de conexão"}`);
    } finally {
      setLoading(false);
    }
  };

    const fetchUserPalpites = async () => {
    if (!isSupabaseConfigured()) {
        setPalpites({ 1: { home: '2', away: '1' } });
        setSavedStatus({ 1: true });
        return;
    }
    try {
      const { data, error } = await supabase
        .from("palpites")
        .select("match_id, home, away, primeiro_gol_autor, primeiro_cartao_vermelho")
        .eq("user_id", user?.id);

      if (data) {
        const loaded: Record<number, { home: string; away: string; primeiro_gol_autor?: string; primeiro_cartao_vermelho?: string }> = {};
        const statuses: Record<number, boolean> = {};
        data.forEach((p) => {
          loaded[p.match_id] = {
            home: String(p.home),
            away: String(p.away),
            primeiro_gol_autor: p.primeiro_gol_autor,
            primeiro_cartao_vermelho: p.primeiro_cartao_vermelho
          };
          statuses[p.match_id] = true;
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
    field: "home" | "away" | "primeiro_gol_autor" | "primeiro_cartao_vermelho",
    value: string,
  ) => {
    // Only allow numbers for score fields
    if ((field === "home" || field === "away") && value !== "" && !/^\d+$/.test(value)) return;

    setPalpites((prev) => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        [field]: value,
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
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_URL.startsWith('http') || import.meta.env.VITE_SUPABASE_URL.includes('placeholder')) {
        setTimeout(() => {
            setSaving(false);
            setSavedStatus(prev => ({ ...prev, [matchId]: true }));
            toast.success('Palpite salvo! (Modo de Teste)');
        }, 500);
        return;
    }
    try {
      // Upsert palpite
      const { data: existing } = await supabase
        .from("palpites")
        .select("id")
        .eq("user_id", user.id)
        .eq("match_id", matchId)
        .single();

      if (existing) {
        const { error } = await supabase
          .from("palpites")
          .update({
            home: parseInt(palpite.home, 10),
            away: parseInt(palpite.away, 10),
            primeiro_gol_autor: palpite.primeiro_gol_autor || null,
            primeiro_cartao_vermelho: palpite.primeiro_cartao_vermelho || null,
            updated_at: new Date().toISOString()
          })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("palpites")
          .insert({
            user_id: user.id,
            match_id: matchId,
            home: parseInt(palpite.home, 10),
            away: parseInt(palpite.away, 10),
            primeiro_gol_autor: palpite.primeiro_gol_autor || null,
            primeiro_cartao_vermelho: palpite.primeiro_cartao_vermelho || null
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
                <div className="px-6 py-3 border-t border-zinc-800/50 bg-zinc-900/30 space-y-3">
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">
                      1º Autor do Gol (Extra)
                    </label>
                    <select
                      disabled={hasStarted || saving || !lineupsCache[match.id]}
                      value={currentPalpite.primeiro_gol_autor || ""}
                      onChange={(e) => handlePalpiteChange(match.id, "primeiro_gol_autor", e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-sm text-zinc-300 focus:outline-none focus:border-emerald-500/50 transition-colors disabled:opacity-50"
                    >
                      <option value="">
                        {!lineupsCache[match.id] ? "Aguardando escalação oficial..." : "Selecione um jogador..."}
                      </option>
                      {lineupsCache[match.id] && (
                        <>
                          <optgroup label={match.homeTeam.name}>
                            {lineupsCache[match.id].home?.players?.map((p: any) => (
                              <option key={`home-${p.player.id}`} value={p.player.name}>
                                {p.player.name} {p.substitute ? '(Reserva)' : ''}
                              </option>
                            ))}
                          </optgroup>
                          <optgroup label={match.awayTeam.name}>
                            {lineupsCache[match.id].away?.players?.map((p: any) => (
                              <option key={`away-${p.player.id}`} value={p.player.name}>
                                {p.player.name} {p.substitute ? '(Reserva)' : ''}
                              </option>
                            ))}
                          </optgroup>
                        </>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">
                      1º Cartão Vermelho (Extra)
                    </label>
                    <select
                      disabled={hasStarted || saving || !lineupsCache[match.id]}
                      value={currentPalpite.primeiro_cartao_vermelho || ""}
                      onChange={(e) => handlePalpiteChange(match.id, "primeiro_cartao_vermelho", e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-sm text-zinc-300 focus:outline-none focus:border-emerald-500/50 transition-colors disabled:opacity-50"
                    >
                      <option value="">
                        {!lineupsCache[match.id] ? "Aguardando escalação oficial..." : "Nenhum / Selecione um jogador..."}
                      </option>
                      {lineupsCache[match.id] && (
                        <>
                          <optgroup label={match.homeTeam.name}>
                            {lineupsCache[match.id].home?.players?.map((p: any) => (
                              <option key={`home-${p.player.id}`} value={p.player.name}>
                                {p.player.name} {p.substitute ? '(Reserva)' : ''}
                              </option>
                            ))}
                          </optgroup>
                          <optgroup label={match.awayTeam.name}>
                            {lineupsCache[match.id].away?.players?.map((p: any) => (
                              <option key={`away-${p.player.id}`} value={p.player.name}>
                                {p.player.name} {p.substitute ? '(Reserva)' : ''}
                              </option>
                            ))}
                          </optgroup>
                        </>
                      )}
                    </select>
                  </div>
                </div>
              )}

              {!hasStarted && (
                <div className="px-6 pb-6 pt-2">
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
              Nenhuma partida disponível no momento.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
