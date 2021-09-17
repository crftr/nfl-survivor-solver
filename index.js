import { rankedAndFilteredWinnersByWeek } from "./process-fivethirtyeight.js";

/**
 * teamsSelected represents any teams that have been selected in earlier rounds
 * of the competition. When we search for our optimal solution we will ignore
 * these teams.
 *
 * This array should be empty if we were pre-competition.
 */
const teamNamesOfSelected = ["Panthers", "Packers"];

const rankedWinners = rankedAndFilteredWinnersByWeek(teamNamesOfSelected);

console.log('Done!')