import { rankedAndFilteredWinnersByWeek } from "./lib/process-fivethirtyeight.js";
import { combinationGenerator, structuredClone } from "./lib/data/utils.js";

/**
 * teamsSelected represents any teams that have been selected in earlier rounds
 * of the competition. When we search for our optimal solution we will ignore
 * these teams. This array should be empty if we were pre-competition.
 *
 * startFromWeek will accommodate pools that begin in the middle of the season.
 */

// const teamNamesOfSelected = ["Panthers", "Packers", "Ravens", "Bengals", "Vikings", "Colts", "Patriots"];
// const startFromWeek = 1;

const teamNamesOfSelected = ["Cardinals"];
const startFromWeek = 7;

const rankedWinners = rankedAndFilteredWinnersByWeek(
  teamNamesOfSelected,
  startFromWeek
).slice(startFromWeek - 1);

/**
 * Strategy #1, "The timid puppy" aims to minimize risk.
 *
 * 1. No Brainers: Select teams that, only once, rank #1 as a weekly favorite.
 * 2. Brute force the rest
 *    - Take on the least risk by optimizing for the min-min spread.
 *    - Sort the options by max-min delta elo of the teams.
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
      idxSpread = weeksToBruteForce[idx].find(
        (game) => game.team == encodedChoice[idx]
      ).spread;
      if (idxSpread > spreadMax) {
        spreadMax = idxSpread;
      }
    }
    return spreadMax;
  };

  const eloDeltaCurrent = (encodedChoice) => {
    const elos = [];
    for (let idx = 0; idx < weeksToBruteForceLength; idx++) {
      const team = weeksToBruteForce[idx].find(
        (game) => game.team == encodedChoice[idx]
      );
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

  const sortEncodedChoicesBySpreadThenEloDelta = (a, b) => {
    const spreadA_min = spreadCurrent(a);
    const spreadB_min = spreadCurrent(b);

    if (spreadA_min < spreadB_min) return -1;
    if (spreadA_min > spreadB_min) return 1;

    const eloA_min = eloDeltaCurrent(a).min;
    const eloB_min = eloDeltaCurrent(b).min;

    if (eloA_min > eloB_min) return -1;
    if (eloA_min < eloB_min) return 1;

    return 0;
  };

  /* Let it begin... */

  const currentIsValid = (currentEncodedChoice) => {
    return (
      currentEncodedChoice.length == weeksToBruteForceLength &&
      new Set(currentEncodedChoice).size == weeksToBruteForceLength
    );
  };

  let i = 0;
  const hist = {};
  const creamSpreadSolutionsEncoded = {};

  const nuChoices = weeksToBruteForce.map((week) =>
    week.map((game) => game.team)
  );

  for (let current of combinationGenerator(nuChoices)) {
    let currentFlattened = current.flat(weeksToBruteForceLength);

    if (currentIsValid(currentFlattened)) {
      const cVal = spreadCurrent(currentFlattened);

      if (hist[cVal]) {
        hist[cVal] += 1;
      } else {
        hist[cVal] = 1;
      }

      if (creamSpreadSolutionsEncoded[cVal]) {
        creamSpreadSolutionsEncoded[cVal].push(currentFlattened);
      } else {
        creamSpreadSolutionsEncoded[cVal] = [currentFlattened];
      }
    }

    if (i % 5000000 == 0) {
      i = 0;
      console.log("... brute force iteration " + currentFlattened);
    }
    i++;
  }

  const top3minSpread = Object.keys(hist).sort().slice(-3);
  const bestEncodedOptions = [];
  for (let spread of top3minSpread) {
    bestEncodedOptions.push(creamSpreadSolutionsEncoded[spread]);
  }
  const bestSortedEncodedOptions = bestEncodedOptions
    .flat()
    .sort(sortEncodedChoicesBySpreadThenEloDelta);

  /* Let's decode our results */
  const bestSortedOptions = bestSortedEncodedOptions.map((encodedChoice) => {
    const teamNames = [];
    for (let idx = 0; idx < weeksToBruteForceLength; idx++) {
      teamNames.push(
        weeksToBruteForce[idx].find((game) => game.team == encodedChoice[idx])
          .team
      );
    }
    return teamNames;
  });

  const rankedSolutions = bestSortedOptions.map((seasonChoices) => {
    const template = structuredClone(rankedWinners);
    Object.values(weeksToBruteForceMapToSeason).forEach(
      (bruteForcedWeek, idx) => {
        template[bruteForcedWeek - startFromWeek] = template[
          bruteForcedWeek - startFromWeek
        ].filter((team) => {
          return team.team == seasonChoices[idx];
        });
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
