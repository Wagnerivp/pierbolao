import axios from 'axios';

async function run() {
    const RAPIDAPI_KEY = "3dd5119643msh5fd4694fc97b882p17f897jsnd406196f787f";
    const matchId = 9001;
    let matchDetail;
    try {
        const resDetail = await axios.get('https://sofascore.p.rapidapi.com/matches/detail', {
          params: { matchId },
          headers: {
            'X-RapidAPI-Key': RAPIDAPI_KEY,
            'X-RapidAPI-Host': 'sofascore.p.rapidapi.com'
          }
        });
        matchDetail = resDetail.data;
        console.log("Detail:", matchDetail);
    } catch (e) {
        console.error("Error fetching detail for", matchId, e.response?.status);
    }
}
run();
