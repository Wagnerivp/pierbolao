import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
    try {
        const resDetail = await axios.get('https://sofascore.p.rapidapi.com/matches/v2/list-live', {
            params: { category: 'sport' },
            headers: {
              'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
              'X-RapidAPI-Host': 'sofascore.p.rapidapi.com'
            }
          });
          const events = resDetail.data.events || [];
          console.log("Live matches:", events.map(e => ({id: e.id, home: e.homeTeam.name, away: e.awayTeam.name})).slice(0, 5));
    } catch(e) {
        console.error("Failed", e.response?.data || e.message);
    }
}
run();
