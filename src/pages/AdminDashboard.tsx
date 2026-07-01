import { useState, useEffect } from "react";
import { Shield, Search, CheckCircle, RefreshCcw } from "lucide-react";
import { supabase } from "../lib/supabase";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [usersToApprove, setUsersToApprove] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Check if current user is Wagner (admin)
  const isAdmin = user?.telefone === "21975151937" && user?.pin === btoa("0508");

  useEffect(() => {
    if (isAdmin) {
      fetchUsersToApprove();
    }
  }, [isAdmin]);

  const fetchUsersToApprove = async () => {
    try {
      const { data, error } = await supabase
        .from("usuarios")
        .select("*")
        .eq("is_approved", false);
      if (error) throw error;
      setUsersToApprove(data || []);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao carregar usuários pendentes.");
    }
  };

  const approveUser = async (id: string) => {
    try {
      const res = await fetch("/api/admin/approve-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user_id: id }),
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        toast.success(data.message || "Usuário liberado com sucesso!");
        fetchUsersToApprove();
      } else {
        toast.error(data.error || "Erro desconhecido ao liberar usuário.");
      }
    } catch (err: any) {
      toast.error(`Falha de rede ao liberar usuário: ${err.message}`);
    }
  };

  const handleFetchMatches = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/fetch-matches", { method: "POST" });
      const data = await res.json();
      
      if (res.ok && data.success) {
        toast.success(data.message || "Jogos sincronizados!");
      } else {
        toast.error(data.error || "Falha na sincronização");
      }
    } catch (err: any) {
      toast.error(`Falha de comunicação: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Shield className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Acesso Negado</h2>
        <p className="text-zinc-500 text-sm">
          Você não tem permissão para visualizar o painel administrativo.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-6">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <Shield className="w-6 h-6 text-emerald-500" />
          Painel de Administração
        </h2>
        <p className="text-sm text-zinc-500">Área exclusiva do organizador</p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-lg space-y-4">
        <h3 className="font-bold text-lg text-white">Motor de Busca da Copa</h3>
        <p className="text-xs text-zinc-400">
          Busca os jogos de hoje na Sofascore, filtra apenas pela "World Cup" e
          atualiza o banco de dados.
        </p>
        <button
          onClick={handleFetchMatches}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold py-4 rounded-xl transition-all disabled:opacity-50"
        >
          {loading ? (
            <RefreshCcw className="w-5 h-5 animate-spin" />
          ) : (
            <Search className="w-5 h-5" />
          )}
          {loading ? "Sincronizando..." : "Buscar Jogos da Copa"}
        </button>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-lg">
        <h3 className="font-bold text-lg text-white mb-4">Aprovação de PIX</h3>
        <div className="space-y-3">
          {usersToApprove.length === 0 ? (
            <p className="text-zinc-500 text-sm text-center py-4 bg-zinc-950 rounded-lg">
              Nenhum usuário aguardando aprovação.
            </p>
          ) : (
            usersToApprove.map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between p-4 bg-zinc-950 border border-zinc-800 rounded-lg"
              >
                <div>
                  <p className="font-bold text-white">{u.nome}</p>
                  <p className="text-xs text-zinc-500">{u.telefone}</p>
                </div>
                <button
                  onClick={() => approveUser(u.id)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-sm font-bold hover:bg-emerald-500/30 transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  Liberar
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
