const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "covid19India.db");

const app = express();

app.use(express.json());

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

app.get("/states/", async (request, response) => {
  const getStates = `
    SELECT 
     state_id AS stateId,
      state_name AS  stateName,
      population
    
    FROM 
    state;`;
  const states = await db.all(getStates);
  response.send(states);
});

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;

  const getState = `
  SELECT 
  state_id AS stateId,
  state_name AS stateName,
  population
  FROM 
  state
  WHERE 
  state_id = ${stateId};`;

  const state = await db.get(getState);
  response.send(state);
});

app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;

  const addDistrict = `
  INSERT INTO 
  district (district_name, state_id, cases, cured, active, deaths) 
  VALUES 
  ('${districtName}', '${stateId}', '${cases}', '${cured}', '${active}', '${deaths}');`;
  const addedDistrict = await db.run(addDistrict);
  response.send("District Successfully Added");
});

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;

  const getDistrict = `
  SELECT 
  district_id AS districtId,
  district_name AS districtName,
  state_id AS stateId,
  cases,
  cured,
  active,
  deaths
  FROM 
  district
  WHERE 
  district_id = ${districtId};`;

  const district = await db.get(getDistrict);
  response.send(district);
});

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;

  const getDistrict = `
  DELETE FROM 
   district
  WHERE 
  district_id = ${districtId};`;

  const district = await db.run(getDistrict);
  response.send("District Removed");
});

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const getUpdateDistrict = `
  UPDATE
   district
   SET 
   district_name = '${districtName}',
   state_id = '${stateId}',
   cases = '${cases}',
   cured = '${cured}',
   active = '${active}',
   deaths = '${deaths}'
  WHERE 
  district_id = ${districtId};`;

  const updateDistrict = await db.run(getUpdateDistrict);
  response.send("District Details Updated");
});

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;

  const getTotalActivities = `
    SELECT 
    SUM(district.cases) AS totalCases,
    SUM(district.cured) AS totalCured,
    SUM(district.active) AS totalActive,
    SUM(district.deaths) AS totalDeaths
    FROM
    district 
    NATURAL JOIN state 
    WHERE 
    state_id = ${stateId};`;

  const totalActivities = await db.get(getTotalActivities);
  response.send(totalActivities);
});

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;

  const getStateName = `
    SELECT 
    state.state_name AS stateName
    FROM
    state 
    NATURAL JOIN district
    WHERE 
    district_id = ${districtId};`;

  const stateName = await db.get(getStateName);
  response.send(stateName);
});

module.exports = app;
