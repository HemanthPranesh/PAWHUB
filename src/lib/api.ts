// ============================================
// PawHub Backend — In-Memory REST-like API
// ============================================
// This module simulates a backend server with
// modular functions, in-memory storage, and
// proper validation. No database required.
// ============================================

export type PetType = "Dog" | "Cat" | "Bird" | "Rabbit" | "Other";
export type ServiceType = "Vet" | "Grooming" | "Boarding";
export type BookingStatus = "Pending" | "Confirmed" | "Completed";

export interface Service {
  name: ServiceType;
  basePrice: number;
}

export interface Booking {
  id: string;
  ownerName: string;
  petName: string;
  petType: PetType;
  service: ServiceType;
  price: number;
  status: BookingStatus;
  createdAt: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// ── Service Catalog (GET /services) ──────────────
const SERVICE_CATALOG: Service[] = [
  { name: "Vet", basePrice: 500 },
  { name: "Grooming", basePrice: 300 },
  { name: "Boarding", basePrice: 700 },
];

const PET_SURCHARGES: Record<PetType, number> = {
  Dog: 100,
  Cat: 50,
  Bird: 0,
  Rabbit: 0,
  Other: 0,
};

// Valid status transitions: Pending → Confirmed → Completed
const VALID_TRANSITIONS: Record<BookingStatus, BookingStatus | null> = {
  Pending: "Confirmed",
  Confirmed: "Completed",
  Completed: null,
};

// ── In-Memory Storage ────────────────────────────
let bookings: Booking[] = [];
let nextId = 1;

// ── Core Functions ───────────────────────────────

/** GET /services — returns predefined service catalog */
export function getServices(): ApiResponse<Service[]> {
  return { success: true, data: [...SERVICE_CATALOG] };
}

/** Calculates price = base price of service + pet type surcharge */
export function calculatePrice(service: ServiceType, petType: PetType): number {
  const svc = SERVICE_CATALOG.find((s) => s.name === service);
  if (!svc) return 0;
  return svc.basePrice + (PET_SURCHARGES[petType] ?? 0);
}

/** POST /booking — creates a new booking with auto-calculated price */
export function createBooking(input: {
  ownerName: string;
  petName: string;
  petType: PetType;
  service: ServiceType;
}): ApiResponse<Booking> {
  // Input validation
  if (!input.ownerName?.trim()) return { success: false, error: "Owner name is required" };
  if (!input.petName?.trim()) return { success: false, error: "Pet name is required" };
  if (!input.petType) return { success: false, error: "Pet type is required" };
  if (!input.service) return { success: false, error: "Service type is required" };

  const validServices = SERVICE_CATALOG.map((s) => s.name);
  if (!validServices.includes(input.service)) {
    return { success: false, error: `Invalid service. Must be one of: ${validServices.join(", ")}` };
  }

  const validPets: PetType[] = ["Dog", "Cat", "Bird", "Rabbit", "Other"];
  if (!validPets.includes(input.petType)) {
    return { success: false, error: `Invalid pet type. Must be one of: ${validPets.join(", ")}` };
  }

  const price = calculatePrice(input.service, input.petType);

  const booking: Booking = {
    id: `PH-${String(nextId++).padStart(3, "0")}`,
    ownerName: input.ownerName.trim(),
    petName: input.petName.trim(),
    petType: input.petType,
    service: input.service,
    price,
    status: "Pending",
    createdAt: new Date().toISOString(),
  };

  bookings.push(booking);
  return { success: true, data: booking };
}

/** GET /bookings — returns all bookings */
export function getBookings(): ApiResponse<Booking[]> {
  return { success: true, data: [...bookings] };
}

/** PUT /booking/:id — updates booking status with lifecycle validation */
export function updateStatus(id: string, newStatus: BookingStatus): ApiResponse<Booking> {
  const booking = bookings.find((b) => b.id === id);
  if (!booking) return { success: false, error: `Booking ${id} not found` };

  const expectedNext = VALID_TRANSITIONS[booking.status];
  if (expectedNext === null) {
    return { success: false, error: `Booking is already ${booking.status}. No further transitions allowed.` };
  }
  if (newStatus !== expectedNext) {
    return { success: false, error: `Invalid transition: ${booking.status} → ${newStatus}. Expected: ${booking.status} → ${expectedNext}` };
  }

  booking.status = newStatus;
  return { success: true, data: { ...booking } };
}

/** DELETE /booking/:id — removes a booking */
export function deleteBooking(id: string): ApiResponse<{ id: string }> {
  const idx = bookings.findIndex((b) => b.id === id);
  if (idx === -1) return { success: false, error: `Booking ${id} not found` };
  bookings.splice(idx, 1);
  return { success: true, data: { id } };
}
