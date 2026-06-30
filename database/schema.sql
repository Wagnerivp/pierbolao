-- Tabela de Usuários
CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    telefone TEXT UNIQUE NOT NULL,
    pin_hash TEXT NOT NULL,
    pontos_totais INTEGER DEFAULT 0,
    acertos_placar_exato INTEGER DEFAULT 0,
    is_approved BOOLEAN DEFAULT false,
    is_locked BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Tabela de Partidas (Apenas Copa do Mundo)
CREATE TABLE partidas (
    id SERIAL PRIMARY KEY,
    sofascore_match_id INTEGER UNIQUE,
    time_casa TEXT NOT NULL,
    time_visitante TEXT NOT NULL,
    horario_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT DEFAULT 'nao_iniciado'
);

-- Tabela de Palpites
CREATE TABLE palpites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    partida_id INTEGER REFERENCES partidas(id) ON DELETE CASCADE,
    dados_palpites JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    CONSTRAINT palpite_unico UNIQUE(usuario_id, partida_id)
);

-- Policies / RLS
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE partidas ENABLE ROW LEVEL SECURITY;
ALTER TABLE palpites ENABLE ROW LEVEL SECURITY;

-- Exemplo basico RLS:
-- Permitir leitura de usuarios autenticados
CREATE POLICY "Leitura_Publica_Partidas" ON partidas FOR SELECT USING (true);
CREATE POLICY "Leitura_Palpites_Proprios" ON palpites FOR SELECT USING (true);
CREATE POLICY "Insercao_Palpites" ON palpites FOR ALL USING (true);
CREATE POLICY "Leitura_Usuarios" ON usuarios FOR SELECT USING (true);
CREATE POLICY "Criar_Usuario" ON usuarios FOR INSERT USING (true);
