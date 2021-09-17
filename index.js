import { deepLog } from "./data-utils.js";
import { getNflGames, getNflStandings } from "./data-fivethirtyeight.js";

let seasonGames = await getNflGames();

const getGamesForWeek = (weekNumber) => seasonGames[weekNumber].games;
const getTeamStatsOfSpreadFavoredGames = (games) => {
    return games.map((game) => {
        const g = {};
        g['team'] = game.spreadWinner;
        g['spread'] = game.spread;
        g['elo'] = getTeamElo(game.spreadWinner);
        g['week'] = game.weekNumber;
        return g;
    });
};
const sortWinnersBySpreadThenElo = (a, b) => {
    if (a.spread < b.spread) { return -1; }
    if (a.spread > b.spread) { return 1; }
    if (a.elo < b.elo) { return -1; }
    if (a.elo > b.elo) { return 1; }
    return 0;
}

const standings = await getNflStandings();
const teams = Object.values(standings);
const teamNames = teams.map((t) => t.team);
const getTeamStanding = (teamName) => Object.values(standings).find((team) => team.team == teamName);
const getTeamElo = (teamName) => getTeamStanding(teamName).elo;

/**
 * teamsSelected represents any teams that have been selected in earlier rounds
 * of the competition. When we search for our optimal solution we will ignore
 * these teams.
 *
 * This array should be empty if we were pre-competition.
 */
const teamNamesOfSelected = ["Panthers", "Packers"];
const teamNamesOfAvailable = new Set(
  teamNames.filter((team) => !teamNamesOfSelected.includes(team))
);

const getRankedSpreadFavoredForSeason = () => {
    const weekNumbers = Object.keys(seasonGames).map((string) => Number(string));
    const weekWinners = weekNumbers.map((weekNumber) => {
        const weekGames = getGamesForWeek(weekNumber);
        const winners = getTeamStatsOfSpreadFavoredGames(weekGames);
        return winners.sort(sortWinnersBySpreadThenElo);
    });
    return weekWinners;
}

const rankedWinnersByWeek = getRankedSpreadFavoredForSeason();

console.log('Done!')