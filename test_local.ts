import axios from 'axios';
async function run() {
  try {
     const res = await axios.get("http://localhost:3000/api/live-matches");
     console.log(res.data);
  } catch (e) { console.error(e.message); }
}
run();
