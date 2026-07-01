import express from "express";
import path from "path";
import axios from "axios";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || "placeholder";
const supabase = createClient(supabaseUrl, supabaseKey);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  app.post("/api/fetch-matches", async (req, res) => {
    try {
      const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || "da55d90e6fmsh9c98df101001573p162a11jsnc6d3574fdcbb";
      const date = new Date().toISOString().split('T')[0]; // Current date

      if (!process.env.VITE_SUPABASE_URL || !(process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY)) {
         console.error("VITE_SUPABASE_URL ou Chave do Supabase ausente nas variáveis de ambiente.");
         return res.status(500).json({ success: false, error: "Credenciais do Supabase ausentes no servidor." });
      }

      const options = {
        method: 'GET',
        url: 'https://sofascore.p.rapidapi.com/matches/by-date', // Solicitado pelo usuário
        params: { date },
        headers: {
          'X-RapidAPI-Key': RAPIDAPI_KEY,
          'X-RapidAPI-Host': 'sofascore.p.rapidapi.com'
        }
      };

      console.log(`Buscando partidas do Sofascore na data ${date}...`);
      const response = await axios.request(options);
      let events = response.data.events || [];

      // FILTRO OBRIGATÓRIO: APENAS Copa do Mundo (World Cup)
      const validMatches = events.filter((m: any) => 
        m.tournament?.name === "World Cup" || m.tournament?.uniqueName === "World Cup"
      );

      if (validMatches.length === 0) {
        return res.json({ success: true, message: "Nenhum jogo da Copa do Mundo encontrado para hoje.", count: 0 });
      }

      // Save to Supabase
      const matchesToInsert = validMatches.map((m: any) => ({
        sofascore_match_id: m.id,
        time_casa: m.homeTeam?.name,
        time_visitante: m.awayTeam?.name,
        horario_inicio: new Date(m.startTimestamp * 1000).toISOString(),
        status: m.status?.description,
      }));

      for (const match of matchesToInsert) {
        const { error } = await supabase
          .from('partidas')
          .upsert(match, { onConflict: 'sofascore_match_id' });
          
        if (error) {
          console.error("Erro do Supabase ao inserir partida:", error.message);
          return res.status(500).json({ success: false, error: `Falha ao salvar no banco (Supabase): ${error.message}` });
        }
      }

      res.json({ success: true, message: "Jogos da Copa sincronizados com sucesso!", count: matchesToInsert.length });
    } catch (error: any) {
      console.error("Erro completo na rota fetch-matches:", error.response?.data || error.message);
      
      let errorMsg = "Falha desconhecida na sincronização.";
      if (error.response?.status === 401 || error.response?.status === 403) {
        errorMsg = "Chave da Sofascore (RapidAPI) inválida ou expirada.";
      } else if (error.response?.data?.message) {
        errorMsg = `Erro na API da Sofascore: ${error.response.data.message}`;
      } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        errorMsg = "Timeout: A Sofascore demorou muito para responder.";
      }
      
      res.status(500).json({ success: false, error: errorMsg });
    }
  });

  app.post("/api/admin/approve-user", async (req, res) => {
    try {
      const { user_id } = req.body;
      if (!user_id) {
        return res.status(400).json({ success: false, error: "ID do usuário não fornecido." });
      }

      if (!process.env.VITE_SUPABASE_URL || !(process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY)) {
         console.error("VITE_SUPABASE_URL ou Chave do Supabase ausente.");
         return res.status(500).json({ success: false, error: "Credenciais do Supabase ausentes no servidor." });
      }

      const { error } = await supabase
        .from('usuarios')
        .update({ is_approved: true })
        .eq('id', user_id);

      if (error) {
        console.error("Erro no Supabase ao aprovar usuário:", error.message);
        return res.status(500).json({ success: false, error: `Falha no banco de dados (Supabase): ${error.message}` });
      }

      res.json({ success: true, message: "Usuário liberado com sucesso!" });
    } catch (error: any) {
      console.error("Erro inesperado na rota approve-user:", error.message);
      res.status(500).json({ success: false, error: "Falha interna no servidor ao liberar usuário." });
    }
  });

  app.get("/api/fetch-lineups", async (req, res) => {
    try {
      const { match_id } = req.query;
      if (!match_id) return res.status(400).json({ success: false, error: "match_id required" });
      
      const RAPIDAPI_KEY = "3dd5119643msh5fd4694fc97b882p17f897jsnd406196f787f";
      
      const options = {
        method: 'GET',
        url: 'https://sofascore.p.rapidapi.com/matches/get-lineups',
        params: { matchId: match_id },
        headers: {
          'X-RapidAPI-Key': RAPIDAPI_KEY,
          'X-RapidAPI-Host': 'sofascore.p.rapidapi.com'
        }
      };

      const response = await axios.request(options);
      const lineups = response.data;
      
      // Return a clean array of players from both teams (starters and subs)
      const extractPlayers = (team: any) => {
        if (!team || !team.players) return [];
        return team.players.map((p: any) => p.player?.name).filter(Boolean);
      };

      const homePlayers = extractPlayers(lineups?.home);
      const awayPlayers = extractPlayers(lineups?.away);
      const allPlayers = [...homePlayers, ...awayPlayers];
      
      res.json({ success: true, players: allPlayers });
    } catch (error: any) {
      console.error("Sync lineups error:", error.message);
      res.status(500).json({ success: false, error: "Failed to fetch lineups" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
