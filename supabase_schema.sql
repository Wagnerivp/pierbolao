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
    pago BOOLEAN DEFAULT false,
    comprovante_enviado BOOLEAN DEFAULT false,
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
    total_gols INTEGER,
    ambos_marcam TEXT,
    primeiro_gol_time TEXT,
    cartoes_1t TEXT,
    escanteios_1t TEXT,
    cartoes_2t TEXT,
    escanteios_2t TEXT,
    vencedor_prorrogacao TEXT,
    cartao_prorrogacao TEXT,
    vencedor_penaltis TEXT,
    jogadores_gols JSONB DEFAULT '{}'::jsonb,
    pontos_obtidos INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, match_id) -- Garante que o usuário só tenha um palpite por jogo
);

-- Função para calcular e atualizar pontos (Pode ser chamada manualmente ou via trigger/API)
CREATE OR REPLACE FUNCTION public.calcular_pontos_partida(
    p_match_id INTEGER,
    p_home_score INTEGER,
    p_away_score INTEGER,
    p_total_gols INTEGER,
    p_ambos_marcam TEXT,
    p_primeiro_gol_time TEXT,
    p_cartoes_1t TEXT,
    p_escanteios_1t TEXT,
    p_cartoes_2t TEXT,
    p_escanteios_2t TEXT,
    p_vencedor_prorrogacao TEXT,
    p_cartao_prorrogacao TEXT,
    p_vencedor_penaltis TEXT,
    p_jogadores_gols JSONB
) RETURNS VOID AS $$
DECLARE
    palpite RECORD;
    v_pontos INTEGER;
    k text;
    v text;
BEGIN
    FOR palpite IN SELECT * FROM public.palpites WHERE match_id = p_match_id LOOP
        v_pontos := 0;

        -- Placar Exato: 10 pontos
        IF palpite.home = p_home_score AND palpite.away = p_away_score THEN
            v_pontos := v_pontos + 10;
        -- Vencedor da Partida: 5 pontos (Se acertou só quem venceu ou empate, sem ser placar exato)
        ELSIF (palpite.home > palpite.away AND p_home_score > p_away_score) OR 
              (palpite.home < palpite.away AND p_home_score < p_away_score) OR 
              (palpite.home = palpite.away AND p_home_score = p_away_score) THEN
            v_pontos := v_pontos + 5;
        END IF;

        -- Total de Gols exato: 5 pontos
        IF palpite.total_gols = p_total_gols THEN
            v_pontos := v_pontos + 5;
        END IF;

        -- Ambos Marcam (Sim/Não): 4 pontos
        IF palpite.ambos_marcam = p_ambos_marcam THEN
            v_pontos := v_pontos + 4;
        END IF;

        -- Quem faz o 1º Gol (Time Casa/Visitante/Ninguém): 4 pontos
        IF palpite.primeiro_gol_time = p_primeiro_gol_time THEN
            v_pontos := v_pontos + 4;
        END IF;

        -- Estatísticas 1º Tempo
        IF palpite.cartoes_1t = p_cartoes_1t THEN v_pontos := v_pontos + 2; END IF;
        IF palpite.escanteios_1t = p_escanteios_1t THEN v_pontos := v_pontos + 2; END IF;

        -- Estatísticas 2º Tempo
        IF palpite.cartoes_2t = p_cartoes_2t THEN v_pontos := v_pontos + 2; END IF;
        IF palpite.escanteios_2t = p_escanteios_2t THEN v_pontos := v_pontos + 2; END IF;

        -- Mata-Mata
        IF p_vencedor_prorrogacao IS NOT NULL AND p_vencedor_prorrogacao != 'Ninguém' THEN
            IF palpite.vencedor_prorrogacao = p_vencedor_prorrogacao THEN v_pontos := v_pontos + 8; END IF;
            IF palpite.cartao_prorrogacao = p_cartao_prorrogacao THEN v_pontos := v_pontos + 5; END IF;
        END IF;

        IF p_vencedor_penaltis IS NOT NULL AND p_vencedor_penaltis != 'Ninguém' THEN
            IF palpite.vencedor_penaltis = p_vencedor_penaltis THEN v_pontos := v_pontos + 8; END IF;
        END IF;

        -- Artilheiro Multi-Gols (Regra Anti-Espertinho)
        IF palpite.jogadores_gols IS NOT NULL AND jsonb_typeof(palpite.jogadores_gols) = 'object' THEN
            FOR k, v IN SELECT key, value FROM jsonb_each_text(palpite.jogadores_gols) LOOP
                IF v::INTEGER > 0 THEN
                    IF p_jogadores_gols IS NOT NULL AND p_jogadores_gols->>k IS NOT NULL AND (p_jogadores_gols->>k)::INTEGER = v::INTEGER THEN
                        v_pontos := v_pontos + 10;
                    ELSE
                        v_pontos := v_pontos - 5;
                    END IF;
                END IF;
            END LOOP;
        END IF;

        -- Atualiza os pontos obtidos no palpite
        UPDATE public.palpites SET pontos_obtidos = v_pontos WHERE id = palpite.id;

        -- Atualiza a pontuação total do usuário
        UPDATE public.usuarios SET pontos_totais = (
            SELECT COALESCE(SUM(pontos_obtidos), 0) FROM public.palpites WHERE user_id = palpite.user_id
        ) WHERE id = palpite.user_id;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

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

-- Atualização das colunas de evolução (NOVA REGRA: NÃO VOLÁTIL)
ALTER TABLE public.palpites ADD COLUMN IF NOT EXISTS pontos_gerais INTEGER DEFAULT 0;
ALTER TABLE public.palpites ADD COLUMN IF NOT EXISTS pontos_1t INTEGER DEFAULT 0;
ALTER TABLE public.palpites ADD COLUMN IF NOT EXISTS pontos_2t INTEGER DEFAULT 0;
