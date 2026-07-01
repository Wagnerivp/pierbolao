import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
    try {
        const resDetail = await axios.get('https://sofascore.p.rapidapi.com/matches/detail', {
            params: { matchId: 11874221 }, // let's try a real match or 9001?
            headers: {
              'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
              'X-RapidAPI-Host': 'sofascore.p.rapidapi.com'
            }
          });
          console.log("Success for 11874221");
    } catch(e) {
        console.error("11874221 failed");
    }
    
    try {
        const resDetail2 = await axios.get('https://sofascore.p.rapidapi.com/matches/detail', {
            params: { matchId: 9001 }, 
            headers: {
              'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
              'X-RapidAPI-Host': 'sofascore.p.rapidapi.com'
            }
          });
          console.log("Success for 9001", resDetail2.data);
    } catch(e) {
        console.error("9001 failed");
    }
}
run();
