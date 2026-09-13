import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { sdk } from "./_core/sdk";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, tenantProcedure } from "./_core/trpc";
import { hashPassword, verifyPassword } from "./db/fallbackStore";
import { workshopDb } from "./db";

export const appRouter = router({
  system: systemRouter,

  // --- Multi-Tenant Authentication & Session Management ---
  auth: router({
    me: publicProcedure.query(async ({ ctx }) => {
      if (!ctx.user) return null;
      const workshop = ctx.user.workshopId ? await workshopDb.getWorkshop(ctx.user.workshopId) : null;
      return {
        ...ctx.user,
        workshop,
      };
    }),

    login: publicProcedure
      .input(
        z.object({
          email: z.string().email(),
          password: z.string().min(1),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const user = await workshopDb.getUserByEmail(input.email);
        if (!user) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "No account found with this email address.",
          });
        }

        if (user.passwordHash && !verifyPassword(input.password, user.passwordHash)) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Incorrect password. Please try again.",
          });
        }

        const sessionUserId = user.email || user.openId || String(user.id);
        const sessionToken = await sdk.createSessionToken(sessionUserId, {
          name: user.name || "User",
          expiresInMs: ONE_YEAR_MS,
        });

        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

        const workshop = user.workshopId ? await workshopDb.getWorkshop(user.workshopId) : null;
        return {
          success: true,
          user,
          workshop,
          sessionToken,
        };
      }),

    register: publicProcedure
      .input(
        z.object({
          email: z.string().email(),
          password: z.string().min(6),
          name: z.string().min(2),
          workshopName: z.string().min(2),
          city: z.string().default("Dubai"),
          phone: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const existing = await workshopDb.getUserByEmail(input.email);
        if (existing) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "An account with this email already exists.",
          });
        }

        // 1. Create new isolated Workshop Organization
        const workshop = await workshopDb.createWorkshop({
          name: input.workshopName,
          city: input.city,
          phone: input.phone,
          email: input.email,
        });

        // 2. Create Owner User
        const user = await workshopDb.createUser({
          workshopId: workshop.id,
          email: input.email,
          passwordHash: hashPassword(input.password),
          name: input.name,
          phone: input.phone,
          role: "owner",
        });

        // 3. Mint Session
        const sessionUserId = user.email || user.openId || String(user.id);
        const sessionToken = await sdk.createSessionToken(sessionUserId, {
          name: user.name || "User",
          expiresInMs: ONE_YEAR_MS,
        });

        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

        return {
          success: true,
          user,
          workshop,
          sessionToken,
        };
      }),

    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true };
    }),
  }),

  // --- Workshop Settings ---
  workshop: router({
    getSettings: tenantProcedure.query(async ({ ctx }) => {
      const workshop = await workshopDb.getWorkshop(ctx.workshopId);
      if (!workshop) throw new TRPCError({ code: "NOT_FOUND", message: "Workshop not found" });
      return workshop;
    }),

    updateSettings: tenantProcedure
      .input(
        z.object({
          name: z.string().optional(),
          city: z.string().optional(),
          address: z.string().optional(),
          phone: z.string().optional(),
          email: z.string().optional(),
          trn: z.string().optional(),
          totalBays: z.number().min(1).max(50).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return workshopDb.updateWorkshop(ctx.workshopId, input);
      }),
  }),

  // --- Dashboard & Intelligence ---
  dashboard: router({
    getMetrics: tenantProcedure.query(async ({ ctx }) => {
      return workshopDb.getDashboardMetrics(ctx.workshopId);
    }),

    getActivity: tenantProcedure.query(async ({ ctx }) => {
      return workshopDb.getActivityLogs(ctx.workshopId, 10);
    }),
  }),

  // --- Customers ---
  customers: router({
    list: tenantProcedure.query(async ({ ctx }) => {
      return workshopDb.getCustomers(ctx.workshopId);
    }),

    getById: tenantProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const customer = await workshopDb.getCustomerById(ctx.workshopId, input.id);
        if (!customer) throw new TRPCError({ code: "NOT_FOUND", message: "Customer not found" });
        return customer;
      }),

    create: tenantProcedure
      .input(
        z.object({
          name: z.string().trim().min(2, "Customer name must be at least 2 characters"),
          phone: z.string().refine(
            (val) => {
              const digits = val.replace("+971", "").replace(/[^\d]/g, "");
              return digits.length >= 7;
            },
            {
              message: "A valid phone number with at least 7 digits is required (e.g. +971 50 123 4567).",
            }
          ),
          email: z.string().email().optional().or(z.literal("")),
          trn: z.string().optional(),
          companyName: z.string().optional(),
          address: z.string().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return workshopDb.createCustomer(ctx.workshopId, {
          name: input.name,
          phone: input.phone,
          email: input.email || undefined,
          trn: input.trn,
          companyName: input.companyName,
          address: input.address,
          notes: input.notes,
        });
      }),

    update: tenantProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().optional(),
          phone: z.string().optional(),
          email: z.string().optional(),
          trn: z.string().optional(),
          companyName: z.string().optional(),
          address: z.string().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        return workshopDb.updateCustomer(ctx.workshopId, id, data);
      }),
  }),

  // --- Vehicles ---
  vehicles: router({
    list: tenantProcedure.query(async ({ ctx }) => {
      return workshopDb.getVehicles(ctx.workshopId);
    }),

    getById: tenantProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const vehicle = await workshopDb.getVehicleById(ctx.workshopId, input.id);
        if (!vehicle) throw new TRPCError({ code: "NOT_FOUND", message: "Vehicle not found" });
        return vehicle;
      }),

    getByCustomer: tenantProcedure
      .input(z.object({ customerId: z.number() }))
      .query(async ({ ctx, input }) => {
        return workshopDb.getVehiclesByCustomer(ctx.workshopId, input.customerId);
      }),

    create: tenantProcedure
      .input(
        z.object({
          customerId: z.number(),
          make: z.string().min(1),
          model: z.string().min(1),
          year: z.number().min(1980).max(2030),
          plateCode: z.string().min(1).max(10),
          plateNumber: z.string().min(1).max(20),
          emirate: z.string().default("Dubai"),
          vin: z.string().optional(),
          color: z.string().optional(),
          mileage: z.number().optional(),
          engine: z.string().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return workshopDb.createVehicle(ctx.workshopId, input);
      }),

    update: tenantProcedure
      .input(
        z.object({
          id: z.number(),
          make: z.string().min(1).optional(),
          model: z.string().min(1).optional(),
          year: z.number().min(1980).max(2030).optional(),
          plateCode: z.string().min(1).max(10).optional(),
          plateNumber: z.string().min(1).max(20).optional(),
          emirate: z.string().optional(),
          vin: z.string().optional(),
          color: z.string().optional(),
          mileage: z.number().optional(),
          engine: z.string().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        return workshopDb.updateVehicle(ctx.workshopId, id, data);
      }),

    getHistory: tenantProcedure
      .input(z.object({ vehicleId: z.number() }))
      .query(async ({ ctx, input }) => {
        const history = await workshopDb.getVehicleHistory(ctx.workshopId, input.vehicleId);
        if (!history) throw new TRPCError({ code: "NOT_FOUND", message: "Vehicle history not found" });
        return history;
      }),
  }),

  // --- Technicians ---
  technicians: router({
    list: tenantProcedure.query(async ({ ctx }) => {
      return workshopDb.getTechnicians(ctx.workshopId);
    }),

    create: tenantProcedure
      .input(
        z.object({
          name: z.string().min(1),
          initials: z.string().min(1).max(5),
          phone: z.string().optional(),
          specialty: z.string().optional(),
          hourlyRate: z.number().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return workshopDb.createTechnician(ctx.workshopId, input);
      }),
  }),

  // --- Job Cards (Core Operational Work Orders) ---
  jobCards: router({
    list: tenantProcedure.query(async ({ ctx }) => {
      return workshopDb.getJobCards(ctx.workshopId);
    }),

    getById: tenantProcedure
      .input(z.object({ idOrNumber: z.union([z.number(), z.string()]) }))
      .query(async ({ ctx, input }) => {
        const card = await workshopDb.getJobCardById(ctx.workshopId, input.idOrNumber);
        if (!card) throw new TRPCError({ code: "NOT_FOUND", message: "Job card not found" });
        return card;
      }),

    create: tenantProcedure
      .input(
        z.object({
          customerId: z.number(),
          vehicleId: z.number(),
          technicianId: z.number().optional(),
          bayNumber: z.string().optional(),
          serviceSummary: z.string().min(1),
          promiseTime: z.string().optional(),
          mileageIn: z.number().optional(),
          customerComplaints: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return workshopDb.createJobCard(ctx.workshopId, input);
      }),

    updateStatus: tenantProcedure
      .input(
        z.object({
          id: z.number(),
          status: z.enum([
            "checked_in",
            "diagnosing",
            "awaiting_approval",
            "approved",
            "in_progress",
            "inspection_passed",
            "ready_for_handover",
            "completed",
            "cancelled",
          ]),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return workshopDb.updateJobCardStatus(ctx.workshopId, input.id, input.status, input.notes);
      }),

    assignTechnician: tenantProcedure
      .input(
        z.object({
          id: z.number(),
          technicianId: z.number().nullable(),
          bayNumber: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return workshopDb.assignTechnician(ctx.workshopId, input.id, input.technicianId, input.bayNumber);
      }),

    recordApproval: tenantProcedure
      .input(
        z.object({
          id: z.number(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return workshopDb.recordApproval(ctx.workshopId, input.id, input.notes);
      }),

    addLabour: tenantProcedure
      .input(
        z.object({
          jobCardId: z.number(),
          description: z.string().min(1),
          hours: z.number().positive(),
          hourlyRate: z.number().positive(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return workshopDb.addLabourItem(ctx.workshopId, input);
      }),

    deleteLabour: tenantProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return workshopDb.deleteLabourItem(ctx.workshopId, input.id);
      }),

    addPart: tenantProcedure
      .input(
        z.object({
          jobCardId: z.number(),
          partId: z.number().optional(),
          partName: z.string().min(1),
          quantity: z.number().int().positive(),
          unitPrice: z.number().positive(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return workshopDb.addJobCardPart(ctx.workshopId, input);
      }),

    deletePart: tenantProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return workshopDb.deleteJobCardPart(ctx.workshopId, input.id);
      }),
  }),

  // --- 8-Point Inspection ---
  inspections: router({
    getByJobCardId: tenantProcedure
      .input(z.object({ jobCardId: z.number() }))
      .query(async ({ ctx, input }) => {
        const inspection = await workshopDb.getInspectionByJobCard(ctx.workshopId, input.jobCardId);
        if (!inspection) throw new TRPCError({ code: "NOT_FOUND", message: "Inspection not found" });
        return inspection;
      }),

    updateItem: tenantProcedure
      .input(
        z.object({
          itemId: z.number(),
          status: z.enum(["pass", "attention", "fail", "not_inspected"]),
          measurement: z.string().optional(),
          findings: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return workshopDb.updateInspectionItem(
          ctx.workshopId,
          input.itemId,
          input.status,
          input.measurement,
          input.findings
        );
      }),
  }),

  // --- Inventory & Parts ---
  inventory: router({
    list: tenantProcedure.query(async ({ ctx }) => {
      return workshopDb.getInventory(ctx.workshopId);
    }),

    create: tenantProcedure
      .input(
        z.object({
          partNumber: z.string().min(1),
          name: z.string().min(1),
          category: z.string().min(1),
          unitPrice: z.number().positive(),
          costPrice: z.number().positive(),
          onHand: z.number().int().min(0).optional(),
          reorderPoint: z.number().int().optional(),
          binLocation: z.string().optional(),
          supplier: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return workshopDb.createInventoryItem(ctx.workshopId, input);
      }),

    adjustStock: tenantProcedure
      .input(
        z.object({
          partId: z.number(),
          delta: z.number().int(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return workshopDb.adjustStock(ctx.workshopId, input.partId, input.delta);
      }),
  }),

  // --- Invoices & Tax Billing ---
  invoices: router({
    list: tenantProcedure.query(async ({ ctx }) => {
      return workshopDb.getInvoices(ctx.workshopId);
    }),

    getById: tenantProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const inv = await workshopDb.getInvoiceById(ctx.workshopId, input.id);
        if (!inv) throw new TRPCError({ code: "NOT_FOUND", message: "Invoice not found" });
        return inv;
      }),

    generateFromJobCard: tenantProcedure
      .input(
        z.object({
          jobCardId: z.number(),
          discount: z.number().min(0).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return workshopDb.createInvoiceFromJobCard(ctx.workshopId, input.jobCardId, input.discount);
      }),

    createDirect: tenantProcedure
      .input(
        z.object({
          customerId: z.number(),
          invoiceDate: z.string().optional(),
          note: z.string().optional(),
          discount: z.number().min(0).optional(),
          items: z.array(
            z.object({
              description: z.string().min(1),
              quantity: z.number().positive(),
              rate: z.number().min(0),
              amount: z.number().min(0),
              partId: z.number().optional(),
            })
          ).min(1),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return workshopDb.createDirectInvoice(ctx.workshopId, input);
      }),

    listEligibleJobCards: tenantProcedure.query(async ({ ctx }) => {
      return workshopDb.listEligibleJobCards(ctx.workshopId);
    }),

    updateStatus: tenantProcedure
      .input(
        z.object({
          id: z.number(),
          status: z.enum(["draft", "sent", "partially_paid", "paid", "void"]),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return workshopDb.updateInvoiceStatus(ctx.workshopId, input.id, input.status);
      }),
  }),

  // --- Payments ---
  payments: router({
    list: tenantProcedure.query(async ({ ctx }) => {
      return workshopDb.getPayments(ctx.workshopId);
    }),

    recordPayment: tenantProcedure
      .input(
        z.object({
          invoiceId: z.number(),
          customerId: z.number(),
          amount: z.number().positive(),
          paymentMethod: z.enum(["card", "cash", "bank_transfer", "cheque"]),
          reference: z.string().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return workshopDb.recordPayment(ctx.workshopId, input);
      }),
  }),

  // --- Multi-Tenant Search ---
  search: router({
    global: tenantProcedure
      .input(z.object({ query: z.string() }))
      .query(async ({ ctx, input }) => {
        return workshopDb.searchWorkspace(ctx.workshopId, input.query);
      }),
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
          new Date(j.createdAt).toLocaleDateString("en-AE"),
        ]),
      ];
      const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
      return { csv, filename: `easygarage_jobs_${new Date().toISOString().split("T")[0]}.csv` };
    }),
  }),
});

export type AppRouter = typeof appRouter;
