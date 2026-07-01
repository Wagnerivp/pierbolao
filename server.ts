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
      const RAPIDAPI_KEY = "3dd5119643msh5fd4694fc97b882p17f897jsnd406196f787f";
      const date = new Date().toISOString().split('T')[0]; // Current date

      const options = {
        method: 'GET',
        url: 'https://sofascore.p.rapidapi.com/matches/by-date',
        params: { date },
        headers: {
          'X-RapidAPI-Key': RAPIDAPI_KEY,
          'X-RapidAPI-Host': 'sofascore.p.rapidapi.com'
        }
      };

      const response = await axios.request(options);
      let events = response.data.events || [];

      // FILTRO OBRIGATÓRIO: APENAS Copa do Mundo (World Cup)
      const validMatches = events.filter((m: any) => 
        m.tournament?.name === "World Cup" || m.tournament?.uniqueName === "World Cup"
      );

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
          console.error("Error upserting match:", error);
        }
      }

      res.json({ success: true, message: "Matches synced successfully", count: matchesToInsert.length });
    } catch (error: any) {
      console.error("Sync error:", error.message);
      res.status(500).json({ success: false, error: "Failed to sync matches" });
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
