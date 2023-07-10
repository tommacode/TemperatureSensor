const mysql = require("mysql2");
const dotenv = require("dotenv");
dotenv.config();

const pool = mysql
  .createPool({
    connectionLimit: 10,
    host: process.env.DB_IP,
    user: process.env.DB_User,
    password: process.env.DB_Pass,
    database: process.env.DB_Name,
  })
  .promise();

async function GetTemperatureIn() {
  response = await fetch(process.env.APIEndpoint);
  let Temperature = await response.json();
  //Round to 1 decimal place
  Temperature["TemperatureIn"] =
    Math.round(Temperature["TemperatureIn"] * 10) / 10;
  console.log(Temperature["TemperatureIn"]);
  return Temperature["TemperatureIn"];
}

async function GetTemperatureOut() {
  response = await fetch(process.env.APIEndpoint);
  let Temperature = await response.json();
  //Round to 1 decimal place
  Temperature["TemperatureOut"] =
    Math.round(Temperature["TemperatureOut"] * 10) / 10;
  console.log(Temperature["TemperatureOut"]);
  return Temperature["TemperatureOut"];
}

async function Main() {
  let Data = await GetTemperatureIn();
  let Timestamp = new Date();
  //Make date only mysql date format
  let DateTime = Timestamp.toISOString().slice(0, 19).replace("T", " ");
  await pool.query("INSERT INTO realTime (Temperature) VALUES (?)", [Data]);
  let [output] = await pool.query("SELECT * FROM realTime ORDER BY ID DESC");
  let first = output[0]["ID"];
  let last = output[output.length - 1]["ID"];
  //If the difference is greater than 5 then delete the last entry
  if (first - last > 5) {
    await pool.query("DELETE FROM realTime WHERE ID = ?", [last]);
  }

  Data = await GetTemperatureOut();
  Timestamp = new Date();
  //Make date only mysql date format
  DateTime = Timestamp.toISOString().slice(0, 19).replace("T", " ");
  await pool.query("INSERT INTO realTimeOut (Temperature) VALUES (?)", [Data]);
  [output] = await pool.query("SELECT * FROM realTimeOut ORDER BY ID DESC");
  first = output[0]["ID"];
  last = output[output.length - 1]["ID"];
  //If the difference is greater than 5 then delete the last entry
  if (first - last > 5) {
    await pool.query("DELETE FROM realTimeOut WHERE ID = ?", [last]);
  }
}

async function Runner() {
  while (true) {
    Main();
    //wait 1 minutes
    await new Promise((r) => setTimeout(r, 5 * 1000));
  }
}

Runner();
