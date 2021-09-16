import { deepLog } from "./data-utils.js";
import { getNflGames, getNflStandings } from "./data-fivethirtyeight.js";

let seasonGames = await getNflGames();

const getGamesForWeek = (weekNumber) => seasonGames[weekNumber].games;
const getGameSpreadFavoredTeam = (game) => {
    let favoredTeam = game.teams.find( (t) => Number(t.spread) < 0);
    return favoredTeam;
};


const getTeamNamesOfSpreadFavoredGames = (games) => {
    games.map((game) => {
        const favoredTeam = getGameSpreadFavoredTeam(game);
        favoredTeam.team;
    });
};


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
const teamNamesOfSelected = [
    'Panthers',
    'Packers'
];
const teamNamesOfAvailable = new Set(teamNames.filter(team => !teamNamesOfSelected.includes(team)));


let week2Games = getGamesForWeek(2);
let game = week2Games[0];

let winners = getTeamNamesOfSpreadFavoredGames(week2Games);

console.log('done')