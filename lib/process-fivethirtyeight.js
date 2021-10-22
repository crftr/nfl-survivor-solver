import { getNflGames, getNflStandings } from "./data-fivethirtyeight.js";

let seasonGames = await getNflGames();

const getGamesForWeek = (weekNumber) => seasonGames[weekNumber].games;
const getTeamStatsOfSpreadFavoredGames = (games) => {
  return games.map((game) => {
    const g = {};
    g["team"] = game.spreadWinner;
    g["spread"] = game.spread;
    g["elo"] = getTeamElo(game.spreadWinner);
    g["eloDelta"] = getTeamElo(game.spreadWinner) - getTeamElo(game.spreadLoser);
    g["rankDelta"] = getTeamRank(game.spreadWinner) - getTeamRank(game.spreadLoser);
    g["week"] = game.weekNumber;
    return g;
  });
};
const sortWinnersBySpreadThenElo = (a, b) => {
  if (a.spread < b.spread) { return -1; }
  if (a.spread > b.spread) { return 1; }
  if (a.elo < b.elo) { return -1; }
  if (a.elo > b.elo) { return 1; }
  return 0;
};

const standings = await getNflStandings();
const teams = Object.values(standings);
const teamNames = teams.map((t) => t.team);
const getTeamStanding = (teamName) => Object.values(standings).find((team) => team.team == teamName);
const getTeamElo = (teamName) => getTeamStanding(teamName).elo;
const getTeamRank = (teamName) => {
  return Object.keys(standings).find((key) => standings[key].team === teamName);
};

const getRankedSpreadFavoredForSeason = () => {
  const weekNumbers = Object.keys(seasonGames).map((string) => Number(string));
  const weekWinners = weekNumbers.map((weekNumber) => {
    const weekGames = getGamesForWeek(weekNumber);
    const winners = getTeamStatsOfSpreadFavoredGames(weekGames);
    return winners.sort(sortWinnersBySpreadThenElo);
  });
  return weekWinners;
};

const eliminateSelectedTeams = (winnersByWeek, teamNamesOfSelected, startFromWeek) => {
  const winners = Array.from(winnersByWeek);
  const numOfSelections = teamNamesOfSelected.length;
  const startFromWeekIdx = startFromWeek - 1;

  // 1. Lock-in the previously made selections
  teamNamesOfSelected.forEach((selectedTeam, idx) => {
    winners[idx + startFromWeekIdx] = winners[idx + startFromWeekIdx].filter((winner) => winner.team == selectedTeam);
  });

  // 2. Eliminate selctions from future consideration
  for (let week = (startFromWeek - 1) + numOfSelections; week < winners.length; week++) {
    winners[week] = winners[week].filter(
      (winner) => !teamNamesOfSelected.includes(winner.team)
    );
  }
  return winners;
};

const rankedAndFilteredWinnersByWeek = (teamNamesOfSelected, startFromWeek = 1) => {
  const rankedWinnersByWeek = getRankedSpreadFavoredForSeason();
  return eliminateSelectedTeams(rankedWinnersByWeek, teamNamesOfSelected, startFromWeek);
};

export { rankedAndFilteredWinnersByWeek };
