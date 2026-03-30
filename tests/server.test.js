const request = require("supertest");
const path = require("path");
const fs = require("fs");
const os = require("os");

// We need to isolate the app from process.argv
// Patch process.argv before requiring the server module
const mapPath = path.join(__dirname, "../map.ascii");
const bookingsPath = path.join(__dirname, "../bookings.json");

// We'll use a fresh require with injected options
function makeApp(options = {}) {
  // Clear require cache
  delete require.cache[require.resolve("../backend/server.js")];
  const { createApp } = require("../backend/server.js");
  return createApp(options);
}

let app;

beforeAll(() => {
  app = makeApp({ mapFile: mapPath, bookingsFile: bookingsPath });
});

describe("GET /api/map", () => {
  test("returns grid and cabanas", async () => {
    const res = await request(app).get("/api/map");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("grid");
    expect(res.body).toHaveProperty("cabanas");
    expect(Array.isArray(res.body.grid)).toBe(true);
    expect(Array.isArray(res.body.cabanas)).toBe(true);
  });

  test("cabanas have id, row, col, available fields", async () => {
    const res = await request(app).get("/api/map");
    const cabanas = res.body.cabanas;
    expect(cabanas.length).toBeGreaterThan(0);
    for (const c of cabanas) {
      expect(c).toHaveProperty("id");
      expect(c).toHaveProperty("row");
      expect(c).toHaveProperty("col");
      expect(c).toHaveProperty("available");
    }
  });

  test("grid contains W for cabana positions", async () => {
    const res = await request(app).get("/api/map");
    const { grid, cabanas } = res.body;
    for (const c of cabanas) {
      expect(grid[c.row][c.col]).toBe("W");
    }
  });
});

describe("POST /api/book", () => {
  test("returns 400 if fields are missing", async () => {
    const res = await request(app).post("/api/book").send({});
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  test("returns 401 for invalid guest credentials", async () => {
    const mapRes = await request(app).get("/api/map");
    const availableCabana = mapRes.body.cabanas.find((c) => c.available);
    expect(availableCabana).toBeDefined();

    const res = await request(app).post("/api/book").send({
      cabanaId: availableCabana.id,
      roomNumber: "999",
      guestName: "Nobody Here",
    });
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/no guest found/i);
  });

  test("books successfully with valid guest", async () => {
    const mapRes = await request(app).get("/api/map");
    const availableCabana = mapRes.body.cabanas.find((c) => c.available);
    expect(availableCabana).toBeDefined();

    const res = await request(app).post("/api/book").send({
      cabanaId: availableCabana.id,
      roomNumber: "102",
      guestName: "Bob Jones",
    });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.booking.guestName).toBe("Bob Jones");
  });

  test("cabana becomes unavailable after booking", async () => {
    const mapRes1 = await request(app).get("/api/map");
    const availableCabana = mapRes1.body.cabanas.find((c) => c.available);

    // Book it
    await request(app).post("/api/book").send({
      cabanaId: availableCabana.id,
      roomNumber: "103",
      guestName: "Carol White",
    });

    // Check map again
    const mapRes2 = await request(app).get("/api/map");
    const same = mapRes2.body.cabanas.find((c) => c.id === availableCabana.id);
    expect(same.available).toBe(false);
  });

  test("returns 409 when booking an already-booked cabana", async () => {
    const mapRes = await request(app).get("/api/map");
    const availableCabana = mapRes.body.cabanas.find((c) => c.available);

    // First booking
    await request(app).post("/api/book").send({
      cabanaId: availableCabana.id,
      roomNumber: "104",
      guestName: "David Brown",
    });

    // Second attempt
    const res = await request(app).post("/api/book").send({
      cabanaId: availableCabana.id,
      roomNumber: "105",
      guestName: "Eva Martinez",
    });
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/already booked/i);
  });

  test("returns 404 for unknown cabana id", async () => {
    const res = await request(app).post("/api/book").send({
      cabanaId: "nonexistent-id",
      roomNumber: "101",
      guestName: "Alice Johnson",
    });
    expect(res.status).toBe(404);
  });

  test("name matching is case-insensitive", async () => {
    const mapRes = await request(app).get("/api/map");
    const availableCabana = mapRes.body.cabanas.find((c) => c.available);
    expect(availableCabana).toBeDefined();

    const res = await request(app).post("/api/book").send({
      cabanaId: availableCabana.id,
      roomNumber: "201",
      guestName: "uma lopez", // lowercase
    });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
