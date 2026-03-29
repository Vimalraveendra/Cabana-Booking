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

  // ---Load bookings/guests---

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
    return cabanas;
  };
  const cabanas = parseCabanas(mapLines);

  //---In-memory cabana booking state---
  //Map from cabanaId->booking info or null

  const cabanaState = {};
  for (const c of cabanas) {
    cabanaState[c.id] = null;
  }

  //---API Routes---

  //  GET /api/map — returns the map grid and cabana availability
  app.get("/api/map", (req, res) => {
    const grid = mapLines.map((line) => line.split(""));
    const cabanaWithStatus = cabanas.map(({ id, row, col }) => ({
      id,
      row,
      col,
      available: cabanaState[id] === null,
      booking: cabanaState[id] || null,
    }));
    res.json({ grid, cabanas: cabanaWithStatus });
  });

  // POST  /api/book---book a cabana---

  app.post("/api/book", (req, res) => {
    const { cabanaId, roomNumber, guestName } = req.body;

    if (!cabanaId || !roomNumber || !guestName) {
      return res
        .status(400)
        .json({ error: "cabanaId,roomNumber and guestName are required." });
    }

    //Validate cabana exists
    if (!cabanaState.hasOwnProperty(cabanaId)) {
      return res
        .status(404)
        .json({ error: `Cabana not found with id: ${cabanaId}` });
    }

    // check cabana availability
    if (cabanaState[cabanaId] !== null) {
      return res.status(409).json({ error: "This cabana is already booked." });
    }

    //Validate guest
    const guest = guests.find(
      (g) =>
        g.roomNumber.trim().toLowerCase() === roomNumber.trim().toLowerCase() &&
        g.guestName.trim().toLowerCase() === guestName.trim().toLowerCase(),
    );
    if (!guest) {
      res.status(401).json({
        error:
          "No guest found with that room number and name.Please check your details.",
      });
    }

    // Book cabana
    cabanaState[cabanaId] = {
      roomNumber: guest.roomNumber,
      guestName: guest.guestName,
      bookedAt: new Date().toISOString(),
    };

    res.json({
      success: true,
      message: `Cabana booked successfully for ${guest.guestName} (Room ${guest.roomNumber}).`,
      booking: cabanaState[cabanaId],
    });
  });

  return app;
};

//Only start server when run directly
if (require.main === module) {
  const app = createApp();
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🌴 Cabana Booking Server running at http://localhost:${PORT}`);
  });
}
