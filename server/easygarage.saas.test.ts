import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { workshopDb } from "./db";
import type { TrpcContext } from "./_core/context";
import type { User } from "../drizzle/schema";

function createMockContext(user: User | null): TrpcContext {
  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      cookie: () => {},
      clearCookie: () => {},
    } as unknown as TrpcContext["res"],
  };
}

describe("EasyGarage SaaS Multi-Tenancy & Operational Workflow", () => {
  const workshop1User: User = {
    id: 1,
    workshopId: 1,
    email: "ops@alnoorauto.ae",
    name: "Tariq Mansoor",
    passwordHash: "demo_hash",
    role: "owner",
    phone: "+971 4 288 1900",
    avatarUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const workshop2User: User = {
    id: 99,
    workshopId: 2, // Organization 2
    email: "manager@dxbmotors.ae",
    name: "DXB Manager",
    passwordHash: "demo_hash",
    role: "manager",
    phone: "+971 4 333 4444",
    avatarUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const caller1 = appRouter.createCaller(createMockContext(workshop1User));
  const caller2 = appRouter.createCaller(createMockContext(workshop2User));

  describe("SaaS Multi-Tenant Isolation", () => {
    it("isolates customer lists between different workshops", async () => {
      const w1Customers = await caller1.customers.list();
      expect(w1Customers.length).toBeGreaterThan(0);
      expect(w1Customers.every((c) => c.workshopId === 1)).toBe(true);

      const w2Customers = await caller2.customers.list();
      // Workshop 2 has no customers yet
      expect(w2Customers.length).toBe(0);
    });

    it("prevents Workshop 2 from viewing or modifying Workshop 1 job cards", async () => {
      const w1Jobs = await caller1.jobCards.list();
      expect(w1Jobs.length).toBeGreaterThan(0);
      const targetJob = w1Jobs[0];

      // Workshop 2 attempts to fetch Workshop 1's job card
      await expect(
        caller2.jobCards.getById({ idOrNumber: targetJob.id })
      ).rejects.toThrow("Job card not found");

      // Workshop 2 attempts to update status of Workshop 1's job card
      await expect(
        caller2.jobCards.updateStatus({ id: targetJob.id, status: "completed" })
      ).rejects.toThrow("Job card not found");
    });

    it("isolates inventory and parts between workshops", async () => {
      const w1Inventory = await caller1.inventory.list();
      expect(w1Inventory.length).toBeGreaterThan(0);
      expect(w1Inventory.every((item) => item.workshopId === 1)).toBe(true);

      const w2Inventory = await caller2.inventory.list();
      expect(w2Inventory.length).toBe(0);
    });

    it("isolates global search results by tenant", async () => {
      // "Nadia" exists in Workshop 1 demo data
      const w1Search = await caller1.search.global({ query: "Nadia" });
      expect(w1Search.customers.length).toBeGreaterThan(0);

      const w2Search = await caller2.search.global({ query: "Nadia" });
      expect(w2Search.customers.length).toBe(0);
      expect(w2Search.jobCards.length).toBe(0);
    });
  });

  describe("Complete End-to-End Workshop Lifecycle Workflow", () => {
    let customerId: number;
    let vehicleId: number;
    let jobCardId: number;
    let invoiceId: number;

    it("Step 1: Creates a new Customer under the workshop", async () => {
      const newCustomer = await caller1.customers.create({
        name: "Omar Al Suwaidi",
        phone: "+971 52 987 6543",
        email: "omar.alsuwaidi@example.com",
        trn: "100293847500003",
        city: "Dubai",
      });

      expect(newCustomer).toBeDefined();
      expect(newCustomer.id).toBeGreaterThan(0);
      expect(newCustomer.workshopId).toBe(1);
      customerId = newCustomer.id;
    });

    it("Step 2: Creates a new Vehicle linked to the customer", async () => {
      const newVehicle = await caller1.vehicles.create({
        customerId,
        make: "Porsche",
        model: "Macan GTS",
        year: 2023,
        emirate: "Dubai",
        plateCode: "X",
        plateNumber: "88992",
        vin: "WP1ZZZ95ZPLB12345",
        color: "Chalk",
        mileage: 28500,
      });

      expect(newVehicle).toBeDefined();
      expect(newVehicle.customerId).toBe(customerId);
      expect(newVehicle.workshopId).toBe(1);
      vehicleId = newVehicle.id;
    });

    it("Step 3: Creates a Job Card with auto-generated 8-point inspection checklist", async () => {
      const jobCard = await caller1.jobCards.create({
        customerId,
        vehicleId,
        serviceSummary: "30,000 KM Major Service & Brake Inspection",
        mileageIn: 28500,
        customerComplaints: "Slight vibration at high speed braking",
      });

      expect(jobCard).toBeDefined();
      expect(jobCard.jobCardNumber).toMatch(/^(EG|JC)-\d+$/);
      expect(jobCard.status).toBe("checked_in");
      jobCardId = jobCard.id;

      // Verify 8-point inspection checklist was automatically created
      const inspection = await caller1.inspections.getByJobCardId({ jobCardId });
      expect(inspection).toBeDefined();
      expect(inspection.items.length).toBe(8);
    });

    it("Step 4: Performs 8-point vehicle inspection with findings", async () => {
      const inspection = await caller1.inspections.getByJobCardId({ jobCardId });
      const brakeItem = inspection.items.find((i) => i.checkKey === "brakes");
      expect(brakeItem).toBeDefined();

      const updatedBrakes = await caller1.inspections.updateItem({
        itemId: brakeItem!.id,
        status: "attention",
        measurement: "Front pads 3.2mm, rotors scored",
        findings: "Front brake pads worn below 4mm. Rotors need skim or replacement.",
      });

      expect(updatedBrakes.status).toBe("attention");
      expect(updatedBrakes.measurement).toContain("Front pads 3.2mm");
    });

    it("Step 5: Assigns a technician and service bay to the job", async () => {
      const technicians = await caller1.technicians.list();
      expect(technicians.length).toBeGreaterThan(0);
      const tech = technicians[0];

      const assigned = await caller1.jobCards.assignTechnician({
        id: jobCardId,
        technicianId: tech.id,
        bayNumber: "Bay 04",
      });

      expect(assigned.technicianId).toBe(tech.id);
      expect(assigned.bayNumber).toBe("Bay 04");
    });

    it("Step 6: Adds Labour items and Parts with automatic inventory stock decrement", async () => {
      // Add labour
      await caller1.jobCards.addLabour({
        jobCardId,
        description: "Major Service Labour (Oil + Filters + Inspection)",
        hours: 3.5,
        hourlyRate: 250, // 875 AED
      });

      // Add parts from inventory
      const inventory = await caller1.inventory.list();
      const oilFilter = inventory.find((i) => i.name.includes("Filter")) || inventory[0];
      if (oilFilter.onHand < 2) {
        await caller1.inventory.adjustStock({ partId: oilFilter.id, delta: 10 });
        oilFilter.onHand += 10;
      }
      const initialStock = oilFilter.onHand;

      await caller1.jobCards.addPart({
        jobCardId,
        partId: oilFilter.id,
        partName: oilFilter.name,
        quantity: 2,
        unitPrice: Number(oilFilter.unitPrice),
      });

      // Verify inventory stock decremented by 2
      const updatedInventory = await caller1.inventory.list();
      const updatedItem = updatedInventory.find((i) => i.id === oilFilter.id);
      expect(updatedItem?.onHand).toBe(initialStock - 2);

      // Verify job card subtotal reflects both labour and parts
      const refreshedJob = await caller1.jobCards.getById({ idOrNumber: jobCardId });
      const labourTotal = refreshedJob.labourItems.reduce((acc, l) => acc + Number(l.amount), 0);
      const partsTotal = refreshedJob.parts.reduce((acc, p) => acc + Number(p.totalPrice), 0);
      expect(labourTotal).toBe(875);
      expect(partsTotal).toBe(Number(oilFilter.unitPrice) * 2);
      expect(refreshedJob.subtotal).toBe(875 + Number(oilFilter.unitPrice) * 2);
    });

    it("Step 7: Customer approves estimate via WhatsApp / Digital sign-off", async () => {
      const approvedJob = await caller1.jobCards.recordApproval({
        id: jobCardId,
        notes: "Approved via WhatsApp by Omar Al Suwaidi",
      });

      expect(approvedJob.status).toBe("approved");
      expect(approvedJob.approvedAt).not.toBeNull();
    });

    it("Step 8: Advances status through execution to completion", async () => {
      await caller1.jobCards.updateStatus({ id: jobCardId, status: "in_progress" });
      await caller1.jobCards.updateStatus({ id: jobCardId, status: "inspection_passed" });
      const readyJob = await caller1.jobCards.updateStatus({ id: jobCardId, status: "ready_for_handover" });
      expect(readyJob.status).toBe("ready_for_handover");
    });

    it("Step 9: Generates official UAE Tax Invoice with 5% VAT breakdown", async () => {
      const invoice = await caller1.invoices.generateFromJobCard({ jobCardId });

      expect(invoice).toBeDefined();
      expect(invoice.invoiceNumber).toMatch(/^INV-\d+$/);
      expect(invoice.workshopId).toBe(1);
      expect(invoice.status).toBe("draft");

      // Verify UAE 5% VAT calculation
      const subtotalNum = parseFloat(invoice.subtotal);
      const vatNum = parseFloat(invoice.vatAmount);
      const totalNum = parseFloat(invoice.totalAmount);
      const expectedVat = Number((subtotalNum * 0.05).toFixed(2));
      expect(Math.abs(vatNum - expectedVat)).toBeLessThanOrEqual(0.01);
      expect(Math.abs(totalNum - (subtotalNum + vatNum))).toBeLessThanOrEqual(0.01);

      invoiceId = invoice.id;
    });

    it("Step 10: Records payment and updates invoice to paid status", async () => {
      const invoice = await caller1.invoices.getById({ id: invoiceId });

      const payment = await caller1.payments.recordPayment({
        invoiceId: invoice.id,
        customerId,
        amount: parseFloat(invoice.totalAmount),
        paymentMethod: "card",
        reference: "AUTH-DXB-998822",
        notes: "Paid via Visa ending 4920 at reception desk",
      });

      expect(payment).toBeDefined();
      expect(payment.workshopId).toBe(1);
      expect(parseFloat(payment.amount)).toBe(parseFloat(invoice.totalAmount));

      // Verify invoice marked as paid
      const updatedInvoice = await caller1.invoices.getById({ id: invoiceId });
      expect(updatedInvoice.status).toBe("paid");
      expect(parseFloat(updatedInvoice.amountPaid)).toBe(parseFloat(invoice.totalAmount));

      // Complete the job card
      await caller1.jobCards.updateStatus({ id: jobCardId, status: "completed" });
      const finalJob = await caller1.jobCards.getById({ idOrNumber: jobCardId });
      expect(finalJob.status).toBe("completed");
    });

    it("Step 11: Service Passport reflects completed service and invoice permanently", async () => {
      const history = await caller1.vehicles.getHistory({ vehicleId });

      expect(history).toBeDefined();
      expect(history.vehicle.id).toBe(vehicleId);
      expect(history.jobCards.length).toBeGreaterThanOrEqual(1);

      const recordedJob = history.jobCards.find((j) => j.id === jobCardId);
      expect(recordedJob).toBeDefined();
      expect(recordedJob?.status).toBe("completed");
      expect(recordedJob?.invoice).toBeDefined();
      expect(recordedJob?.invoice?.status).toBe("paid");
    });

    it("Step 12: Generates Direct Invoice (Without Job Card) with discount and 5% UAE VAT", async () => {
      const directInvoice = await caller1.invoices.createDirect({
        customerId,
        invoiceDate: new Date().toISOString().split("T")[0],
        discount: 50,
        note: "Direct counter sale: Oil service and wiper blades",
        items: [
          { description: "Synthetic Engine Oil (5L)", quantity: 1, rate: 250, amount: 250 },
          { description: "Bosch Aerotwin Wiper Blades", quantity: 2, rate: 80, amount: 160 },
        ],
      });

      expect(directInvoice).toBeDefined();
      expect(directInvoice.invoiceNumber).toMatch(/^INV-\d+$/);
      expect(directInvoice.jobCardId).toBeNull();
      // subtotal: 250 + 160 = 410, discount = 50 -> taxable = 360
      expect(parseFloat(directInvoice.subtotal)).toBe(410);
      expect(parseFloat(directInvoice.discount)).toBe(50);
      // 5% VAT on 360 = 18
      expect(parseFloat(directInvoice.vatAmount)).toBe(18);
      // total = 360 + 18 = 378
      expect(parseFloat(directInvoice.totalAmount)).toBe(378);

      const retrieved = await caller1.invoices.getById({ id: directInvoice.id });
      expect(retrieved.items.length).toBe(2);
      expect(retrieved.customer.id).toBe(customerId);
    });

    it("Step 13: Lists eligible job cards for With-Job-Card invoicing", async () => {
      const eligible = await caller1.invoices.listEligibleJobCards();
      expect(Array.isArray(eligible)).toBe(true);
    });
  });
});
