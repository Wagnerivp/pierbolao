import axios from 'axios';

// test sofascore statistics to see what we can parse
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
        const res = await axios.request(options);
        const stats = res.data.statistics;
        let corners_1t = 0, corners_2t = 0;
        let cards_1t = 0, cards_2t = 0;
        let yellow_home = 0, yellow_away = 0;

        const allPeriod = stats.find((s:any) => s.period === 'ALL');
        const firstHalf = stats.find((s:any) => s.period === '1ST');
        const secondHalf = stats.find((s:any) => s.period === '2ND');

        if (firstHalf) {
             firstHalf.groups.forEach((g:any) => {
                 g.statisticsItems.forEach((item:any) => {
                     if (item.name === 'Corner kicks') corners_1t = parseInt(item.homeValue || 0) + parseInt(item.awayValue || 0);
                     if (item.name === 'Yellow cards') cards_1t += parseInt(item.homeValue || 0) + parseInt(item.awayValue || 0);
                     if (item.name === 'Red cards') cards_1t += parseInt(item.homeValue || 0) + parseInt(item.awayValue || 0);
                 });
             });
        }
        if (secondHalf) {
             secondHalf.groups.forEach((g:any) => {
                 g.statisticsItems.forEach((item:any) => {
                     if (item.name === 'Corner kicks') corners_2t = parseInt(item.homeValue || 0) + parseInt(item.awayValue || 0);
                     if (item.name === 'Yellow cards') cards_2t += parseInt(item.homeValue || 0) + parseInt(item.awayValue || 0);
                     if (item.name === 'Red cards') cards_2t += parseInt(item.homeValue || 0) + parseInt(item.awayValue || 0);
                 });
             });
        }

        console.log({ corners_1t, corners_2t, cards_1t, cards_2t });

    } catch (e: any) {
        console.error(e.message);
    }
}
run();
