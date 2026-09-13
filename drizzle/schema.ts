import { boolean, decimal, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * EasyGarage SaaS Multi-Tenant Database Schema
 * Every workshop-owned record is explicitly scoped by `workshopId`.
 */

// 1. Workshops / Organizations (Tenants)
export const workshops = mysqlTable("workshops", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  city: varchar("city", { length: 100 }).default("Dubai").notNull(),
  address: text("address"),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 320 }),
  trn: varchar("trn", { length: 50 }), // UAE Tax Registration Number (15 digits)
  vatRate: decimal("vatRate", { precision: 5, scale: 4 }).default("0.0500").notNull(), // 5% UAE VAT
  currency: varchar("currency", { length: 10 }).default("AED").notNull(),
  totalBays: int("totalBays").default(16).notNull(),
  plan: mysqlEnum("plan", ["starter", "pro", "enterprise"]).default("pro").notNull(),
  subscriptionStatus: mysqlEnum("subscriptionStatus", ["trial", "active", "past_due", "cancelled"]).default("trial").notNull(),
  trialEndsAt: timestamp("trialEndsAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Workshop = typeof workshops.$inferSelect;
export type InsertWorkshop = typeof workshops.$inferInsert;

// 2. Users (Workshop Members & Staff)
export const users = mysqlTable("users", {
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
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// 3. Customers
export const customers = mysqlTable("customers", {
  id: int("id").autoincrement().primaryKey(),
  workshopId: int("workshopId").notNull().references(() => workshops.id),
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }).notNull(),
  email: varchar("email", { length: 320 }),
  trn: varchar("trn", { length: 50 }), // For corporate fleet customers
  companyName: varchar("companyName", { length: 255 }),
  address: text("address"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = typeof customers.$inferInsert;

// 4. Vehicles
export const vehicles = mysqlTable("vehicles", {
  id: int("id").autoincrement().primaryKey(),
  workshopId: int("workshopId").notNull().references(() => workshops.id),
  customerId: int("customerId").notNull().references(() => customers.id),
  make: varchar("make", { length: 100 }).notNull(),
  model: varchar("model", { length: 100 }).notNull(),
  year: int("year").notNull(),
  plateCode: varchar("plateCode", { length: 10 }).notNull(), // e.g. "D", "AD", "DXB"
  plateNumber: varchar("plateNumber", { length: 20 }).notNull(), // e.g. "48291"
  emirate: varchar("emirate", { length: 50 }).default("Dubai").notNull(),
  vin: varchar("vin", { length: 50 }),
  color: varchar("color", { length: 50 }),
  mileage: int("mileage").default(0).notNull(),
  engine: varchar("engine", { length: 50 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Vehicle = typeof vehicles.$inferSelect;
export type InsertVehicle = typeof vehicles.$inferInsert;

// 5. Technicians
export const technicians = mysqlTable("technicians", {
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
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Technician = typeof technicians.$inferSelect;
export type InsertTechnician = typeof technicians.$inferInsert;

// 6. Job Cards (Work Orders)
export const jobCards = mysqlTable("jobCards", {
  id: int("id").autoincrement().primaryKey(),
  workshopId: int("workshopId").notNull().references(() => workshops.id),
  jobCardNumber: varchar("jobCardNumber", { length: 50 }).notNull(), // e.g. "EG-2418"
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
    "cancelled",
  ]).default("checked_in").notNull(),
  promiseTime: varchar("promiseTime", { length: 100 }),
  mileageIn: int("mileageIn"),
  customerComplaints: text("customerComplaints"),
  approvalNotes: text("approvalNotes"),
  approvedAt: timestamp("approvedAt"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type JobCard = typeof jobCards.$inferSelect;
export type InsertJobCard = typeof jobCards.$inferInsert;

// 7. Inspections
export const inspections = mysqlTable("inspections", {
  id: int("id").autoincrement().primaryKey(),
  workshopId: int("workshopId").notNull().references(() => workshops.id),
  jobCardId: int("jobCardId").notNull().references(() => jobCards.id),
  completedBy: int("completedBy").references(() => technicians.id),
  status: mysqlEnum("status", ["in_progress", "completed", "requires_attention"]).default("in_progress").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Inspection = typeof inspections.$inferSelect;
export type InsertInspection = typeof inspections.$inferInsert;

// 8. Inspection Checklist Items
export const inspectionItems = mysqlTable("inspectionItems", {
  id: int("id").autoincrement().primaryKey(),
  workshopId: int("workshopId").notNull().references(() => workshops.id),
  inspectionId: int("inspectionId").notNull().references(() => inspections.id),
  checkKey: varchar("checkKey", { length: 50 }).notNull(), // exterior, lights, tyres, fluids, brakes, battery, ac, road_test
  checkTitle: varchar("checkTitle", { length: 100 }).notNull(),
  status: mysqlEnum("status", ["pass", "attention", "fail", "not_inspected"]).default("pass").notNull(),
  measurement: varchar("measurement", { length: 50 }), // e.g. "3.2 mm"
  findings: text("findings"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type InspectionItem = typeof inspectionItems.$inferSelect;
export type InsertInspectionItem = typeof inspectionItems.$inferInsert;

// 9. Labour Items
export const labourItems = mysqlTable("labourItems", {
  id: int("id").autoincrement().primaryKey(),
  workshopId: int("workshopId").notNull().references(() => workshops.id),
  jobCardId: int("jobCardId").notNull().references(() => jobCards.id),
  description: varchar("description", { length: 255 }).notNull(),
  hours: decimal("hours", { precision: 5, scale: 2 }).notNull(),
  hourlyRate: decimal("hourlyRate", { precision: 10, scale: 2 }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type LabourItem = typeof labourItems.$inferSelect;
export type InsertLabourItem = typeof labourItems.$inferInsert;

// 10. Inventory Items (Parts Catalog & Stock)
export const inventoryItems = mysqlTable("inventoryItems", {
  id: int("id").autoincrement().primaryKey(),
  workshopId: int("workshopId").notNull().references(() => workshops.id),
  partNumber: varchar("partNumber", { length: 100 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(), // Filters, Fluids, Brakes, Tyres, Electrical, Suspension
  unitPrice: decimal("unitPrice", { precision: 10, scale: 2 }).notNull(), // Retail price
  costPrice: decimal("costPrice", { precision: 10, scale: 2 }).notNull(),
  onHand: int("onHand").default(0).notNull(),
  reorderPoint: int("reorderPoint").default(5).notNull(),
  binLocation: varchar("binLocation", { length: 50 }),
  supplier: varchar("supplier", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type InventoryItem = typeof inventoryItems.$inferSelect;
export type InsertInventoryItem = typeof inventoryItems.$inferInsert;

// 11. Job Card Parts (Parts Allocated to a Job)
export const jobCardParts = mysqlTable("jobCardParts", {
  id: int("id").autoincrement().primaryKey(),
  workshopId: int("workshopId").notNull().references(() => workshops.id),
  jobCardId: int("jobCardId").notNull().references(() => jobCards.id),
  partId: int("partId").references(() => inventoryItems.id),
  partName: varchar("partName", { length: 255 }).notNull(),
  quantity: int("quantity").notNull(),
  unitPrice: decimal("unitPrice", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("totalPrice", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type JobCardPart = typeof jobCardParts.$inferSelect;
export type InsertJobCardPart = typeof jobCardParts.$inferInsert;

// 12. Invoices (UAE Tax Invoices)
export const invoices = mysqlTable("invoices", {
  id: int("id").autoincrement().primaryKey(),
  workshopId: int("workshopId").notNull().references(() => workshops.id),
  jobCardId: int("jobCardId").references(() => jobCards.id), // Nullable for direct invoices without job card
  customerId: int("customerId").notNull().references(() => customers.id),
  invoiceNumber: varchar("invoiceNumber", { length: 50 }).notNull().unique(), // e.g. "INV-2418"
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  discount: decimal("discount", { precision: 10, scale: 2 }).default("0.00").notNull(),
  vatRate: decimal("vatRate", { precision: 5, scale: 4 }).default("0.0500").notNull(),
  vatAmount: decimal("vatAmount", { precision: 10, scale: 2 }).notNull(),
  totalAmount: decimal("totalAmount", { precision: 10, scale: 2 }).notNull(),
  amountPaid: decimal("amountPaid", { precision: 10, scale: 2 }).default("0.00").notNull(),
  status: mysqlEnum("status", ["draft", "sent", "partially_paid", "paid", "void"]).default("draft").notNull(),
  trn: varchar("trn", { length: 50 }),
  note: text("note"),
  itemsJson: text("itemsJson"), // Serialized line items for direct invoices
  issuedAt: timestamp("issuedAt").defaultNow().notNull(),
  dueDate: timestamp("dueDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = typeof invoices.$inferInsert;

// 13. Payments (Settlement Records)
export const payments = mysqlTable("payments", {
  id: int("id").autoincrement().primaryKey(),
  workshopId: int("workshopId").notNull().references(() => workshops.id),
  invoiceId: int("invoiceId").notNull().references(() => invoices.id),
  customerId: int("customerId").notNull().references(() => customers.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: mysqlEnum("paymentMethod", ["card", "cash", "bank_transfer", "cheque"]).notNull(),
  reference: varchar("reference", { length: 100 }),
  notes: text("notes"),
  paidAt: timestamp("paidAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;

// 14. Activity Logs (Audit Trail)
export const activityLogs = mysqlTable("activityLogs", {
  id: int("id").autoincrement().primaryKey(),
  workshopId: int("workshopId").notNull().references(() => workshops.id),
  userId: int("userId").references(() => users.id),
  jobCardId: int("jobCardId").references(() => jobCards.id),
  title: varchar("title", { length: 255 }).notNull(),
  copy: text("copy").notNull(),
  tone: varchar("tone", { length: 20 }).default("blue").notNull(), // green, amber, blue, steel
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = typeof activityLogs.$inferInsert;