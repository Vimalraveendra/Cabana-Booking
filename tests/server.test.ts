import request from 'supertest';
import path from 'path';
import {createApp} from "../backend/server";
import { BookingRequest, CabanaWithStatus, MapResponse } from '../backend/types';

const mapFile= path.join(__dirname, "../map.ascii");
const bookingsFile = path.join(__dirname, "../bookings.json");

const app = createApp({ mapFile, bookingsFile });

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
    const {cabanas}:MapResponse = res.body;
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
    const { grid, cabanas }:MapResponse = res.body;
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
    const { cabanas }: MapResponse = mapRes.body;
    const availableCabana = cabanas.find((c:CabanaWithStatus) => c.available);
    expect(availableCabana).toBeDefined();
    if(!availableCabana) return;
    const booking:BookingRequest={
      cabanaId: availableCabana.id,
      roomNumber: "999",
      guestName: "Nobody Here",
    }
    const res = await request(app).post("/api/book").send(booking);
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/no guest found/i);
  });

  test("books successfully with valid guest", async () => {
    const mapRes = await request(app).get("/api/map");
    const { cabanas }: MapResponse = mapRes.body;
    const availableCabana = cabanas.find((c:CabanaWithStatus) => c.available);
    expect(availableCabana).toBeDefined();
    if(!availableCabana) return;
    const booking:BookingRequest={
      cabanaId: availableCabana.id,
      roomNumber: "102",
      guestName: "Bob Jones",
    }
    const res = await request(app).post("/api/book").send(booking);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.booking.guestName).toBe("Bob Jones");
  });

  test("cabana becomes unavailable after booking", async () => {
    const mapRes1 = await request(app).get("/api/map");
    const { cabanas:initialCabanas }: MapResponse = mapRes1.body;
    const availableCabana =initialCabanas.find((c:CabanaWithStatus) => c.available);

   if(!availableCabana) return;
    const booking:BookingRequest={
      cabanaId: availableCabana.id,
      roomNumber: "103",
      guestName: "Carol White",
    }

    // Book it
    await request(app).post("/api/book").send(booking);

    // Check map again
    const mapRes2 = await request(app).get("/api/map");
    const { cabanas :updatedCabanas}: MapResponse = mapRes2.body;
    const same = updatedCabanas.find((c:CabanaWithStatus) => c.id === availableCabana.id);
    if (!same) return;
    expect(same.available).toBe(false);
  });

  test("returns 409 when booking an already-booked cabana", async () => {
    const mapRes = await request(app).get("/api/map");
    const { cabanas }: MapResponse = mapRes.body;
    const availableCabana = cabanas.find((c:CabanaWithStatus) => c.available);
     if(!availableCabana) return;
    const firstBooking:BookingRequest={
      cabanaId: availableCabana.id,
      roomNumber: "104",
      guestName: "David Brown",
    }

    // First booking
    await request(app).post("/api/book").send(firstBooking);

    // Second attempt
    const secondBooking: BookingRequest = {
    cabanaId: availableCabana.id,
    roomNumber: '105',
    guestName: 'Eva Martinez',
  };
    const res = await request(app).post("/api/book").send(secondBooking);
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/already booked/i);
  });

  test("returns 404 for unknown cabana id", async () => {
    const booking: BookingRequest ={
      cabanaId: "nonexistent-id",
      roomNumber: "101",
      guestName: "Alice Smith",
    };
    const res = await request(app).post("/api/book").send(booking);
    expect(res.status).toBe(404);
  });

  test("name matching is case-insensitive", async () => {
    const mapRes = await request(app).get("/api/map");
    const { cabanas }: MapResponse = mapRes.body;
    const availableCabana = cabanas.find((c:CabanaWithStatus) => c.available);
    expect(availableCabana).toBeDefined();
    if(!availableCabana) return;

    const booking: BookingRequest ={
      cabanaId: availableCabana.id,
      roomNumber: "201",
      guestName: "uma lopez", // lowercase
    };

    const res = await request(app).post("/api/book").send(booking);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
