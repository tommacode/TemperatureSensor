const dotenv = require("dotenv");
dotenv.config();

const mysql = require("mysql2");

const pool = mysql
  .createPool({
    connectionLimit: 10,
    host: process.env.DB_IP,
    user: process.env.DB_User,
    password: process.env.DB_Pass,
    database: process.env.DB_Name,
  })
  .promise();

async function Main() {
  let Temperature = await GetTemperatureIn();
  let DateVar = new Date();
  //Make date only mysql date format
  let DateTime = DateVar.toISOString().slice(0, 19).replace("T", " ");

  await pool.query("INSERT INTO rawData (Time, Temperature) VALUES (?, ?)", [
    DateTime,
    Temperature,
  ]);
  console.log("Time: " + DateTime + " Temperature: " + Temperature);
  //Check if five minutes ago is in the same hour as now
  let xMinutesAgo = new Date(DateVar.getTime() - 60 * 1000);
  if (DateVar.getHours() !== xMinutesAgo.getHours()) {
    console.log("Calculating hourly average");
    //Get all the data from the last hour
    let HourAgo = new Date(DateVar.getTime() - 60 * 60 * 1000);
    let HourAgoDateTime = HourAgo.toISOString().slice(0, 19).replace("T", " ");
    let [data] = await pool.query("SELECT * FROM rawData WHERE Time > ?", [
      HourAgoDateTime,
    ]);
    //calculate the average
    let Average = 0;
    for (let i = 0; i < data.length; i++) {
      Average += data[i]["Temperature"];
    }
    Average = Average / data.length;
    //Round to 1 decimal place
    Average = Math.round(Average * 10) / 10;
    console.log(Average);
    //Write to the hourlyAverage table
    await pool.query(
      "INSERT INTO hourlyAverage (Time, Average) VALUES (?, ?)",
      [DateTime, Average]
    );
  }
  //Check if five minutes ago is in the same day as now
  if (DateVar.getDate() !== xMinutesAgo.getDate()) {
    console.log("Calculating daily average");
    //Get all the data from the last day
    let DayAgo = new Date(DateVar.getTime() - 24 * 60 * 60 * 1000);
    let DayAgoDateTime = DayAgo.toISOString().slice(0, 19).replace("T", " ");
    let [data] = await pool.query("SELECT * FROM rawData WHERE Time > ?", [
      DayAgoDateTime,
    ]);
    //calculate the average
    let Average = 0;
    for (let i = 0; i < data.length; i++) {
      Average += data[i]["Temperature"];
    }
    Average = Average / data.length;
    //Round to 1 decimal place
    Average = Math.round(Average * 10) / 10;
    console.log(Average);
    //Write to the dailyAverage table
    await pool.query("INSERT INTO dailyAverage (Date, Average) VALUES (?, ?)", [
      DateTime,
      Average,
    ]);
  }

  Temperature = await GetTemperatureOut();
  DateVar = new Date();
  //Make date only mysql date format
  DateTime = DateVar.toISOString().slice(0, 19).replace("T", " ");

  await pool.query("INSERT INTO rawDataOut (Time, Temperature) VALUES (?, ?)", [
    DateTime,
    Temperature,
  ]);
  console.log("Time: " + DateTime + " Temperature: " + Temperature);
  //Check if five minutes ago is in the same hour as now
  xMinutesAgo = new Date(DateVar.getTime() - 60 * 1000);
  if (DateVar.getHours() !== xMinutesAgo.getHours()) {
    console.log("Calculating hourly average");
    //Get all the data from the last hour
    HourAgo = new Date(DateVar.getTime() - 60 * 60 * 1000);
    HourAgoDateTime = HourAgo.toISOString().slice(0, 19).replace("T", " ");
    [data] = await pool.query("SELECT * FROM rawDataOut WHERE Time > ?", [
      HourAgoDateTime,
    ]);
    //calculate the average
    Average = 0;
    for (let i = 0; i < data.length; i++) {
      Average += data[i]["Temperature"];
    }
    Average = Average / data.length;
    //Round to 1 decimal place
    Average = Math.round(Average * 10) / 10;
    console.log(Average);
    //Write to the hourlyAverage table
    await pool.query(
      "INSERT INTO hourlyAverageOut (Time, Average) VALUES (?, ?)",
      [DateTime, Average]
    );
  }
  //Check if five minutes ago is in the same day as now
  if (DateVar.getDate() !== xMinutesAgo.getDate()) {
    console.log("Calculating daily average");
    //Get all the data from the last day
    DayAgo = new Date(DateVar.getTime() - 24 * 60 * 60 * 1000);
    DayAgoDateTime = DayAgo.toISOString().slice(0, 19).replace("T", " ");
    [data] = await pool.query("SELECT * FROM rawDataOut WHERE Time > ?", [
      DayAgoDateTime,
    ]);
    //calculate the average
    Average = 0;
    for (let i = 0; i < data.length; i++) {
      Average += data[i]["Temperature"];
    }
    Average = Average / data.length;
    //Round to 1 decimal place
    Average = Math.round(Average * 10) / 10;
    console.log(Average);
    //Write to the dailyAverage table
    await pool.query(
      "INSERT INTO dailyAverageOut (Date, Average) VALUES (?, ?)",
      [DateTime, Average]
    );
  }
  //exit the process
}

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

async function Runner() {
  while (true) {
    Main();
    //wait 1 minutes
    await new Promise((r) => setTimeout(r, 60 * 1000));
  }
}

Runner();
