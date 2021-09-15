import { deepLog } from "./data-utils.js";
import { getNflGames } from "./data-fivethirtyeight.js";

const games = await getNflGames();

deepLog(games);