const axios = require('axios');
async function test() {
  try {
    const response = await axios.get('https://sofascore.p.rapidapi.com/matches/v1/events/schedule/date', {
      params: { date: '2022-11-20' }, // trying different endpoint
      headers: {
        'X-RapidAPI-Key': 'da55d90e6fmsh9c98df101001573p162a11jsnc6d3574fdcbb',
        'X-RapidAPI-Host': 'sofascore.p.rapidapi.com'
      }
    });
    console.log("SUCCESS");
  } catch (e) {
    console.error("ERROR", e.response?.status);
    console.error(e.response?.data);
  }
}
test();
