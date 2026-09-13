import { relations } from "drizzle-orm";
import {
  activityLogs,
  customers,
  inspectionItems,
  inspections,
  inventoryItems,
  invoices,
  jobCardParts,
  jobCards,
  labourItems,
  payments,
  technicians,
  users,
  vehicles,
  workshops,
} from "./schema";

export const workshopsRelations = relations(workshops, ({ many }) => ({
  users: many(users),
  customers: many(customers),
  vehicles: many(vehicles),
  technicians: many(technicians),
  jobCards: many(jobCards),
  inventoryItems: many(inventoryItems),
  invoices: many(invoices),
  payments: many(payments),
  activityLogs: many(activityLogs),
}));

export const usersRelations = relations(users, ({ one }) => ({
  workshop: one(workshops, {
    fields: [users.workshopId],
    references: [workshops.id],
  }),
}));

export const customersRelations = relations(customers, ({ one, many }) => ({
  workshop: one(workshops, {
    fields: [customers.workshopId],
    references: [workshops.id],
  }),
  vehicles: many(vehicles),
  jobCards: many(jobCards),
  invoices: many(invoices),
}));

export const vehiclesRelations = relations(vehicles, ({ one, many }) => ({
  workshop: one(workshops, {
    fields: [vehicles.workshopId],
    references: [workshops.id],
  }),
  customer: one(customers, {
    fields: [vehicles.customerId],
    references: [customers.id],
  }),
  jobCards: many(jobCards),
}));

export const techniciansRelations = relations(technicians, ({ one, many }) => ({
  workshop: one(workshops, {
    fields: [technicians.workshopId],
    references: [workshops.id],
  }),
  user: one(users, {
    fields: [technicians.userId],
    references: [users.id],
  }),
  jobCards: many(jobCards),
}));

export const jobCardsRelations = relations(jobCards, ({ one, many }) => ({
  workshop: one(workshops, {
    fields: [jobCards.workshopId],
    references: [workshops.id],
  }),
  customer: one(customers, {
    fields: [jobCards.customerId],
    references: [customers.id],
  }),
  vehicle: one(vehicles, {
    fields: [jobCards.vehicleId],
    references: [vehicles.id],
  }),
  technician: one(technicians, {
    fields: [jobCards.technicianId],
    references: [technicians.id],
  }),
  inspection: one(inspections, {
    fields: [jobCards.id],
    references: [inspections.jobCardId],
  }),
  labourItems: many(labourItems),
  jobCardParts: many(jobCardParts),
  invoice: one(invoices, {
    fields: [jobCards.id],
    references: [invoices.jobCardId],
  }),
  activityLogs: many(activityLogs),
}));

export const inspectionsRelations = relations(inspections, ({ one, many }) => ({
  workshop: one(workshops, {
    fields: [inspections.workshopId],
    references: [workshops.id],
  }),
  jobCard: one(jobCards, {
    fields: [inspections.jobCardId],
    references: [jobCards.id],
  }),
  completedByTechnician: one(technicians, {
    fields: [inspections.completedBy],
    references: [technicians.id],
  }),
  items: many(inspectionItems),
}));

export const inspectionItemsRelations = relations(inspectionItems, ({ one }) => ({
  workshop: one(workshops, {
    fields: [inspectionItems.workshopId],
    references: [workshops.id],
  }),
  inspection: one(inspections, {
    fields: [inspectionItems.inspectionId],
    references: [inspections.id],
  }),
}));

export const labourItemsRelations = relations(labourItems, ({ one }) => ({
  workshop: one(workshops, {
    fields: [labourItems.workshopId],
    references: [workshops.id],
  }),
  jobCard: one(jobCards, {
    fields: [labourItems.jobCardId],
    references: [jobCards.id],
  }),
}));

export const inventoryItemsRelations = relations(inventoryItems, ({ one, many }) => ({
  workshop: one(workshops, {
    fields: [inventoryItems.workshopId],
    references: [workshops.id],
  }),
  jobCardParts: many(jobCardParts),
}));

export const jobCardPartsRelations = relations(jobCardParts, ({ one }) => ({
  workshop: one(workshops, {
    fields: [jobCardParts.workshopId],
    references: [workshops.id],
  }),
  jobCard: one(jobCards, {
    fields: [jobCardParts.jobCardId],
    references: [jobCards.id],
  }),
  inventoryItem: one(inventoryItems, {
    fields: [jobCardParts.partId],
    references: [inventoryItems.id],
  }),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  workshop: one(workshops, {
    fields: [invoices.workshopId],
    references: [workshops.id],
  }),
  jobCard: one(jobCards, {
    fields: [invoices.jobCardId],
    references: [jobCards.id],
  }),
  customer: one(customers, {
    fields: [invoices.customerId],
    references: [customers.id],
  }),
  payments: many(payments),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  workshop: one(workshops, {
    fields: [payments.workshopId],
    references: [workshops.id],
  }),
  invoice: one(invoices, {
    fields: [payments.invoiceId],
    references: [invoices.id],
  }),
  customer: one(customers, {
    fields: [payments.customerId],
    references: [customers.id],
  }),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  workshop: one(workshops, {
    fields: [activityLogs.workshopId],
    references: [workshops.id],
  }),
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id],
  }),
  jobCard: one(jobCards, {
    fields: [activityLogs.jobCardId],
    references: [jobCards.id],
  }),
}));
