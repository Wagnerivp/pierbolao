import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
    try {
        const resDetail = await axios.get('https://sofascore.p.rapidapi.com/teams/search', {
            params: { name: 'England' },
            headers: {
              'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
              'X-RapidAPI-Host': 'sofascore.p.rapidapi.com'
            }
          });
          const teamId = resDetail.data.results[0].entity.id;
          console.log("Team ID:", teamId);
          
          const resMatches = await axios.get(`https://sofascore.p.rapidapi.com/teams/get-next-matches`, {
             params: { teamId },
            headers: {
              'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
              'X-RapidAPI-Host': 'sofascore.p.rapidapi.com'
            }
          });
          console.log("Next matches:", resMatches.data.events.map(e => ({id: e.id, home: e.homeTeam.name, away: e.awayTeam.name})));
    } catch(e) {
        console.error("Failed", e.response?.data || e.message);
    }
}
run();
