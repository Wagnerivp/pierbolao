import axios from 'axios';

async function run() {
    try {
        const response = await axios.get('https://api.sofascore.com/api/v1/event/11352468/lineups', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
            }
        });
        console.log("Keys: ", Object.keys(response.data));
        console.log("Home players: ", response.data.home.players[0].player.name);
    } catch (e: any) {
        console.error(e.response ? e.response.status : e.message);
    }
}
run();
