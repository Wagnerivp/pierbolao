import axios from 'axios';

async function run() {
    try {
        const res = await axios.get('https://site.api.espn.com/apis/site/v2/sports/soccer/all/scoreboard');
        console.log(JSON.stringify(res.data.events, null, 2));
    } catch(e) { console.log("ESPN failed"); }
}
run();
