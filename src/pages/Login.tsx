import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { Trophy, LogIn, UserPlus } from "lucide-react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

export default function Login() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    telefone: "",
    pin: "",
  });

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleAuth = async (e: FormEvent) => {
    e.preventDefault();

    if (!formData.telefone || !formData.pin) {
      return toast.error("Preencha todos os campos obrigatórios.");
    }

    if (isRegistering && !formData.nome) {
      return toast.error("Nome é obrigatório para cadastro.");
    }

    if (!isSupabaseConfigured()) {
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        const mockUser = {
          id: 'mock-user-123',
          nome: formData.nome || 'Usuário Teste',
          telefone: formData.telefone,
          pontos_totais: 150,
          acertos_placar_exato: 5,
          is_approved: true,
          is_locked: false
        };
        toast.success(isRegistering ? "Cadastro realizado (Modo de Teste)" : `Bem-vindo, ${mockUser.nome}! (Modo de Teste)`);
        login(mockUser);
        navigate('/');
      }, 1000);
      return;
    }

    setLoading(true);

    try {
      if (isRegistering) {
        // Simple hash conceptually - in production you'd hash on the server.
        const pinHash = btoa(formData.pin); // Basic base64 for demo per requirements (using pin_hash)

        // Check if phone exists
        const { data: existingUser } = await supabase
          .from("usuarios")
          .select("id")
          .eq("telefone", formData.telefone)
          .single();

        if (existingUser) {
          toast.error("Telefone já cadastrado. Faça login.");
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from("usuarios")
          .insert([
            {
              nome: formData.nome,
              telefone: formData.telefone,
              pin: pinHash,
              is_approved: false, // Needs admin approval conceptually, but we'll let them in for demo
            },
          ])
          .select()
          .single();

        if (error) throw error;

        toast.success("Cadastro realizado com sucesso!");
        login(data);
        navigate("/");
      } else {
        const pinHash = btoa(formData.pin);

        const { data, error } = await supabase
          .from("usuarios")
          .select("*")
          .eq("telefone", formData.telefone)
          .eq("pin", pinHash)
          .single();

        if (error || !data) {
          throw new Error("Telefone ou PIN incorretos.");
        }

        if (data.is_locked) {
          throw new Error("Sua conta está bloqueada.");
        }

        toast.success(`Bem-vindo, ${data.nome}!`);
        login(data);
        navigate("/");
      }
    } catch (error: any) {
      const isConnectionError = error.message?.includes('Failed to fetch') || 
                                error.message?.includes('Invalid path') || 
                                error.message?.includes('URL') ||
                                error.message?.includes('fetch') ||
                                error.message?.includes('network');

      if (isConnectionError || !import.meta.env.VITE_SUPABASE_URL?.startsWith('http')) {
        toast.error('Modo offline/teste ativado (sem conexão com banco de dados).');
        setTimeout(() => {
          setLoading(false);
          const mockUser = {
            id: 'mock-user-123',
            nome: formData.nome || 'Usuário Teste',
            telefone: formData.telefone,
            pontos_totais: 150,
            acertos_placar_exato: 5,
            is_approved: true,
            is_locked: false
          };
          login(mockUser);
          navigate('/');
        }, 1000);
      } else {
        toast.error(error.message || "Ocorreu um erro.");
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800/50 rounded-2xl p-6 shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-emerald-500 rounded-lg flex items-center justify-center mb-4 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
            <Trophy className="w-8 h-8 text-zinc-950" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            COPA<span className="text-emerald-500">PRO</span>
          </h1>
          <p className="text-zinc-500 text-sm mt-1">
            O seu bolão da Copa do Mundo
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {isRegistering && (
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">
                Nome Completo
              </label>
              <input
                type="text"
                placeholder="Ex: João Silva"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
                value={formData.nome}
                onChange={(e) =>
                  setFormData({ ...formData, nome: e.target.value })
                }
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">
              Telefone (Whatsapp)
            </label>
            <input
              type="tel"
              placeholder="11999999999"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
              value={formData.telefone}
              onChange={(e) =>
                setFormData({ ...formData, telefone: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">
              PIN (Senha)
            </label>
            <input
              type="password"
              placeholder="Sua senha numérica"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50 transition-colors tracking-widest"
              value={formData.pin}
              onChange={(e) =>
                setFormData({ ...formData, pin: e.target.value })
              }
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold tracking-wide rounded-lg px-4 py-3 mt-6 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
          >
            {loading ? (
              <span className="animate-pulse">Aguarde...</span>
            ) : (
              <>
                {isRegistering ? (
                  <UserPlus className="w-5 h-5" />
                ) : (
                  <LogIn className="w-5 h-5" />
                )}
                {isRegistering ? "Criar Conta" : "Entrar no Bolão"}
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-sm text-zinc-400 hover:text-white transition-colors"
          >
            {isRegistering
              ? "Já tem uma conta? Faça login"
              : "Não tem conta? Cadastre-se"}
          </button>
        </div>
      </div>
    </div>
  );
}
