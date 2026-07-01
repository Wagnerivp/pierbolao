import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
    try {
        const resDetail = await axios.get('https://sofascore.p.rapidapi.com/matches/detail', {
            params: { matchId: 11874221 }, // Random match ID, maybe it exists?
            headers: {
              'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
              'X-RapidAPI-Host': 'sofascore.p.rapidapi.com'
            }
          });
          console.log("Detail works!", resDetail.data.event?.homeTeam.name);
    } catch(e) {
        console.error("Detail failed", e.response?.data || e.message);
    }
}
run();
