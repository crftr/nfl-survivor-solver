import { deepLog } from "./data-utils.js";
import { getNflGames, getNflStandings } from "./data-fivethirtyeight.js";

const games = await getNflGames();
const standings = await getNflStandings();

const teams = Object.values(standings);
const teamNames = teams.map(t => t.team);

/**
 * teamsSelected represents any teams that have been selected in earlier rounds
 * of the competition. When we search for our optimal solution we will ignore
 * these teams.
 * 
 * This array should be empty if we were pre-competition.
 */
const teamsSelected = [
    'Panthers',
    'Packers'
];
const teamsAvailable = new Set(teamNames.filter(team => !teamsSelected.includes(team)));
