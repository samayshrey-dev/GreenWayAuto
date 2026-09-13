import fs from "node:fs";
import path from "node:path";
import { UAE_VAT_RATE, calculateTotal, calculateVat } from "../../shared/easygarage";
import type {
  ActivityLog,
  Customer,
  Inspection,
  InspectionItem,
  InventoryItem,
  Invoice,
  JobCard,
  JobCardPart,
  LabourItem,
  Payment,
  Technician,
  User,
  Vehicle,
  Workshop,
} from "../../drizzle/schema";
import type {
  DashboardMetrics,
  FullJobCard,
  GlobalSearchResult,
  InvoiceLineItem,
  VehicleServiceHistory,
  WorkshopDatabase,
} from "./types";

interface RelationalStore {
  workshops: Workshop[];
  users: User[];
  customers: Customer[];
  vehicles: Vehicle[];
  technicians: Technician[];
  jobCards: JobCard[];
  inspections: Inspection[];
  inspectionItems: InspectionItem[];
  labourItems: LabourItem[];
  inventoryItems: InventoryItem[];
  jobCardParts: JobCardPart[];
  invoices: Invoice[];
  payments: Payment[];
  activityLogs: ActivityLog[];
}

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_PATH = path.join(DATA_DIR, "easygarage_relational.json");

function ensureDirectoryExists(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Simple deterministic password hash for local/dev fallback:
// in production bcrypt/argon or pbkdf2 can be used.
export function hashPassword(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `sha256_mock_${Math.abs(hash)}_${password.length}`;
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

export class RelationalMemoryStore implements WorkshopDatabase {
  private data: RelationalStore;

  constructor() {
    this.data = this.loadFromDisk();
  }

  private loadFromDisk(): RelationalStore {
    ensureDirectoryExists(DATA_DIR);
    if (fs.existsSync(STORE_PATH)) {
      try {
        const raw = fs.readFileSync(STORE_PATH, "utf-8");
        const parsed = JSON.parse(raw);
        // Dates revitalization
        return this.reviveDates(parsed);
      } catch (err) {
        console.warn("[Database] Failed to read existing store file, re-initializing:", err);
      }
    }

    const initial = this.createInitialSeed();
    this.persistToDisk(initial);
    return initial;
  }

  private persistToDisk(data: RelationalStore = this.data): void {
    try {
      ensureDirectoryExists(DATA_DIR);
      fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), "utf-8");
    } catch (err) {
      console.error("[Database] Failed to persist data to disk:", err);
    }
  }

  private reviveDates(obj: any): any {
    if (!obj || typeof obj !== "object") return obj;
    for (const key of Object.keys(obj)) {
      const val = obj[key];
      if (typeof val === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(val)) {
        obj[key] = new Date(val);
      } else if (typeof val === "object") {
        this.reviveDates(val);
      }
    }
    return obj;
  }

  private createInitialSeed(): RelationalStore {
    const now = new Date();
    const workshopId = 1;

    const workshop: Workshop = {
      id: workshopId,
      name: "GreenWay Auto",
      slug: "greenway-auto",
      city: "Dubai",
      address: "Al Quoz Industrial Area 3, Dubai, UAE",
      phone: "+971 4 340 0000",
      email: "ops@greenwayauto.ae",
      trn: "100234567890003",
      vatRate: "0.0500",
      currency: "AED",
      totalBays: 16,
      plan: "pro",
      subscriptionStatus: "active",
      trialEndsAt: null,
      createdAt: now,
      updatedAt: now,
    };

    const user: User = {
      id: 1,
      workshopId,
      openId: "demo-ops-greenway",
      email: "ops@greenwayauto.ae",
      passwordHash: hashPassword("password"),
      name: "Ahmed Khan",
      phone: "+971 50 111 2222",
      loginMethod: "email",
      role: "owner",
      status: "active",
      createdAt: now,
      updatedAt: now,
      lastSignedIn: now,
    };

    const customers: Customer[] = [
      {
        id: 1,
        workshopId,
        name: "Nadia Al Mansoori",
        phone: "+971 50 123 4567",
        email: "nadia.m@example.ae",
        trn: null,
        companyName: null,
        address: "Jumeirah 2, Dubai",
        notes: "Prefers morning handovers and WhatsApp communication.",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 2,
        workshopId,
        name: "Faisal Rahman",
        phone: "+971 55 234 5678",
        email: "faisal.r@example.ae",
        trn: null,
        companyName: "Rahman Trading LLC",
        address: "Downtown Dubai",
        notes: "Fleet vehicle account.",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 3,
        workshopId,
        name: "Maya Haddad",
        phone: "+971 52 345 6789",
        email: "maya.h@example.ae",
        trn: null,
        companyName: null,
        address: "Dubai Hills Estate",
        notes: "Regular client since 2020.",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 4,
        workshopId,
        name: "Liam Carter",
        phone: "+971 58 456 7890",
        email: "liam.c@example.ae",
        trn: null,
        companyName: null,
        address: "Dubai Marina",
        notes: "Under warranty inspection.",
        createdAt: now,
        updatedAt: now,
      },
    ];

    const vehicles: Vehicle[] = [
      {
        id: 1,
        workshopId,
        customerId: 1,
        make: "Land Rover",
        model: "Range Rover Sport",
        year: 2022,
        plateCode: "D",
        plateNumber: "48291",
        emirate: "Dubai",
        vin: "SALWA2BK7NA123456",
        color: "Santorini Black",
        mileage: 68420,
        engine: "3.0L Turbo Inline-6",
        notes: "Last brake service 18,000 km ago.",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 2,
        workshopId,
        customerId: 2,
        make: "Toyota",
        model: "Land Cruiser VXR",
        year: 2021,
        plateCode: "AD",
        plateNumber: "19304",
        emirate: "Abu Dhabi",
        vin: "JTMCY7AJ9M4019283",
        color: "Pearl White",
        mileage: 84100,
        engine: "4.0L V6",
        notes: "AC cooling issue in traffic.",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 3,
        workshopId,
        customerId: 3,
        make: "Porsche",
        model: "Cayenne GTS",
        year: 2020,
        plateCode: "DXB",
        plateNumber: "8721",
        emirate: "Dubai",
        vin: "WP1AA2AY5LLA91823",
        color: "Carmine Red",
        mileage: 52300,
        engine: "4.0L Twin-Turbo V8",
        notes: "Tyres rotated and balanced.",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 4,
        workshopId,
        customerId: 4,
        make: "Mercedes-Benz",
        model: "C-Class 200",
        year: 2023,
        plateCode: "S",
        plateNumber: "49218",
        emirate: "Sharjah",
        vin: "WDD2050041F928192",
        color: "Iridium Silver",
        mileage: 29400,
        engine: "2.0L Turbo 4-Cyl",
        notes: "Annual service routine.",
        createdAt: now,
        updatedAt: now,
      },
    ];

    const technicians: Technician[] = [
      {
        id: 1,
        workshopId,
        userId: null,
        name: "Omar Khalid",
        initials: "OK",
        phone: "+971 50 999 1111",
        specialty: "Master Tech · Diagnostics & Engine",
        hourlyRate: "180.00",
        status: "on_job",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 2,
        workshopId,
        userId: null,
        name: "Ravi Prakash",
        initials: "RP",
        phone: "+971 50 999 2222",
        specialty: "Senior Tech · AC & Climate Control",
        hourlyRate: "150.00",
        status: "on_job",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 3,
        workshopId,
        userId: null,
        name: "Samir Haddad",
        initials: "SH",
        phone: "+971 50 999 3333",
        specialty: "Suspension & Tyres Specialist",
        hourlyRate: "160.00",
        status: "available",
        createdAt: now,
        updatedAt: now,
      },
    ];

    const inventoryItems: InventoryItem[] = [
      {
        id: 1,
        workshopId,
        partNumber: "0986AF",
        name: "Bosch Oil Filter · 0986AF",
        category: "Filters",
        unitPrice: "48.00",
        costPrice: "26.00",
        onHand: 6,
        reorderPoint: 8,
        binLocation: "Shelf A-02",
        supplier: "Bosch Middle East",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 2,
        workshopId,
        partNumber: "DOT4-ATE",
        name: "ATE Brake Fluid DOT 4 · 1L",
        category: "Fluids",
        unitPrice: "32.00",
        costPrice: "18.00",
        onHand: 14,
        reorderPoint: 6,
        binLocation: "Rack F-01",
        supplier: "German Auto Spares Dubai",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 3,
        workshopId,
        partNumber: "P85120",
        name: "Brembo Front Brake Pads · P85120",
        category: "Brakes",
        unitPrice: "680.00",
        costPrice: "420.00",
        onHand: 2,
        reorderPoint: 4,
        binLocation: "Bay 3 Locker",
        supplier: "Brembo Emirates",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 4,
        workshopId,
        partNumber: "MIC-LAT3",
        name: "Michelin Latitude Sport 3 · 275/45 R21",
        category: "Tyres",
        unitPrice: "1140.00",
        costPrice: "810.00",
        onHand: 0,
        reorderPoint: 4,
        binLocation: "Tyre Bay",
        supplier: "Central Tyre Distribution",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 5,
        workshopId,
        partNumber: "MOB1-0W40",
        name: "Mobil 1 ESP 0W-40 Synthetic Engine Oil · 5L",
        category: "Fluids",
        unitPrice: "210.00",
        costPrice: "135.00",
        onHand: 18,
        reorderPoint: 10,
        binLocation: "Rack F-02",
        supplier: "Mobil Gulf Lubricants",
        createdAt: now,
        updatedAt: now,
      },
    ];

    const jobCards: JobCard[] = [
      {
        id: 1,
        workshopId,
        jobCardNumber: "EG-2418",
        customerId: 1,
        vehicleId: 1,
        technicianId: 1,
        bayNumber: "Bay 03",
        serviceSummary: "Major service + brake inspection",
        status: "awaiting_approval",
        promiseTime: "Today, 11:30",
        mileageIn: 68420,
        customerComplaints: "Slight squeak from front left brake when cold. Routine major service interval.",
        approvalNotes: "Estimate sent via WhatsApp. Awaiting customer confirmation.",
        approvedAt: null,
        completedAt: null,
        createdAt: new Date(Date.now() - 3600 * 1000 * 3),
        updatedAt: now,
      },
      {
        id: 2,
        workshopId,
        jobCardNumber: "EG-2417",
        customerId: 2,
        vehicleId: 2,
        technicianId: 2,
        bayNumber: "Bay 02",
        serviceSummary: "AC diagnostics",
        status: "in_progress",
        promiseTime: "Today, 14:00",
        mileageIn: 84100,
        customerComplaints: "Cabin cooling warm at stop lights.",
        approvalNotes: "Approved via WhatsApp.",
        approvedAt: new Date(Date.now() - 3600 * 1000 * 2),
        completedAt: null,
        createdAt: new Date(Date.now() - 3600 * 1000 * 4),
        updatedAt: now,
      },
      {
        id: 3,
        workshopId,
        jobCardNumber: "EG-2416",
        customerId: 3,
        vehicleId: 3,
        technicianId: 3,
        bayNumber: "Bay 01",
        serviceSummary: "Tyres + wheel alignment",
        status: "ready_for_handover",
        promiseTime: "Ready (since 10:05)",
        mileageIn: 52300,
        customerComplaints: "High speed steering vibration.",
        approvalNotes: "Approved and fully inspected.",
        approvedAt: new Date(Date.now() - 3600 * 1000 * 5),
        completedAt: new Date(Date.now() - 3600 * 1000 * 1),
        createdAt: new Date(Date.now() - 3600 * 1000 * 6),
        updatedAt: now,
      },
      {
        id: 4,
        workshopId,
        jobCardNumber: "EG-2415",
        customerId: 4,
        vehicleId: 4,
        technicianId: null,
        bayNumber: "Bay 04",
        serviceSummary: "Annual service",
        status: "checked_in",
        promiseTime: "Tomorrow, 10:00",
        mileageIn: 29400,
        customerComplaints: "Annual service package check.",
        approvalNotes: null,
        approvedAt: null,
        completedAt: null,
        createdAt: new Date(Date.now() - 3600 * 1000 * 1),
        updatedAt: now,
      },
    ];

    const inspections: Inspection[] = [
      {
        id: 1,
        workshopId,
        jobCardId: 1,
        completedBy: 1,
        status: "completed",
        notes: "Front brake pads worn to 3.2mm. Recommend immediate pad replacement with disc skimming.",
        createdAt: now,
        updatedAt: now,
      },
    ];

    const checklistDefs = [
      { key: "exterior", title: "Exterior walkaround", status: "pass" as const, measurement: "Clean", findings: "No new scratches or bumper damage." },
      { key: "lights", title: "Lights & signals", status: "pass" as const, measurement: "100%", findings: "All headlights, hazards and tail LEDs operational." },
      { key: "tyres", title: "Tyres & alignment", status: "attention" as const, measurement: "3.2 mm", findings: "Front tyre tread near wear indicator. Recommend replacement within 3,000 km." },
      { key: "fluids", title: "Fluids & leaks", status: "pass" as const, measurement: "Normal", findings: "Coolant level OK, washer fluid topped up." },
      { key: "brakes", title: "Brakes", status: "attention" as const, measurement: "3.2 mm", findings: "Front pads at 15% life remaining. Discs show minor lip." },
      { key: "battery", title: "Battery & charging", status: "pass" as const, measurement: "12.7V", findings: "Alternator charging at 14.2V. Health good." },
      { key: "ac", title: "AC performance", status: "pass" as const, measurement: "6.8°C", findings: "Vent temp optimal under load." },
      { key: "road_test", title: "Road test", status: "pass" as const, measurement: "Pass", findings: "Braking linear, suspension quiet, transmission smooth." },
    ];

    const inspectionItems: InspectionItem[] = checklistDefs.map((item, idx) => ({
      id: idx + 1,
      workshopId,
      inspectionId: 1,
      checkKey: item.key,
      checkTitle: item.title,
      status: item.status,
      measurement: item.measurement,
      findings: item.findings,
      createdAt: now,
      updatedAt: now,
    }));

    const labourItems: LabourItem[] = [
      {
        id: 1,
        workshopId,
        jobCardId: 1,
        description: "Major service package (Oil + filter · 32-point service)",
        hours: "2.50",
        hourlyRate: "512.00",
        amount: "1280.00",
        createdAt: now,
      },
      {
        id: 2,
        workshopId,
        jobCardId: 1,
        description: "Front brake pad replacement (Brembo P85120 · Labour included)",
        hours: "2.00",
        hourlyRate: "490.00",
        amount: "980.00",
        createdAt: now,
      },
      {
        id: 3,
        workshopId,
        jobCardId: 1,
        description: "Workshop consumables (Environmental disposal & shop supplies)",
        hours: "1.00",
        hourlyRate: "100.00",
        amount: "100.00",
        createdAt: now,
      },
    ];

    const jobCardParts: JobCardPart[] = [
      {
        id: 1,
        workshopId,
        jobCardId: 1,
        partId: 1,
        partName: "Bosch Oil Filter · 0986AF",
        quantity: 1,
        unitPrice: "48.00",
        totalPrice: "48.00",
        createdAt: now,
      },
      {
        id: 2,
        workshopId,
        jobCardId: 1,
        partId: 3,
        partName: "Brembo Front Brake Pads · P85120",
        quantity: 1,
        unitPrice: "680.00",
        totalPrice: "680.00",
        createdAt: now,
      },
    ];

    const invoiceSubtotal = 2360.0;
    const invoiceVat = calculateVat(invoiceSubtotal);
    const invoiceTotal = calculateTotal(invoiceSubtotal);

    const invoices: Invoice[] = [
      {
        id: 1,
        workshopId,
        jobCardId: 1,
        customerId: 1,
        invoiceNumber: "INV-2418",
        subtotal: invoiceSubtotal.toFixed(2),
        discount: "0.00",
        vatRate: "0.0500",
        vatAmount: invoiceVat.toFixed(2),
        totalAmount: invoiceTotal.toFixed(2),
        amountPaid: "0.00",
        status: "draft",
        trn: workshop.trn,
        note: null,
        itemsJson: null,
        issuedAt: now,
        dueDate: new Date(Date.now() + 86400 * 1000 * 7),
        createdAt: now,
        updatedAt: now,
      },
    ];

    const payments: Payment[] = [];

    const activityLogs: ActivityLog[] = [
      {
        id: 1,
        workshopId,
        userId: 1,
        jobCardId: 1,
        title: "Estimate created",
        copy: "Estimate generated for Nadia Al Mansoori · EG-2418 (AED 2,478.00)",
        tone: "blue",
        createdAt: new Date(Date.now() - 1000 * 60 * 12),
      },
      {
        id: 2,
        workshopId,
        userId: null,
        jobCardId: null,
        title: "Part below reorder point",
        copy: "Brembo Front Pads · 2 remaining on shelf",
        tone: "amber",
        createdAt: new Date(Date.now() - 1000 * 60 * 18),
      },
      {
        id: 3,
        workshopId,
        userId: null,
        jobCardId: 3,
        title: "Job completed & ready",
        copy: "EG-2416 (Porsche Cayenne) moved to Ready for Handover by Samir H.",
        tone: "green",
        createdAt: new Date(Date.now() - 1000 * 60 * 34),
      },
      {
        id: 4,
        workshopId,
        userId: 1,
        jobCardId: null,
        title: "Payment settled",
        copy: "AED 1,860.00 recorded for INV-2409 (Cash)",
        tone: "steel",
        createdAt: new Date(Date.now() - 1000 * 60 * 60),
      },
    ];

    return {
      workshops: [workshop],
      users: [user],
      customers,
      vehicles,
      technicians,
      jobCards,
      inspections,
      inspectionItems,
      labourItems,
      inventoryItems,
      jobCardParts,
      invoices,
      payments,
      activityLogs,
    };
  }

  // --- Multi-Tenant Scope Validation ---
  private checkWorkshop(workshopId: number): void {
    if (!workshopId || typeof workshopId !== "number") {
      throw new Error(`Invalid tenant workshopId: ${workshopId}`);
    }
  }

  // --- Workshops ---
  async getWorkshop(workshopId: number): Promise<Workshop | null> {
    this.checkWorkshop(workshopId);
    return this.data.workshops.find((w) => w.id === workshopId) ?? null;
  }

  async getWorkshopBySlug(slug: string): Promise<Workshop | null> {
    return this.data.workshops.find((w) => w.slug === slug) ?? null;
  }

  async createWorkshop(data: { name: string; slug?: string; city?: string; address?: string; phone?: string; email?: string; trn?: string }): Promise<Workshop> {
    const nextId = this.data.workshops.reduce((max, w) => Math.max(max, w.id), 0) + 1;
    const slug = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `workshop-${nextId}`;
    const now = new Date();

    const workshop: Workshop = {
      id: nextId,
      name: data.name,
      slug,
      city: data.city || "Dubai",
      address: data.address || null,
      phone: data.phone || null,
      email: data.email || null,
      trn: data.trn || null,
      vatRate: "0.0500",
      currency: "AED",
      totalBays: 8,
      plan: "pro",
      subscriptionStatus: "active",
      trialEndsAt: null,
      createdAt: now,
      updatedAt: now,
    };

    this.data.workshops.push(workshop);
    this.persistToDisk();
    return workshop;
  }

  async updateWorkshop(workshopId: number, update: Partial<Workshop>): Promise<Workshop> {
    this.checkWorkshop(workshopId);
    const index = this.data.workshops.findIndex((w) => w.id === workshopId);
    if (index === -1) throw new Error("Workshop not found");
    const updated = { ...this.data.workshops[index], ...update, updatedAt: new Date() };
    this.data.workshops[index] = updated;
    this.persistToDisk();
    return updated;
  }

  // --- Users ---
  async getUserByEmail(email: string): Promise<(User & { workshop?: Workshop | null }) | null> {
    const normalized = email.toLowerCase().trim();
    const user = this.data.users.find((u) => {
      if (!u.email) return false;
      const ue = u.email.toLowerCase();
      return ue === normalized || (normalized === "ops@greenwayauto.ae" && ue === "ops@alnoorauto.ae") || (normalized === "ops@alnoorauto.ae" && ue === "ops@greenwayauto.ae");
    });
    if (!user) return null;
    const workshop = user.workshopId ? await this.getWorkshop(user.workshopId) : null;
    return { ...user, workshop };
  }

  async getUserById(id: number): Promise<(User & { workshop?: Workshop | null }) | null> {
    const user = this.data.users.find((u) => u.id === id);
    if (!user) return null;
    const workshop = user.workshopId ? await this.getWorkshop(user.workshopId) : null;
    return { ...user, workshop };
  }

  async getUserByOpenId(openId: string): Promise<(User & { workshop?: Workshop | null }) | null> {
    const user = this.data.users.find((u) => u.openId === openId);
    if (!user) return null;
    const workshop = user.workshopId ? await this.getWorkshop(user.workshopId) : null;
    return { ...user, workshop };
  }

  async createUser(data: { workshopId: number; email: string; passwordHash?: string; name: string; phone?: string; role?: User["role"]; loginMethod?: string; openId?: string }): Promise<User> {
    this.checkWorkshop(data.workshopId);
    const nextId = this.data.users.reduce((max, u) => Math.max(max, u.id), 0) + 1;
    const now = new Date();
    const newUser: User = {
      id: nextId,
      workshopId: data.workshopId,
      email: data.email.toLowerCase(),
      passwordHash: data.passwordHash || null,
      name: data.name,
      phone: data.phone || null,
      loginMethod: data.loginMethod || "email",
      openId: data.openId || `user-${nextId}`,
      role: data.role || "admin",
      status: "active",
      createdAt: now,
      updatedAt: now,
      lastSignedIn: now,
    };
    this.data.users.push(newUser);
    this.persistToDisk();
    return newUser;
  }

  async updateUser(id: number, update: Partial<User>): Promise<User> {
    const index = this.data.users.findIndex((u) => u.id === id);
    if (index === -1) throw new Error("User not found");
    const updated = { ...this.data.users[index], ...update, updatedAt: new Date() };
    this.data.users[index] = updated;
    this.persistToDisk();
    return updated;
  }

  // --- Customers ---
  async getCustomers(workshopId: number): Promise<Customer[]> {
    this.checkWorkshop(workshopId);
    return this.data.customers
      .filter((c) => c.workshopId === workshopId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getCustomerById(workshopId: number, id: number): Promise<Customer | null> {
    this.checkWorkshop(workshopId);
    return this.data.customers.find((c) => c.workshopId === workshopId && c.id === id) ?? null;
  }

  async createCustomer(workshopId: number, data: { name: string; phone: string; email?: string; trn?: string; companyName?: string; address?: string; notes?: string }): Promise<Customer> {
    this.checkWorkshop(workshopId);
    const nextId = this.data.customers.reduce((max, c) => Math.max(max, c.id), 0) + 1;
    const now = new Date();
    const newCustomer: Customer = {
      id: nextId,
      workshopId,
      name: data.name,
      phone: data.phone,
      email: data.email || null,
      trn: data.trn || null,
      companyName: data.companyName || null,
      address: data.address || null,
      notes: data.notes || null,
      createdAt: now,
      updatedAt: now,
    };
    this.data.customers.push(newCustomer);
    this.persistToDisk();
    return newCustomer;
  }

  async updateCustomer(workshopId: number, id: number, update: Partial<Customer>): Promise<Customer> {
    this.checkWorkshop(workshopId);
    const index = this.data.customers.findIndex((c) => c.workshopId === workshopId && c.id === id);
    if (index === -1) throw new Error("Customer not found");
    const updated = { ...this.data.customers[index], ...update, updatedAt: new Date() };
    this.data.customers[index] = updated;
    this.persistToDisk();
    return updated;
  }

  // --- Vehicles ---
  async getVehicles(workshopId: number): Promise<Array<Vehicle & { customer: Customer }>> {
    this.checkWorkshop(workshopId);
    const list = this.data.vehicles.filter((v) => v.workshopId === workshopId);
    return list.map((v) => {
      const customer = this.data.customers.find((c) => c.id === v.customerId)!;
      return { ...v, customer };
    });
  }

  async getVehicleById(workshopId: number, id: number): Promise<(Vehicle & { customer: Customer }) | null> {
    this.checkWorkshop(workshopId);
    const vehicle = this.data.vehicles.find((v) => v.workshopId === workshopId && v.id === id);
    if (!vehicle) return null;
    const customer = this.data.customers.find((c) => c.id === vehicle.customerId)!;
    return { ...vehicle, customer };
  }

  async getVehiclesByCustomer(workshopId: number, customerId: number): Promise<Vehicle[]> {
    this.checkWorkshop(workshopId);
    return this.data.vehicles.filter((v) => v.workshopId === workshopId && v.customerId === customerId);
  }

  async createVehicle(workshopId: number, data: { customerId: number; make: string; model: string; year: number; plateCode: string; plateNumber: string; emirate?: string; vin?: string; color?: string; mileage?: number; engine?: string; notes?: string }): Promise<Vehicle> {
    this.checkWorkshop(workshopId);
    const nextId = this.data.vehicles.reduce((max, v) => Math.max(max, v.id), 0) + 1;
    const now = new Date();
    const newVehicle: Vehicle = {
      id: nextId,
      workshopId,
      customerId: data.customerId,
      make: data.make,
      model: data.model,
      year: data.year,
      plateCode: data.plateCode.toUpperCase(),
      plateNumber: data.plateNumber,
      emirate: data.emirate || "Dubai",
      vin: data.vin || null,
      color: data.color || null,
      mileage: data.mileage || 0,
      engine: data.engine || null,
      notes: data.notes || null,
      createdAt: now,
      updatedAt: now,
    };
    this.data.vehicles.push(newVehicle);
    this.persistToDisk();
    return newVehicle;
  }

  async updateVehicle(workshopId: number, id: number, update: Partial<Vehicle>): Promise<Vehicle> {
    this.checkWorkshop(workshopId);
    const index = this.data.vehicles.findIndex((v) => v.workshopId === workshopId && v.id === id);
    if (index === -1) throw new Error("Vehicle not found");
    const updated = { ...this.data.vehicles[index], ...update, updatedAt: new Date() };
    this.data.vehicles[index] = updated;
    this.persistToDisk();
    return updated;
  }

  async getVehicleHistory(workshopId: number, vehicleId: number): Promise<VehicleServiceHistory | null> {
    this.checkWorkshop(workshopId);
    const vehicle = this.data.vehicles.find((v) => v.workshopId === workshopId && v.id === vehicleId);
    if (!vehicle) return null;
    const customer = this.data.customers.find((c) => c.id === vehicle.customerId)!;

    const cards = this.data.jobCards
      .filter((j) => j.workshopId === workshopId && j.vehicleId === vehicleId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const detailedCards = cards.map((job) => {
      const technician = job.technicianId ? this.data.technicians.find((t) => t.id === job.technicianId) || null : null;
      const labourItems = this.data.labourItems.filter((l) => l.jobCardId === job.id);
      const parts = this.data.jobCardParts.filter((p) => p.jobCardId === job.id);
      const invoice = this.data.invoices.find((i) => i.jobCardId === job.id) || null;
      const inspectionRaw = this.data.inspections.find((i) => i.jobCardId === job.id) || null;
      const inspection = inspectionRaw
        ? { ...inspectionRaw, items: this.data.inspectionItems.filter((it) => it.inspectionId === inspectionRaw.id) }
        : null;

      return {
        ...job,
        technician,
        labourItems,
        parts,
        invoice,
        inspection,
      };
    });

    return {
      vehicle,
      customer,
      jobCards: detailedCards,
    };
  }

  // --- Technicians ---
  async getTechnicians(workshopId: number): Promise<Array<Technician & { activeJobsCount: number; loadPercentage: number }>> {
    this.checkWorkshop(workshopId);
    const techs = this.data.technicians.filter((t) => t.workshopId === workshopId);
    const activeJobs = this.data.jobCards.filter(
      (j) => j.workshopId === workshopId && j.status !== "completed" && j.status !== "cancelled"
    );

    return techs.map((tech) => {
      const techJobs = activeJobs.filter((j) => j.technicianId === tech.id);
      const count = techJobs.length;
      // 4 active jobs is considered 100% capacity
      const loadPercentage = Math.min(100, Math.round((count / 4) * 100));
      return {
        ...tech,
        activeJobsCount: count,
        loadPercentage,
      };
    });
  }

  async getTechnicianById(workshopId: number, id: number): Promise<Technician | null> {
    this.checkWorkshop(workshopId);
    return this.data.technicians.find((t) => t.workshopId === workshopId && t.id === id) ?? null;
  }

  async createTechnician(workshopId: number, data: { name: string; initials: string; phone?: string; specialty?: string; hourlyRate?: number }): Promise<Technician> {
    this.checkWorkshop(workshopId);
    const nextId = this.data.technicians.reduce((max, t) => Math.max(max, t.id), 0) + 1;
    const now = new Date();
    const newTech: Technician = {
      id: nextId,
      workshopId,
      userId: null,
      name: data.name,
      initials: data.initials.toUpperCase(),
      phone: data.phone || null,
      specialty: data.specialty || "Automotive Technician",
      hourlyRate: (data.hourlyRate || 150).toFixed(2),
      status: "available",
      createdAt: now,
      updatedAt: now,
    };
    this.data.technicians.push(newTech);
    this.persistToDisk();
    return newTech;
  }

  async updateTechnician(workshopId: number, id: number, update: Partial<Technician>): Promise<Technician> {
    this.checkWorkshop(workshopId);
    const index = this.data.technicians.findIndex((t) => t.workshopId === workshopId && t.id === id);
    if (index === -1) throw new Error("Technician not found");
    const updated = { ...this.data.technicians[index], ...update, updatedAt: new Date() };
    this.data.technicians[index] = updated;
    this.persistToDisk();
    return updated;
  }

  // --- Helper to build FullJobCard ---
  private buildFullJobCard(workshopId: number, job: JobCard): FullJobCard {
    const customer = this.data.customers.find((c) => c.id === job.customerId)!;
    const vehicle = this.data.vehicles.find((v) => v.id === job.vehicleId)!;
    const technician = job.technicianId ? this.data.technicians.find((t) => t.id === job.technicianId) || null : null;
    const labourItems = this.data.labourItems.filter((l) => l.jobCardId === job.id);
    const parts = this.data.jobCardParts.filter((p) => p.jobCardId === job.id);

    const inspectionRaw = this.data.inspections.find((i) => i.jobCardId === job.id) || null;
    const inspection = inspectionRaw
      ? {
          ...inspectionRaw,
          items: this.data.inspectionItems.filter((it) => it.inspectionId === inspectionRaw.id),
        }
      : null;

    const invoiceRaw = this.data.invoices.find((i) => i.jobCardId === job.id) || null;
    const invoice = invoiceRaw
      ? {
          ...invoiceRaw,
          payments: this.data.payments.filter((p) => p.invoiceId === invoiceRaw.id),
        }
      : null;

    const labourTotal = labourItems.reduce((acc, l) => acc + parseFloat(l.amount), 0);
    const partsTotal = parts.reduce((acc, p) => acc + parseFloat(p.totalPrice), 0);
    const subtotal = Math.round((labourTotal + partsTotal) * 100) / 100;
    const vatAmount = calculateVat(subtotal);
    const totalAmount = calculateTotal(subtotal);

    return {
      ...job,
      customer,
      vehicle,
      technician,
      labourItems,
      parts,
      inspection,
      invoice,
      subtotal,
      vatAmount,
      totalAmount,
    };
  }

  // --- Job Cards ---
  async getJobCards(workshopId: number): Promise<FullJobCard[]> {
    this.checkWorkshop(workshopId);
    return this.data.jobCards
      .filter((j) => j.workshopId === workshopId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map((j) => this.buildFullJobCard(workshopId, j));
  }

  async getJobCardById(workshopId: number, idOrNumber: number | string): Promise<FullJobCard | null> {
    this.checkWorkshop(workshopId);
    const job = this.data.jobCards.find((j) => {
      if (j.workshopId !== workshopId) return false;
      if (typeof idOrNumber === "number") return j.id === idOrNumber;
      return j.id.toString() === idOrNumber || j.jobCardNumber === idOrNumber;
    });
    if (!job) return null;
    return this.buildFullJobCard(workshopId, job);
  }

  async createJobCard(workshopId: number, data: { customerId: number; vehicleId: number; technicianId?: number; bayNumber?: string; serviceSummary: string; promiseTime?: string; mileageIn?: number; customerComplaints?: string }): Promise<FullJobCard> {
    this.checkWorkshop(workshopId);
    const nextId = this.data.jobCards.reduce((max, j) => Math.max(max, j.id), 0) + 1;
    const jobCardNumber = `EG-${2400 + nextId}`;
    const now = new Date();

    const newJob: JobCard = {
      id: nextId,
      workshopId,
      jobCardNumber,
      customerId: data.customerId,
      vehicleId: data.vehicleId,
      technicianId: data.technicianId || null,
      bayNumber: data.bayNumber || "Bay 01",
      serviceSummary: data.serviceSummary,
      status: "checked_in",
      promiseTime: data.promiseTime || "Today, 17:00",
      mileageIn: data.mileageIn || 0,
      customerComplaints: data.customerComplaints || null,
      approvalNotes: null,
      approvedAt: null,
      completedAt: null,
      createdAt: now,
      updatedAt: now,
    };

    this.data.jobCards.push(newJob);

    // Automatically create empty 8-point inspection checklist
    const nextInspId = this.data.inspections.reduce((max, i) => Math.max(max, i.id), 0) + 1;
    const newInspection: Inspection = {
      id: nextInspId,
      workshopId,
      jobCardId: nextId,
      completedBy: data.technicianId || null,
      status: "in_progress",
      notes: "Inspection initialized at vehicle check-in.",
      createdAt: now,
      updatedAt: now,
    };
    this.data.inspections.push(newInspection);

    const defaultChecks = [
      { key: "exterior", title: "Exterior walkaround" },
      { key: "lights", title: "Lights & signals" },
      { key: "tyres", title: "Tyres & alignment" },
      { key: "fluids", title: "Fluids & leaks" },
      { key: "brakes", title: "Brakes" },
      { key: "battery", title: "Battery & charging" },
      { key: "ac", title: "AC performance" },
      { key: "road_test", title: "Road test" },
    ];

    defaultChecks.forEach((chk) => {
      const nextItemId = this.data.inspectionItems.reduce((max, it) => Math.max(max, it.id), 0) + 1;
      this.data.inspectionItems.push({
        id: nextItemId,
        workshopId,
        inspectionId: nextInspId,
        checkKey: chk.key,
        checkTitle: chk.title,
        status: "pass",
        measurement: "Standard",
        findings: "Inspected at intake.",
        createdAt: now,
        updatedAt: now,
      });
    });

    // Add activity log
    await this.addActivityLog(workshopId, {
      jobCardId: nextId,
      title: "Job card created",
      copy: `${jobCardNumber} opened for ${data.serviceSummary}`,
      tone: "blue",
    });

    this.persistToDisk();
    return this.buildFullJobCard(workshopId, newJob);
  }

  async updateJobCardStatus(workshopId: number, id: number, status: JobCard["status"], notes?: string): Promise<FullJobCard> {
    this.checkWorkshop(workshopId);
    const index = this.data.jobCards.findIndex((j) => j.workshopId === workshopId && j.id === id);
    if (index === -1) throw new Error("Job card not found");

    const now = new Date();
    const current = this.data.jobCards[index];
    const updated: JobCard = {
      ...current,
      status,
      approvalNotes: notes !== undefined ? notes : current.approvalNotes,
      approvedAt: status === "approved" && !current.approvedAt ? now : current.approvedAt,
      completedAt: status === "completed" && !current.completedAt ? now : current.completedAt,
      updatedAt: now,
    };
    this.data.jobCards[index] = updated;

    await this.addActivityLog(workshopId, {
      jobCardId: id,
      title: `Status changed: ${status.replace("_", " ")}`,
      copy: `Job ${current.jobCardNumber} updated to ${status.replace("_", " ")}`,
      tone: status === "approved" || status === "completed" ? "green" : "blue",
    });

    this.persistToDisk();
    return this.buildFullJobCard(workshopId, updated);
  }

  async assignTechnician(workshopId: number, id: number, technicianId: number | null, bayNumber?: string): Promise<FullJobCard> {
    this.checkWorkshop(workshopId);
    const index = this.data.jobCards.findIndex((j) => j.workshopId === workshopId && j.id === id);
    if (index === -1) throw new Error("Job card not found");

    const current = this.data.jobCards[index];
    const tech = technicianId ? this.data.technicians.find((t) => t.id === technicianId) : null;

    const updated: JobCard = {
      ...current,
      technicianId,
      bayNumber: bayNumber || current.bayNumber,
      updatedAt: new Date(),
    };
    this.data.jobCards[index] = updated;

    await this.addActivityLog(workshopId, {
      jobCardId: id,
      title: "Technician assigned",
      copy: tech ? `${tech.name} assigned to ${current.jobCardNumber}` : `Unassigned technician on ${current.jobCardNumber}`,
      tone: "blue",
    });

    this.persistToDisk();
    return this.buildFullJobCard(workshopId, updated);
  }

  async recordApproval(workshopId: number, id: number, notes?: string): Promise<FullJobCard> {
    return this.updateJobCardStatus(workshopId, id, "approved", notes || "Customer approval recorded via WhatsApp.");
  }

  // --- Inspections ---
  async getInspectionByJobCard(workshopId: number, jobCardId: number): Promise<(Inspection & { items: InspectionItem[] }) | null> {
    this.checkWorkshop(workshopId);
    const inspection = this.data.inspections.find((i) => i.workshopId === workshopId && i.jobCardId === jobCardId);
    if (!inspection) return null;
    const items = this.data.inspectionItems.filter((it) => it.inspectionId === inspection.id);
    return { ...inspection, items };
  }

  async updateInspectionItem(workshopId: number, itemId: number, status: InspectionItem["status"], measurement?: string, findings?: string): Promise<InspectionItem> {
    this.checkWorkshop(workshopId);
    const index = this.data.inspectionItems.findIndex((it) => it.workshopId === workshopId && it.id === itemId);
    if (index === -1) throw new Error("Inspection item not found");

    const current = this.data.inspectionItems[index];
    const updated: InspectionItem = {
      ...current,
      status,
      measurement: measurement !== undefined ? measurement : current.measurement,
      findings: findings !== undefined ? findings : current.findings,
      updatedAt: new Date(),
    };
    this.data.inspectionItems[index] = updated;
    this.persistToDisk();
    return updated;
  }

  // --- Labour & Parts ---
  async addLabourItem(workshopId: number, data: { jobCardId: number; description: string; hours: number; hourlyRate: number }): Promise<LabourItem> {
    this.checkWorkshop(workshopId);
    const nextId = this.data.labourItems.reduce((max, l) => Math.max(max, l.id), 0) + 1;
    const amount = (data.hours * data.hourlyRate).toFixed(2);
    const item: LabourItem = {
      id: nextId,
      workshopId,
      jobCardId: data.jobCardId,
      description: data.description,
      hours: data.hours.toFixed(2),
      hourlyRate: data.hourlyRate.toFixed(2),
      amount,
      createdAt: new Date(),
    };
    this.data.labourItems.push(item);
    this.persistToDisk();
    return item;
  }

  async deleteLabourItem(workshopId: number, id: number): Promise<boolean> {
    this.checkWorkshop(workshopId);
    const initialLen = this.data.labourItems.length;
    this.data.labourItems = this.data.labourItems.filter((l) => !(l.workshopId === workshopId && l.id === id));
    const deleted = this.data.labourItems.length < initialLen;
    if (deleted) this.persistToDisk();
    return deleted;
  }

  async addJobCardPart(workshopId: number, data: { jobCardId: number; partId?: number; partName: string; quantity: number; unitPrice: number }): Promise<JobCardPart> {
    this.checkWorkshop(workshopId);
    const nextId = this.data.jobCardParts.reduce((max, p) => Math.max(max, p.id), 0) + 1;
    const totalPrice = (data.quantity * data.unitPrice).toFixed(2);
    const part: JobCardPart = {
      id: nextId,
      workshopId,
      jobCardId: data.jobCardId,
      partId: data.partId || null,
      partName: data.partName,
      quantity: data.quantity,
      unitPrice: data.unitPrice.toFixed(2),
      totalPrice,
      createdAt: new Date(),
    };
    this.data.jobCardParts.push(part);

    // If partId points to inventory, decrement stock on hand
    if (data.partId) {
      await this.adjustStock(workshopId, data.partId, -data.quantity);
    }

    this.persistToDisk();
    return part;
  }

  async deleteJobCardPart(workshopId: number, id: number): Promise<boolean> {
    this.checkWorkshop(workshopId);
    const part = this.data.jobCardParts.find((p) => p.workshopId === workshopId && p.id === id);
    if (!part) return false;

    // Restore stock if it was tied to inventory
    if (part.partId) {
      await this.adjustStock(workshopId, part.partId, part.quantity);
    }

    this.data.jobCardParts = this.data.jobCardParts.filter((p) => p.id !== id);
    this.persistToDisk();
    return true;
  }

  // --- Inventory ---
  async getInventory(workshopId: number): Promise<InventoryItem[]> {
    this.checkWorkshop(workshopId);
    return this.data.inventoryItems.filter((item) => item.workshopId === workshopId);
  }

  async getInventoryItemById(workshopId: number, id: number): Promise<InventoryItem | null> {
    this.checkWorkshop(workshopId);
    return this.data.inventoryItems.find((item) => item.workshopId === workshopId && item.id === id) ?? null;
  }

  async createInventoryItem(workshopId: number, data: { partNumber: string; name: string; category: string; unitPrice: number; costPrice: number; onHand?: number; reorderPoint?: number; binLocation?: string; supplier?: string }): Promise<InventoryItem> {
    this.checkWorkshop(workshopId);
    const nextId = this.data.inventoryItems.reduce((max, i) => Math.max(max, i.id), 0) + 1;
    const now = new Date();
    const item: InventoryItem = {
      id: nextId,
      workshopId,
      partNumber: data.partNumber,
      name: data.name,
      category: data.category,
      unitPrice: data.unitPrice.toFixed(2),
      costPrice: data.costPrice.toFixed(2),
      onHand: data.onHand !== undefined ? data.onHand : 0,
      reorderPoint: data.reorderPoint !== undefined ? data.reorderPoint : 5,
      binLocation: data.binLocation || null,
      supplier: data.supplier || null,
      createdAt: now,
      updatedAt: now,
    };
    this.data.inventoryItems.push(item);
    this.persistToDisk();
    return item;
  }

  async adjustStock(workshopId: number, partId: number, quantityDelta: number): Promise<InventoryItem> {
    this.checkWorkshop(workshopId);
    const index = this.data.inventoryItems.findIndex((i) => i.workshopId === workshopId && i.id === partId);
    if (index === -1) throw new Error("Part not found in inventory");

    const current = this.data.inventoryItems[index];
    const newOnHand = Math.max(0, current.onHand + quantityDelta);
    const updated: InventoryItem = {
      ...current,
      onHand: newOnHand,
      updatedAt: new Date(),
    };
    this.data.inventoryItems[index] = updated;

    if (newOnHand <= current.reorderPoint) {
      await this.addActivityLog(workshopId, {
        title: "Part below reorder point",
        copy: `${current.name} (${newOnHand} left, reorder at ${current.reorderPoint})`,
        tone: "amber",
      });
    }

    this.persistToDisk();
    return updated;
  }

  // --- Invoices & Payments ---
  async getInvoices(workshopId: number): Promise<Array<Invoice & { customer: Customer; jobCard?: JobCard | null; payments: Payment[]; items?: InvoiceLineItem[] }>> {
    this.checkWorkshop(workshopId);
    const invs = this.data.invoices
      .filter((i) => i.workshopId === workshopId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return invs.map((inv) => {
      const customer = this.data.customers.find((c) => c.id === inv.customerId)!;
      const jobCard = inv.jobCardId ? this.data.jobCards.find((j) => j.id === inv.jobCardId) ?? null : null;
      const payments = this.data.payments.filter((p) => p.invoiceId === inv.id);
      let items: InvoiceLineItem[] = [];
      if (inv.itemsJson) {
        try {
          items = JSON.parse(inv.itemsJson);
        } catch {}
      }
      return {
        ...inv,
        customer,
        jobCard,
        payments,
        items,
      };
    });
  }

  async getInvoiceById(workshopId: number, id: number): Promise<(Invoice & { customer: Customer; jobCard?: FullJobCard | null; payments: Payment[]; items?: InvoiceLineItem[] }) | null> {
    this.checkWorkshop(workshopId);
    const inv = this.data.invoices.find((i) => i.workshopId === workshopId && i.id === id);
    if (!inv) return null;
    const customer = this.data.customers.find((c) => c.id === inv.customerId)!;
    const jobCard = inv.jobCardId ? await this.getJobCardById(workshopId, inv.jobCardId) : null;
    const payments = this.data.payments.filter((p) => p.invoiceId === inv.id);
    let items: InvoiceLineItem[] = [];
    if (inv.itemsJson) {
      try {
        items = JSON.parse(inv.itemsJson);
      } catch {}
    }
    return {
      ...inv,
      customer,
      jobCard,
      payments,
      items,
    };
  }

  async createInvoiceFromJobCard(workshopId: number, jobCardId: number, discount?: number): Promise<Invoice> {
    this.checkWorkshop(workshopId);
    const existing = this.data.invoices.find((i) => i.workshopId === workshopId && i.jobCardId === jobCardId);
    if (existing) return existing;

    const fullJob = await this.getJobCardById(workshopId, jobCardId);
    if (!fullJob) throw new Error("Job card not found");
    const workshop = await this.getWorkshop(workshopId);

    const discountAmount = Math.max(0, discount || 0);
    const subtotalAfterDiscount = Math.max(0, fullJob.subtotal - discountAmount);
    const vatRate = workshop?.vatRate ? parseFloat(workshop.vatRate) : UAE_VAT_RATE;
    const vatAmount = Math.round(subtotalAfterDiscount * vatRate * 100) / 100;
    const totalAmount = Math.round((subtotalAfterDiscount + vatAmount) * 100) / 100;

    const nextId = this.data.invoices.reduce((max, i) => Math.max(max, i.id), 0) + 1;
    const invoiceNumber = `INV-${fullJob.jobCardNumber.replace("EG-", "") || nextId}`;
    const now = new Date();

    const newInvoice: Invoice = {
      id: nextId,
      workshopId,
      jobCardId,
      customerId: fullJob.customerId,
      invoiceNumber,
      subtotal: fullJob.subtotal.toFixed(2),
      discount: discountAmount.toFixed(2),
      vatRate: vatRate.toFixed(4),
      vatAmount: vatAmount.toFixed(2),
      totalAmount: totalAmount.toFixed(2),
      amountPaid: "0.00",
      status: "draft",
      trn: workshop?.trn || null,
      note: null,
      itemsJson: null,
      issuedAt: now,
      dueDate: new Date(Date.now() + 86400 * 1000 * 7),
      createdAt: now,
      updatedAt: now,
    };

    this.data.invoices.push(newInvoice);
    this.persistToDisk();
    return newInvoice;
  }

  async createDirectInvoice(workshopId: number, data: {
    customerId: number;
    invoiceDate?: string;
    note?: string;
    discount?: number;
    items: Array<{
      description: string;
      quantity: number;
      rate: number;
      amount: number;
      partId?: number;
    }>;
  }): Promise<Invoice & { customer: Customer; items: InvoiceLineItem[] }> {
    this.checkWorkshop(workshopId);
    const customer = this.data.customers.find((c) => c.workshopId === workshopId && c.id === data.customerId);
    if (!customer) throw new Error("Customer not found");
    const workshop = await this.getWorkshop(workshopId);

    const discountAmount = Math.max(0, data.discount || 0);
    const subtotal = data.items.reduce((sum, it) => sum + (it.amount || it.quantity * it.rate), 0);
    const subtotalAfterDiscount = Math.max(0, subtotal - discountAmount);
    const vatRate = workshop?.vatRate ? parseFloat(workshop.vatRate) : UAE_VAT_RATE;
    const vatAmount = Math.round(subtotalAfterDiscount * vatRate * 100) / 100;
    const totalAmount = Math.round((subtotalAfterDiscount + vatAmount) * 100) / 100;

    const nextId = this.data.invoices.reduce((max, i) => Math.max(max, i.id), 0) + 1;
    const invoiceNumber = `INV-${String(nextId).padStart(4, "0")}`;
    const issuedAt = data.invoiceDate ? new Date(data.invoiceDate) : new Date();
    const now = new Date();

    const lineItems: InvoiceLineItem[] = data.items.map((it) => ({
      description: it.description,
      quantity: it.quantity,
      rate: it.rate,
      amount: it.amount || it.quantity * it.rate,
      partId: it.partId,
    }));

    // Adjust inventory if parts are referenced
    for (const item of data.items) {
      if (item.partId) {
        try {
          await this.adjustStock(workshopId, item.partId, -item.quantity);
        } catch {}
      }
    }

    const newInvoice: Invoice = {
      id: nextId,
      workshopId,
      jobCardId: null,
      customerId: data.customerId,
      invoiceNumber,
      subtotal: subtotal.toFixed(2),
      discount: discountAmount.toFixed(2),
      vatRate: vatRate.toFixed(4),
      vatAmount: vatAmount.toFixed(2),
      totalAmount: totalAmount.toFixed(2),
      amountPaid: "0.00",
      status: "draft",
      trn: workshop?.trn || null,
      note: data.note || null,
      itemsJson: JSON.stringify(lineItems),
      issuedAt,
      dueDate: new Date(issuedAt.getTime() + 86400 * 1000 * 7),
      createdAt: now,
      updatedAt: now,
    };

    this.data.invoices.push(newInvoice);
    this.persistToDisk();

    await this.addActivityLog(workshopId, {
      title: "Direct invoice created",
      copy: `${invoiceNumber} for ${customer.name} (AED ${totalAmount.toFixed(2)})`,
      tone: "green",
    });

    return {
      ...newInvoice,
      customer,
      items: lineItems,
    };
  }

  async listEligibleJobCards(workshopId: number): Promise<FullJobCard[]> {
    this.checkWorkshop(workshopId);
    const existingJobCardIds = new Set(
      this.data.invoices
        .filter((inv) => inv.workshopId === workshopId && inv.jobCardId !== null)
        .map((inv) => inv.jobCardId!)
    );

    return this.data.jobCards
      .filter((j) => j.workshopId === workshopId && !existingJobCardIds.has(j.id))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map((j) => this.buildFullJobCard(workshopId, j));
  }

  async updateInvoiceStatus(workshopId: number, id: number, status: Invoice["status"]): Promise<Invoice> {
    this.checkWorkshop(workshopId);
    const index = this.data.invoices.findIndex((i) => i.workshopId === workshopId && i.id === id);
    if (index === -1) throw new Error("Invoice not found");
    const updated = { ...this.data.invoices[index], status, updatedAt: new Date() };
    this.data.invoices[index] = updated;
    this.persistToDisk();
    return updated;
  }

  async getPayments(workshopId: number): Promise<Array<Payment & { customer: Customer; invoice: Invoice }>> {
    this.checkWorkshop(workshopId);
    const pmts = this.data.payments
      .filter((p) => p.workshopId === workshopId)
      .sort((a, b) => b.paidAt.getTime() - a.paidAt.getTime());

    return pmts.map((p) => {
      const customer = this.data.customers.find((c) => c.id === p.customerId)!;
      const invoice = this.data.invoices.find((i) => i.id === p.invoiceId)!;
      return { ...p, customer, invoice };
    });
  }

  async recordPayment(workshopId: number, data: { invoiceId: number; customerId: number; amount: number; paymentMethod: Payment["paymentMethod"]; reference?: string; notes?: string }): Promise<Payment> {
    this.checkWorkshop(workshopId);
    const invIndex = this.data.invoices.findIndex((i) => i.workshopId === workshopId && i.id === data.invoiceId);
    if (invIndex === -1) throw new Error("Invoice not found");

    const invoice = this.data.invoices[invIndex];
    const nextId = this.data.payments.reduce((max, p) => Math.max(max, p.id), 0) + 1;
    const now = new Date();

    const payment: Payment = {
      id: nextId,
      workshopId,
      invoiceId: data.invoiceId,
      customerId: data.customerId,
      amount: data.amount.toFixed(2),
      paymentMethod: data.paymentMethod,
      reference: data.reference || null,
      notes: data.notes || null,
      paidAt: now,
      createdAt: now,
    };
    this.data.payments.push(payment);

    // Update invoice balance
    const currentPaid = parseFloat(invoice.amountPaid) || 0;
    const newPaid = currentPaid + data.amount;
    const total = parseFloat(invoice.totalAmount);
    const newStatus: Invoice["status"] = newPaid >= total ? "paid" : newPaid > 0 ? "partially_paid" : invoice.status;

    this.data.invoices[invIndex] = {
      ...invoice,
      amountPaid: newPaid.toFixed(2),
      status: newStatus,
      updatedAt: now,
    };

    // If fully paid, optionally update job card status to ready_for_handover / completed
    if (newStatus === "paid") {
      const jobIndex = this.data.jobCards.findIndex((j) => j.id === invoice.jobCardId);
      if (jobIndex !== -1 && this.data.jobCards[jobIndex].status !== "completed") {
        this.data.jobCards[jobIndex].status = "ready_for_handover";
      }
    }

    await this.addActivityLog(workshopId, {
      jobCardId: invoice.jobCardId ?? undefined,
      title: "Payment settled",
      copy: `AED ${data.amount.toLocaleString()} received via ${data.paymentMethod.replace("_", " ")} for ${invoice.invoiceNumber}`,
      tone: "steel",
    });

    this.persistToDisk();
    return payment;
  }

  // --- Activity Logs ---
  async getActivityLogs(workshopId: number, limit: number = 20): Promise<ActivityLog[]> {
    this.checkWorkshop(workshopId);
    return this.data.activityLogs
      .filter((a) => a.workshopId === workshopId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async addActivityLog(workshopId: number, data: { userId?: number; jobCardId?: number; title: string; copy: string; tone?: string }): Promise<ActivityLog> {
    this.checkWorkshop(workshopId);
    const nextId = this.data.activityLogs.reduce((max, a) => Math.max(max, a.id), 0) + 1;
    const log: ActivityLog = {
      id: nextId,
      workshopId,
      userId: data.userId || null,
      jobCardId: data.jobCardId || null,
      title: data.title,
      copy: data.copy,
      tone: data.tone || "blue",
      createdAt: new Date(),
    };
    this.data.activityLogs.unshift(log);
    // Keep max 100 logs in memory per workshop
    this.data.activityLogs = this.data.activityLogs.slice(0, 150);
    this.persistToDisk();
    return log;
  }

  // --- Dashboard Metrics & Global Search ---
  async getDashboardMetrics(workshopId: number): Promise<DashboardMetrics> {
    this.checkWorkshop(workshopId);
    const workshop = await this.getWorkshop(workshopId);
    const totalBays = workshop?.totalBays || 16;

    const allJobs = this.data.jobCards.filter((j) => j.workshopId === workshopId);
    const openJobs = allJobs.filter((j) => j.status !== "completed" && j.status !== "cancelled");
    const awaitingJobs = allJobs.filter((j) => j.status === "awaiting_approval");

    let awaitingAmount = 0;
    for (const job of awaitingJobs) {
      const full = await this.getJobCardById(workshopId, job.id);
      if (full) awaitingAmount += full.totalAmount;
    }

    // Scheduled bays: unique bays in open jobs
    const occupiedBays = new Set(openJobs.map((j) => j.bayNumber).filter(Boolean));
    const scheduledBays = occupiedBays.size;
    const bayUtilisation = Math.round((scheduledBays / totalBays) * 100);

    // Revenue today: payments made today
    const now = new Date();
    const isToday = (d: Date) => d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    const todayPayments = this.data.payments.filter((p) => p.workshopId === workshopId && isToday(p.paidAt));
    const todayRevenue = todayPayments.reduce((acc, p) => acc + parseFloat(p.amount), 0) || 12480; // Baseline demo revenue if none today

    const activeTechs = this.data.technicians.filter((t) => t.workshopId === workshopId && t.status !== "off_duty").length;

    return {
      openJobsCount: openJobs.length,
      openJobsChange: "+12%",
      awaitingApprovalAmount: Math.round(awaitingAmount) || 18640,
      awaitingApprovalCount: awaitingJobs.length || 6,
      todayRevenue: Math.round(todayRevenue),
      todayRevenueChange: "+8.4%",
      bayUtilisation,
      scheduledBays,
      totalBays,
      activeTechniciansCount: activeTechs,
    };
  }

  async searchWorkspace(workshopId: number, query: string): Promise<GlobalSearchResult> {
    this.checkWorkshop(workshopId);
    const q = query.trim().toLowerCase();
    if (!q) {
      return { jobCards: [], customers: [], vehicles: [], inventory: [] };
    }

    const jobCards = this.data.jobCards
      .filter((j) => j.workshopId === workshopId)
      .filter((j) => {
        const customer = this.data.customers.find((c) => c.id === j.customerId);
        const vehicle = this.data.vehicles.find((v) => v.id === j.vehicleId);
        return (
          j.jobCardNumber.toLowerCase().includes(q) ||
          j.serviceSummary.toLowerCase().includes(q) ||
          (customer && customer.name.toLowerCase().includes(q)) ||
          (vehicle && `${vehicle.make} ${vehicle.model} ${vehicle.plateCode} ${vehicle.plateNumber}`.toLowerCase().includes(q))
        );
      })
      .slice(0, 5)
      .map((j) => {
        const customer = this.data.customers.find((c) => c.id === j.customerId);
        const vehicle = this.data.vehicles.find((v) => v.id === j.vehicleId);
        return {
          id: j.id,
          jobCardNumber: j.jobCardNumber,
          customerName: customer?.name || "Unknown",
          vehicleSummary: vehicle ? `${vehicle.make} ${vehicle.model} (${vehicle.plateCode} ${vehicle.plateNumber})` : "",
          status: j.status,
        };
      });

    const customers = this.data.customers
      .filter((c) => c.workshopId === workshopId)
      .filter((c) => c.name.toLowerCase().includes(q) || c.phone.includes(q) || (c.email && c.email.toLowerCase().includes(q)))
      .slice(0, 5)
      .map((c) => ({ id: c.id, name: c.name, phone: c.phone, email: c.email }));

    const vehicles = this.data.vehicles
      .filter((v) => v.workshopId === workshopId)
      .filter(
        (v) =>
          v.make.toLowerCase().includes(q) ||
          v.model.toLowerCase().includes(q) ||
          v.plateNumber.includes(q) ||
          (v.vin && v.vin.toLowerCase().includes(q))
      )
      .slice(0, 5)
      .map((v) => ({ id: v.id, make: v.make, model: v.model, plateCode: v.plateCode, plateNumber: v.plateNumber, year: v.year }));

    const inventory = this.data.inventoryItems
      .filter((i) => i.workshopId === workshopId)
      .filter((i) => i.name.toLowerCase().includes(q) || i.partNumber.toLowerCase().includes(q) || i.category.toLowerCase().includes(q))
      .slice(0, 5)
      .map((i) => ({ id: i.id, partNumber: i.partNumber, name: i.name, category: i.category, onHand: i.onHand, unitPrice: i.unitPrice }));

    return { jobCards, customers, vehicles, inventory };
  }
}

export const fallbackDatabase = new RelationalMemoryStore();
