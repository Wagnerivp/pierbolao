-- ==========================================
-- SCRIPT DE CRIAÇÃO DO BANCO DE DADOS (SUPABASE)
-- ==========================================

-- 1. Tabela de Usuários
CREATE TABLE public.usuarios (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome TEXT NOT NULL,
    telefone TEXT NOT NULL UNIQUE,
    pin TEXT NOT NULL,
    pontos_totais INTEGER DEFAULT 0,
    acertos_placar_exato INTEGER DEFAULT 0,
    is_approved BOOLEAN DEFAULT true,
    is_locked BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabela de Partidas (Copa do Mundo)
CREATE TABLE public.partidas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sofascore_match_id INTEGER NOT NULL UNIQUE,
    time_casa TEXT NOT NULL,
    time_visitante TEXT NOT NULL,
    horario_inicio TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabela de Palpites
CREATE TABLE public.palpites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE,
    match_id INTEGER NOT NULL,
    home INTEGER NOT NULL,
    away INTEGER NOT NULL,
    primeiro_gol_autor TEXT,
    primeiro_cartao_vermelho TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, match_id) -- Garante que o usuário só tenha um palpite por jogo
);

-- 3. Configuração de Segurança (RLS - Row Level Security)
-- Como o aplicativo utiliza autenticação customizada via Telefone + PIN no frontend
-- em vez do Supabase Auth nativo, precisamos liberar as políticas de leitura/escrita.

ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partidas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.palpites ENABLE ROW LEVEL SECURITY;

-- Políticas Abertas (Necessário para a autenticação customizada funcionar)
CREATE POLICY "Acesso total aos usuários" ON public.usuarios FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso total as partidas" ON public.partidas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso total aos palpites" ON public.palpites FOR ALL USING (true) WITH CHECK (true);
