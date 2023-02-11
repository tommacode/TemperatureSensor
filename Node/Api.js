const express = require("express");
const app = express();

const fs = require("fs");

app.get("/", (req, res) => {
  //read the file /sys/bus/w1/devices/28-3ce10457e9d5#/w1_slave

  let RawData = fs.readFileSync(
    "/sys/bus/w1/devices/28-3ce10457e9d5/w1_slave",
    "utf8"
  );
  let Data = RawData.split("t=")[1];
  let Temperature = Data / 1000;
  res.send({ Temperature: Temperature });
});

app.listen(9000, () => {
  console.log("http://localhost:9000");
});
