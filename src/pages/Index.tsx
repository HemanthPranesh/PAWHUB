import { useState } from "react";
import type { PetType, ServiceType, Booking } from "@/lib/api";
import { getServices, createBooking, getBookings, updateStatus, deleteBooking, calculatePrice } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { PawPrint, Trash2, ArrowRight, DollarSign, Activity, Server, Shield } from "lucide-react";

const PET_TYPES: PetType[] = ["Dog", "Cat", "Bird", "Rabbit", "Other"];

const statusColor: Record<string, string> = {
  Pending: "bg-[hsl(45,93%,47%)] text-[hsl(0,0%,100%)]",
  Confirmed: "bg-[hsl(210,80%,50%)] text-[hsl(0,0%,100%)]",
  Completed: "bg-accent text-accent-foreground",
};

const Index = () => {
  const [bookingsList, setBookingsList] = useState<Booking[]>([]);
  const [ownerName, setOwnerName] = useState("");
  const [petName, setPetName] = useState("");
  const [petType, setPetType] = useState<PetType | "">("");
  const [service, setService] = useState<ServiceType | "">("");
  const [previewPrice, setPreviewPrice] = useState<number | null>(null);

  const services = getServices().data!;

  const updatePreviewPrice = (svc: ServiceType | "", pet: PetType | "") => {
    if (svc && pet) setPreviewPrice(calculatePrice(svc as ServiceType, pet as PetType));
    else setPreviewPrice(null);
  };

  const handleCreate = () => {
    if (!service || !petType) {
      toast.error("Please fill all fields");
      return;
    }
    const res = createBooking({ ownerName, petName, petType: petType as PetType, service: service as ServiceType });
    if (!res.success) {
      toast.error(res.error);
      return;
    }
    toast.success(`Booking ${res.data!.id} created — ₹${res.data!.price}`);
    setBookingsList(getBookings().data!);
    setOwnerName(""); setPetName(""); setPetType(""); setService(""); setPreviewPrice(null);
  };

  const handleStatusUpdate = (id: string, newStatus: string) => {
    const res = updateStatus(id, newStatus as any);
    if (!res.success) { toast.error(res.error); return; }
    toast.success(`${id} → ${newStatus}`);
    setBookingsList(getBookings().data!);
  };

  const handleDelete = (id: string) => {
    const res = deleteBooking(id);
    if (!res.success) { toast.error(res.error); return; }
    toast.success(`Booking ${id} deleted`);
    setBookingsList(getBookings().data!);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto flex items-center gap-3 py-4 px-4">
          <PawPrint className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">PawHub</h1>
            <p className="text-sm text-muted-foreground">Pet Service Booking System</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8 max-w-5xl">
        {/* ── Booking Form ─────────────────────────────── */}
        <Card className="shadow-lg border-2 border-primary/10">
          <CardHeader>
            <CardTitle className="text-lg">New Booking</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Input placeholder="Owner Name" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} />
              <Input placeholder="Pet Name" value={petName} onChange={(e) => setPetName(e.target.value)} />
              <Select value={petType} onValueChange={(v) => { setPetType(v as PetType); updatePreviewPrice(service, v as PetType); }}>
                <SelectTrigger><SelectValue placeholder="Pet Type" /></SelectTrigger>
                <SelectContent>
                  {PET_TYPES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={service} onValueChange={(v) => { setService(v as ServiceType); updatePreviewPrice(v as ServiceType, petType); }}>
                <SelectTrigger><SelectValue placeholder="Service" /></SelectTrigger>
                <SelectContent>
                  {services.map((s) => <SelectItem key={s.name} value={s.name}>{s.name} — ₹{s.basePrice}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="mt-4 flex items-center justify-between">
              {previewPrice !== null && (
                <p className="text-sm font-medium text-muted-foreground">
                  Estimated Price: <span className="text-foreground font-bold text-lg">₹{previewPrice}</span>
                </p>
              )}
              <Button onClick={handleCreate} className="ml-auto">Create Booking</Button>
            </div>
          </CardContent>
        </Card>

        {/* ── Service Catalog ──────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {services.map((s) => (
            <Card key={s.name} className="text-center">
              <CardContent className="pt-6">
                <p className="font-semibold text-foreground">{s.name}</p>
                <p className="text-2xl font-bold text-primary mt-1">₹{s.basePrice}</p>
                <p className="text-xs text-muted-foreground mt-1">base price</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── Bookings Table ───────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">All Bookings ({bookingsList.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {bookingsList.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No bookings yet. Create one above!</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-3 pr-4">ID</th>
                      <th className="pb-3 pr-4">Owner</th>
                      <th className="pb-3 pr-4">Pet</th>
                      <th className="pb-3 pr-4">Service</th>
                      <th className="pb-3 pr-4">Price</th>
                      <th className="pb-3 pr-4">Status</th>
                      <th className="pb-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookingsList.map((b) => {
                      const nextStatus = b.status === "Pending" ? "Confirmed" : b.status === "Confirmed" ? "Completed" : null;
                      return (
                        <tr key={b.id} className="border-b last:border-0">
                          <td className="py-3 pr-4 font-mono text-xs">{b.id}</td>
                          <td className="py-3 pr-4">{b.ownerName}</td>
                          <td className="py-3 pr-4">{b.petName} <span className="text-muted-foreground">({b.petType})</span></td>
                          <td className="py-3 pr-4">{b.service}</td>
                          <td className="py-3 pr-4 font-semibold">₹{b.price}</td>
                          <td className="py-3 pr-4">
                            <Badge className={statusColor[b.status]}>{b.status}</Badge>
                          </td>
                          <td className="py-3 flex gap-2">
                            {nextStatus && (
                              <Button size="sm" variant="outline" onClick={() => handleStatusUpdate(b.id, nextStatus)}>
                                {nextStatus} <ArrowRight className="ml-1 h-3 w-3" />
                              </Button>
                            )}
                            <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(b.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Separator />

        {/* ── Explanation Section ──────────────────────── */}
        <div className="space-y-6 pb-12">
          <h2 className="text-xl font-bold text-foreground">How It Works</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardContent className="pt-6 space-y-3">
                <div className="flex items-center gap-2 text-primary font-semibold">
                  <DollarSign className="h-5 w-5" /> Smart Pricing
                </div>
                <p className="text-sm text-muted-foreground">
                  Price = <strong>Service Base Price</strong> + <strong>Pet Surcharge</strong>
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Vet ₹500 · Grooming ₹300 · Boarding ₹700</li>
                  <li>Dog +₹100 · Cat +₹50 · Others +₹0</li>
                  <li>Example: Grooming + Dog = ₹300 + ₹100 = <strong>₹400</strong></li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 space-y-3">
                <div className="flex items-center gap-2 text-primary font-semibold">
                  <Activity className="h-5 w-5" /> Booking Lifecycle
                </div>
                <p className="text-sm text-muted-foreground">
                  Bookings follow a strict state machine:
                </p>
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Badge className={statusColor.Pending}>Pending</Badge>
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  <Badge className={statusColor.Confirmed}>Confirmed</Badge>
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  <Badge className={statusColor.Completed}>Completed</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  You cannot skip steps — the backend rejects invalid transitions with an error.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 space-y-3">
                <div className="flex items-center gap-2 text-primary font-semibold">
                  <Server className="h-5 w-5" /> API Flow
                </div>
                <p className="text-sm text-muted-foreground">
                  The frontend calls modular backend functions that simulate REST endpoints:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 font-mono text-xs">
                  <li>GET /services → getServices()</li>
                  <li>POST /booking → createBooking()</li>
                  <li>GET /bookings → getBookings()</li>
                  <li>PUT /booking/:id → updateStatus()</li>
                  <li>DELETE /booking/:id → deleteBooking()</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 space-y-3">
                <div className="flex items-center gap-2 text-primary font-semibold">
                  <Shield className="h-5 w-5" /> Input Validation
                </div>
                <p className="text-sm text-muted-foreground">
                  Every API call validates inputs before processing:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Empty fields are rejected with clear error messages</li>
                  <li>Invalid service/pet types return descriptive errors</li>
                  <li>Status transitions are enforced — no skipping states</li>
                  <li>Non-existent booking IDs return 404-style errors</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
