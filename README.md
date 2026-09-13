# GreenWay Auto 🚗⚡
### High-Performance Workshop Management & UAE VAT Invoicing SaaS

[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-7.1-646cff.svg)](https://vitejs.dev/)
[![tRPC](https://img.shields.io/badge/tRPC-11-2596be.svg)](https://trpc.io/)
[![UAE VAT Compliant](https://img.shields.io/badge/UAE_VAT-5%25_Compliant-007a3d.svg)]()
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**GreenWay Auto** is an enterprise-grade workshop management and billing platform purpose-built for UAE automotive service centers, garages, and performance tuning shops. It streamlines everything from customer vehicle check-in to parts inventory, technician workload balancing, 5% UAE VAT tax invoicing, and instant WhatsApp dispatch.

---

## 🌟 Key Highlights & Features

### 1. Dual-Mode UAE Invoicing (Job Card vs. Counter Sale)
- **Job Card Invoicing:** Seamlessly convert full vehicle work orders into official tax-ready invoices with itemized labour hours, technician notes, and replacement parts.
- **Direct Walk-in / Counter Invoices:** Bill customers for counter parts sales, oil changes, or quick diagnostics without needing to open a full multi-stage job card.
- **UAE Tax Compliance:** Automatic 5% UAE VAT calculation, 15-digit TRN formatting, subtotal discounts, and AED currency formatting.

### 2. Instant WhatsApp Dispatch (1-Click)
- Automatically normalizes UAE mobile numbers (`+971 5x xxx xxxx` or `05x`).
- Dispatches a formatted, official invoice summary directly to the customer's WhatsApp with TRN verification, line item breakdowns, and settlement totals.

### 3. Real-Time Search Across All 6 Modules
Instant, debounced search bars integrated into every core section:
- **Customers:** Search by customer name, phone number, email address, physical location, company name, or account notes.
- **Vehicles:** Search by plate code, plate number, make, model, year, customer name, VIN, or color.
- **Parts (Inventory):** Search by part name, SKU / part number, category, supplier, or shelf / bin location.
- **Technicians:** Search by technician name, specialty, initials, or contact phone.
- **Invoices:** Search by invoice number (e.g. `INV-0020`), customer name, customer phone, job card number, status, or TRN.
- **Payments:** Search by invoice number, customer name, payment method (card, cash, bank transfer, cheque), reference code, or amount.

### 4. Settlement Ledger & Invoice ID Lookup
- **Lookup by Invoice ID:** In the Payments module, click **"Lookup by Invoice ID"** to inspect any invoice (`INV-0020`, `20`, or dropdown picker).
- **Financial Breakdown:** Instant breakdown showing **Total Billed**, **Amount Settled**, and **Remaining Balance**.
- **Audit Ledger:** Chronological log of all transactions recorded for the invoice.
- **Direct Payment Settlement:** Record full or partial payments in real-time with POS reference codes and payment method categorization.

### 5. 8-Point Vehicle Inspection Passport
- Guided intake inspection checklist covering **Exterior Walkaround**, **Lights & Signals**, **Tyres & Alignment**, **Fluids & Leaks**, **Brakes**, **Battery & Charging**, **AC Performance**, and **Road Test**.
- Generates an official inspection passport with pass/attention statuses and measurements for customer transparency.

### 6. Multi-Tenant Architecture & Workshop Settings
- Fully scoped data models isolated by `workshopId`.
- Configurable workshop organization profile, physical address, 15-digit UAE TRN number, and bay capacity (Bays 01–16).

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, TypeScript, Vite 7, Lucide Icons, Vanilla CSS Design System, Radix UI primitives, Wouter |
| **Backend** | Node.js (v18+), Express, tRPC v11 (End-to-End Type Safety), Zod schema validation |
| **Data Layer** | Drizzle ORM, MySQL-compatible schema + High-Performance File-Backed Relational Store |
| **Testing** | Vitest (20 automated integration & SaaS workflow tests) |
| **Deployment** | Vercel Serverless, Node VPS, Docker |

---

## 📂 Project Architecture

```
easygarage/
├── api/                     # Vercel Serverless Function entrypoint
│   └── index.ts             # Express + tRPC serverless wrapper
├── client/                  # Frontend Vite React SPA
│   ├── public/              # Dynamic SVGs, favicons, logos
│   └── src/
│       ├── components/      # BrandLogo, Navigation, Modals, Search bars
│       ├── pages/
│       │   ├── Home.tsx     # Landing page & workflow overview
│       │   └── Workspace.tsx# Unified Command Center & Module Views
│       ├── lib/trpc.ts      # Typed tRPC client
│       └── index.css        # Curated Emerald-Graphite Design System
├── data/
│   └── easygarage_relational.json # Local relational database seed
├── drizzle/
│   └── schema.ts            # Drizzle ORM MySQL multi-tenant database schema
├── server/
│   ├── _core/               # Express, Vite middleware, Context, OAuth
│   ├── db/
│   │   ├── fallbackStore.ts # Relational store with ACID JSON persistence
│   │   └── types.ts         # Database interfaces & relations
│   └── routers.ts           # tRPC routers (customers, vehicles, invoices, payments, etc.)
├── vercel.json              # Vercel build & route rewrite configuration
└── package.json             # Scripts & dependencies
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm** or **pnpm**

### 1. Clone the Repository
```bash
git clone https://github.com/samayshrey-dev/EasyGarage.git
cd EasyGarage
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Run in Development Mode
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Run Automated Test Suite
```bash
npm test
```
Runs 20 automated tests validating multi-tenant isolation, VAT computation, invoice generation, payment settlement, and customer relationships.

### 5. Build for Production
```bash
npm run build
npm start
```

---

## ☁️ Deployment

### Deploying to Vercel

1. Install the Vercel CLI:
   ```bash
   npm i -g vercel
   ```
2. Login to your Vercel account:
   ```bash
   vercel login
   ```
3. Deploy to production:
   ```bash
   vercel --prod
   ```
*Note: `vercel.json` and `api/index.ts` are preconfigured to handle frontend routing and tRPC serverless endpoints automatically.*

### Deploying to VPS / Docker (Render, Railway, DigitalOcean)
Ensure `PORT` and `NODE_ENV=production` are set:
```bash
npm run build
npm start
```

---

## 🔒 License

Distributed under the MIT License. See `LICENSE` for more information.
