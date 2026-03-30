export interface CabanaBooking {
  roomNumber: string;
  guestName: string;
  bookedAt: string;
}

export interface Cabana {
  id: string;
  row: number;
  col: number;
  available: boolean;
  booking: CabanaBooking | null;
}

export interface MapResponse {
  grid: string[][];
  cabanas: Cabana[];
}

export interface PathResult {
  type: 'straight' | 'corner' | 'split' | 'crossing' | 'end';
  rotate: string;
}

export interface LegendItem {
  src: string;
  alt: string;
  modifier: string;
  label: string;
}

export interface StatsItem {
  id: string;
  label: string;
}
