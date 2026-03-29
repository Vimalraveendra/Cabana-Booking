const API = ""; // same origin
let mapData = null;
let selectedCabanaId = null;

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
    if (!up) return { type: "split", rotate: "90deg" }; // T facing down
    if (!down) return { type: "split", rotate: "270deg" }; // T facing up
    if (!left) return { type: "split", rotate: "0deg" }; // T facing right: ;
    if (!right) return { type: "split", rotate: "270deg" }; // T facing left
  }

  // Straight
  if (left && right && !up && !down)
    return { type: "straight", rotate: "90deg" }; // straight-h
  if (up && down && !left && !right)
    // straight -v
    return { type: "straight", rotate: "0deg" };

  // Corners
  if (right && down && !up && !left)
    // top-left
    return { type: "corner", rotate: "90deg" };
  if (left && down && !up && !right)
    //top-right
    return { type: "corner", rotate: "180deg" };
  if (right && up && !down && !left)
    // bottom-left
    return { type: "corner", rotate: "0deg" };
  if (left && up && !down && !right)
    //bottom-right
    return { type: "corner", rotate: "270deg" };

  // End caps
  if (right && !left && !up && !down)
    //end-left
    return { type: "end", rotate: "270deg" };
  if (left && !right && !up && !down)
    //end-right
    return { type: "end", rotate: "90deg" };
  if (down && !up && !left && !right)
    //end-top
    return { type: "end", rotate: "90deg" };
  if (up && !down && !left && !right)
    //end-bottom
    return { type: "end", rotate: "270deg" };

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
          : `${cabanaLabel(cabana.id)} — Booked (${(cabana.booking && cabana.booking.guestName) || ""})`;
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
}
// LOAD MAP
async function loadMap() {
  try {
    const res = await fetch("/api/map");
    const data = await res.json();
    renderMap(data);
  } catch (e) {
    console.log("e", e);
    document.getElementById("map-grid").innerHTML =
      '<div style="padding:2rem;color:#7a3333;font-size:0.8rem;">Failed to load resort map. Is the server running?</div>';
  }
}

// Date display
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
  // Load map
  await loadMap();
  // Hide loading screen
  const loading = document.getElementById("loading");
  loading.classList.add("loading--hidden");
  setTimeout(() => loading.remove(), 500);
});
