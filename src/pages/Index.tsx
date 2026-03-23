import { useState, useMemo } from "react";
import type { PetType, ServiceType, Booking, BookingStatus } from "@/lib/api";
import {
  getServices, createBooking, getBookings, updateStatus,
  deleteBooking, calculatePrice, getBookingStats, getPetSurcharge,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  PawPrint, Trash2, ArrowRight, DollarSign, Activity, Server, Shield,
  Stethoscope, Scissors, Home, Search, Clock, CheckCircle, AlertCircle,
  TrendingUp, Users, IndianRupee, ChevronRight
} from "lucide-react";

const PET_TYPES: PetType[] = ["Dog", "Cat", "Bird", "Rabbit", "Other"];

const PET_EMOJI: Record<PetType, string> = {
  Dog: "🐕", Cat: "🐈", Bird: "🐦", Rabbit: "🐇", Other: "🐾"
};

const SERVICE_ICONS: Record<ServiceType, typeof Stethoscope> = {
  Vet: Stethoscope, Grooming: Scissors, Boarding: Home,
};

const statusConfig: Record<BookingStatus, { color: string; icon: typeof Clock }> = {
  Pending: { color: "bg-[hsl(var(--warning))] text-[hsl(var(--warning-foreground))]", icon: Clock },
  Confirmed: { color: "bg-[hsl(210,80%,50%)] text-[hsl(0,0%,100%)]", icon: AlertCircle },
  Completed: { color: "bg-accent text-accent-foreground", icon: CheckCircle },
};

const Index = () => {
  const [bookingsList, setBookingsList] = useState<Booking[]>([]);
  const [ownerName, setOwnerName] = useState("");
  const [petName, setPetName] = useState("");
  const [petType, setPetType] = useState<PetType | "">("");
  const [service, setService] = useState<ServiceType | "">("");
  const [previewPrice, setPreviewPrice] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<BookingStatus | "All">("All");

  const services = getServices().data!;
  const stats = getBookingStats().data!;

  const filteredBookings = useMemo(() => {
    return bookingsList.filter((b) => {
      const matchesSearch = !searchQuery ||
        b.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.petName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "All" || b.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [bookingsList, searchQuery, statusFilter]);

  const refreshBookings = () => setBookingsList(getBookings().data!);

  const updatePreviewPrice = (svc: ServiceType | "", pet: PetType | "") => {
    if (svc && pet) setPreviewPrice(calculatePrice(svc as ServiceType, pet as PetType));
    else setPreviewPrice(null);
  };

  const handleCreate = () => {
    if (!service || !petType) { toast.error("Please fill all fields"); return; }
    const res = createBooking({ ownerName, petName, petType: petType as PetType, service: service as ServiceType });
    if (!res.success) { toast.error(res.error); return; }
    toast.success(`Booking ${res.data!.id} created — ₹${res.data!.price}`);
    refreshBookings();
    setOwnerName(""); setPetName(""); setPetType(""); setService(""); setPreviewPrice(null);
  };

  const handleStatusUpdate = (id: string, newStatus: string) => {
    const res = updateStatus(id, newStatus as BookingStatus);
    if (!res.success) { toast.error(res.error); return; }
    toast.success(`${id} → ${newStatus}`);
    refreshBookings();
  };

  const handleDelete = (id: string) => {
    const res = deleteBooking(id);
    if (!res.success) { toast.error(res.error); return; }
    toast.success(`Booking ${id} deleted`);
    refreshBookings();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ── Hero Header ───────────────────────────────── */}
      <header className="relative border-b bg-card overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="container mx-auto flex items-center justify-between py-5 px-4 relative">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-primary flex items-center justify-center shadow-md">
              <PawPrint className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">PawHub</h1>
              <p className="text-xs text-muted-foreground">Pet Service Booking System</p>
            </div>
          </div>
          <Badge variant="outline" className="hidden sm:flex gap-1 text-xs">
            <span className="h-2 w-2 rounded-full bg-accent animate-pulse" /> In-Memory Backend
          </Badge>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6 max-w-6xl">

        {/* ── Stats Dashboard ─────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total Bookings", value: stats.total, icon: Users, color: "text-primary" },
            { label: "Pending", value: stats.pending, icon: Clock, color: "text-[hsl(var(--warning))]" },
            { label: "Completed", value: stats.completed, icon: CheckCircle, color: "text-accent" },
            { label: "Revenue", value: `₹${stats.totalRevenue}`, icon: TrendingUp, color: "text-primary" },
          ].map((s) => (
            <Card key={s.label} className="relative overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{s.value}</p>
                  </div>
                  <s.icon className={`h-8 w-8 ${s.color} opacity-30`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── Tabs ────────────────────────────────────── */}
        <Tabs defaultValue="booking" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="booking">New Booking</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="docs">How It Works</TabsTrigger>
          </TabsList>

          {/* ── New Booking Tab ─────────────────────────── */}
          <TabsContent value="booking">
            <Card className="shadow-lg border-2 border-primary/10">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <PawPrint className="h-5 w-5 text-primary" /> Create Booking
                </CardTitle>
                <CardDescription>Fill in the details to book a service for your pet.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Owner Name</label>
                    <Input placeholder="e.g. Rahul Sharma" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Pet Name</label>
                    <Input placeholder="e.g. Bruno" value={petName} onChange={(e) => setPetName(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Pet Type</label>
                    <Select value={petType} onValueChange={(v) => { setPetType(v as PetType); updatePreviewPrice(service, v as PetType); }}>
                      <SelectTrigger><SelectValue placeholder="Select pet type" /></SelectTrigger>
                      <SelectContent>
                        {PET_TYPES.map((p) => (
                          <SelectItem key={p} value={p}>
                            {PET_EMOJI[p]} {p} {getPetSurcharge(p) > 0 && <span className="text-muted-foreground">(+₹{getPetSurcharge(p)})</span>}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Service</label>
                    <Select value={service} onValueChange={(v) => { setService(v as ServiceType); updatePreviewPrice(v as ServiceType, petType); }}>
                      <SelectTrigger><SelectValue placeholder="Select service" /></SelectTrigger>
                      <SelectContent>
                        {services.map((s) => (
                          <SelectItem key={s.name} value={s.name}>{s.name} — ₹{s.basePrice}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Price breakdown */}
                {previewPrice !== null && service && petType && (
                  <div className="rounded-lg bg-muted/50 border border-border p-3 space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Price Breakdown</p>
                    <div className="flex items-center justify-between text-sm">
                      <span>{service} base price</span>
                      <span>₹{services.find(s => s.name === service)?.basePrice}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>{petType} surcharge</span>
                      <span>+₹{getPetSurcharge(petType as PetType)}</span>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between font-bold text-base">
                      <span>Total</span>
                      <span className="text-primary">₹{previewPrice}</span>
                    </div>
                  </div>
                )}

                <Button onClick={handleCreate} className="w-full sm:w-auto">
                  <PawPrint className="mr-2 h-4 w-4" /> Create Booking
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Services Tab ───────────────────────────── */}
          <TabsContent value="services">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {services.map((s) => {
                const Icon = SERVICE_ICONS[s.name];
                return (
                  <Card key={s.name} className="group hover:shadow-lg hover:border-primary/20 transition-all duration-200">
                    <CardContent className="pt-6 space-y-3">
                      <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground text-lg">{s.name}</p>
                        <p className="text-sm text-muted-foreground mt-1">{s.description}</p>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-border">
                        <div>
                          <p className="text-2xl font-bold text-primary">₹{s.basePrice}</p>
                          <p className="text-xs text-muted-foreground">base price</p>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          <Clock className="h-3 w-3 mr-1" /> {s.duration}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* ── How It Works Tab ───────────────────────── */}
          <TabsContent value="docs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <p className="text-sm text-muted-foreground">Bookings follow a strict state machine:</p>
                  <div className="flex items-center gap-2 text-sm font-medium flex-wrap">
                    <Badge className={statusConfig.Pending.color}>Pending</Badge>
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    <Badge className={statusConfig.Confirmed.color}>Confirmed</Badge>
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    <Badge className={statusConfig.Completed.color}>Completed</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    You cannot skip steps — the backend rejects invalid transitions.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6 space-y-3">
                  <div className="flex items-center gap-2 text-primary font-semibold">
                    <Server className="h-5 w-5" /> REST API Endpoints
                  </div>
                  <div className="space-y-2">
                    {[
                      { method: "GET", path: "/services", fn: "getServices()" },
                      { method: "POST", path: "/booking", fn: "createBooking()" },
                      { method: "GET", path: "/bookings", fn: "getBookings()" },
                      { method: "PUT", path: "/booking/:id", fn: "updateStatus()" },
                      { method: "DELETE", path: "/booking/:id", fn: "deleteBooking()" },
                    ].map((ep) => (
                      <div key={ep.path + ep.method} className="flex items-center gap-2 text-xs">
                        <Badge variant="outline" className="font-mono w-16 justify-center text-[10px]">{ep.method}</Badge>
                        <code className="text-muted-foreground flex-1">{ep.path}</code>
                        <ChevronRight className="h-3 w-3 text-muted-foreground" />
                        <code className="text-foreground">{ep.fn}</code>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6 space-y-3">
                  <div className="flex items-center gap-2 text-primary font-semibold">
                    <Shield className="h-5 w-5" /> Input Validation
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Empty fields rejected with clear error messages</li>
                    <li>Invalid service/pet types return descriptive errors</li>
                    <li>Status transitions enforced — no skipping states</li>
                    <li>Non-existent IDs return 404-style errors</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* ── Bookings Table ───────────────────────────── */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <CardTitle className="text-lg">All Bookings ({bookingsList.length})</CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or ID…"
                    className="pl-9 h-9 w-48"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as BookingStatus | "All")}>
                  <SelectTrigger className="h-9 w-32"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Status</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Confirmed">Confirmed</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredBookings.length === 0 ? (
              <div className="text-center py-12 space-y-2">
                <PawPrint className="h-10 w-10 text-muted-foreground/30 mx-auto" />
                <p className="text-muted-foreground">
                  {bookingsList.length === 0 ? "No bookings yet. Create one above!" : "No bookings match your search."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground text-xs uppercase tracking-wide">
                      <th className="pb-3 pr-4 font-medium">ID</th>
                      <th className="pb-3 pr-4 font-medium">Owner</th>
                      <th className="pb-3 pr-4 font-medium">Pet</th>
                      <th className="pb-3 pr-4 font-medium">Service</th>
                      <th className="pb-3 pr-4 font-medium">Price</th>
                      <th className="pb-3 pr-4 font-medium">Status</th>
                      <th className="pb-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBookings.map((b) => {
                      const nextStatus = b.status === "Pending" ? "Confirmed" : b.status === "Confirmed" ? "Completed" : null;
                      const StatusIcon = statusConfig[b.status].icon;
                      return (
                        <tr key={b.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                          <td className="py-3.5 pr-4 font-mono text-xs text-muted-foreground">{b.id}</td>
                          <td className="py-3.5 pr-4 font-medium">{b.ownerName}</td>
                          <td className="py-3.5 pr-4">
                            <span className="mr-1">{PET_EMOJI[b.petType]}</span>
                            {b.petName}
                            <span className="text-muted-foreground text-xs ml-1">({b.petType})</span>
                          </td>
                          <td className="py-3.5 pr-4">{b.service}</td>
                          <td className="py-3.5 pr-4">
                            <span className="inline-flex items-center font-semibold">
                              <IndianRupee className="h-3 w-3" />{b.price}
                            </span>
                          </td>
                          <td className="py-3.5 pr-4">
                            <Badge className={`${statusConfig[b.status].color} gap-1`}>
                              <StatusIcon className="h-3 w-3" /> {b.status}
                            </Badge>
                          </td>
                          <td className="py-3.5">
                            <div className="flex items-center gap-1.5">
                              {nextStatus && (
                                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleStatusUpdate(b.id, nextStatus)}>
                                  {nextStatus} <ArrowRight className="ml-1 h-3 w-3" />
                                </Button>
                              )}
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(b.id)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
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

        <div className="pb-8" />
      </main>
    </div>
  );
};

export default Index;
