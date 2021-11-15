import cheerio from "cheerio";
import fetch from "node-fetch";

const NFL_GAMES_URL =
  "https://projects.fivethirtyeight.com/2021-nfl-predictions/games/";

const NFL_STANDINGS_URL =
  "https://projects.fivethirtyeight.com/2021-nfl-predictions/";

const teamsContainPk = (teams) => teams.find((t) => t.spread === "PK");
const teamsSpreadFilter = (teams, spreadMax) =>
  !teams.find((t) => Number(t.spread) <= spreadMax);

const getNflGames = async (spreadMax = -0.5) => {
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

      let rejectGame = false;
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

      rejectGame =
        teamsContainPk(teams) || teamsSpreadFilter(teams, spreadMax);

      //metric-table
      $(".metric-table .metric", game).each((i, metricNode) => {
        const title = $(".title", metricNode).text();
        const value = $(".val", metricNode).text();

        metrics[title] = value;
      });

      if (!rejectGame) {

        // Summarize the spread for easy-access, later.
        teams.forEach((t) => {
          const teamSpread = Number(t.spread);

          if (teamSpread == 0) {
            spreadStats['loser'] = t.team;
          } else {
            spreadStats['winner'] = t.team;
            spreadStats['spread'] = teamSpread;
          }
        })

        weekGames.push({
          weekNumber: weekNumber,
          spread: spreadStats.spread,
          spreadWinner: spreadStats.winner,
          spreadLoser: spreadStats.loser,
          teams: teams,
          metrics: metrics
        });
      }
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
    const teamWinLossText = $("td.team", teamRow).text();

    let team, wins, losses, ties;
    if (/(.*\D+)(\d+)-(\d+)-(\d+)/.test(teamWinLossText)) {
      const teamWinLoss = teamWinLossText.match(/(.*\D+)(\d+)-(\d+)-(\d+)/);
      team = teamWinLoss[1];
      wins = teamWinLoss[2];
      losses = teamWinLoss[3];
      ties = teamWinLoss[4];
    }
    else {
      const teamWinLoss = teamWinLossText.match(/(.*\D+)(\d+)-(\d+)/);
      team = teamWinLoss[1];
      wins = teamWinLoss[2];
      losses = teamWinLoss[3];
      ties = 0;
    }

    const elo = Number( $("td[data-cell='elo']", teamRow).text() );
    const eloChange = $("td[data-cell='change']", teamRow).text();
    const division = $("td.division", teamRow).text();
    const simRecord = $("td[data-cell='record']", teamRow).text();
    const simPointDiff = Number( $("td[data-cell='pointdiff']", teamRow).text() );
    const makePlayOffs = $("td[data-cat='make_playoffs']", teamRow).text();
    const winDivision = $("td[data-cat='win_division']", teamRow).text();
    const firstRoundBye = $("td[data-cat='first_round_bye']", teamRow).text();
    const winSuperBowl = $("td[data-cat='win_superbowl']", teamRow).text();

    standings[i + 1] = {
      team: team,
      wins: wins,
      losses: losses,
      ties: ties,
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
