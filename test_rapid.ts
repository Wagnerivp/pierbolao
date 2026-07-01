import axios from 'axios';

async function run() {
    const RAPIDAPI_KEY = "3dd5119643msh5fd4694fc97b882p17f897jsnd406196f787f";
    const options = {
        method: 'GET',
        url: `https://sofascore.p.rapidapi.com/matches/get-statistics`,
        params: { matchId: 11352468 },
        headers: {
            'X-RapidAPI-Key': RAPIDAPI_KEY,
            'X-RapidAPI-Host': 'sofascore.p.rapidapi.com'
        }
    };
    try {
        const response = await axios.request(options);
        console.log(`Success: `, JSON.stringify(response.data, null, 2).slice(0, 500));
    } catch (e: any) {
        console.error(`Failed`, e.response?.status);
    }
}
run();
