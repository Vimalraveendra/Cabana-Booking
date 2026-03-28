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

  return app;
};
