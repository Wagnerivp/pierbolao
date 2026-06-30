import express from "express";
import path from "path";
import axios from "axios";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Proxy to RapidAPI Sofascore
  app.get("/api/matches", async (req, res) => {
    try {
      // Para puxar os jogos automaticamente do Sofascore:
      // 1. Crie uma conta no RapidAPI e assine a API não-oficial do Sofascore.
      // 2. Coloque sua chave no arquivo .env: RAPIDAPI_KEY=sua_chave
      // 3. Descubra o ID do campeonato (ex: Brasileirão = 325, Libertadores = 384)
      const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
      
      const options = {
        method: 'GET',
        url: 'https://sofascore.p.rapidapi.com/tournaments/get-events',
        params: {
          tournamentId: '325', // 325 = Brasileirão Série A (Exemplo)
          seasonId: '58766',   // Temporada atual
          page: '1'
        },
        headers: {
          'X-RapidAPI-Key': RAPIDAPI_KEY,
          'X-RapidAPI-Host': 'sofascore.p.rapidapi.com'
        }
      };

      let events = [];
      try {
        if (RAPIDAPI_KEY) {
          const response = await axios.request(options);
          events = response.data.events || [];
        } else {
          throw new Error("Usando chave de demonstração, caindo para mock");
        }
      } catch (err: any) {
        if (err.response && err.response.status === 403) {
          console.error("ERRO RAPIDAPI: Você precisa se inscrever na API (Subscribe) na página do Sofascore no RapidAPI.");
        } else {
          console.error("Erro na API Sofascore:", err.message);
        }
        // Fallback mock data para testes
        events = [
          {
            id: 1,
            homeTeam: { name: "Flamengo", nameCode: "FLA" },
            awayTeam: { name: "Palmeiras", nameCode: "PAL" },
            startTimestamp: Math.floor(Date.now() / 1000) + 86400,
            status: { description: "Not started" }
          },
          {
            id: 2,
            homeTeam: { name: "São Paulo", nameCode: "SAO" },
            awayTeam: { name: "Corinthians", nameCode: "COR" },
            startTimestamp: Math.floor(Date.now() / 1000) + 172800,
            status: { description: "Not started" }
          }
        ];
      }

      res.json({ success: true, events });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, error: "Failed to fetch matches" });
    }
  });

  app.get("/api/lineups", async (req, res) => {
    try {
      const { matchId } = req.query;
      if (!matchId) {
        return res.status(400).json({ success: false, error: "Match ID required" });
      }

      const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
      
      const options = {
        method: 'GET',
        url: 'https://sofascore.p.rapidapi.com/matches/get-lineups',
        params: { matchId },
        headers: {
          'X-RapidAPI-Key': RAPIDAPI_KEY,
          'X-RapidAPI-Host': 'sofascore.p.rapidapi.com'
        }
      };

      let lineups = null;
      try {
        if (RAPIDAPI_KEY) {
          const response = await axios.request(options);
          lineups = response.data;
        } else {
          throw new Error("Usando chave de demonstração, caindo para mock lineups");
        }
      } catch (err: any) {
        if (err.response && err.response.status === 429) {
          console.warn(`Lineups Rate limit hit for match ${matchId}, using mock data.`);
        }
        // Mock data fallback for the UI to work if API fails or we're using mock matches
        lineups = {
          home: {
            players: [
              { player: { id: 101, name: "Neymar Jr" }, substitute: false },
              { player: { id: 102, name: "Vinícius Jr" }, substitute: false },
              { player: { id: 103, name: "Alisson" }, substitute: false },
              { player: { id: 104, name: "Richarlison" }, substitute: true },
              { player: { id: 105, name: "Antony" }, substitute: true },
            ],
            manager: { name: "Dorival Júnior" }
          },
          away: {
            players: [
              { player: { id: 201, name: "Lionel Messi" }, substitute: false },
              { player: { id: 202, name: "Angel Di Maria" }, substitute: false },
              { player: { id: 203, name: "Emi Martinez" }, substitute: false },
              { player: { id: 204, name: "Paulo Dybala" }, substitute: true },
              { player: { id: 205, name: "Julian Alvarez" }, substitute: true },
            ],
            manager: { name: "Lionel Scaloni" }
          }
        };
      }

      res.json({ success: true, lineups });
    } catch (error) {
      console.error(error);
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
