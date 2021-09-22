import { rankedAndFilteredWinnersByWeek } from "./lib/process-fivethirtyeight.js";

/**
 * teamsSelected represents any teams that have been selected in earlier rounds
 * of the competition. When we search for our optimal solution we will ignore
 * these teams.
 *
 * This array should be empty if we were pre-competition.
 */
const teamNamesOfSelected = ["Panthers", "Packers"];

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

function generateStates(n, base) {
  var states = [];

  // Convert to decimal
  //   var maxDecimal = BigInt(base.toString().repeat(n), base);
  var maxDecimal = 200;

  // For every number between 0->decimal
  for (var i = 0n; i <= maxDecimal; i++) {
    // Convert to binary, pad with 0, and add to final results
    states.push(i.toString(base).padStart(n, "0"));
  }

  return states;
}
// generateStates(12, 5);

/**
 * Strategy #1
 * - No Brainers: Select teams that rank #1 as weekly winners, once
 * - The Weekly Cream: Only consider the top-5 per week
 * - Brute force the rest
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

const bruteForceSolutions = (creamNum) => {
  const weeksToBruteForce = rankedWinners.filter((week) => week.length != 1);
  const weeksToBruteForceNames = weeksToBruteForce.map((week) =>
    week.map((team) => team.team)
  );
  const weeksToBruteForceLength = weeksToBruteForceNames.length;

  let bestMin = 0;
  let bestMax = 0;
  const bestChoices = [];

  /* Let it begin... */

  const bfTeams = new Set();
  const currentIsValid = (currentEncodedChoice) => {
      bfTeams.clear();
      for (let idx = 0; idx < weeksToBruteForceLength; idx++) {
          if (weeksToBruteForceNames[idx][currentEncodedChoice[idx]]) {
            bfTeams.add(weeksToBruteForceNames[idx][currentEncodedChoice[idx]])
          }
      }
      return bfTeams.size == weeksToBruteForceLength;
  };

  var maxDecimal = BigInt(creamNum.toString().repeat(weeksToBruteForceLength), creamNum);
  let current = "";

//   /* testing ... currentIsValid */
//   let tValid = currentIsValid('011210100111');
//   let tWrong = currentIsValid('001210100111');
//   console.log('huh');

  for (var i = 0n; i <= maxDecimal; i = i+1n) {
    current = i.toString(creamNum).padStart(weeksToBruteForceLength, "0");

    if (currentIsValid(current)) {
      console.log(current);
    } else if (i % 50000000n == 0) {
      console.log('...' + current + ' of ' + maxDecimal)
    }
  }
};

const creamNum = 5;
filterForNoBrainers();
filterTheWeeklyCream(creamNum);
bruteForceSolutions(creamNum);

console.log("Done!");
