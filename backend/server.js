const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const createApp = (options = {}) => {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use(express.static(path.join(__dirname, "../frontend")));

  // ---Parse CLI args or use options---

  const args = process.argv.slice(2);

  const getArg = (name) => {
    const idx = args.indexOf(name);
    return idx !== -1 ? args[idx + 1] : null;
  };

  const mapFile =
    options.mapFile || getArg("--map") || path.join(process.cwd(), "map.ascii");
  const bookingFIle =
    options.bookingFIle ||
    getArg("--bookings") ||
    path.join(process.cwd(), "bookings.json");

  // ---Load Map---
  let mapLines = [];
  try {
    const raw = fs.readFileSync(mapFile, "utf-8");
    mapLines = raw.split("\n").filter((l) => l.length > 0);
  } catch (e) {
    console.log(`Failed to read map file: ${mapFile}`);
    process.exit(1);
  }

  // Load bookings/guests---

  let guests = [];
  try {
    const raw = JSON.parse(fs.readFileSync(bookingFIle, "utf-8"));
    guests = raw || [];
  } catch (e) {
    console.log(`Failed to read bookings file: ${bookingsFile}`);
    process.exit(1);
  }

  //---parse cabanas from map---
  //A cabana is any 'W' character; give it an ID based on row-col

  const parseCabanas = (mapLines) => {
    const cabanas = [];
    for (let row = 0; row < mapLines.length; row++) {
      for (let col = 0; col < mapLines[row].length; col++) {
        if (mapLines[row][col] === "W") {
          cabanas.push({ id: `${row}-${col}`, row, col });
        }
      }
    }
  };
  const cabanas = parseCabanas(mapLines);

  return app;
};
