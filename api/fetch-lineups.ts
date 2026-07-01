import axios from "axios";
import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    const { match_id } = req.query;
    if (!match_id) {
      return res.status(400).json({ success: false, error: "match_id required" });
    }
    
    const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || "3dd5119643msh5fd4694fc97b882p17f897jsnd406196f787f";
    
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
    
    return res.json({ success: true, players: allPlayers });
  } catch (error: any) {
    console.error("Sync lineups error (Vercel):", error.message);
    return res.status(500).json({ success: false, error: "Failed to fetch lineups" });
  }
}
