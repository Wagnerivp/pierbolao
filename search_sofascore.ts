import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
    try {
        const resDetail = await axios.get('https://sofascore.p.rapidapi.com/matches/v2/list-by-date', {
            params: { category: 'sport', date: '2026-07-01' },
            headers: {
              'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
              'X-RapidAPI-Host': 'sofascore.p.rapidapi.com'
            }
          });
          const events = resDetail.data.events;
          events.forEach(e => {
              if (e.homeTeam.name.includes("England") || e.homeTeam.name.includes("Inglaterra") || e.awayTeam.name.includes("England") || e.awayTeam.name.includes("Inglaterra")) {
                  console.log("Found match:", e.id, e.homeTeam.name, "vs", e.awayTeam.name);
              }
          });
    } catch(e) {
        console.error("Failed to list by date");
    }
}
run();
