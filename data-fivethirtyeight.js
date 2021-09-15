import cheerio from "cheerio";
import fetch from "node-fetch";

const NFL_GAMES_URL =
  "https://projects.fivethirtyeight.com/2021-nfl-predictions/games/";

const NFL_STANDINGS_URL =
  "https://projects.fivethirtyeight.com/2021-nfl-predictions/";

const getNflGames = async () => {
  const response = await fetch(NFL_GAMES_URL);
  const body = await response.text();

  const $ = cheerio.load(body);
  const weeks = {};

  $("section.week").each((i, weekSection) => {
    const weekTitle = $(".h3", weekSection).text();
    const weekNumber = Number(weekTitle.split(" ")[1]);

    const weekGames = [];

    $(".game-body-wrap", weekSection).each((i, game) => {
      const teams = [];
      const metrics = {};

      //game-body
      $(".game-body tr.tr", game).each((i, teamNode) => {
        const team = $(".team", teamNode).text();
        const spread = $(".spread", teamNode).text();
        const chance = $(".chance", teamNode).text();
        const score = $(".score", teamNode).text();

        teams.push({
          team: team,
          spread: spread,
          chance: chance,
          score: score,
        });
      });

      //metric-table
      $(".metric-table .metric", game).each((i, metricNode) => {
        const title = $(".title", metricNode).text();
        const value = $(".val", metricNode).text();

        metrics[title] = value;
      });

      weekGames.push({
        weekNumber: weekNumber,
        teams: teams,
        metrics: metrics,
      });
    });

    weeks[weekNumber] = {
      weekTitle: weekTitle,
      games: weekGames,
    };
  });

  return weeks;
};

const getNflStandings = async () => {
  const response = await fetch(NFL_STANDINGS_URL);
  const body = await response.text();

  const $ = cheerio.load(body);
  const standings = {};

  $("table#standings-table > tbody > tr").each((i, teamRow) => {
    const teamWinLoss = $("td.team", teamRow)
      .text()
      .match(/(\D+)(\d+)-(\d+)/);
    const team = teamWinLoss[1];
    const wins = teamWinLoss[2];
    const losses = teamWinLoss[3];

    const elo = $("td[data-cell='elo']", teamRow).text();
    const eloChange = $("td[data-cell='change']", teamRow).text();
    const division = $("td.division", teamRow).text();
    const simRecord = $("td[data-cell='record']", teamRow).text();
    const simPointDiff = $("td[data-cell='pointdiff']", teamRow).text();
    const makePlayOffs = $("td[data-cat='make_playoffs']", teamRow).text();
    const winDivision = $("td[data-cat='win_division']", teamRow).text();
    const firstRoundBye = $("td[data-cat='first_round_bye']", teamRow).text();
    const winSuperBowl = $("td[data-cat='win_superbowl']", teamRow).text();

    standings[i + 1] = {
      team: team,
      wins: wins,
      losses: losses,
      elo: elo,
      eloChange: eloChange,
      division: division,
      simulatedRecord: simRecord,
      simulatedPointDiff: simPointDiff,
      makePlayOffs: makePlayOffs,
      winDivision: winDivision,
      firstRoundBye: firstRoundBye,
      winSuperBowl: winSuperBowl,
    };
  });

  return standings;
};

export { getNflGames, getNflStandings };
