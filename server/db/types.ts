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

export interface DashboardMetrics {
  openJobsCount: number;
  openJobsChange: string;
  awaitingApprovalAmount: number;
  awaitingApprovalCount: number;
  todayRevenue: number;
  todayRevenueChange: string;
  bayUtilisation: number;
  scheduledBays: number;
  totalBays: number;
  activeTechniciansCount: number;
}

export interface VehicleServiceHistory {
  vehicle: Vehicle;
  customer: Customer;
  jobCards: Array<
    JobCard & {
      technician?: Technician | null;
      labourItems: LabourItem[];
      parts: JobCardPart[];
      invoice?: Invoice | null;
      inspection?: (Inspection & { items: InspectionItem[] }) | null;
    }
  >;
}

export interface FullJobCard extends JobCard {
  customer: Customer;
  vehicle: Vehicle;
  technician: Technician | null;
  labourItems: LabourItem[];
  parts: JobCardPart[];
  inspection: (Inspection & { items: InspectionItem[] }) | null;
  invoice: (Invoice & { payments: Payment[] }) | null;
  subtotal: number;
  vatAmount: number;
  totalAmount: number;
}

export interface GlobalSearchResult {
  jobCards: Array<{ id: number; jobCardNumber: string; customerName: string; vehicleSummary: string; status: string }>;
  customers: Array<{ id: number; name: string; phone: string; email: string | null }>;
  vehicles: Array<{ id: number; make: string; model: string; plateCode: string; plateNumber: string; year: number }>;
  inventory: Array<{ id: number; partNumber: string; name: string; category: string; onHand: number; unitPrice: string }>;
}

export interface InvoiceLineItem {
  id?: number;
  partId?: number;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface WorkshopDatabase {
  // Workshops (Tenants)
  getWorkshop(workshopId: number): Promise<Workshop | null>;
  getWorkshopBySlug(slug: string): Promise<Workshop | null>;
  createWorkshop(data: { name: string; slug?: string; city?: string; address?: string; phone?: string; email?: string; trn?: string }): Promise<Workshop>;
  updateWorkshop(workshopId: number, data: Partial<Workshop>): Promise<Workshop>;

  // Users (Tenant Authentication & Members)
  getUserByEmail(email: string): Promise<(User & { workshop?: Workshop | null }) | null>;
  getUserById(id: number): Promise<(User & { workshop?: Workshop | null }) | null>;
  getUserByOpenId(openId: string): Promise<(User & { workshop?: Workshop | null }) | null>;
  createUser(data: { workshopId: number; email: string; passwordHash?: string; name: string; phone?: string; role?: User["role"]; loginMethod?: string; openId?: string }): Promise<User>;
  updateUser(id: number, data: Partial<User>): Promise<User>;

  // Customers
  getCustomers(workshopId: number): Promise<Customer[]>;
  getCustomerById(workshopId: number, id: number): Promise<Customer | null>;
  createCustomer(workshopId: number, data: { name: string; phone: string; email?: string; trn?: string; companyName?: string; address?: string; notes?: string }): Promise<Customer>;
  updateCustomer(workshopId: number, id: number, data: Partial<Customer>): Promise<Customer>;

  // Vehicles
  getVehicles(workshopId: number): Promise<Array<Vehicle & { customer: Customer }>>;
  getVehicleById(workshopId: number, id: number): Promise<(Vehicle & { customer: Customer }) | null>;
  getVehiclesByCustomer(workshopId: number, customerId: number): Promise<Vehicle[]>;
  createVehicle(workshopId: number, data: { customerId: number; make: string; model: string; year: number; plateCode: string; plateNumber: string; emirate?: string; vin?: string; color?: string; mileage?: number; engine?: string; notes?: string }): Promise<Vehicle>;
  updateVehicle(workshopId: number, id: number, data: Partial<Vehicle>): Promise<Vehicle>;
  getVehicleHistory(workshopId: number, vehicleId: number): Promise<VehicleServiceHistory | null>;

  // Technicians
  getTechnicians(workshopId: number): Promise<Array<Technician & { activeJobsCount: number; loadPercentage: number }>>;
  getTechnicianById(workshopId: number, id: number): Promise<Technician | null>;
  createTechnician(workshopId: number, data: { name: string; initials: string; phone?: string; specialty?: string; hourlyRate?: number }): Promise<Technician>;
  updateTechnician(workshopId: number, id: number, data: Partial<Technician>): Promise<Technician>;

  // Job Cards
  getJobCards(workshopId: number): Promise<FullJobCard[]>;
  getJobCardById(workshopId: number, id: number | string): Promise<FullJobCard | null>;
  createJobCard(workshopId: number, data: { customerId: number; vehicleId: number; technicianId?: number; bayNumber?: string; serviceSummary: string; promiseTime?: string; mileageIn?: number; customerComplaints?: string }): Promise<FullJobCard>;
  updateJobCardStatus(workshopId: number, id: number, status: JobCard["status"], notes?: string): Promise<FullJobCard>;
  assignTechnician(workshopId: number, id: number, technicianId: number | null, bayNumber?: string): Promise<FullJobCard>;
  recordApproval(workshopId: number, id: number, notes?: string): Promise<FullJobCard>;

  // Inspections
  getInspectionByJobCard(workshopId: number, jobCardId: number): Promise<(Inspection & { items: InspectionItem[] }) | null>;
  updateInspectionItem(workshopId: number, itemId: number, status: InspectionItem["status"], measurement?: string, findings?: string): Promise<InspectionItem>;

  // Labour & Parts Line Items
  addLabourItem(workshopId: number, data: { jobCardId: number; description: string; hours: number; hourlyRate: number }): Promise<LabourItem>;
  deleteLabourItem(workshopId: number, id: number): Promise<boolean>;
  addJobCardPart(workshopId: number, data: { jobCardId: number; partId?: number; partName: string; quantity: number; unitPrice: number }): Promise<JobCardPart>;
  deleteJobCardPart(workshopId: number, id: number): Promise<boolean>;

  // Inventory / Parts
  getInventory(workshopId: number): Promise<InventoryItem[]>;
  getInventoryItemById(workshopId: number, id: number): Promise<InventoryItem | null>;
  createInventoryItem(workshopId: number, data: { partNumber: string; name: string; category: string; unitPrice: number; costPrice: number; onHand?: number; reorderPoint?: number; binLocation?: string; supplier?: string }): Promise<InventoryItem>;
  adjustStock(workshopId: number, partId: number, quantityDelta: number): Promise<InventoryItem>;

  // Invoices & Payments
  getInvoices(workshopId: number): Promise<Array<Invoice & { customer: Customer; jobCard?: JobCard | null; payments: Payment[]; items?: InvoiceLineItem[] }>>;
  getInvoiceById(workshopId: number, id: number): Promise<(Invoice & { customer: Customer; jobCard?: FullJobCard | null; payments: Payment[]; items?: InvoiceLineItem[] }) | null>;
  createInvoiceFromJobCard(workshopId: number, jobCardId: number, discount?: number): Promise<Invoice>;
  createDirectInvoice(workshopId: number, data: {
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
  }): Promise<Invoice & { customer: Customer; items: InvoiceLineItem[] }>;
  listEligibleJobCards(workshopId: number): Promise<FullJobCard[]>;
  updateInvoiceStatus(workshopId: number, id: number, status: Invoice["status"]): Promise<Invoice>;
  getPayments(workshopId: number): Promise<Array<Payment & { customer: Customer; invoice: Invoice }>>;
  recordPayment(workshopId: number, data: { invoiceId: number; customerId: number; amount: number; paymentMethod: Payment["paymentMethod"]; reference?: string; notes?: string }): Promise<Payment>;

  // Activity Logs
  getActivityLogs(workshopId: number, limit?: number): Promise<ActivityLog[]>;
  addActivityLog(workshopId: number, data: { userId?: number; jobCardId?: number; title: string; copy: string; tone?: string }): Promise<ActivityLog>;

  // Dashboard & Search
  getDashboardMetrics(workshopId: number): Promise<DashboardMetrics>;
  searchWorkspace(workshopId: number, query: string): Promise<GlobalSearchResult>;
}
