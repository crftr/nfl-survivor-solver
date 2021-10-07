import { rankedAndFilteredWinnersByWeek } from "./lib/process-fivethirtyeight.js";
import { combinationGenerator, structuredClone } from "./lib/data/utils.js";

/**
 * teamsSelected represents any teams that have been selected in earlier rounds
 * of the competition. When we search for our optimal solution we will ignore
 * these teams.
 *
 * This array should be empty if we were pre-competition.
 */
const teamNamesOfSelected = ["Panthers", "Packers", "Ravens", "Bengals", "Vikings"];

const rankedWinners = rankedAndFilteredWinnersByWeek(teamNamesOfSelected);

/**
 * Strategy #1, "The timid puppy" aims to minimize risk.
 *
 * 1. No Brainers: Select teams that, only once, rank #1 as weekly favorites
 * 2. Brute force the rest
 *    - Take on the least risk by optimizing for the min-min spread.
 *    - Sort the options first by max-min delta elo of the teams...
 *    - ... then second, sort by the max mode of the elos.
 */

const filterForNoBrainers = () => {
  const winners = rankedWinners.map((week) => {
    return week[0];
  });

  const winningFrequencies = {};
  winners.forEach((winner) => {
    if (winningFrequencies[winner.team]) {
      winningFrequencies[winner.team]++;
    } else {
      winningFrequencies[winner.team] = 1;
    }
  });
  const noBrainers = Object.keys(winningFrequencies).filter((teamName) => {
    return winningFrequencies[teamName] == 1;
  });

  rankedWinners.forEach((week, idx) => {
    if (noBrainers.includes(week[0].team)) {
      rankedWinners[idx] = rankedWinners[idx].slice(0, 1);
    } else {
      rankedWinners[idx] = rankedWinners[idx].filter((team) => {
        return !noBrainers.includes(team.team);
      });
    }
  });
};

const bruteForceSolutions = () => {
  const weeksToBruteForce = rankedWinners.filter((week) => week.length != 1);
  const weeksToBruteForceNames = weeksToBruteForce.map((week) =>
    week.map((team) => team.team)
  );
  const weeksToBruteForceLength = weeksToBruteForceNames.length;
  const weeksToBruteForceMapToSeason = weeksToBruteForce.map(
    (week) => week[0].week
  );

  const spreadCurrent = (encodedChoice) => {
    let idxSpread;
    let spreadMax = -99;
    for (let idx = 0; idx < weeksToBruteForceLength; idx++) {
      idxSpread = weeksToBruteForce[idx][encodedChoice[idx]].spread;
      if (idxSpread > spreadMax) {
        spreadMax = idxSpread;
      }
    }
    return spreadMax;
  };

  const eloDeltaCurrent = (encodedChoice) => {
    const elos = [];
    for (let idx = 0; idx < weeksToBruteForceLength; idx++) {
      const team = weeksToBruteForce[idx][encodedChoice[idx]];
      elos.push(team.eloDelta);
    }
    elos.sort((a, b) => a - b);
    return {
      min: elos[0],
      max: elos[elos.length - 1],
      avg: elos.reduce((prev, curr) => prev + curr) / elos.length,
      mode: elos[Math.round(elos.length / 2)],
    };
  };

  const sortEncodedChoicesByEloDelta = (a, b) => {
    const eloA_min = eloDeltaCurrent(a).min;
    const eloB_min = eloDeltaCurrent(b).min;

    const eloA_mode = eloDeltaCurrent(a).mode;
    const eloB_mode = eloDeltaCurrent(b).mode;

    if (eloA_min > eloB_min) return -1;
    if (eloA_min < eloB_min) return 1;

    if (eloA_mode > eloB_mode) return -1;
    if (eloA_mode < eloB_mode) return 1;

    return 0;
  };

  /* Let it begin... */

  const bfTeams = new Set();
  const currentIsValid = (currentEncodedChoice) => {
    if (currentEncodedChoice.length != weeksToBruteForceLength) return false;
    bfTeams.clear();
    for (let idx = 0; idx < weeksToBruteForceLength; idx++) {
      if (weeksToBruteForceNames[idx][currentEncodedChoice[idx]]) {
        bfTeams.add(weeksToBruteForceNames[idx][currentEncodedChoice[idx]]);
      }
    }
    return bfTeams.size == weeksToBruteForceLength;
  };

  let i = 0;
  const hist = {};
  const creamSpreadSolutionsEncoded = {};

  const nuChoices = weeksToBruteForce.map((week) => [...Array(week.length).keys()])

  for (let current of combinationGenerator(nuChoices)) {
    if (currentIsValid(current)) {
      const cVal = spreadCurrent(current);

      if (hist[cVal]) {
        hist[cVal] += 1;
      } else {
        hist[cVal] = 1;
      }

      if (creamSpreadSolutionsEncoded[cVal]) {
        creamSpreadSolutionsEncoded[cVal].push(current);
      } else {
        creamSpreadSolutionsEncoded[cVal] = [current];
      }
    }
    
    if (i % 5000000 == 0) {
      i = 0;
      console.log("... brute force iteration " + current);
    }
    i++;
  }

  const top3minSpread = Object.keys(hist).sort().slice(-3);
  const bestEncodedOptions = [];
  for (let spread of top3minSpread) {
    bestEncodedOptions.push(creamSpreadSolutionsEncoded[spread])
  }
  const bestSortedEncodedOptions = bestEncodedOptions.flat().sort(
    sortEncodedChoicesByEloDelta
  );

  /* Let's decode our results */
  const bestSortedOptions = bestSortedEncodedOptions.map((encodedChoice) => {
    const teamNames = [];
    for (let idx = 0; idx < weeksToBruteForceLength; idx++) {
      teamNames.push(weeksToBruteForce[idx][encodedChoice[idx]].team);
    }
    return teamNames;
  });

  const rankedSolutions = bestSortedOptions.map((seasonChoices) => {
    const template = structuredClone(rankedWinners);
    Object.values(weeksToBruteForceMapToSeason).forEach(
      (bruteForcedWeek, idx) => {
        template[bruteForcedWeek - 1] = template[bruteForcedWeek - 1].filter(
          (team) => {
            return team.team == seasonChoices[idx];
          }
        );
      }
    );
    return template;
  });

  return rankedSolutions;
};

filterForNoBrainers();
const rankedSolutions = bruteForceSolutions();

rankedSolutions.forEach((solution, sIdx) => {
  console.log("\n\nSolution #" + (sIdx + 1) + " ------------------");
  console.table(solution.flat());
});
