# 🌴 Soleil Palms — Cabana Booking


*An interactive cabana booking website for luxury resorts, allowing guests to browse a live resort map, view real-time poolside cabana availability, and book their preferred lounging spot in a seamless, single-flow digital experience.*



## Requirements

- **Node.js** v18+
  
## Quick Start

```bash
npm install
npm start
```
Open **http://localhost:3000** in your browser.

### Custom map and bookings files

```bash
npm start -- --map /path/to/map.ascii --bookings /path/to/bookings.json
```
Both arguments are optional — defaults to `map.ascii` and `bookings.json` in the project root.


## Running Tests

```bash
# All tests
npm test

# Backend only
npm run test:backend

# Frontend only
npm run test:frontend
```

---

## File Formats

### `map.ascii`

Each character represents a map tile:

| Character | Meaning |
|---|---|
| `W` | Cabana (bookable) |
| `p` | Pool |
| `#` | Path |
| `c` | Chalet |
| `.` | Empty space |

### `bookings.json`
```json
{
  "guests": [
    { "roomNumber": "101", "name": "Alice Smith" }
  ],
}
```
- `guests` — registered guests used to validate booking requests

---

## API

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/map` | Full map grid and cabana availability |
| `POST` | `/api/book` | Book a cabana |

### `POST /api/book`

**Request:**
```json
{
  "cabanaId": "4-8",
  "roomNumber": "101",
  "guestName": "Alice Johnson"
}
```

**Response codes:**

| Code | Reason |
|---|---|
| `200` | Booked successfully |
| `400` | Missing fields |
| `401` | Guest not found |
| `404` | Cabana not found |
| `409` | Cabana already booked |

---

## Design Decisions

> The API has two endpoints covering exactly what the spec requires —
map rendering and cabana booking . The map endpoint
returns the full grid and availability in one call so the frontend needs only one request to render.


> **Single process.** Express serves both the REST API and static frontend files from one Node.js process —  Just `npm start`.

> **In-memory state.** Cabana bookings are held in memory as the spec permits. This keeps the stack minimal with no database or migrations. 

> **Modal over sidebar.** The booking flow uses a modal popup rather than a sidebar. This matches the spec's intent of "redirect back to map view" — the map stays fully visible behind the modal, and closing it returns the guest to the map view with the cabana visually updated.

> **REST over WebSockets.** The map loads once on page load. After a successful booking the client updates its local state directly.

> **TypeScript throughout.** Shared interfaces in `types.ts` enforce the API contract between backend and frontend. `tsx` runs the backend directly without a compile step; `esbuild` bundles the frontend.

> **BEM CSS.** All styles follow BEM naming convention — blocks, elements and modifiers clearly separated. This avoids specificity conflicts and keeps the stylesheet easy to extend.

> **Guest privacy.** Guest names and room numbers displayed in the unavailable modal are masked — `Alice Smith` becomes `***** *****` — to protect other guests' privacy.


**Kept simple:**

- **In-memory state** — no database needed, spec permitted this
  
- **No auth tokens** — room number and name is sufficient per spec
- **No real-time sync** — single user session, no WebSockets needed
- **No framework** — vanilla TypeScript is enough for this scope
- **No pagination** — resort map is small enough to load in one request

**Skipped:**
- **Persistent storage** — spec said in-memory is fine
  
- **Per-guest booking limit** — spec did not require this
- **Initial Cabana Booking** — spec did not require this
- **Exhaustive unit tests** — focused on API behavior and key UI flows as spec requested
