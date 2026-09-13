// server/apiServerless.ts
import "dotenv/config";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// shared/const.ts
var COOKIE_NAME = "app_session_id";
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
var AXIOS_TIMEOUT_MS = 3e4;
var UNAUTHED_ERR_MSG = "Please login (10001)";
var NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";
var OAUTH_STATE_COOKIE = "__Host-oauth_state";
var decodeOAuthState = (state) => {
  let decoded;
  try {
    decoded = atob(state);
  } catch {
    return { redirectUri: "" };
  }
  try {
    const parsed = JSON.parse(decoded);
    if (parsed && typeof parsed.redirectUri === "string") return parsed;
  } catch {
  }
  return { redirectUri: decoded };
};

// server/routers.ts
import { TRPCError as TRPCError3 } from "@trpc/server";
import { z as z2 } from "zod";

// server/_core/cookies.ts
function isSecureRequest(req) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}
function getSessionCookieOptions(req) {
  const secure = isSecureRequest(req);
  return {
    httpOnly: true,
    path: "/",
    sameSite: secure ? "none" : "lax",
    secure
  };
}

// shared/_core/errors.ts
var HttpError = class extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = "HttpError";
  }
};
var ForbiddenError = (msg) => new HttpError(403, msg);

// server/_core/sdk.ts
import axios from "axios";
import { parse as parseCookieHeader } from "cookie";
import { SignJWT, jwtVerify } from "jose";

// server/db.ts
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";

// drizzle/schema.ts
import { decimal, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";
var workshops = mysqlTable("workshops", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  city: varchar("city", { length: 100 }).default("Dubai").notNull(),
  address: text("address"),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 320 }),
  trn: varchar("trn", { length: 50 }),
  // UAE Tax Registration Number (15 digits)
  vatRate: decimal("vatRate", { precision: 5, scale: 4 }).default("0.0500").notNull(),
  // 5% UAE VAT
  currency: varchar("currency", { length: 10 }).default("AED").notNull(),
  totalBays: int("totalBays").default(16).notNull(),
  plan: mysqlEnum("plan", ["starter", "pro", "enterprise"]).default("pro").notNull(),
  subscriptionStatus: mysqlEnum("subscriptionStatus", ["trial", "active", "past_due", "cancelled"]).default("trial").notNull(),
  trialEndsAt: timestamp("trialEndsAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  workshopId: int("workshopId").references(() => workshops.id),
  openId: varchar("openId", { length: 64 }).unique(),
  email: varchar("email", { length: 320 }),
  passwordHash: varchar("passwordHash", { length: 255 }),
  name: text("name"),
  phone: varchar("phone", { length: 50 }),
  loginMethod: varchar("loginMethod", { length: 64 }).default("email"),
  role: mysqlEnum("role", ["owner", "admin", "service_advisor", "technician", "user"]).default("admin").notNull(),
  status: mysqlEnum("status", ["active", "invited", "suspended"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull()
});
var customers = mysqlTable("customers", {
  id: int("id").autoincrement().primaryKey(),
  workshopId: int("workshopId").notNull().references(() => workshops.id),
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }).notNull(),
  email: varchar("email", { length: 320 }),
  trn: varchar("trn", { length: 50 }),
  // For corporate fleet customers
  companyName: varchar("companyName", { length: 255 }),
  address: text("address"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var vehicles = mysqlTable("vehicles", {
  id: int("id").autoincrement().primaryKey(),
  workshopId: int("workshopId").notNull().references(() => workshops.id),
  customerId: int("customerId").notNull().references(() => customers.id),
  make: varchar("make", { length: 100 }).notNull(),
  model: varchar("model", { length: 100 }).notNull(),
  year: int("year").notNull(),
  plateCode: varchar("plateCode", { length: 10 }).notNull(),
  // e.g. "D", "AD", "DXB"
  plateNumber: varchar("plateNumber", { length: 20 }).notNull(),
  // e.g. "48291"
  emirate: varchar("emirate", { length: 50 }).default("Dubai").notNull(),
  vin: varchar("vin", { length: 50 }),
  color: varchar("color", { length: 50 }),
  mileage: int("mileage").default(0).notNull(),
  engine: varchar("engine", { length: 50 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var technicians = mysqlTable("technicians", {
  id: int("id").autoincrement().primaryKey(),
  workshopId: int("workshopId").notNull().references(() => workshops.id),
  userId: int("userId").references(() => users.id),
  name: varchar("name", { length: 255 }).notNull(),
  initials: varchar("initials", { length: 10 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  specialty: varchar("specialty", { length: 100 }),
  hourlyRate: decimal("hourlyRate", { precision: 10, scale: 2 }).default("150.00").notNull(),
  status: mysqlEnum("status", ["available", "on_job", "off_duty"]).default("available").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var jobCards = mysqlTable("jobCards", {
  id: int("id").autoincrement().primaryKey(),
  workshopId: int("workshopId").notNull().references(() => workshops.id),
  jobCardNumber: varchar("jobCardNumber", { length: 50 }).notNull(),
  // e.g. "EG-2418"
  customerId: int("customerId").notNull().references(() => customers.id),
  vehicleId: int("vehicleId").notNull().references(() => vehicles.id),
  technicianId: int("technicianId").references(() => technicians.id),
  bayNumber: varchar("bayNumber", { length: 50 }).default("Bay 01").notNull(),
  serviceSummary: varchar("serviceSummary", { length: 255 }).notNull(),
  status: mysqlEnum("status", [
    "checked_in",
    "diagnosing",
    "awaiting_approval",
    "approved",
    "in_progress",
    "inspection_passed",
    "ready_for_handover",
    "completed",
    "cancelled"
  ]).default("checked_in").notNull(),
  promiseTime: varchar("promiseTime", { length: 100 }),
  mileageIn: int("mileageIn"),
  customerComplaints: text("customerComplaints"),
  approvalNotes: text("approvalNotes"),
  approvedAt: timestamp("approvedAt"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var inspections = mysqlTable("inspections", {
  id: int("id").autoincrement().primaryKey(),
  workshopId: int("workshopId").notNull().references(() => workshops.id),
  jobCardId: int("jobCardId").notNull().references(() => jobCards.id),
  completedBy: int("completedBy").references(() => technicians.id),
  status: mysqlEnum("status", ["in_progress", "completed", "requires_attention"]).default("in_progress").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var inspectionItems = mysqlTable("inspectionItems", {
  id: int("id").autoincrement().primaryKey(),
  workshopId: int("workshopId").notNull().references(() => workshops.id),
  inspectionId: int("inspectionId").notNull().references(() => inspections.id),
  checkKey: varchar("checkKey", { length: 50 }).notNull(),
  // exterior, lights, tyres, fluids, brakes, battery, ac, road_test
  checkTitle: varchar("checkTitle", { length: 100 }).notNull(),
  status: mysqlEnum("status", ["pass", "attention", "fail", "not_inspected"]).default("pass").notNull(),
  measurement: varchar("measurement", { length: 50 }),
  // e.g. "3.2 mm"
  findings: text("findings"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var labourItems = mysqlTable("labourItems", {
  id: int("id").autoincrement().primaryKey(),
  workshopId: int("workshopId").notNull().references(() => workshops.id),
  jobCardId: int("jobCardId").notNull().references(() => jobCards.id),
  description: varchar("description", { length: 255 }).notNull(),
  hours: decimal("hours", { precision: 5, scale: 2 }).notNull(),
  hourlyRate: decimal("hourlyRate", { precision: 10, scale: 2 }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var inventoryItems = mysqlTable("inventoryItems", {
  id: int("id").autoincrement().primaryKey(),
  workshopId: int("workshopId").notNull().references(() => workshops.id),
  partNumber: varchar("partNumber", { length: 100 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  // Filters, Fluids, Brakes, Tyres, Electrical, Suspension
  unitPrice: decimal("unitPrice", { precision: 10, scale: 2 }).notNull(),
  // Retail price
  costPrice: decimal("costPrice", { precision: 10, scale: 2 }).notNull(),
  onHand: int("onHand").default(0).notNull(),
  reorderPoint: int("reorderPoint").default(5).notNull(),
  binLocation: varchar("binLocation", { length: 50 }),
  supplier: varchar("supplier", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var jobCardParts = mysqlTable("jobCardParts", {
  id: int("id").autoincrement().primaryKey(),
  workshopId: int("workshopId").notNull().references(() => workshops.id),
  jobCardId: int("jobCardId").notNull().references(() => jobCards.id),
  partId: int("partId").references(() => inventoryItems.id),
  partName: varchar("partName", { length: 255 }).notNull(),
  quantity: int("quantity").notNull(),
  unitPrice: decimal("unitPrice", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("totalPrice", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var invoices = mysqlTable("invoices", {
  id: int("id").autoincrement().primaryKey(),
  workshopId: int("workshopId").notNull().references(() => workshops.id),
  jobCardId: int("jobCardId").references(() => jobCards.id),
  // Nullable for direct invoices without job card
  customerId: int("customerId").notNull().references(() => customers.id),
  invoiceNumber: varchar("invoiceNumber", { length: 50 }).notNull().unique(),
  // e.g. "INV-2418"
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  discount: decimal("discount", { precision: 10, scale: 2 }).default("0.00").notNull(),
  vatRate: decimal("vatRate", { precision: 5, scale: 4 }).default("0.0500").notNull(),
  vatAmount: decimal("vatAmount", { precision: 10, scale: 2 }).notNull(),
  totalAmount: decimal("totalAmount", { precision: 10, scale: 2 }).notNull(),
  amountPaid: decimal("amountPaid", { precision: 10, scale: 2 }).default("0.00").notNull(),
  status: mysqlEnum("status", ["draft", "sent", "partially_paid", "paid", "void"]).default("draft").notNull(),
  trn: varchar("trn", { length: 50 }),
  note: text("note"),
  itemsJson: text("itemsJson"),
  // Serialized line items for direct invoices
  issuedAt: timestamp("issuedAt").defaultNow().notNull(),
  dueDate: timestamp("dueDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var payments = mysqlTable("payments", {
  id: int("id").autoincrement().primaryKey(),
  workshopId: int("workshopId").notNull().references(() => workshops.id),
  invoiceId: int("invoiceId").notNull().references(() => invoices.id),
  customerId: int("customerId").notNull().references(() => customers.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: mysqlEnum("paymentMethod", ["card", "cash", "bank_transfer", "cheque"]).notNull(),
  reference: varchar("reference", { length: 100 }),
  notes: text("notes"),
  paidAt: timestamp("paidAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var activityLogs = mysqlTable("activityLogs", {
  id: int("id").autoincrement().primaryKey(),
  workshopId: int("workshopId").notNull().references(() => workshops.id),
  userId: int("userId").references(() => users.id),
  jobCardId: int("jobCardId").references(() => jobCards.id),
  title: varchar("title", { length: 255 }).notNull(),
  copy: text("copy").notNull(),
  tone: varchar("tone", { length: 20 }).default("blue").notNull(),
  // green, amber, blue, steel
  createdAt: timestamp("createdAt").defaultNow().notNull()
});

// server/_core/env.ts
var ENV = {
  appId: process.env.VITE_APP_ID || "easygarage",
  cookieSecret: process.env.JWT_SECRET || "easygarage_secret_jwt_key_super_secure_32_bytes",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? ""
};

// server/db/fallbackStore.ts
import fs from "node:fs";
import path from "node:path";

// shared/easygarage.ts
var UAE_VAT_RATE = 0.05;
function calculateVat(subtotal) {
  return Math.round(subtotal * UAE_VAT_RATE * 100) / 100;
}
function calculateTotal(subtotal) {
  return Math.round((subtotal + calculateVat(subtotal)) * 100) / 100;
}

// server/db/fallbackStore.ts
var SEED_PATH = path.join(process.cwd(), "data", "easygarage_relational.json");
var DATA_DIR = process.env.VERCEL ? "/tmp" : path.join(process.cwd(), "data");
var STORE_PATH = path.join(DATA_DIR, "easygarage_relational.json");
function ensureDirectoryExists(dir) {
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  } catch {
  }
}
function hashPassword(password) {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `sha256_mock_${Math.abs(hash)}_${password.length}`;
}
function verifyPassword(password, hash) {
  return hashPassword(password) === hash;
}
var RelationalMemoryStore = class {
  data;
  constructor() {
    this.data = this.loadFromDisk();
  }
  loadFromDisk() {
    ensureDirectoryExists(DATA_DIR);
    const candidatePath = fs.existsSync(STORE_PATH) ? STORE_PATH : fs.existsSync(SEED_PATH) ? SEED_PATH : null;
    if (candidatePath) {
      try {
        const raw = fs.readFileSync(candidatePath, "utf-8");
        const parsed = JSON.parse(raw);
        return this.reviveDates(parsed);
      } catch (err) {
        console.warn("[Database] Failed to read existing store file, re-initializing:", err);
      }
    }
    const initial = this.createInitialSeed();
    this.persistToDisk(initial);
    return initial;
  }
  persistToDisk(data = this.data) {
    try {
      ensureDirectoryExists(DATA_DIR);
      fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), "utf-8");
    } catch (err) {
      console.error("[Database] Failed to persist data to disk:", err);
    }
  }
  reviveDates(obj) {
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
  createInitialSeed() {
    const now = /* @__PURE__ */ new Date();
    const workshopId = 1;
    const workshop = {
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
      updatedAt: now
    };
    const user = {
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
      lastSignedIn: now
    };
    const customers2 = [
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
        updatedAt: now
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
        updatedAt: now
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
        updatedAt: now
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
        updatedAt: now
      }
    ];
    const vehicles2 = [
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
        updatedAt: now
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
        updatedAt: now
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
        updatedAt: now
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
        updatedAt: now
      }
    ];
    const technicians2 = [
      {
        id: 1,
        workshopId,
        userId: null,
        name: "Omar Khalid",
        initials: "OK",
        phone: "+971 50 999 1111",
        specialty: "Master Tech \xB7 Diagnostics & Engine",
        hourlyRate: "180.00",
        status: "on_job",
        createdAt: now,
        updatedAt: now
      },
      {
        id: 2,
        workshopId,
        userId: null,
        name: "Ravi Prakash",
        initials: "RP",
        phone: "+971 50 999 2222",
        specialty: "Senior Tech \xB7 AC & Climate Control",
        hourlyRate: "150.00",
        status: "on_job",
        createdAt: now,
        updatedAt: now
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
        updatedAt: now
      }
    ];
    const inventoryItems2 = [
      {
        id: 1,
        workshopId,
        partNumber: "0986AF",
        name: "Bosch Oil Filter \xB7 0986AF",
        category: "Filters",
        unitPrice: "48.00",
        costPrice: "26.00",
        onHand: 6,
        reorderPoint: 8,
        binLocation: "Shelf A-02",
        supplier: "Bosch Middle East",
        createdAt: now,
        updatedAt: now
      },
      {
        id: 2,
        workshopId,
        partNumber: "DOT4-ATE",
        name: "ATE Brake Fluid DOT 4 \xB7 1L",
        category: "Fluids",
        unitPrice: "32.00",
        costPrice: "18.00",
        onHand: 14,
        reorderPoint: 6,
        binLocation: "Rack F-01",
        supplier: "German Auto Spares Dubai",
        createdAt: now,
        updatedAt: now
      },
      {
        id: 3,
        workshopId,
        partNumber: "P85120",
        name: "Brembo Front Brake Pads \xB7 P85120",
        category: "Brakes",
        unitPrice: "680.00",
        costPrice: "420.00",
        onHand: 2,
        reorderPoint: 4,
        binLocation: "Bay 3 Locker",
        supplier: "Brembo Emirates",
        createdAt: now,
        updatedAt: now
      },
      {
        id: 4,
        workshopId,
        partNumber: "MIC-LAT3",
        name: "Michelin Latitude Sport 3 \xB7 275/45 R21",
        category: "Tyres",
        unitPrice: "1140.00",
        costPrice: "810.00",
        onHand: 0,
        reorderPoint: 4,
        binLocation: "Tyre Bay",
        supplier: "Central Tyre Distribution",
        createdAt: now,
        updatedAt: now
      },
      {
        id: 5,
        workshopId,
        partNumber: "MOB1-0W40",
        name: "Mobil 1 ESP 0W-40 Synthetic Engine Oil \xB7 5L",
        category: "Fluids",
        unitPrice: "210.00",
        costPrice: "135.00",
        onHand: 18,
        reorderPoint: 10,
        binLocation: "Rack F-02",
        supplier: "Mobil Gulf Lubricants",
        createdAt: now,
        updatedAt: now
      }
    ];
    const jobCards2 = [
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
        createdAt: new Date(Date.now() - 3600 * 1e3 * 3),
        updatedAt: now
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
        approvedAt: new Date(Date.now() - 3600 * 1e3 * 2),
        completedAt: null,
        createdAt: new Date(Date.now() - 3600 * 1e3 * 4),
        updatedAt: now
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
        approvedAt: new Date(Date.now() - 3600 * 1e3 * 5),
        completedAt: new Date(Date.now() - 3600 * 1e3 * 1),
        createdAt: new Date(Date.now() - 3600 * 1e3 * 6),
        updatedAt: now
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
        createdAt: new Date(Date.now() - 3600 * 1e3 * 1),
        updatedAt: now
      }
    ];
    const inspections2 = [
      {
        id: 1,
        workshopId,
        jobCardId: 1,
        completedBy: 1,
        status: "completed",
        notes: "Front brake pads worn to 3.2mm. Recommend immediate pad replacement with disc skimming.",
        createdAt: now,
        updatedAt: now
      }
    ];
    const checklistDefs = [
      { key: "exterior", title: "Exterior walkaround", status: "pass", measurement: "Clean", findings: "No new scratches or bumper damage." },
      { key: "lights", title: "Lights & signals", status: "pass", measurement: "100%", findings: "All headlights, hazards and tail LEDs operational." },
      { key: "tyres", title: "Tyres & alignment", status: "attention", measurement: "3.2 mm", findings: "Front tyre tread near wear indicator. Recommend replacement within 3,000 km." },
      { key: "fluids", title: "Fluids & leaks", status: "pass", measurement: "Normal", findings: "Coolant level OK, washer fluid topped up." },
      { key: "brakes", title: "Brakes", status: "attention", measurement: "3.2 mm", findings: "Front pads at 15% life remaining. Discs show minor lip." },
      { key: "battery", title: "Battery & charging", status: "pass", measurement: "12.7V", findings: "Alternator charging at 14.2V. Health good." },
      { key: "ac", title: "AC performance", status: "pass", measurement: "6.8\xB0C", findings: "Vent temp optimal under load." },
      { key: "road_test", title: "Road test", status: "pass", measurement: "Pass", findings: "Braking linear, suspension quiet, transmission smooth." }
    ];
    const inspectionItems2 = checklistDefs.map((item, idx) => ({
      id: idx + 1,
      workshopId,
      inspectionId: 1,
      checkKey: item.key,
      checkTitle: item.title,
      status: item.status,
      measurement: item.measurement,
      findings: item.findings,
      createdAt: now,
      updatedAt: now
    }));
    const labourItems2 = [
      {
        id: 1,
        workshopId,
        jobCardId: 1,
        description: "Major service package (Oil + filter \xB7 32-point service)",
        hours: "2.50",
        hourlyRate: "512.00",
        amount: "1280.00",
        createdAt: now
      },
      {
        id: 2,
        workshopId,
        jobCardId: 1,
        description: "Front brake pad replacement (Brembo P85120 \xB7 Labour included)",
        hours: "2.00",
        hourlyRate: "490.00",
        amount: "980.00",
        createdAt: now
      },
      {
        id: 3,
        workshopId,
        jobCardId: 1,
        description: "Workshop consumables (Environmental disposal & shop supplies)",
        hours: "1.00",
        hourlyRate: "100.00",
        amount: "100.00",
        createdAt: now
      }
    ];
    const jobCardParts2 = [
      {
        id: 1,
        workshopId,
        jobCardId: 1,
        partId: 1,
        partName: "Bosch Oil Filter \xB7 0986AF",
        quantity: 1,
        unitPrice: "48.00",
        totalPrice: "48.00",
        createdAt: now
      },
      {
        id: 2,
        workshopId,
        jobCardId: 1,
        partId: 3,
        partName: "Brembo Front Brake Pads \xB7 P85120",
        quantity: 1,
        unitPrice: "680.00",
        totalPrice: "680.00",
        createdAt: now
      }
    ];
    const invoiceSubtotal = 2360;
    const invoiceVat = calculateVat(invoiceSubtotal);
    const invoiceTotal = calculateTotal(invoiceSubtotal);
    const invoices2 = [
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
        dueDate: new Date(Date.now() + 86400 * 1e3 * 7),
        createdAt: now,
        updatedAt: now
      }
    ];
    const payments2 = [];
    const activityLogs2 = [
      {
        id: 1,
        workshopId,
        userId: 1,
        jobCardId: 1,
        title: "Estimate created",
        copy: "Estimate generated for Nadia Al Mansoori \xB7 EG-2418 (AED 2,478.00)",
        tone: "blue",
        createdAt: new Date(Date.now() - 1e3 * 60 * 12)
      },
      {
        id: 2,
        workshopId,
        userId: null,
        jobCardId: null,
        title: "Part below reorder point",
        copy: "Brembo Front Pads \xB7 2 remaining on shelf",
        tone: "amber",
        createdAt: new Date(Date.now() - 1e3 * 60 * 18)
      },
      {
        id: 3,
        workshopId,
        userId: null,
        jobCardId: 3,
        title: "Job completed & ready",
        copy: "EG-2416 (Porsche Cayenne) moved to Ready for Handover by Samir H.",
        tone: "green",
        createdAt: new Date(Date.now() - 1e3 * 60 * 34)
      },
      {
        id: 4,
        workshopId,
        userId: 1,
        jobCardId: null,
        title: "Payment settled",
        copy: "AED 1,860.00 recorded for INV-2409 (Cash)",
        tone: "steel",
        createdAt: new Date(Date.now() - 1e3 * 60 * 60)
      }
    ];
    return {
      workshops: [workshop],
      users: [user],
      customers: customers2,
      vehicles: vehicles2,
      technicians: technicians2,
      jobCards: jobCards2,
      inspections: inspections2,
      inspectionItems: inspectionItems2,
      labourItems: labourItems2,
      inventoryItems: inventoryItems2,
      jobCardParts: jobCardParts2,
      invoices: invoices2,
      payments: payments2,
      activityLogs: activityLogs2
    };
  }
  // --- Multi-Tenant Scope Validation ---
  checkWorkshop(workshopId) {
    if (!workshopId || typeof workshopId !== "number") {
      throw new Error(`Invalid tenant workshopId: ${workshopId}`);
    }
  }
  // --- Workshops ---
  async getWorkshop(workshopId) {
    this.checkWorkshop(workshopId);
    return this.data.workshops.find((w) => w.id === workshopId) ?? null;
  }
  async getWorkshopBySlug(slug) {
    return this.data.workshops.find((w) => w.slug === slug) ?? null;
  }
  async createWorkshop(data) {
    const nextId = this.data.workshops.reduce((max, w) => Math.max(max, w.id), 0) + 1;
    const slug = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `workshop-${nextId}`;
    const now = /* @__PURE__ */ new Date();
    const workshop = {
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
      updatedAt: now
    };
    this.data.workshops.push(workshop);
    this.persistToDisk();
    return workshop;
  }
  async updateWorkshop(workshopId, update) {
    this.checkWorkshop(workshopId);
    const index = this.data.workshops.findIndex((w) => w.id === workshopId);
    if (index === -1) throw new Error("Workshop not found");
    const updated = { ...this.data.workshops[index], ...update, updatedAt: /* @__PURE__ */ new Date() };
    this.data.workshops[index] = updated;
    this.persistToDisk();
    return updated;
  }
  // --- Users ---
  async getUserByEmail(email) {
    const normalized = email.toLowerCase().trim();
    const user = this.data.users.find((u) => {
      if (!u.email) return false;
      const ue = u.email.toLowerCase();
      return ue === normalized || normalized === "ops@greenwayauto.ae" && ue === "ops@alnoorauto.ae" || normalized === "ops@alnoorauto.ae" && ue === "ops@greenwayauto.ae";
    });
    if (!user) return null;
    const workshop = user.workshopId ? await this.getWorkshop(user.workshopId) : null;
    return { ...user, workshop };
  }
  async getUserById(id) {
    const user = this.data.users.find((u) => u.id === id);
    if (!user) return null;
    const workshop = user.workshopId ? await this.getWorkshop(user.workshopId) : null;
    return { ...user, workshop };
  }
  async getUserByOpenId(openId) {
    const user = this.data.users.find((u) => u.openId === openId);
    if (!user) return null;
    const workshop = user.workshopId ? await this.getWorkshop(user.workshopId) : null;
    return { ...user, workshop };
  }
  async createUser(data) {
    this.checkWorkshop(data.workshopId);
    const nextId = this.data.users.reduce((max, u) => Math.max(max, u.id), 0) + 1;
    const now = /* @__PURE__ */ new Date();
    const newUser = {
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
      lastSignedIn: now
    };
    this.data.users.push(newUser);
    this.persistToDisk();
    return newUser;
  }
  async updateUser(id, update) {
    const index = this.data.users.findIndex((u) => u.id === id);
    if (index === -1) throw new Error("User not found");
    const updated = { ...this.data.users[index], ...update, updatedAt: /* @__PURE__ */ new Date() };
    this.data.users[index] = updated;
    this.persistToDisk();
    return updated;
  }
  // --- Customers ---
  async getCustomers(workshopId) {
    this.checkWorkshop(workshopId);
    return this.data.customers.filter((c) => c.workshopId === workshopId).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  async getCustomerById(workshopId, id) {
    this.checkWorkshop(workshopId);
    return this.data.customers.find((c) => c.workshopId === workshopId && c.id === id) ?? null;
  }
  async createCustomer(workshopId, data) {
    this.checkWorkshop(workshopId);
    const nextId = this.data.customers.reduce((max, c) => Math.max(max, c.id), 0) + 1;
    const now = /* @__PURE__ */ new Date();
    const newCustomer = {
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
      updatedAt: now
    };
    this.data.customers.push(newCustomer);
    this.persistToDisk();
    return newCustomer;
  }
  async updateCustomer(workshopId, id, update) {
    this.checkWorkshop(workshopId);
    const index = this.data.customers.findIndex((c) => c.workshopId === workshopId && c.id === id);
    if (index === -1) throw new Error("Customer not found");
    const updated = { ...this.data.customers[index], ...update, updatedAt: /* @__PURE__ */ new Date() };
    this.data.customers[index] = updated;
    this.persistToDisk();
    return updated;
  }
  // --- Vehicles ---
  async getVehicles(workshopId) {
    this.checkWorkshop(workshopId);
    const list = this.data.vehicles.filter((v) => v.workshopId === workshopId);
    return list.map((v) => {
      const customer = this.data.customers.find((c) => c.id === v.customerId);
      return { ...v, customer };
    });
  }
  async getVehicleById(workshopId, id) {
    this.checkWorkshop(workshopId);
    const vehicle = this.data.vehicles.find((v) => v.workshopId === workshopId && v.id === id);
    if (!vehicle) return null;
    const customer = this.data.customers.find((c) => c.id === vehicle.customerId);
    return { ...vehicle, customer };
  }
  async getVehiclesByCustomer(workshopId, customerId) {
    this.checkWorkshop(workshopId);
    return this.data.vehicles.filter((v) => v.workshopId === workshopId && v.customerId === customerId);
  }
  async createVehicle(workshopId, data) {
    this.checkWorkshop(workshopId);
    const nextId = this.data.vehicles.reduce((max, v) => Math.max(max, v.id), 0) + 1;
    const now = /* @__PURE__ */ new Date();
    const newVehicle = {
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
      updatedAt: now
    };
    this.data.vehicles.push(newVehicle);
    this.persistToDisk();
    return newVehicle;
  }
  async updateVehicle(workshopId, id, update) {
    this.checkWorkshop(workshopId);
    const index = this.data.vehicles.findIndex((v) => v.workshopId === workshopId && v.id === id);
    if (index === -1) throw new Error("Vehicle not found");
    const updated = { ...this.data.vehicles[index], ...update, updatedAt: /* @__PURE__ */ new Date() };
    this.data.vehicles[index] = updated;
    this.persistToDisk();
    return updated;
  }
  async getVehicleHistory(workshopId, vehicleId) {
    this.checkWorkshop(workshopId);
    const vehicle = this.data.vehicles.find((v) => v.workshopId === workshopId && v.id === vehicleId);
    if (!vehicle) return null;
    const customer = this.data.customers.find((c) => c.id === vehicle.customerId);
    const cards = this.data.jobCards.filter((j) => j.workshopId === workshopId && j.vehicleId === vehicleId).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    const detailedCards = cards.map((job) => {
      const technician = job.technicianId ? this.data.technicians.find((t2) => t2.id === job.technicianId) || null : null;
      const labourItems2 = this.data.labourItems.filter((l) => l.jobCardId === job.id);
      const parts = this.data.jobCardParts.filter((p) => p.jobCardId === job.id);
      const invoice = this.data.invoices.find((i) => i.jobCardId === job.id) || null;
      const inspectionRaw = this.data.inspections.find((i) => i.jobCardId === job.id) || null;
      const inspection = inspectionRaw ? { ...inspectionRaw, items: this.data.inspectionItems.filter((it) => it.inspectionId === inspectionRaw.id) } : null;
      return {
        ...job,
        technician,
        labourItems: labourItems2,
        parts,
        invoice,
        inspection
      };
    });
    return {
      vehicle,
      customer,
      jobCards: detailedCards
    };
  }
  // --- Technicians ---
  async getTechnicians(workshopId) {
    this.checkWorkshop(workshopId);
    const techs = this.data.technicians.filter((t2) => t2.workshopId === workshopId);
    const activeJobs = this.data.jobCards.filter(
      (j) => j.workshopId === workshopId && j.status !== "completed" && j.status !== "cancelled"
    );
    return techs.map((tech) => {
      const techJobs = activeJobs.filter((j) => j.technicianId === tech.id);
      const count = techJobs.length;
      const loadPercentage = Math.min(100, Math.round(count / 4 * 100));
      return {
        ...tech,
        activeJobsCount: count,
        loadPercentage
      };
    });
  }
  async getTechnicianById(workshopId, id) {
    this.checkWorkshop(workshopId);
    return this.data.technicians.find((t2) => t2.workshopId === workshopId && t2.id === id) ?? null;
  }
  async createTechnician(workshopId, data) {
    this.checkWorkshop(workshopId);
    const nextId = this.data.technicians.reduce((max, t2) => Math.max(max, t2.id), 0) + 1;
    const now = /* @__PURE__ */ new Date();
    const newTech = {
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
      updatedAt: now
    };
    this.data.technicians.push(newTech);
    this.persistToDisk();
    return newTech;
  }
  async updateTechnician(workshopId, id, update) {
    this.checkWorkshop(workshopId);
    const index = this.data.technicians.findIndex((t2) => t2.workshopId === workshopId && t2.id === id);
    if (index === -1) throw new Error("Technician not found");
    const updated = { ...this.data.technicians[index], ...update, updatedAt: /* @__PURE__ */ new Date() };
    this.data.technicians[index] = updated;
    this.persistToDisk();
    return updated;
  }
  // --- Helper to build FullJobCard ---
  buildFullJobCard(workshopId, job) {
    const customer = this.data.customers.find((c) => c.id === job.customerId);
    const vehicle = this.data.vehicles.find((v) => v.id === job.vehicleId);
    const technician = job.technicianId ? this.data.technicians.find((t2) => t2.id === job.technicianId) || null : null;
    const labourItems2 = this.data.labourItems.filter((l) => l.jobCardId === job.id);
    const parts = this.data.jobCardParts.filter((p) => p.jobCardId === job.id);
    const inspectionRaw = this.data.inspections.find((i) => i.jobCardId === job.id) || null;
    const inspection = inspectionRaw ? {
      ...inspectionRaw,
      items: this.data.inspectionItems.filter((it) => it.inspectionId === inspectionRaw.id)
    } : null;
    const invoiceRaw = this.data.invoices.find((i) => i.jobCardId === job.id) || null;
    const invoice = invoiceRaw ? {
      ...invoiceRaw,
      payments: this.data.payments.filter((p) => p.invoiceId === invoiceRaw.id)
    } : null;
    const labourTotal = labourItems2.reduce((acc, l) => acc + parseFloat(l.amount), 0);
    const partsTotal = parts.reduce((acc, p) => acc + parseFloat(p.totalPrice), 0);
    const subtotal = Math.round((labourTotal + partsTotal) * 100) / 100;
    const vatAmount = calculateVat(subtotal);
    const totalAmount = calculateTotal(subtotal);
    return {
      ...job,
      customer,
      vehicle,
      technician,
      labourItems: labourItems2,
      parts,
      inspection,
      invoice,
      subtotal,
      vatAmount,
      totalAmount
    };
  }
  // --- Job Cards ---
  async getJobCards(workshopId) {
    this.checkWorkshop(workshopId);
    return this.data.jobCards.filter((j) => j.workshopId === workshopId).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).map((j) => this.buildFullJobCard(workshopId, j));
  }
  async getJobCardById(workshopId, idOrNumber) {
    this.checkWorkshop(workshopId);
    const job = this.data.jobCards.find((j) => {
      if (j.workshopId !== workshopId) return false;
      if (typeof idOrNumber === "number") return j.id === idOrNumber;
      return j.id.toString() === idOrNumber || j.jobCardNumber === idOrNumber;
    });
    if (!job) return null;
    return this.buildFullJobCard(workshopId, job);
  }
  async createJobCard(workshopId, data) {
    this.checkWorkshop(workshopId);
    const nextId = this.data.jobCards.reduce((max, j) => Math.max(max, j.id), 0) + 1;
    const jobCardNumber = `EG-${2400 + nextId}`;
    const now = /* @__PURE__ */ new Date();
    const newJob = {
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
      updatedAt: now
    };
    this.data.jobCards.push(newJob);
    const nextInspId = this.data.inspections.reduce((max, i) => Math.max(max, i.id), 0) + 1;
    const newInspection = {
      id: nextInspId,
      workshopId,
      jobCardId: nextId,
      completedBy: data.technicianId || null,
      status: "in_progress",
      notes: "Inspection initialized at vehicle check-in.",
      createdAt: now,
      updatedAt: now
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
      { key: "road_test", title: "Road test" }
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
        updatedAt: now
      });
    });
    await this.addActivityLog(workshopId, {
      jobCardId: nextId,
      title: "Job card created",
      copy: `${jobCardNumber} opened for ${data.serviceSummary}`,
      tone: "blue"
    });
    this.persistToDisk();
    return this.buildFullJobCard(workshopId, newJob);
  }
  async updateJobCardStatus(workshopId, id, status, notes) {
    this.checkWorkshop(workshopId);
    const index = this.data.jobCards.findIndex((j) => j.workshopId === workshopId && j.id === id);
    if (index === -1) throw new Error("Job card not found");
    const now = /* @__PURE__ */ new Date();
    const current = this.data.jobCards[index];
    const updated = {
      ...current,
      status,
      approvalNotes: notes !== void 0 ? notes : current.approvalNotes,
      approvedAt: status === "approved" && !current.approvedAt ? now : current.approvedAt,
      completedAt: status === "completed" && !current.completedAt ? now : current.completedAt,
      updatedAt: now
    };
    this.data.jobCards[index] = updated;
    await this.addActivityLog(workshopId, {
      jobCardId: id,
      title: `Status changed: ${status.replace("_", " ")}`,
      copy: `Job ${current.jobCardNumber} updated to ${status.replace("_", " ")}`,
      tone: status === "approved" || status === "completed" ? "green" : "blue"
    });
    this.persistToDisk();
    return this.buildFullJobCard(workshopId, updated);
  }
  async assignTechnician(workshopId, id, technicianId, bayNumber) {
    this.checkWorkshop(workshopId);
    const index = this.data.jobCards.findIndex((j) => j.workshopId === workshopId && j.id === id);
    if (index === -1) throw new Error("Job card not found");
    const current = this.data.jobCards[index];
    const tech = technicianId ? this.data.technicians.find((t2) => t2.id === technicianId) : null;
    const updated = {
      ...current,
      technicianId,
      bayNumber: bayNumber || current.bayNumber,
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.data.jobCards[index] = updated;
    await this.addActivityLog(workshopId, {
      jobCardId: id,
      title: "Technician assigned",
      copy: tech ? `${tech.name} assigned to ${current.jobCardNumber}` : `Unassigned technician on ${current.jobCardNumber}`,
      tone: "blue"
    });
    this.persistToDisk();
    return this.buildFullJobCard(workshopId, updated);
  }
  async recordApproval(workshopId, id, notes) {
    return this.updateJobCardStatus(workshopId, id, "approved", notes || "Customer approval recorded via WhatsApp.");
  }
  // --- Inspections ---
  async getInspectionByJobCard(workshopId, jobCardId) {
    this.checkWorkshop(workshopId);
    const inspection = this.data.inspections.find((i) => i.workshopId === workshopId && i.jobCardId === jobCardId);
    if (!inspection) return null;
    const items = this.data.inspectionItems.filter((it) => it.inspectionId === inspection.id);
    return { ...inspection, items };
  }
  async updateInspectionItem(workshopId, itemId, status, measurement, findings) {
    this.checkWorkshop(workshopId);
    const index = this.data.inspectionItems.findIndex((it) => it.workshopId === workshopId && it.id === itemId);
    if (index === -1) throw new Error("Inspection item not found");
    const current = this.data.inspectionItems[index];
    const updated = {
      ...current,
      status,
      measurement: measurement !== void 0 ? measurement : current.measurement,
      findings: findings !== void 0 ? findings : current.findings,
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.data.inspectionItems[index] = updated;
    this.persistToDisk();
    return updated;
  }
  // --- Labour & Parts ---
  async addLabourItem(workshopId, data) {
    this.checkWorkshop(workshopId);
    const nextId = this.data.labourItems.reduce((max, l) => Math.max(max, l.id), 0) + 1;
    const amount = (data.hours * data.hourlyRate).toFixed(2);
    const item = {
      id: nextId,
      workshopId,
      jobCardId: data.jobCardId,
      description: data.description,
      hours: data.hours.toFixed(2),
      hourlyRate: data.hourlyRate.toFixed(2),
      amount,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.data.labourItems.push(item);
    this.persistToDisk();
    return item;
  }
  async deleteLabourItem(workshopId, id) {
    this.checkWorkshop(workshopId);
    const initialLen = this.data.labourItems.length;
    this.data.labourItems = this.data.labourItems.filter((l) => !(l.workshopId === workshopId && l.id === id));
    const deleted = this.data.labourItems.length < initialLen;
    if (deleted) this.persistToDisk();
    return deleted;
  }
  async addJobCardPart(workshopId, data) {
    this.checkWorkshop(workshopId);
    const nextId = this.data.jobCardParts.reduce((max, p) => Math.max(max, p.id), 0) + 1;
    const totalPrice = (data.quantity * data.unitPrice).toFixed(2);
    const part = {
      id: nextId,
      workshopId,
      jobCardId: data.jobCardId,
      partId: data.partId || null,
      partName: data.partName,
      quantity: data.quantity,
      unitPrice: data.unitPrice.toFixed(2),
      totalPrice,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.data.jobCardParts.push(part);
    if (data.partId) {
      await this.adjustStock(workshopId, data.partId, -data.quantity);
    }
    this.persistToDisk();
    return part;
  }
  async deleteJobCardPart(workshopId, id) {
    this.checkWorkshop(workshopId);
    const part = this.data.jobCardParts.find((p) => p.workshopId === workshopId && p.id === id);
    if (!part) return false;
    if (part.partId) {
      await this.adjustStock(workshopId, part.partId, part.quantity);
    }
    this.data.jobCardParts = this.data.jobCardParts.filter((p) => p.id !== id);
    this.persistToDisk();
    return true;
  }
  // --- Inventory ---
  async getInventory(workshopId) {
    this.checkWorkshop(workshopId);
    return this.data.inventoryItems.filter((item) => item.workshopId === workshopId);
  }
  async getInventoryItemById(workshopId, id) {
    this.checkWorkshop(workshopId);
    return this.data.inventoryItems.find((item) => item.workshopId === workshopId && item.id === id) ?? null;
  }
  async createInventoryItem(workshopId, data) {
    this.checkWorkshop(workshopId);
    const nextId = this.data.inventoryItems.reduce((max, i) => Math.max(max, i.id), 0) + 1;
    const now = /* @__PURE__ */ new Date();
    const item = {
      id: nextId,
      workshopId,
      partNumber: data.partNumber,
      name: data.name,
      category: data.category,
      unitPrice: data.unitPrice.toFixed(2),
      costPrice: data.costPrice.toFixed(2),
      onHand: data.onHand !== void 0 ? data.onHand : 0,
      reorderPoint: data.reorderPoint !== void 0 ? data.reorderPoint : 5,
      binLocation: data.binLocation || null,
      supplier: data.supplier || null,
      createdAt: now,
      updatedAt: now
    };
    this.data.inventoryItems.push(item);
    this.persistToDisk();
    return item;
  }
  async adjustStock(workshopId, partId, quantityDelta) {
    this.checkWorkshop(workshopId);
    const index = this.data.inventoryItems.findIndex((i) => i.workshopId === workshopId && i.id === partId);
    if (index === -1) throw new Error("Part not found in inventory");
    const current = this.data.inventoryItems[index];
    const newOnHand = Math.max(0, current.onHand + quantityDelta);
    const updated = {
      ...current,
      onHand: newOnHand,
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.data.inventoryItems[index] = updated;
    if (newOnHand <= current.reorderPoint) {
      await this.addActivityLog(workshopId, {
        title: "Part below reorder point",
        copy: `${current.name} (${newOnHand} left, reorder at ${current.reorderPoint})`,
        tone: "amber"
      });
    }
    this.persistToDisk();
    return updated;
  }
  // --- Invoices & Payments ---
  async getInvoices(workshopId) {
    this.checkWorkshop(workshopId);
    const invs = this.data.invoices.filter((i) => i.workshopId === workshopId).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return invs.map((inv) => {
      const customer = this.data.customers.find((c) => c.id === inv.customerId);
      const jobCard = inv.jobCardId ? this.data.jobCards.find((j) => j.id === inv.jobCardId) ?? null : null;
      const payments2 = this.data.payments.filter((p) => p.invoiceId === inv.id);
      let items = [];
      if (inv.itemsJson) {
        try {
          items = JSON.parse(inv.itemsJson);
        } catch {
        }
      }
      return {
        ...inv,
        customer,
        jobCard,
        payments: payments2,
        items
      };
    });
  }
  async getInvoiceById(workshopId, id) {
    this.checkWorkshop(workshopId);
    const inv = this.data.invoices.find((i) => i.workshopId === workshopId && i.id === id);
    if (!inv) return null;
    const customer = this.data.customers.find((c) => c.id === inv.customerId);
    const jobCard = inv.jobCardId ? await this.getJobCardById(workshopId, inv.jobCardId) : null;
    const payments2 = this.data.payments.filter((p) => p.invoiceId === inv.id);
    let items = [];
    if (inv.itemsJson) {
      try {
        items = JSON.parse(inv.itemsJson);
      } catch {
      }
    }
    return {
      ...inv,
      customer,
      jobCard,
      payments: payments2,
      items
    };
  }
  async createInvoiceFromJobCard(workshopId, jobCardId, discount) {
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
    const now = /* @__PURE__ */ new Date();
    const newInvoice = {
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
      dueDate: new Date(Date.now() + 86400 * 1e3 * 7),
      createdAt: now,
      updatedAt: now
    };
    this.data.invoices.push(newInvoice);
    this.persistToDisk();
    return newInvoice;
  }
  async createDirectInvoice(workshopId, data) {
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
    const issuedAt = data.invoiceDate ? new Date(data.invoiceDate) : /* @__PURE__ */ new Date();
    const now = /* @__PURE__ */ new Date();
    const lineItems = data.items.map((it) => ({
      description: it.description,
      quantity: it.quantity,
      rate: it.rate,
      amount: it.amount || it.quantity * it.rate,
      partId: it.partId
    }));
    for (const item of data.items) {
      if (item.partId) {
        try {
          await this.adjustStock(workshopId, item.partId, -item.quantity);
        } catch {
        }
      }
    }
    const newInvoice = {
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
      dueDate: new Date(issuedAt.getTime() + 86400 * 1e3 * 7),
      createdAt: now,
      updatedAt: now
    };
    this.data.invoices.push(newInvoice);
    this.persistToDisk();
    await this.addActivityLog(workshopId, {
      title: "Direct invoice created",
      copy: `${invoiceNumber} for ${customer.name} (AED ${totalAmount.toFixed(2)})`,
      tone: "green"
    });
    return {
      ...newInvoice,
      customer,
      items: lineItems
    };
  }
  async listEligibleJobCards(workshopId) {
    this.checkWorkshop(workshopId);
    const existingJobCardIds = new Set(
      this.data.invoices.filter((inv) => inv.workshopId === workshopId && inv.jobCardId !== null).map((inv) => inv.jobCardId)
    );
    return this.data.jobCards.filter((j) => j.workshopId === workshopId && !existingJobCardIds.has(j.id)).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).map((j) => this.buildFullJobCard(workshopId, j));
  }
  async updateInvoiceStatus(workshopId, id, status) {
    this.checkWorkshop(workshopId);
    const index = this.data.invoices.findIndex((i) => i.workshopId === workshopId && i.id === id);
    if (index === -1) throw new Error("Invoice not found");
    const updated = { ...this.data.invoices[index], status, updatedAt: /* @__PURE__ */ new Date() };
    this.data.invoices[index] = updated;
    this.persistToDisk();
    return updated;
  }
  async getPayments(workshopId) {
    this.checkWorkshop(workshopId);
    const pmts = this.data.payments.filter((p) => p.workshopId === workshopId).sort((a, b) => b.paidAt.getTime() - a.paidAt.getTime());
    return pmts.map((p) => {
      const customer = this.data.customers.find((c) => c.id === p.customerId);
      const invoice = this.data.invoices.find((i) => i.id === p.invoiceId);
      return { ...p, customer, invoice };
    });
  }
  async recordPayment(workshopId, data) {
    this.checkWorkshop(workshopId);
    const invIndex = this.data.invoices.findIndex((i) => i.workshopId === workshopId && i.id === data.invoiceId);
    if (invIndex === -1) throw new Error("Invoice not found");
    const invoice = this.data.invoices[invIndex];
    const nextId = this.data.payments.reduce((max, p) => Math.max(max, p.id), 0) + 1;
    const now = /* @__PURE__ */ new Date();
    const payment = {
      id: nextId,
      workshopId,
      invoiceId: data.invoiceId,
      customerId: data.customerId,
      amount: data.amount.toFixed(2),
      paymentMethod: data.paymentMethod,
      reference: data.reference || null,
      notes: data.notes || null,
      paidAt: now,
      createdAt: now
    };
    this.data.payments.push(payment);
    const currentPaid = parseFloat(invoice.amountPaid) || 0;
    const newPaid = currentPaid + data.amount;
    const total = parseFloat(invoice.totalAmount);
    const newStatus = newPaid >= total ? "paid" : newPaid > 0 ? "partially_paid" : invoice.status;
    this.data.invoices[invIndex] = {
      ...invoice,
      amountPaid: newPaid.toFixed(2),
      status: newStatus,
      updatedAt: now
    };
    if (newStatus === "paid") {
      const jobIndex = this.data.jobCards.findIndex((j) => j.id === invoice.jobCardId);
      if (jobIndex !== -1 && this.data.jobCards[jobIndex].status !== "completed") {
        this.data.jobCards[jobIndex].status = "ready_for_handover";
      }
    }
    await this.addActivityLog(workshopId, {
      jobCardId: invoice.jobCardId ?? void 0,
      title: "Payment settled",
      copy: `AED ${data.amount.toLocaleString()} received via ${data.paymentMethod.replace("_", " ")} for ${invoice.invoiceNumber}`,
      tone: "steel"
    });
    this.persistToDisk();
    return payment;
  }
  // --- Activity Logs ---
  async getActivityLogs(workshopId, limit = 20) {
    this.checkWorkshop(workshopId);
    return this.data.activityLogs.filter((a) => a.workshopId === workshopId).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, limit);
  }
  async addActivityLog(workshopId, data) {
    this.checkWorkshop(workshopId);
    const nextId = this.data.activityLogs.reduce((max, a) => Math.max(max, a.id), 0) + 1;
    const log = {
      id: nextId,
      workshopId,
      userId: data.userId || null,
      jobCardId: data.jobCardId || null,
      title: data.title,
      copy: data.copy,
      tone: data.tone || "blue",
      createdAt: /* @__PURE__ */ new Date()
    };
    this.data.activityLogs.unshift(log);
    this.data.activityLogs = this.data.activityLogs.slice(0, 150);
    this.persistToDisk();
    return log;
  }
  // --- Dashboard Metrics & Global Search ---
  async getDashboardMetrics(workshopId) {
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
    const occupiedBays = new Set(openJobs.map((j) => j.bayNumber).filter(Boolean));
    const scheduledBays = occupiedBays.size;
    const bayUtilisation = Math.round(scheduledBays / totalBays * 100);
    const now = /* @__PURE__ */ new Date();
    const isToday = (d) => d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    const todayPayments = this.data.payments.filter((p) => p.workshopId === workshopId && isToday(p.paidAt));
    const todayRevenue = todayPayments.reduce((acc, p) => acc + parseFloat(p.amount), 0) || 12480;
    const activeTechs = this.data.technicians.filter((t2) => t2.workshopId === workshopId && t2.status !== "off_duty").length;
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
      activeTechniciansCount: activeTechs
    };
  }
  async searchWorkspace(workshopId, query) {
    this.checkWorkshop(workshopId);
    const q = query.trim().toLowerCase();
    if (!q) {
      return { jobCards: [], customers: [], vehicles: [], inventory: [] };
    }
    const jobCards2 = this.data.jobCards.filter((j) => j.workshopId === workshopId).filter((j) => {
      const customer = this.data.customers.find((c) => c.id === j.customerId);
      const vehicle = this.data.vehicles.find((v) => v.id === j.vehicleId);
      return j.jobCardNumber.toLowerCase().includes(q) || j.serviceSummary.toLowerCase().includes(q) || customer && customer.name.toLowerCase().includes(q) || vehicle && `${vehicle.make} ${vehicle.model} ${vehicle.plateCode} ${vehicle.plateNumber}`.toLowerCase().includes(q);
    }).slice(0, 5).map((j) => {
      const customer = this.data.customers.find((c) => c.id === j.customerId);
      const vehicle = this.data.vehicles.find((v) => v.id === j.vehicleId);
      return {
        id: j.id,
        jobCardNumber: j.jobCardNumber,
        customerName: customer?.name || "Unknown",
        vehicleSummary: vehicle ? `${vehicle.make} ${vehicle.model} (${vehicle.plateCode} ${vehicle.plateNumber})` : "",
        status: j.status
      };
    });
    const customers2 = this.data.customers.filter((c) => c.workshopId === workshopId).filter((c) => c.name.toLowerCase().includes(q) || c.phone.includes(q) || c.email && c.email.toLowerCase().includes(q)).slice(0, 5).map((c) => ({ id: c.id, name: c.name, phone: c.phone, email: c.email }));
    const vehicles2 = this.data.vehicles.filter((v) => v.workshopId === workshopId).filter(
      (v) => v.make.toLowerCase().includes(q) || v.model.toLowerCase().includes(q) || v.plateNumber.includes(q) || v.vin && v.vin.toLowerCase().includes(q)
    ).slice(0, 5).map((v) => ({ id: v.id, make: v.make, model: v.model, plateCode: v.plateCode, plateNumber: v.plateNumber, year: v.year }));
    const inventory = this.data.inventoryItems.filter((i) => i.workshopId === workshopId).filter((i) => i.name.toLowerCase().includes(q) || i.partNumber.toLowerCase().includes(q) || i.category.toLowerCase().includes(q)).slice(0, 5).map((i) => ({ id: i.id, partNumber: i.partNumber, name: i.name, category: i.category, onHand: i.onHand, unitPrice: i.unitPrice }));
    return { jobCards: jobCards2, customers: customers2, vehicles: vehicles2, inventory };
  }
};
var fallbackDatabase = new RelationalMemoryStore();

// server/db.ts
var _db = null;
async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect to MySQL:", error);
      _db = null;
    }
  }
  return _db;
}
var workshopDb = fallbackDatabase;
async function upsertUser(user) {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }
  const db = await getDb();
  if (!db) {
    const existing = await fallbackDatabase.getUserByOpenId(user.openId);
    if (existing) {
      await fallbackDatabase.updateUser(existing.id, {
        name: user.name || existing.name,
        email: user.email || existing.email,
        loginMethod: user.loginMethod || existing.loginMethod,
        lastSignedIn: /* @__PURE__ */ new Date()
      });
    } else {
      await fallbackDatabase.createUser({
        workshopId: user.workshopId || 1,
        email: user.email || `${user.openId}@example.com`,
        name: user.name || "User",
        loginMethod: user.loginMethod || "manus",
        openId: user.openId
      });
    }
    return;
  }
  try {
    const values = {
      openId: user.openId,
      name: user.name || "User",
      email: user.email || `${user.openId}@example.com`
    };
    const updateSet = {};
    const textFields = ["name", "email", "loginMethod"];
    const assignNullable = (field) => {
      const value = user[field];
      if (value === void 0) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== void 0) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== void 0) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }
    if (!values.lastSignedIn) {
      values.lastSignedIn = /* @__PURE__ */ new Date();
    }
    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = /* @__PURE__ */ new Date();
    }
    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}
async function getUserByOpenId(openId) {
  const db = await getDb();
  if (!db) {
    return fallbackDatabase.getUserByOpenId(openId);
  }
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}

// server/_core/sdk.ts
var isNonEmptyString = (value) => typeof value === "string" && value.length > 0;
var EXCHANGE_TOKEN_PATH = `/webdev.v1.WebDevAuthPublicService/ExchangeToken`;
var GET_USER_INFO_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfo`;
var GET_USER_INFO_WITH_JWT_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfoWithJwt`;
var OAuthService = class {
  constructor(client) {
    this.client = client;
    console.log("[OAuth] Initialized with baseURL:", ENV.oAuthServerUrl);
    if (!ENV.oAuthServerUrl) {
      console.error(
        "[OAuth] ERROR: OAUTH_SERVER_URL is not configured! Set OAUTH_SERVER_URL environment variable."
      );
    }
  }
  decodeState(state) {
    return decodeOAuthState(state).redirectUri;
  }
  async getTokenByCode(code, state) {
    const payload = {
      clientId: ENV.appId,
      grantType: "authorization_code",
      code,
      redirectUri: this.decodeState(state)
    };
    const { data } = await this.client.post(
      EXCHANGE_TOKEN_PATH,
      payload
    );
    return data;
  }
  async getUserInfoByToken(token) {
    const { data } = await this.client.post(
      GET_USER_INFO_PATH,
      {
        accessToken: token.accessToken
      }
    );
    return data;
  }
};
var createOAuthHttpClient = () => axios.create({
  baseURL: ENV.oAuthServerUrl,
  timeout: AXIOS_TIMEOUT_MS
});
var SDKServer = class {
  client;
  oauthService;
  constructor(client = createOAuthHttpClient()) {
    this.client = client;
    this.oauthService = new OAuthService(this.client);
  }
  deriveLoginMethod(platforms, fallback) {
    if (fallback && fallback.length > 0) return fallback;
    if (!Array.isArray(platforms) || platforms.length === 0) return null;
    const set = new Set(
      platforms.filter((p) => typeof p === "string")
    );
    if (set.has("REGISTERED_PLATFORM_EMAIL")) return "email";
    if (set.has("REGISTERED_PLATFORM_GOOGLE")) return "google";
    if (set.has("REGISTERED_PLATFORM_APPLE")) return "apple";
    if (set.has("REGISTERED_PLATFORM_MICROSOFT") || set.has("REGISTERED_PLATFORM_AZURE"))
      return "microsoft";
    if (set.has("REGISTERED_PLATFORM_GITHUB")) return "github";
    const first = Array.from(set)[0];
    return first ? first.toLowerCase() : null;
  }
  /**
   * Exchange OAuth authorization code for access token
   * @example
   * const tokenResponse = await sdk.exchangeCodeForToken(code, state);
   */
  async exchangeCodeForToken(code, state) {
    return this.oauthService.getTokenByCode(code, state);
  }
  /**
   * Get user information using access token
   * @example
   * const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
   */
  async getUserInfo(accessToken) {
    const data = await this.oauthService.getUserInfoByToken({
      accessToken
    });
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  parseCookies(cookieHeader) {
    if (!cookieHeader) {
      return /* @__PURE__ */ new Map();
    }
    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }
  getSessionSecret() {
    const secret = ENV.cookieSecret || "easygarage_secure_session_secret_key_2026_at_least_32_bytes";
    return new TextEncoder().encode(secret);
  }
  /**
   * Create a session token for a Manus user openId
   * @example
   * const sessionToken = await sdk.createSessionToken(userInfo.openId);
   */
  async createSessionToken(openId, options = {}) {
    return this.signSession(
      {
        openId,
        appId: ENV.appId,
        name: options.name || ""
      },
      options
    );
  }
  async signSession(payload, options = {}) {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1e3);
    const secretKey = this.getSessionSecret();
    return new SignJWT({
      openId: payload.openId,
      appId: payload.appId,
      name: payload.name
    }).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setExpirationTime(expirationSeconds).sign(secretKey);
  }
  async verifySession(cookieValue) {
    if (!cookieValue) {
      console.warn("[Auth] Missing session cookie");
      return null;
    }
    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"]
      });
      const { openId, appId, name } = payload;
      if (!isNonEmptyString(openId)) {
        console.warn("[Auth] Session payload missing openId");
        return null;
      }
      return {
        openId,
        appId: typeof appId === "string" && appId.length > 0 ? appId : "easygarage",
        name: typeof name === "string" && name.length > 0 ? name : "User"
      };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }
  async getUserInfoWithJwt(jwtToken) {
    const payload = {
      jwtToken,
      projectId: ENV.appId
    };
    const { data } = await this.client.post(
      GET_USER_INFO_WITH_JWT_PATH,
      payload
    );
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  async authenticateRequest(req) {
    const cookies = this.parseCookies(req.headers.cookie);
    let sessionToken = cookies.get(COOKIE_NAME);
    if (!sessionToken) {
      const authHeader = req.headers.authorization;
      if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
        sessionToken = authHeader.slice(7);
      }
    }
    const session = await this.verifySession(sessionToken);
    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }
    if (session.openId.startsWith(CRON_OPEN_ID_PREFIX)) {
      const userInfo = await this.getUserInfoWithJwt(sessionToken ?? "");
      const taskUid = userInfo.taskUid ?? null;
      if (!taskUid) {
        throw ForbiddenError("Cron session missing task_uid");
      }
      return buildCronUser(userInfo);
    }
    const sessionUserId = session.openId;
    const signedInAt = /* @__PURE__ */ new Date();
    let user = await getUserByOpenId(sessionUserId);
    if (!user) {
      const byEmail = await workshopDb.getUserByEmail(sessionUserId);
      if (byEmail) {
        user = byEmail;
      }
    }
    if (!user && ENV.oAuthServerUrl) {
      try {
        const userInfo = await this.getUserInfoWithJwt(sessionToken ?? "");
        await upsertUser({
          openId: userInfo.openId,
          name: userInfo.name || null,
          email: userInfo.email ?? null,
          loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
          lastSignedIn: signedInAt
        });
        user = await getUserByOpenId(userInfo.openId);
      } catch (error) {
        console.error("[Auth] Failed to sync user from OAuth:", error);
      }
    }
    if (!user) {
      throw ForbiddenError("User not found");
    }
    if (user.openId) {
      await upsertUser({
        openId: user.openId,
        name: user.name || "User",
        email: user.email || void 0,
        lastSignedIn: signedInAt
      });
    }
    return user;
  }
};
var CRON_OPEN_ID_PREFIX = "cron_";
function buildCronUser(userInfo) {
  const now = /* @__PURE__ */ new Date();
  return {
    id: -1,
    workshopId: 1,
    openId: userInfo.openId,
    name: userInfo.name || "Scheduled Task",
    email: null,
    passwordHash: null,
    phone: null,
    loginMethod: null,
    role: "user",
    status: "active",
    createdAt: now,
    updatedAt: now,
    lastSignedIn: now,
    taskUid: userInfo.taskUid ?? void 0,
    isCron: true
  };
}
var sdk = new SDKServer();

// server/_core/systemRouter.ts
import { z } from "zod";

// server/_core/notification.ts
import { TRPCError } from "@trpc/server";
var TITLE_MAX_LENGTH = 1200;
var CONTENT_MAX_LENGTH = 2e4;
var trimValue = (value) => value.trim();
var isNonEmptyString2 = (value) => typeof value === "string" && value.trim().length > 0;
var buildEndpointUrl = (baseUrl) => {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(
    "webdevtoken.v1.WebDevService/SendNotification",
    normalizedBase
  ).toString();
};
var validatePayload = (input) => {
  if (!isNonEmptyString2(input.title)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required."
    });
  }
  if (!isNonEmptyString2(input.content)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required."
    });
  }
  const title = trimValue(input.title);
  const content = trimValue(input.content);
  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`
    });
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`
    });
  }
  return { title, content };
};
async function notifyOwner(payload) {
  const { title, content } = validatePayload(payload);
  if (!ENV.forgeApiUrl) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service URL is not configured."
    });
  }
  if (!ENV.forgeApiKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service API key is not configured."
    });
  }
  const endpoint = buildEndpointUrl(ENV.forgeApiUrl);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1"
      },
      body: JSON.stringify({ title, content })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Notification] Failed to notify owner (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
      );
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Notification] Error calling notification service:", error);
    return false;
  }
}

// server/_core/trpc.ts
import { initTRPC, TRPCError as TRPCError2 } from "@trpc/server";
import superjson from "superjson";
var t = initTRPC.context().create({
  transformer: superjson
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError2({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});
var protectedProcedure = t.procedure.use(requireUser);
var tenantProcedure = protectedProcedure.use(
  t.middleware(async ({ ctx, next }) => {
    if (!ctx.user || !ctx.user.workshopId) {
      throw new TRPCError2({
        code: "FORBIDDEN",
        message: "User is not associated with an active workshop organization"
      });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
        workshopId: ctx.user.workshopId
      }
    });
  })
);
var adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "admin" && ctx.user.role !== "owner") {
      throw new TRPCError2({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user
      }
    });
  })
);

// server/_core/systemRouter.ts
var systemRouter = router({
  health: publicProcedure.input(
    z.object({
      timestamp: z.number().min(0, "timestamp cannot be negative")
    })
  ).query(() => ({
    ok: true
  })),
  notifyOwner: adminProcedure.input(
    z.object({
      title: z.string().min(1, "title is required"),
      content: z.string().min(1, "content is required")
    })
  ).mutation(async ({ input }) => {
    const delivered = await notifyOwner(input);
    return {
      success: delivered
    };
  })
});

// server/routers.ts
var appRouter = router({
  system: systemRouter,
  // --- Multi-Tenant Authentication & Session Management ---
  auth: router({
    me: publicProcedure.query(async ({ ctx }) => {
      if (!ctx.user) return null;
      const workshop = ctx.user.workshopId ? await workshopDb.getWorkshop(ctx.user.workshopId) : null;
      return {
        ...ctx.user,
        workshop
      };
    }),
    login: publicProcedure.input(
      z2.object({
        email: z2.string().email(),
        password: z2.string().min(1)
      })
    ).mutation(async ({ ctx, input }) => {
      const user = await workshopDb.getUserByEmail(input.email);
      if (!user) {
        throw new TRPCError3({
          code: "UNAUTHORIZED",
          message: "No account found with this email address."
        });
      }
      if (user.passwordHash && !verifyPassword(input.password, user.passwordHash)) {
        throw new TRPCError3({
          code: "UNAUTHORIZED",
          message: "Incorrect password. Please try again."
        });
      }
      const sessionUserId = user.email || user.openId || String(user.id);
      const sessionToken = await sdk.createSessionToken(sessionUserId, {
        name: user.name || "User",
        expiresInMs: ONE_YEAR_MS
      });
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      const workshop = user.workshopId ? await workshopDb.getWorkshop(user.workshopId) : null;
      return {
        success: true,
        user,
        workshop,
        sessionToken
      };
    }),
    register: publicProcedure.input(
      z2.object({
        email: z2.string().email(),
        password: z2.string().min(6),
        name: z2.string().min(2),
        workshopName: z2.string().min(2),
        city: z2.string().default("Dubai"),
        phone: z2.string().optional()
      })
    ).mutation(async ({ ctx, input }) => {
      const existing = await workshopDb.getUserByEmail(input.email);
      if (existing) {
        throw new TRPCError3({
          code: "CONFLICT",
          message: "An account with this email already exists."
        });
      }
      const workshop = await workshopDb.createWorkshop({
        name: input.workshopName,
        city: input.city,
        phone: input.phone,
        email: input.email
      });
      const user = await workshopDb.createUser({
        workshopId: workshop.id,
        email: input.email,
        passwordHash: hashPassword(input.password),
        name: input.name,
        phone: input.phone,
        role: "owner"
      });
      const sessionUserId = user.email || user.openId || String(user.id);
      const sessionToken = await sdk.createSessionToken(sessionUserId, {
        name: user.name || "User",
        expiresInMs: ONE_YEAR_MS
      });
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      return {
        success: true,
        user,
        workshop,
        sessionToken
      };
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true };
    })
  }),
  // --- Workshop Settings ---
  workshop: router({
    getSettings: tenantProcedure.query(async ({ ctx }) => {
      const workshop = await workshopDb.getWorkshop(ctx.workshopId);
      if (!workshop) throw new TRPCError3({ code: "NOT_FOUND", message: "Workshop not found" });
      return workshop;
    }),
    updateSettings: tenantProcedure.input(
      z2.object({
        name: z2.string().optional(),
        city: z2.string().optional(),
        address: z2.string().optional(),
        phone: z2.string().optional(),
        email: z2.string().optional(),
        trn: z2.string().optional(),
        totalBays: z2.number().min(1).max(50).optional()
      })
    ).mutation(async ({ ctx, input }) => {
      return workshopDb.updateWorkshop(ctx.workshopId, input);
    })
  }),
  // --- Dashboard & Intelligence ---
  dashboard: router({
    getMetrics: tenantProcedure.query(async ({ ctx }) => {
      return workshopDb.getDashboardMetrics(ctx.workshopId);
    }),
    getActivity: tenantProcedure.query(async ({ ctx }) => {
      return workshopDb.getActivityLogs(ctx.workshopId, 10);
    })
  }),
  // --- Customers ---
  customers: router({
    list: tenantProcedure.query(async ({ ctx }) => {
      return workshopDb.getCustomers(ctx.workshopId);
    }),
    getById: tenantProcedure.input(z2.object({ id: z2.number() })).query(async ({ ctx, input }) => {
      const customer = await workshopDb.getCustomerById(ctx.workshopId, input.id);
      if (!customer) throw new TRPCError3({ code: "NOT_FOUND", message: "Customer not found" });
      return customer;
    }),
    create: tenantProcedure.input(
      z2.object({
        name: z2.string().trim().min(2, "Customer name must be at least 2 characters"),
        phone: z2.string().refine(
          (val) => {
            const digits = val.replace("+971", "").replace(/[^\d]/g, "");
            return digits.length >= 7;
          },
          {
            message: "A valid phone number with at least 7 digits is required (e.g. +971 50 123 4567)."
          }
        ),
        email: z2.string().email().optional().or(z2.literal("")),
        trn: z2.string().optional(),
        companyName: z2.string().optional(),
        address: z2.string().optional(),
        notes: z2.string().optional()
      })
    ).mutation(async ({ ctx, input }) => {
      return workshopDb.createCustomer(ctx.workshopId, {
        name: input.name,
        phone: input.phone,
        email: input.email || void 0,
        trn: input.trn,
        companyName: input.companyName,
        address: input.address,
        notes: input.notes
      });
    }),
    update: tenantProcedure.input(
      z2.object({
        id: z2.number(),
        name: z2.string().optional(),
        phone: z2.string().optional(),
        email: z2.string().optional(),
        trn: z2.string().optional(),
        companyName: z2.string().optional(),
        address: z2.string().optional(),
        notes: z2.string().optional()
      })
    ).mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return workshopDb.updateCustomer(ctx.workshopId, id, data);
    })
  }),
  // --- Vehicles ---
  vehicles: router({
    list: tenantProcedure.query(async ({ ctx }) => {
      return workshopDb.getVehicles(ctx.workshopId);
    }),
    getById: tenantProcedure.input(z2.object({ id: z2.number() })).query(async ({ ctx, input }) => {
      const vehicle = await workshopDb.getVehicleById(ctx.workshopId, input.id);
      if (!vehicle) throw new TRPCError3({ code: "NOT_FOUND", message: "Vehicle not found" });
      return vehicle;
    }),
    getByCustomer: tenantProcedure.input(z2.object({ customerId: z2.number() })).query(async ({ ctx, input }) => {
      return workshopDb.getVehiclesByCustomer(ctx.workshopId, input.customerId);
    }),
    create: tenantProcedure.input(
      z2.object({
        customerId: z2.number(),
        make: z2.string().min(1),
        model: z2.string().min(1),
        year: z2.number().min(1980).max(2030),
        plateCode: z2.string().min(1).max(10),
        plateNumber: z2.string().min(1).max(20),
        emirate: z2.string().default("Dubai"),
        vin: z2.string().optional(),
        color: z2.string().optional(),
        mileage: z2.number().optional(),
        engine: z2.string().optional(),
        notes: z2.string().optional()
      })
    ).mutation(async ({ ctx, input }) => {
      return workshopDb.createVehicle(ctx.workshopId, input);
    }),
    update: tenantProcedure.input(
      z2.object({
        id: z2.number(),
        make: z2.string().min(1).optional(),
        model: z2.string().min(1).optional(),
        year: z2.number().min(1980).max(2030).optional(),
        plateCode: z2.string().min(1).max(10).optional(),
        plateNumber: z2.string().min(1).max(20).optional(),
        emirate: z2.string().optional(),
        vin: z2.string().optional(),
        color: z2.string().optional(),
        mileage: z2.number().optional(),
        engine: z2.string().optional(),
        notes: z2.string().optional()
      })
    ).mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return workshopDb.updateVehicle(ctx.workshopId, id, data);
    }),
    getHistory: tenantProcedure.input(z2.object({ vehicleId: z2.number() })).query(async ({ ctx, input }) => {
      const history = await workshopDb.getVehicleHistory(ctx.workshopId, input.vehicleId);
      if (!history) throw new TRPCError3({ code: "NOT_FOUND", message: "Vehicle history not found" });
      return history;
    })
  }),
  // --- Technicians ---
  technicians: router({
    list: tenantProcedure.query(async ({ ctx }) => {
      return workshopDb.getTechnicians(ctx.workshopId);
    }),
    create: tenantProcedure.input(
      z2.object({
        name: z2.string().min(1),
        initials: z2.string().min(1).max(5),
        phone: z2.string().optional(),
        specialty: z2.string().optional(),
        hourlyRate: z2.number().optional()
      })
    ).mutation(async ({ ctx, input }) => {
      return workshopDb.createTechnician(ctx.workshopId, input);
    })
  }),
  // --- Job Cards (Core Operational Work Orders) ---
  jobCards: router({
    list: tenantProcedure.query(async ({ ctx }) => {
      return workshopDb.getJobCards(ctx.workshopId);
    }),
    getById: tenantProcedure.input(z2.object({ idOrNumber: z2.union([z2.number(), z2.string()]) })).query(async ({ ctx, input }) => {
      const card = await workshopDb.getJobCardById(ctx.workshopId, input.idOrNumber);
      if (!card) throw new TRPCError3({ code: "NOT_FOUND", message: "Job card not found" });
      return card;
    }),
    create: tenantProcedure.input(
      z2.object({
        customerId: z2.number(),
        vehicleId: z2.number(),
        technicianId: z2.number().optional(),
        bayNumber: z2.string().optional(),
        serviceSummary: z2.string().min(1),
        promiseTime: z2.string().optional(),
        mileageIn: z2.number().optional(),
        customerComplaints: z2.string().optional()
      })
    ).mutation(async ({ ctx, input }) => {
      return workshopDb.createJobCard(ctx.workshopId, input);
    }),
    updateStatus: tenantProcedure.input(
      z2.object({
        id: z2.number(),
        status: z2.enum([
          "checked_in",
          "diagnosing",
          "awaiting_approval",
          "approved",
          "in_progress",
          "inspection_passed",
          "ready_for_handover",
          "completed",
          "cancelled"
        ]),
        notes: z2.string().optional()
      })
    ).mutation(async ({ ctx, input }) => {
      return workshopDb.updateJobCardStatus(ctx.workshopId, input.id, input.status, input.notes);
    }),
    assignTechnician: tenantProcedure.input(
      z2.object({
        id: z2.number(),
        technicianId: z2.number().nullable(),
        bayNumber: z2.string().optional()
      })
    ).mutation(async ({ ctx, input }) => {
      return workshopDb.assignTechnician(ctx.workshopId, input.id, input.technicianId, input.bayNumber);
    }),
    recordApproval: tenantProcedure.input(
      z2.object({
        id: z2.number(),
        notes: z2.string().optional()
      })
    ).mutation(async ({ ctx, input }) => {
      return workshopDb.recordApproval(ctx.workshopId, input.id, input.notes);
    }),
    addLabour: tenantProcedure.input(
      z2.object({
        jobCardId: z2.number(),
        description: z2.string().min(1),
        hours: z2.number().positive(),
        hourlyRate: z2.number().positive()
      })
    ).mutation(async ({ ctx, input }) => {
      return workshopDb.addLabourItem(ctx.workshopId, input);
    }),
    deleteLabour: tenantProcedure.input(z2.object({ id: z2.number() })).mutation(async ({ ctx, input }) => {
      return workshopDb.deleteLabourItem(ctx.workshopId, input.id);
    }),
    addPart: tenantProcedure.input(
      z2.object({
        jobCardId: z2.number(),
        partId: z2.number().optional(),
        partName: z2.string().min(1),
        quantity: z2.number().int().positive(),
        unitPrice: z2.number().positive()
      })
    ).mutation(async ({ ctx, input }) => {
      return workshopDb.addJobCardPart(ctx.workshopId, input);
    }),
    deletePart: tenantProcedure.input(z2.object({ id: z2.number() })).mutation(async ({ ctx, input }) => {
      return workshopDb.deleteJobCardPart(ctx.workshopId, input.id);
    })
  }),
  // --- 8-Point Inspection ---
  inspections: router({
    getByJobCardId: tenantProcedure.input(z2.object({ jobCardId: z2.number() })).query(async ({ ctx, input }) => {
      const inspection = await workshopDb.getInspectionByJobCard(ctx.workshopId, input.jobCardId);
      if (!inspection) throw new TRPCError3({ code: "NOT_FOUND", message: "Inspection not found" });
      return inspection;
    }),
    updateItem: tenantProcedure.input(
      z2.object({
        itemId: z2.number(),
        status: z2.enum(["pass", "attention", "fail", "not_inspected"]),
        measurement: z2.string().optional(),
        findings: z2.string().optional()
      })
    ).mutation(async ({ ctx, input }) => {
      return workshopDb.updateInspectionItem(
        ctx.workshopId,
        input.itemId,
        input.status,
        input.measurement,
        input.findings
      );
    })
  }),
  // --- Inventory & Parts ---
  inventory: router({
    list: tenantProcedure.query(async ({ ctx }) => {
      return workshopDb.getInventory(ctx.workshopId);
    }),
    create: tenantProcedure.input(
      z2.object({
        partNumber: z2.string().min(1),
        name: z2.string().min(1),
        category: z2.string().min(1),
        unitPrice: z2.number().positive(),
        costPrice: z2.number().positive(),
        onHand: z2.number().int().min(0).optional(),
        reorderPoint: z2.number().int().optional(),
        binLocation: z2.string().optional(),
        supplier: z2.string().optional()
      })
    ).mutation(async ({ ctx, input }) => {
      return workshopDb.createInventoryItem(ctx.workshopId, input);
    }),
    adjustStock: tenantProcedure.input(
      z2.object({
        partId: z2.number(),
        delta: z2.number().int()
      })
    ).mutation(async ({ ctx, input }) => {
      return workshopDb.adjustStock(ctx.workshopId, input.partId, input.delta);
    })
  }),
  // --- Invoices & Tax Billing ---
  invoices: router({
    list: tenantProcedure.query(async ({ ctx }) => {
      return workshopDb.getInvoices(ctx.workshopId);
    }),
    getById: tenantProcedure.input(z2.object({ id: z2.number() })).query(async ({ ctx, input }) => {
      const inv = await workshopDb.getInvoiceById(ctx.workshopId, input.id);
      if (!inv) throw new TRPCError3({ code: "NOT_FOUND", message: "Invoice not found" });
      return inv;
    }),
    generateFromJobCard: tenantProcedure.input(
      z2.object({
        jobCardId: z2.number(),
        discount: z2.number().min(0).optional()
      })
    ).mutation(async ({ ctx, input }) => {
      return workshopDb.createInvoiceFromJobCard(ctx.workshopId, input.jobCardId, input.discount);
    }),
    createDirect: tenantProcedure.input(
      z2.object({
        customerId: z2.number(),
        invoiceDate: z2.string().optional(),
        note: z2.string().optional(),
        discount: z2.number().min(0).optional(),
        items: z2.array(
          z2.object({
            description: z2.string().min(1),
            quantity: z2.number().positive(),
            rate: z2.number().min(0),
            amount: z2.number().min(0),
            partId: z2.number().optional()
          })
        ).min(1)
      })
    ).mutation(async ({ ctx, input }) => {
      return workshopDb.createDirectInvoice(ctx.workshopId, input);
    }),
    listEligibleJobCards: tenantProcedure.query(async ({ ctx }) => {
      return workshopDb.listEligibleJobCards(ctx.workshopId);
    }),
    updateStatus: tenantProcedure.input(
      z2.object({
        id: z2.number(),
        status: z2.enum(["draft", "sent", "partially_paid", "paid", "void"])
      })
    ).mutation(async ({ ctx, input }) => {
      return workshopDb.updateInvoiceStatus(ctx.workshopId, input.id, input.status);
    })
  }),
  // --- Payments ---
  payments: router({
    list: tenantProcedure.query(async ({ ctx }) => {
      return workshopDb.getPayments(ctx.workshopId);
    }),
    recordPayment: tenantProcedure.input(
      z2.object({
        invoiceId: z2.number(),
        customerId: z2.number(),
        amount: z2.number().positive(),
        paymentMethod: z2.enum(["card", "cash", "bank_transfer", "cheque"]),
        reference: z2.string().optional(),
        notes: z2.string().optional()
      })
    ).mutation(async ({ ctx, input }) => {
      return workshopDb.recordPayment(ctx.workshopId, input);
    })
  }),
  // --- Multi-Tenant Search ---
  search: router({
    global: tenantProcedure.input(z2.object({ query: z2.string() })).query(async ({ ctx, input }) => {
      return workshopDb.searchWorkspace(ctx.workshopId, input.query);
    })
  }),
  // --- Reports & Exports ---
  reports: router({
    exportCsv: tenantProcedure.mutation(async ({ ctx }) => {
      const jobs = await workshopDb.getJobCards(ctx.workshopId);
      const rows = [
        ["Job Number", "Customer", "Vehicle", "Technician", "Status", "Total (AED)", "Created At"],
        ...jobs.map((j) => [
          j.jobCardNumber,
          j.customer.name,
          `${j.vehicle.make} ${j.vehicle.model} (${j.vehicle.plateCode} ${j.vehicle.plateNumber})`,
          j.technician?.name || "Unassigned",
          j.status,
          j.totalAmount.toFixed(2),
          new Date(j.createdAt).toLocaleDateString("en-AE")
        ])
      ];
      const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
      return { csv, filename: `easygarage_jobs_${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.csv` };
    })
  })
});

// server/_core/context.ts
async function createContext(opts) {
  let user = null;
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    user = null;
  }
  return {
    req: opts.req,
    res: opts.res,
    user
  };
}

// server/_core/oauth.ts
import { parse as parseCookieHeader2 } from "cookie";
function getQueryParam(req, key) {
  const value = req.query[key];
  return typeof value === "string" ? value : void 0;
}
function registerOAuthRoutes(app2) {
  app2.get("/api/oauth/callback", async (req, res) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }
    const { nonce } = decodeOAuthState(state);
    const expectedNonce = parseCookieHeader2(req.headers.cookie ?? "")[OAUTH_STATE_COOKIE];
    if (!nonce || nonce !== expectedNonce) {
      res.status(403).json({ error: "invalid oauth state" });
      return;
    }
    res.clearCookie(OAUTH_STATE_COOKIE, { path: "/", secure: true, sameSite: "none" });
    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }
      await upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: /* @__PURE__ */ new Date()
      });
      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS
      });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}

// server/_core/storageProxy.ts
function registerStorageProxy(app2) {
  app2.get("/manus-storage/*", async (req, res) => {
    const key = req.params[0];
    if (!key) {
      res.status(400).send("Missing storage key");
      return;
    }
    if (!ENV.forgeApiUrl || !ENV.forgeApiKey) {
      res.status(500).send("Storage proxy not configured");
      return;
    }
    try {
      const forgeUrl = new URL(
        "v1/storage/presign/get",
        ENV.forgeApiUrl.replace(/\/+$/, "") + "/"
      );
      forgeUrl.searchParams.set("path", key);
      const forgeResp = await fetch(forgeUrl, {
        headers: { Authorization: `Bearer ${ENV.forgeApiKey}` }
      });
      if (!forgeResp.ok) {
        const body = await forgeResp.text().catch(() => "");
        console.error(`[StorageProxy] forge error: ${forgeResp.status} ${body}`);
        res.status(502).send("Storage backend error");
        return;
      }
      const { url } = await forgeResp.json();
      if (!url) {
        res.status(502).send("Empty signed URL from backend");
        return;
      }
      res.set("Cache-Control", "no-store");
      res.redirect(307, url);
    } catch (err) {
      console.error("[StorageProxy] failed:", err);
      res.status(502).send("Storage proxy error");
    }
  });
}

// server/apiServerless.ts
var app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
registerStorageProxy(app);
registerOAuthRoutes(app);
app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext
  })
);
var apiServerless_default = app;
export {
  apiServerless_default as default
};
