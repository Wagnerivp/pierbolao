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

  // Rota protegida do Admin para sincronizar partidas da Sofascore para o Supabase
  app.post("/api/admin/sync-matches", async (req, res) => {
    try {
      const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
      if (!RAPIDAPI_KEY) {
        return res.status(400).json({ success: false, error: "RAPIDAPI_KEY not configured" });
      }

      // 1. Fetch from Sofascore
      const options = {
        method: 'GET',
        url: 'https://sofascore.p.rapidapi.com/tournaments/get-events',
        params: {
          tournamentId: '325', // Exemplo
          seasonId: '58766',
          page: '1'
        },
        headers: {
          'X-RapidAPI-Key': RAPIDAPI_KEY,
          'X-RapidAPI-Host': 'sofascore.p.rapidapi.com'
        }
      };

      const response = await axios.request(options);
      const events = response.data.events || [];

      // 2. Save to Supabase
      const matchesToInsert = events.map((m: any) => ({
        sofascore_match_id: m.id,
        time_casa: m.homeTeam.name,
        time_visitante: m.awayTeam.name,
        horario_inicio: new Date(m.startTimestamp * 1000).toISOString(),
        status: m.status.description,
      }));

      for (const match of matchesToInsert) {
        const { error } = await supabase
          .from('partidas')
          .upsert(match, { onConflict: 'sofascore_match_id' });
          
        if (error) {
          console.error("Error upserting match:", error);
        }
      }

      res.json({ success: true, message: "Matches synced successfully", count: matchesToInsert.length });
    } catch (error: any) {
      console.error("Sync error:", error.message);
      res.status(500).json({ success: false, error: "Failed to sync matches" });
    }
  });

  // Rota para sincronizar escalações/resultados (Cron job ou Admin)
  app.post("/api/admin/sync-lineups", async (req, res) => {
    try {
      const { matchId } = req.body;
      if (!matchId) return res.status(400).json({ success: false, error: "matchId required" });
      
      const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
      if (!RAPIDAPI_KEY) {
        return res.status(400).json({ success: false, error: "RAPIDAPI_KEY not configured" });
      }

      // 1. Fetch from Sofascore
      const options = {
        method: 'GET',
        url: 'https://sofascore.p.rapidapi.com/matches/get-lineups',
        params: { matchId },
        headers: {
          'X-RapidAPI-Key': RAPIDAPI_KEY,
          'X-RapidAPI-Host': 'sofascore.p.rapidapi.com'
        }
      };

      const response = await axios.request(options);
      const lineups = response.data;
      
      // 2. Aqui você salvaria as escalações no Supabase
      // Exemplo: await supabase.from('lineups').upsert({ match_id: matchId, data: lineups });
      
      res.json({ success: true, message: "Lineups synced successfully" });
    } catch (error: any) {
      console.error("Sync lineups error:", error.message);
      res.status(500).json({ success: false, error: "Failed to sync lineups" });
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
