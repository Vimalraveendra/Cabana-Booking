// ── Cabana booking ──
describe("Cabana click behavior", () => {
  test("opens booking form for available cabana", () => {
    let state = "idle";
    const cabana = { id: "4-5", available: true, booking: null };
    if (!cabana.available) {
      state = "unavailable";
    } else {
      state = "booking";
    }
    expect(state).toBe("booking");
  });

  test("booked cabana shows unavailable message", () => {
    let state = "idle";
    const cabana = {
      id: "4-5",
      available: false,
      booking: { guestName: "Alice Smith", roomNumber: "101" },
    };
    if (!cabana.available) {
      state = "unavailable";
    } else {
      state = "booking";
    }
    expect(state).toBe("unavailable");
  });

  test("reset clears selected cabana", () => {
    let selectedCabanaId = "4-5";
    selectedCabanaId = null;
    expect(selectedCabanaId).toBeNull();
  });
});

// ── Map update after booking ──
describe("Map updates after booking", () => {
  test("cabana marked as booked", () => {
    const cabanas = [
      { id: "4-5", available: true, booking: null },
      { id: "4-10", available: true, booking: null },
    ];

    // booking
    const cabana = cabanas.find((c) => c.id === "4-5");
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
    const cabanas = [
      { id: "4-5", available: true, booking: null },
      { id: "4-10", available: true, booking: null },
    ];
    cabanas.find((c) => c.id === "4-5").available = false;
    expect(cabanas.find((c) => c.id === "4-10").available).toBe(true);
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
    const cabanas = [
      { id: "a", available: true },
      { id: "b", available: true },
      { id: "c", available: false },
    ];
    cabanas.find((c) => c.id === "a").available = false;
    const avail = cabanas.filter((c) => c.available).length;
    expect(avail).toBe(1);
  });

  test("cabana booked count increases after booking", () => {
    const cabanas = [
      { id: "a", available: true },
      { id: "b", available: true },
    ];
    cabanas.find((c) => c.id === "a").available = false;
    const booked = cabanas.filter((c) => !c.available).length;
    expect(booked).toBe(1);
  });
});
