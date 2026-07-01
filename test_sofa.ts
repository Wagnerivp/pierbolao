import axios from 'axios';

async function run() {
    const RAPIDAPI_KEY = "3dd5119643msh5fd4694fc97b882p17f897jsnd406196f787f";
    const options = {
        method: 'GET',
        url: 'https://sofascore.p.rapidapi.com/matches/get-lineups',
        params: { matchId: 11352376 },
        headers: {
            'X-RapidAPI-Key': RAPIDAPI_KEY,
            'X-RapidAPI-Host': 'sofascore.p.rapidapi.com'
        }
    };
    try {
        const response = await axios.request(options);
        console.log("Data: ", Object.keys(response.data));
        if (response.data.home) {
            console.log("Home players count:", response.data.home.players.length);
        }
    } catch (e: any) {
        console.error("Error:", e.response ? e.response.status + " " + e.response.statusText : e.message);
    }
}
run();
