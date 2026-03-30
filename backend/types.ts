export interface Cabana {
  id: string;
  row: number;
  col: number;
}

export interface CabanaBooking {
  roomNumber: string;
  guestName: string;
  bookedAt: string;
}

export interface CabanaWithStatus extends Cabana {
  available: boolean;
  booking: CabanaBooking | null;
}

export interface GuestData {
  roomNumber: string;
  guestName: string;
}

export interface BookingsFile {
  guests: GuestData[];
  cabanaBookings: CabanaBooking[]
}


export interface MapResponse {
  grid: string[][];
  cabanas: CabanaWithStatus[];
}

export interface BookingRequest {
  cabanaId: string;
  roomNumber: string;
  guestName: string;
}

export interface BookingResponse {
  success: boolean;
  message: string;
  booking: CabanaBooking;
}

export interface ErrorResponse {
  error: string;
}

export interface AppOptions {
  mapFile?: string;
  bookingsFile?: string;
}

export type CabanaState = Record<string, CabanaBooking | null>;
