// ============================================
// PawHub Backend — In-Memory REST-like API
// ============================================

export type PetType = "Dog" | "Cat" | "Bird" | "Rabbit" | "Other";
export type ServiceType = "Vet" | "Grooming" | "Boarding";
export type BookingStatus = "Pending" | "Confirmed" | "Completed";

export interface Service {
  name: ServiceType;
  basePrice: number;
  description: string;
  duration: string;
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

export interface BookingStats {
  total: number;
  pending: number;
  confirmed: number;
  completed: number;
  totalRevenue: number;
}

// ── Service Catalog ──────────────────────────────
const SERVICE_CATALOG: Service[] = [
  { name: "Vet", basePrice: 500, description: "Health checkup, vaccinations & treatments", duration: "30-60 min" },
  { name: "Grooming", basePrice: 300, description: "Bath, haircut, nail trimming & styling", duration: "45-90 min" },
  { name: "Boarding", basePrice: 700, description: "Comfortable overnight stay with meals", duration: "24 hrs" },
];

const PET_SURCHARGES: Record<PetType, number> = {
  Dog: 100,
  Cat: 50,
  Bird: 0,
  Rabbit: 0,
  Other: 0,
};

const VALID_TRANSITIONS: Record<BookingStatus, BookingStatus | null> = {
  Pending: "Confirmed",
  Confirmed: "Completed",
  Completed: null,
};

// ── In-Memory Storage ────────────────────────────
let bookings: Booking[] = [];
let nextId = 1;

// ── Core Functions ───────────────────────────────

export function getServices(): ApiResponse<Service[]> {
  return { success: true, data: [...SERVICE_CATALOG] };
}

export function calculatePrice(service: ServiceType, petType: PetType): number {
  const svc = SERVICE_CATALOG.find((s) => s.name === service);
  if (!svc) return 0;
  return svc.basePrice + (PET_SURCHARGES[petType] ?? 0);
}

export function getPetSurcharge(petType: PetType): number {
  return PET_SURCHARGES[petType] ?? 0;
}

export function createBooking(input: {
  ownerName: string;
  petName: string;
  petType: PetType;
  service: ServiceType;
}): ApiResponse<Booking> {
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

export function getBookings(): ApiResponse<Booking[]> {
  return { success: true, data: [...bookings] };
}

export function getBookingStats(): ApiResponse<BookingStats> {
  const stats: BookingStats = {
    total: bookings.length,
    pending: bookings.filter((b) => b.status === "Pending").length,
    confirmed: bookings.filter((b) => b.status === "Confirmed").length,
    completed: bookings.filter((b) => b.status === "Completed").length,
    totalRevenue: bookings.reduce((sum, b) => sum + b.price, 0),
  };
  return { success: true, data: stats };
}

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

export function deleteBooking(id: string): ApiResponse<{ id: string }> {
  const idx = bookings.findIndex((b) => b.id === id);
  if (idx === -1) return { success: false, error: `Booking ${id} not found` };
  bookings.splice(idx, 1);
  return { success: true, data: { id } };
}
