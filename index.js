import { rankedAndFilteredWinnersByWeek } from "./lib/process-fivethirtyeight.js";
import { structuredClone } from "./lib/data-utils.js";

/**
 * teamsSelected represents any teams that have been selected in earlier rounds
 * of the competition. When we search for our optimal solution we will ignore
 * these teams.
 *
 * This array should be empty if we were pre-competition.
 */
const teamNamesOfSelected = ["Panthers", "Packers", "Ravens"];

const rankedWinners = rankedAndFilteredWinnersByWeek(teamNamesOfSelected);
const spreadLookupTable = (() => {
  return rankedWinners.map((weeklyGames) => {
    const weeklyLookupObj = {};
    weeklyGames.forEach((game) => {
      weeklyLookupObj[game.team] = {
        spread: game.spread,
      };
    });
    return weeklyLookupObj;
  });
})();
const participantLookupTable = (() => {
  return spreadLookupTable.map((weeklyGamesObj) => {
    return new Set(Object.keys(weeklyGamesObj));
  });
})();

const sumSpreadSeasonChoices = (arrayOfChoices) => {
  let score = 0;
  arrayOfChoices.forEach((choice, idx) => {
    score += spreadLookupTable[idx][choice].spread;
  });
  return score;
};

const minSpreadSeasonChoices = (arrayOfChoices) => {
  let min = 0;
  arrayOfChoices.forEach((choice, idx) => {
    if (min > spreadLookupTable[idx][choice].spread) {
      min = spreadLookupTable[idx][choice].spread;
    }
  });
  return min;
};

const maxSpreadSeasonChoices = (arrayOfChoices) => {
  let max = -99;
  arrayOfChoices.forEach((choice, idx) => {
    if (max < spreadLookupTable[idx][choice].spread) {
      max = spreadLookupTable[idx][choice].spread;
    }
  });
  return max;
};

/**
 * Strategy #1, "The timid puppy" aims to minimize risk.
 * 
 * 1. No Brainers: Select teams that, only once, rank #1 as weekly favorites
 * 2. The Weekly Cream: Only consider the top-5 per week (this is configurable)
 * 3. Brute force the rest
 *    - Take on the least risk by optimizing for max-min spread.
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

const filterTheWeeklyCream = (creamNum) => {
  rankedWinners.forEach((week, idx) => {
    rankedWinners[idx] = rankedWinners[idx].slice(0, creamNum);
  });
};

const bruteForceSolutions = (creamNum, creamSpread) => {
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
    let idxEloDelta;
    const elos = [];
    for (let idx = 0; idx < weeksToBruteForceLength; idx++) {
      idxEloDelta = weeksToBruteForce[idx][encodedChoice[idx]].eloDelta;
      elos.push(idxEloDelta);
    }
    elos.sort((a,b) => a-b);
    return {
        min: elos[0],
        max: elos[elos.length - 1],
        avg: elos.reduce((prev, curr) => prev+curr) / elos.length,
        mode: elos[Math.round(elos.length / 2)]
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
  }

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

  /**
   * I'm periodically checking the bounds of the for-loop since
   * BigInt radix parsing seems to be trickier than I have
   * patience for at the moment. Plus, a few extra loops won't
   * kill me for this fun project.
   *
   * Consider optimizing this later.
   */

  const hist = {};
  const creamSpreadSolutionsEncoded = {};

  for (var i = 0n; ; i = i + 1n) {
    const current = i.toString(creamNum).padStart(weeksToBruteForceLength, "0");

    if (currentIsValid(current)) {
      const cVal = spreadCurrent(current);

      if (hist[cVal]) {
        hist[cVal] += 1;
      } else {
        hist[cVal] = 1;
      }

      if (cVal <= creamSpread) {
        if (creamSpreadSolutionsEncoded[cVal]) {
          creamSpreadSolutionsEncoded[cVal].push(current);
        } else {
          creamSpreadSolutionsEncoded[cVal] = [current];
        }
      }
    } else if (i % 1000000n == 0) {
      console.log("... at " + current);
      if (i.toString(creamNum).length > weeksToBruteForceLength) break;
    }
  }

  const lowestMinSpreadFound = Object.keys(hist).sort().pop();
  const bestEncodedOptions = creamSpreadSolutionsEncoded[lowestMinSpreadFound];
  const bestSortedEncodedOptions = bestEncodedOptions.sort(sortEncodedChoicesByEloDelta);

  /* Let's decode our results */
  const bestSortedOptions = bestSortedEncodedOptions.map((encodedChoice) => {
    const teamNames = [];
    for (let idx = 0; idx < weeksToBruteForceLength; idx++) {
        teamNames.push(weeksToBruteForce[idx][encodedChoice[idx]].team);
    }
    return teamNames;
  });

  const rankedSolutions = bestSortedOptions.map(seasonChoices => {
      const template = structuredClone(rankedWinners);
      Object.values(weeksToBruteForceMapToSeason).forEach((bruteForcedWeek, idx) => {
          template[bruteForcedWeek - 1] = template[bruteForcedWeek - 1].filter(team => {
              return team.team == seasonChoices[idx];
          })
      });
      return template;
  })

  return rankedSolutions;
};

const creamNum = 4;
const creamSpread = -6;
filterForNoBrainers();
filterTheWeeklyCream(creamNum);
const rankedSolutions = bruteForceSolutions(creamNum, creamSpread);

rankedSolutions.forEach((solution, sIdx) => {
    console.log( 'Solution #' + (sIdx+1) + ' ------------------');
    
    solution.forEach((week, wIdx) => {
        console.log( '  wk' + (wIdx+1) + ' ' + JSON.stringify(week));
    })
}) 
