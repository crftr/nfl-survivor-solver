import cheerio from "cheerio";
import fetch from "node-fetch";
import util from "util";

/**
 * Config
 */
const FTE_NFL_GAMES_URL =
  "https://projects.fivethirtyeight.com/2021-nfl-predictions/games/";

const deepLog = (myObject) => {
  console.log(
    util.inspect(myObject, { showHidden: false, depth: null, colors: true })
  );
};

const getFteNflGames = async () => {
  const response = await fetch(FTE_NFL_GAMES_URL);
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
      games: weekGames
    };
  });

  deepLog(weeks);
};

getFteNflGames();
