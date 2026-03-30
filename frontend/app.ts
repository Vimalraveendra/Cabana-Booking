import { Cabana, LegendItem, MapResponse, PathResult, StatsItem } from "./app.types";

let mapData:MapResponse|null = null;
let selectedCabanaId:string|null = null;

// ── LEGEND (dynamic) ──

const LEGEND_ITEMS:LegendItem[] = [
  {
    src: "assets/cabana.png",
    alt: "Available Cabana",
    modifier: "available",
    label: "Available",
  },
  {
    src: "assets/cabana.png",
    alt: "Booked Cabana",
    modifier: "booked",
    label: "Booked",
  },
  {
    src: "assets/textureWater.png",
    alt: "Pool",
    modifier: "pool",
    label: "Pool",
  },
  {
    src: "assets/arrowStraight.png",
    alt: "Path",
    modifier: "path",
    label: "Path",
  },
  {
    src: "assets/houseChimney.png",
    alt: "Chalet",
    modifier: "chalet",
    label: "Chalet",
  },
];

function renderLegend():void {
  const legend = document.getElementById('legend');
    if(legend instanceof HTMLElement){
      legend!.innerHTML = LEGEND_ITEMS.map(
      ({ src, alt, modifier, label }) => `
      <div class="legend__item">
        <img src="${src}" alt="${alt}" class="legend__icon legend__icon--${modifier}" />
        <span>${label}</span>
      </div>
    `,
    ).join("");

  }
}

// ── STATS (dynamic)──

const STAT_ITEMS:StatsItem[] = [
  { id: "stats-total", label: "Total Cabanas" },
  { id: "stats-available", label: "Available" },
  { id: "stats-booked", label: "Reserved" },
];

function renderStats():void {
  const statsBar = document.getElementById("stats");
  if(statsBar instanceof HTMLElement){
    statsBar.innerHTML = STAT_ITEMS.map(
      ({ id, label }) => `
      <div class="stats__item">
        <div class="stats__value" id="${id}">—</div>
        <div class="stats__label">${label}</div>
      </div>
    `,
    ).join("");

  }
}

function showError(msg:string):void {
  const el = document.getElementById("form-booking-error");
  if(el instanceof HTMLElement){
    el.textContent = msg;
    el.style.display = "block";
  }
}

// ── Modal helpers ──
function openModal(panel:string):void{
  ["modal-booking", "modal-unavailable", "modal-confirm"].forEach((id) => {
    const element =document.getElementById(id);
     if(element instanceof HTMLElement){
        element.style.display = id === panel ? "block" : "none";
     }
  });
  const modal= document.getElementById("modal");
  if(modal instanceof HTMLElement){
      modal.classList.add("modal--open");
  }
}

  // reset input fields
   function resetInputValue (id: string): void {
    const input = document.getElementById(id);
    if (input instanceof HTMLInputElement) input.value = "";
  };

function closeModal():void {
  const modal =document.getElementById("modal");
  const bookingError=document.getElementById("form-booking-error");
  if(modal instanceof HTMLElement ){
     modal.classList.remove("modal--open");
  }
  if(bookingError instanceof HTMLElement){
    bookingError.style.display = "none";
  }
    resetInputValue("input-room");
    resetInputValue("input-name");
  selectedCabanaId = null;
}

// Close on backdrop click
const modal =document.getElementById("modal")
if(modal instanceof HTMLElement){
  modal.addEventListener("click", function (e) {
  if (e.target === this) closeModal();
  });
}

  // reset input fields
   function getInputValue (id: string): string{
    const input = document.getElementById(id);
    if (input instanceof HTMLInputElement) return input.value.trim();
    return " ";
  };

// ── Booking submit ──

async function submitBooking():Promise<void> {
  const roomNumber =getInputValue("input-room");
  const guestName =getInputValue("input-name");
  if (!roomNumber || !guestName) {
    showError("Please enter both your room number and full name.");
    return;
  }

  const btn = document.getElementById("modal-booking-button");
  if(btn instanceof HTMLButtonElement){
    btn.disabled = true;
    btn.textContent = "Processing...";
  }

  try {
    const res = await fetch("/api/book", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cabanaId: selectedCabanaId,
        roomNumber,
        guestName,
      }),
    });
    const data = await res.json();

    if (!res.ok) {
      showError(data.error || "Booking failed. Please try again.");
      return;
    }

    // Update local map data
    const cabana = mapData?.cabanas.find((c) => c.id === selectedCabanaId);
    if (cabana) {
      cabana.available = false;
      cabana.booking = data.booking;
    }

    // Update cell visually
    const cell = document.querySelector(
      `[data-cabana-id="${selectedCabanaId}"]`,
    )as HTMLElement;
    if (cell) {
      cell.classList.remove("cell--available");
      cell.classList.add("cell--booked", "cell--just-booked");
      cell.title = `Booked — ${guestName} (Room ${roomNumber})`;
    }

    // Update stats
    updateStats();

    // Show confirmation
    const confirmDetail=document.getElementById("modal-confirm-detail");
    if(confirmDetail instanceof HTMLElement){
        confirmDetail.innerHTML =
      `<strong>${guestName}</strong><br>Room ${roomNumber}<br><br>` +
      `${cabanaLabel(selectedCabanaId!)} is reserved for you.<br>Enjoy your day at the pool! 🌴`;
    openModal("modal-confirm");
    }
  } catch (err) {
    showError("Network error. Please try again.");
  } finally {
      if(btn instanceof HTMLButtonElement){
        btn.disabled = false;
        btn.textContent = "Reserve This Cabana";
      }
}
}

// set text content
function setText(id: string, text: string): void {
  const el = document.getElementById(id);
  if (el instanceof HTMLElement) el.textContent = text;
}

// ── UPDATE STATUS ──

function updateStats() {
  if (!mapData) return;
  const total = mapData.cabanas.length;
  const available = mapData.cabanas.filter((c) => c.available).length;
  setText("stats-total",String(total));
  setText("stats-available",String(available));
  setText("stats-booked",String(total - available));
}

// ── MASK DATA──
function maskData(name:string):string {
  const words = name.trim().split(" ");
  return words
    .map((word) => {
      return "*".repeat(word.length);
    })
    .join(" ");
}

//CABANA LABEL
function cabanaLabel(id:string):string {
  return "Cabana " + id.replace("-", ":");
}

// ── CABANA CLICK ──
function handleCabanaClick(cabana:Cabana):void {
  selectedCabanaId = cabana.id;
 
  if (!cabana.available) {
    setText("modal-unavailable-cabana-name",cabanaLabel(cabana.id));
    setText("modal-unavailable-guest",cabana
      .booking?.guestName
      ? maskData(cabana.booking.guestName)
      : "—");
      setText("modal-unavailable-room",cabana
      .booking?.roomNumber
      ? "Room " + maskData(cabana.booking.roomNumber)
      : "—");
    openModal("modal-unavailable");
  } else {
    setText("modal-cabana-name",cabanaLabel(cabana.id));
    openModal("modal-booking");
    setTimeout(() => (document.getElementById("input-room")as HTMLInputElement).focus(), 100);
  }
}


// PATH TILE DETECTION
function getPathType(grid:string[][], r:number, c:number):PathResult {
  const up = r > 0 && grid[r - 1][c] === "#";
  const down = r < grid.length - 1 && grid[r + 1][c] === "#";
  const left = c > 0 && grid[r][c - 1] === "#";
  const right = c < grid[r].length - 1 && grid[r][c + 1] === "#";

  const count = [up, down, left, right].filter(Boolean).length;

  // 4-way crossing
  if (up && down && left && right) return { type: "crossing", rotate: "0deg" };

  // 3-way T-junctions (corner split)
  if (count === 3) {
    if (!up) return { type: "split", rotate: "90deg" };
    if (!down) return { type: "split", rotate: "270deg" };
    if (!left) return { type: "split", rotate: "0deg" };
    if (!right) return { type: "split", rotate: "270deg" };
  }

  // Straight
  if (left && right && !up && !down)
    return { type: "straight", rotate: "90deg" };
  if (up && down && !left && !right)
    return { type: "straight", rotate: "0deg" };

  // Corners
  if (right && down && !up && !left) return { type: "corner", rotate: "90deg" };
  if (left && down && !up && !right)
    return { type: "corner", rotate: "180deg" };
  if (right && up && !down && !left) return { type: "corner", rotate: "0deg" };
  if (left && up && !down && !right)
    return { type: "corner", rotate: "270deg" };

  // End caps
  if (right && !left && !up && !down) return { type: "end", rotate: "270deg" };
  if (left && !right && !up && !down) return { type: "end", rotate: "90deg" };
  if (down && !up && !left && !right) return { type: "end", rotate: "90deg" };
  if (up && !down && !left && !right) return { type: "end", rotate: "270deg" };

  return { type: "straight", rotate: "0deg" };
}

// RENDER MAP
function renderMap(data:MapResponse):void {
  mapData = data;
  const grid = data.grid;
  const cabanaMap:Record<string, Cabana> = {};
  for (const c of data.cabanas) {
    cabanaMap[`${c.row}-${c.col}`] = c;
  }

  const container = document.getElementById("map-grid")as HTMLElement;
  container.innerHTML = "";

  for (let r = 0; r < grid.length; r++) {
    const rowEl = document.createElement("div");
    rowEl.className = "map__row";
    for (let c = 0; c < grid[r].length; c++) {
      const ch = grid[r][c];
      const cell = document.createElement("div");
      cell.className = "cell";
      const key = `${r}-${c}`;

      if (ch === "W") {
        const cabana = cabanaMap[key];
        cell.className =
          "cell cell--cabana " +
          (cabana.available ? "cell--available" : "cell--booked");
        cell.dataset.cabanaId = cabana.id;
        cell.title = cabana.available
          ? `${cabanaLabel(cabana.id)} — Click to book`
          : `${cabanaLabel(cabana.id)} — Booked`;
        const img = document.createElement("img");
        img.src = cabana.available ? "assets/cabana.png" : "assets/cabana.png";
        img.style.width = "100%";
        img.style.height = "100%";
        img.style.objectFit = "contain";
        cell.appendChild(img);
        cell.addEventListener("click", () => handleCabanaClick(cabana));
      } else if (ch === "p") {
        const img = document.createElement("img");
        img.src = "assets/textureWater.png";
        cell.appendChild(img);
        cell.className = "cell cell--pool";
      } else if (ch === "#") {
        const PATH_IMAGES = {
          straight: "assets/arrowStraight.png",
          corner: "assets/arrowCornerSquare.png",
          split: "assets/arrowSplit.png",
          crossing: "assets/arrowCrossing.png",
          end: "assets/arrowEnd.png",
        };

        const img = document.createElement("img");
        const { type, rotate } = getPathType(grid, r, c);
        img.src = PATH_IMAGES[type];
        img.style.cssText = `width:100%;height:100%;object-fit:cover;transform:rotate(${rotate});`;
        cell.appendChild(img);
        cell.className = "cell cell--path";
      } else if (ch === "c") {
        const img = document.createElement("img");
        img.src = "assets/houseChimney.png";
        img.style.cssText = "width:100%;height:100%;object-fit:contain;";
        cell.appendChild(img);
        cell.className = "cell cell--chalet";
      } else {
        cell.className = "cell cell--empty";
      }
      rowEl.appendChild(cell);
    }

    container.appendChild(rowEl);
  }
  updateStats();
}
// LOAD MAP
async function loadMap():Promise<void> {
  try {
    const res = await fetch("/api/map");
    const data = await res.json();
    renderMap(data);
  } catch (e) {
    const mapGrid=document.getElementById("map-grid");
    if(mapGrid instanceof HTMLElement){
          mapGrid.innerHTML =
         '<div style="padding:2rem;color:#7a3333;font-size:0.8rem;">Failed to load resort map. Is the server running?</div>';
    }
  }
}

// DATE DISPLAY
function setDate():void {
  const now = new Date();
  const headerDate=document.getElementById("header-date");
    if(headerDate instanceof HTMLElement){
          headerDate.textContent = now.toLocaleDateString(
          "en-US",
          { weekday: "long", year: "numeric", month: "long", day: "numeric" },
          );
    }
}

// INIT
window.addEventListener("DOMContentLoaded", async () => {
  // Date display
  setDate();
  // Render legend and stats before map loads
  renderLegend();
  renderStats();
  // Load map
  await loadMap();
  // Hide loading screen
  const loading =document.getElementById("loading");
  if(loading instanceof HTMLElement){
   loading.classList.add("loading--hidden");
   setTimeout(() => loading.remove(), 500);
  }
});

