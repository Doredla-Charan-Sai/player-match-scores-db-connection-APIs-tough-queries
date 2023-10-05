const express = require("express");
const app = express();

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

app.use(express.json());
let db = null;

const path = require("path");
const dbpath = path.join(__dirname, "cricketMatchDetails.db");

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

const forAPI1Fun = (item) => {
  return {
    playerId: item.player_id,
    playerName: item.player_name,
  };
};

const forAPI4Fun = (item) => {
  return {
    matchId: item.match_id,
    match: item.match,
    year: item.year,
  };
};

// API 1
app.get("/players/", async (request, response) => {
  const getAPI1Query = `SELECT * FROM player_details;`;
  const dbAPI1Response = await db.all(getAPI1Query);
  response.send(dbAPI1Response.map((eachObj) => forAPI1Fun(eachObj)));
});

// API 2
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getAPI2Query = `SELECT * FROM player_details WHERE player_id = ${playerId};`;
  const dbAPI2Response = await db.get(getAPI2Query);
  response.send(forAPI1Fun(dbAPI2Response));
});

// API 3
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const api3Details = request.body;
  const { playerName } = api3Details;
  const getAPI3Query = `UPDATE player_details SET player_name = '${playerName}' WHERE player_id = ${playerId};`;
  await db.run(getAPI3Query);
  response.send("Player Details Updated");
});

// API 4
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getAPI4Query = `SELECT * FROM match_details WHERE match_id = ${matchId};`;
  const dbAPI4Response = await db.get(getAPI4Query);
  response.send(forAPI4Fun(dbAPI4Response));
});

// API 5
app.get("/players/:playerId/matches/", async (request, response) => {
  const { playerId } = request.params;
  const getAPI5Query = `SELECT match_details.match_id,match_details.match,match_details.year 
    FROM match_details LEFT JOIN player_match_score
    ON match_details.match_id = player_match_score.match_id
    WHERE player_match_score.player_id = ${playerId};`;
  const dbAPI5Response = await db.all(getAPI5Query);
  response.send(dbAPI5Response.map((eachObj) => forAPI4Fun(eachObj)));
});

// API 6
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getAPI6Query = `SELECT player_details.player_id,player_details.player_name
    FROM player_details LEFT JOIN player_match_score
    ON player_details.player_id = player_match_score.player_id
    WHERE player_match_score.match_id = ${matchId};`;
  const dbAPI6Response = await db.all(getAPI6Query);
  response.send(dbAPI6Response.map((eachObj) => forAPI1Fun(eachObj)));
});

// API 7
const forAPI7Fun = (item) => {
  return {
    playerId: item.player_id,
    playerName: item.player_name,
    totalScore: item.totalScore,
    totalFours: item.totalFours,
    totalSixes: item.totalSixes,
  };
};

app.get("/players/:playerId/playerScores/", async (request, response) => {
  const { playerId } = request.params;
  const getAPI7Query = `SELECT player_details.player_id, player_details.player_name,
    SUM(player_match_score.score) as totalScore,
    SUM(player_match_score.fours) as totalFours,
    SUM(player_match_score.sixes) as totalSixes
    FROM player_match_score LEFT JOIN player_details
    ON player_match_score.player_id=player_details.player_id
    GROUP BY player_match_score.player_id
    HAVING player_match_score.player_id = ${playerId};
    `;
  const dbAPI7Response = await db.get(getAPI7Query);
  response.send(forAPI7Fun(dbAPI7Response));
});

module.exports = app;
