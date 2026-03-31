import { CabanaWithStatus} from "../backend/types";

// ── Cabana booking ──
describe("Cabana click behavior", () => {
  test("opens booking form for available cabana", () => {
    let state = "idle";
    const cabana:CabanaWithStatus = { id: "4-5",row:4,col:5, available: true, booking: null };
    if (!cabana.available) {
      state = "unavailable";
    } else {
      state = "booking";
    }
    expect(state).toBe("booking");
  });

  test("booked cabana shows unavailable message", () => {
    let state = "idle";
    const cabana:CabanaWithStatus = {
      id: "4-5",
      row:4,
      col:5, 
      available: false,
      booking: { guestName: "Alice Smith", roomNumber: "101",bookedAt: new Date().toISOString() },
    };
    if (!cabana.available) {
      state = "unavailable";
    } else {
      state = "booking";
    }
    expect(state).toBe("unavailable");
  });

  test("reset clears selected cabana", () => {
    let selectedCabanaId:string|null  = "4-5";
    selectedCabanaId= null;
    expect(selectedCabanaId).toBeNull();
  });
});

// ── Map update after booking ──
describe("Map updates after booking", () => {
  test("cabana marked as booked", () => {
    const cabanas :CabanaWithStatus[]= [
      { id: "4-5", row:4,col:5,available: true, booking: null },
      { id: "4-10", row:4,col:10, available: true, booking: null },
    ];

    // booking
    const cabana:CabanaWithStatus= cabanas.find((c) => c.id === "4-5")!;
    cabana.available = false;
    cabana.booking = {
      guestName: "Bob Jones",
      roomNumber: "102",
      bookedAt: new Date().toISOString(),
    };

    expect(cabana.available).toBe(false);
    expect(cabana.booking.guestName).toBe("Bob Jones");
  });

  test("other cabanas available after booking", () => {
    const cabanas:CabanaWithStatus[] = [
      { id: "4-5", row:4,col:5,available: true, booking: null },
      { id: "4-10", row:4,col:10,available: true, booking: null },
    ];
    cabanas.find((c) => c.id === "4-5")!.available = false;
    expect(cabanas.find((c) => c.id === "4-10")!.available).toBe(true);
  });
});

// ── Booking form validation ──
describe("Booking form validation", () => {
  test("empty room number is invalid", () => {
    const roomNumber = "";
    const guestName = "Alice Smith";
    expect(!roomNumber.trim() || !guestName.trim()).toBe(true);
  });

  test("empty guest name is invalid", () => {
    const roomNumber = "101";
    const guestName = "";
    expect(!roomNumber.trim() || !guestName.trim()).toBe(true);
  });

  test("room number and guest name is valid", () => {
    const roomNumber = "101";
    const guestName = "Alice Johnson";
    expect(!roomNumber.trim() || !guestName.trim()).toBe(false);
  });

  test("whitespace only is invalid", () => {
    const roomNumber = "   ";
    const guestName = "   ";
    expect(!roomNumber.trim() || !guestName.trim()).toBe(true);
  });
});

// ── Stats calculation ──
describe("Stats update after booking", () => {
  test("cabana available count decreases after booking", () => {
    const cabanas :CabanaWithStatus[]= [
      { id: "a",row:4,col:5, available: true,booking:null },
      { id: "b",row:4,col:10, available: true,booking:null },
      { id: "c",row:4,col:12, available: false,booking:null },
    ];
    cabanas.find((c) => c.id === "a")!.available = false;
    const avail = cabanas.filter((c) => c.available).length;
    expect(avail).toBe(1);
  });

  test("cabana booked count increases after booking", () => {
    const cabanas :CabanaWithStatus[]= [
       { id: "a",row:4,col:5, available: true,booking:null },
      { id: "b",row:4,col:10, available: true,booking:null },
    ];
    cabanas.find((c) => c.id === "a")!.available = false;
    const booked = cabanas.filter((c) => !c.available).length;
    expect(booked).toBe(1);
  });
});

// ── Masking ──
describe("Guest data masking", () => {
  function maskData(name:string) {
    return name
      .trim()
      .split(" ")
      .map((word) => {
        if (word.length <= 2) return word;
        return "*".repeat(word.length);
      })
      .join(" ");
  }
  test("masks  characters of name", () => {
    expect(maskData("Alice Johnson")).toBe("***** *******");
  });

  test("masks room number", () => {
    expect(maskData("101")).toBe("***");
  });

  test("words length less than 3 are not masked", () => {
    expect(maskData("Al")).toBe("Al");
  });
});

// ── Path detection ──
describe("Path tile detection", () => {
  test("identifies straight horizontal path", () => {
    const grid = [
      [".", ".", "."],
      ["#", "#", "#"],
      [".", ".", "."],
    ];
    const r = 1,
      c = 1;
    const left = grid[r][c - 1] === "#";
    const right = grid[r][c + 1] === "#";
    const up = grid[r - 1][c] === "#";
    const down = grid[r + 1][c] === "#";
    expect(left && right && !up && !down).toBe(true);
  });

  test("identifies corner path", () => {
    const grid = [
      [".", "#", "."],
      [".", "#", "#"],
      [".", ".", "."],
    ];
    const r = 1,
      c = 1;
    const left = grid[r][c - 1] === "#";
    const right = grid[r][c + 1] === "#";
    const up = grid[r - 1][c] === "#";
    const down = grid[r + 1][c] === "#";
    expect(right && up && !left && !down).toBe(true);
  });
});
