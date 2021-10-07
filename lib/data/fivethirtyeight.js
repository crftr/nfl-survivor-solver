import cheerio from "cheerio";
import fetch from "node-fetch";

const NFL_GAMES_URL =
  "https://projects.fivethirtyeight.com/2021-nfl-predictions/games/";

const NFL_STANDINGS_URL =
  "https://projects.fivethirtyeight.com/2021-nfl-predictions/";

class FivethirtyeightData {
  constructor() {
    this.data = {};
  }

  getNflGames() {
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

        const spreadStats = {};

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

        // Summarize the spread for easy-access, later.
        teams.forEach((t) => {
          const teamSpread = Number(t.spread);

          if (teamSpread == 0) {
            spreadStats["loser"] = t.team;
          } else {
            spreadStats["winner"] = t.team;
            spreadStats["spread"] = teamSpread;
          }
        });

        weekGames.push({
          weekNumber: weekNumber,
          spread: spreadStats.spread,
          spreadWinner: spreadStats.winner,
          spreadLoser: spreadStats.loser,
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
  }
}

export { FivethirtyeightData };