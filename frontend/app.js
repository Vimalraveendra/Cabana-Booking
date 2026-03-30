const API = ""; // same origin
let mapData = null;
let selectedCabanaId = null;

// ── LEGEND (dynamic) ──

const LEGEND_ITEMS = [
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

function renderLegend() {
  const legend = document.getElementById("legend");
  legend.innerHTML = LEGEND_ITEMS.map(
    ({ src, alt, modifier, label }) => `
    <div class="legend__item">
      <img src="${src}" alt="${alt}" class="legend__icon legend__icon--${modifier}" />
      <span>${label}</span>
    </div>
  `,
  ).join("");
}

// ── STATS (dynamic)──

const STAT_ITEMS = [
  { id: "stats-total", label: "Total Cabanas" },
  { id: "stats-available", label: "Available" },
  { id: "stats-booked", label: "Reserved" },
];

function renderStats() {
  const statsBar = document.getElementById("stats");
  statsBar.innerHTML = STAT_ITEMS.map(
    ({ id, label }) => `
    <div class="stats__item">
      <div class="stats__value" id="${id}">—</div>
      <div class="stats__label">${label}</div>
    </div>
  `,
  ).join("");
}

function showError(msg) {
  const el = document.getElementById("form-booking-error");
  el.textContent = msg;
  el.style.display = "block";
}

// ── Modal helpers ──
function openModal(panel) {
  ["modal-booking", "modal-unavailable", "modal-confirm"].forEach((id) => {
    document.getElementById(id).style.display = id === panel ? "block" : "none";
  });
  document.getElementById("modal").classList.add("modal--open");
}

function closeModal() {
  document.getElementById("modal").classList.remove("modal--open");
  document.getElementById("form-booking-error").style.display = "none";
  document.getElementById("input-room").value = "";
  document.getElementById("input-name").value = "";
  selectedCabanaId = null;
}

// Close on backdrop click
document.getElementById("modal").addEventListener("click", function (e) {
  if (e.target === this) closeModal();
});

// ── Booking submit ──

async function submitBooking() {
  const roomNumber = document.getElementById("input-room").value.trim();
  const guestName = document.getElementById("input-name").value.trim();
  if (!roomNumber || !guestName) {
    showError("Please enter both your room number and full name.");
    return;
  }

  const btn = document.getElementById("modal-booking-button");
  btn.disabled = true;
  btn.textContent = "Processing...";

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
    const cabana = mapData.cabanas.find((c) => c.id === selectedCabanaId);
    if (cabana) {
      cabana.available = false;
      cabana.booking = data.booking;
    }

    // Update cell visually
    const cell = document.querySelector(
      `[data-cabana-id="${selectedCabanaId}"]`,
    );
    if (cell) {
      cell.classList.remove("cell--available");
      cell.classList.add("cell--booked", "cell--just-booked");
      cell.title = `Booked — ${guestName} (Room ${roomNumber})`;
    }

    // Update stats
    updateStats();

    // Show confirmation
    document.getElementById("modal-confirm-detail").innerHTML =
      `<strong>${guestName}</strong><br>Room ${roomNumber}<br><br>` +
      `${cabanaLabel(selectedCabanaId)} is reserved for you.<br>Enjoy your day at the pool! 🌴`;
    openModal("modal-confirm");
  } catch (err) {
    showError("Network error. Please try again.");
  } finally {
    btn.disabled = false;
    btn.textContent = "Reserve This Cabana";
  }
}

// ── UPDATE STATUS ──

function updateStats() {
  if (!mapData) return;
  const total = mapData.cabanas.length;
  const avail = mapData.cabanas.filter((c) => c.available).length;
  document.getElementById("stats-total").textContent = total;
  document.getElementById("stats-available").textContent = avail;
  document.getElementById("stats-booked").textContent = total - avail;
}

// ── MASK DATA──
function maskData(name) {
  const words = name.trim().split(" ");
  return words
    .map((word) => {
      return "*".repeat(word.length);
    })
    .join(" ");
}

// ── CABANA CLICK ──
function handleCabanaClick(cabana) {
  selectedCabanaId = cabana.id;
  if (!cabana.available) {
    document.getElementById("modal-unavailable-cabana-name").textContent =
      cabanaLabel(cabana.id);
    document.getElementById("modal-unavailable-guest").textContent = cabana
      .booking?.guestName
      ? maskData(cabana.booking.guestName)
      : "—";
    document.getElementById("modal-unavailable-room").textContent = cabana
      .booking?.roomNumber
      ? "Room " + maskData(cabana.booking.roomNumber)
      : "—";
    openModal("modal-unavailable");
  } else {
    document.getElementById("modal-cabana-name").textContent = cabanaLabel(
      cabana.id,
    );
    openModal("modal-booking");
    setTimeout(() => document.getElementById("input-room").focus(), 100);
  }
}

//CABANA LABEL
function cabanaLabel(id) {
  return "Cabana " + id.replace("-", ":");
}

// PATH TILE DETECTION
function getPathType(grid, r, c) {
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
function renderMap(data) {
  mapData = data;
  const grid = data.grid;
  const cabanaMap = {};
  for (const c of data.cabanas) {
    cabanaMap[`${c.row}-${c.col}`] = c;
  }

  const container = document.getElementById("map-grid");
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
async function loadMap() {
  try {
    const res = await fetch("/api/map");
    const data = await res.json();
    renderMap(data);
  } catch (e) {
    document.getElementById("map-grid").innerHTML =
      '<div style="padding:2rem;color:#7a3333;font-size:0.8rem;">Failed to load resort map. Is the server running?</div>';
  }
}

// DATE DISPLAY
function setDate() {
  const now = new Date();
  document.getElementById("header-date").textContent = now.toLocaleDateString(
    "en-US",
    { weekday: "long", year: "numeric", month: "long", day: "numeric" },
  );
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
  const loading = document.getElementById("loading");
  loading.classList.add("loading--hidden");
  setTimeout(() => loading.remove(), 500);
});
