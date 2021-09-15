import { deepLog } from "./data-utils.js";
import { getNflGames, getNflStandings } from "./data-fivethirtyeight.js";

const games = await getNflGames();
const standings = await getNflStandings();

// deepLog(games);
deepLog(standings);
