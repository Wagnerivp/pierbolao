import axios from 'axios';

async function run() {
    try {
        const response = await axios.get('https://api.sofascore.com/api/v1/event/11352376', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
            }
        });
        const match = response.data.event;
        console.log("Status: ", match.status);
        console.log("Home score: ", match.homeScore);
        console.log("Away score: ", match.awayScore);
        console.log("Time: ", match.time);
    } catch (e: any) {
        console.error(e.response ? e.response.status : e.message);
    }
}
run();
