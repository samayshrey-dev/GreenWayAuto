import {
  AlertCircle,
  ArrowDownRight,
  ArrowRight,
  Bell,
  Boxes,
  CalendarDays,
  Car,
  Check,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  ClipboardCheck,
  Clock3,
  Download,
  FileText,
  Gauge,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  MessageCircle,
  MoreHorizontal,
  PackageCheck,
  Plus,
  Printer,
  Receipt,
  Search,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  UserRound,
  Users,
  WalletCards,
  Wrench,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { BrandMark } from "@/components/BrandLogo";
import type { FullJobCard } from "../../../server/db/types";
import type { Customer, InventoryItem, Invoice, JobCard, Technician, User, Vehicle, Workshop } from "../../../drizzle/schema";

type Icon = typeof LayoutDashboard;

const navigation: Array<{ label: string; href: string; icon: Icon }> = [
  { label: "Command center", href: "/app", icon: LayoutDashboard },
  { label: "Job cards", href: "/app/job-cards", icon: ClipboardCheck },
  { label: "Customers", href: "/app/customers", icon: Users },
  { label: "Vehicles", href: "/app/vehicles", icon: Car },
  { label: "Parts", href: "/app/parts", icon: Boxes },
  { label: "Technicians", href: "/app/technicians", icon: Wrench },
  { label: "Invoices", href: "/app/invoices", icon: FileText },
  { label: "Payments", href: "/app/payments", icon: WalletCards },
  { label: "Settings", href: "/app/settings", icon: Settings },
];

function StatusBadge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: string }) {
  return (
    <span className={`status-badge ${tone}`}>
      <span />
      {children}
    </span>
  );
}

function Money({ children }: { children: React.ReactNode }) {
  return (
    <span className="money">
      <small>AED</small>
      {children}
    </span>
  );
}

export default function Workspace({ user }: { user: User & { workshop?: Workshop | null } }) {
  const [location, setLocation] = useLocation();
  const [mobileNav, setMobileNav] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [newJobModal, setNewJobModal] = useState(false);
  const [addCustomerModal, setAddCustomerModal] = useState(false);
  const [addVehicleModal, setAddVehicleModal] = useState(false);
  const [historyVehicleId, setHistoryVehicleId] = useState<number | null>(null);

  const utils = trpc.useUtils();
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      localStorage.removeItem("easygarage_token");
      sessionStorage.removeItem("easygarage_token");
      utils.auth.me.invalidate();
      setLocation("/login");
    },
  });

  // Keyboard shortcut Command+K and Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      } else if (e.key === "Escape") {
        setSearchOpen(false);
        setNewJobModal(false);
        setAddCustomerModal(false);
        setAddVehicleModal(false);
        setHistoryVehicleId(null);
        setNotificationsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Route migration and redirects
  useEffect(() => {
    if (location === "/app/inventory") {
      setLocation("/app/parts");
    } else if (location === "/app/inspection" || location === "/app/reports") {
      setLocation("/app");
    }
  }, [location, setLocation]);

  const activeNav = navigation.find((item) => item.href === location || (item.href === "/app/job-cards" && location.startsWith("/app/job-cards"))) ?? navigation[0];
  const workshop = user.workshop;

  const { data: metrics } = trpc.dashboard.getMetrics.useQuery();

  return (
    <div className="workspace-shell">
      {/* Sidebar */}
      <aside className={`app-sidebar ${mobileNav ? "mobile-open" : ""}`}>
        <div className="sidebar-top">
          <a className="brand brand-app" href="/">
            <span className="brand-mark"><BrandMark size={19} /></span>
            <span>Green<span>Way</span> Auto</span>
          </a>
          <button className="icon-button mobile-close" onClick={() => setMobileNav(false)} aria-label="Close navigation">
            <X size={18} />
          </button>
        </div>

        <div
          className="workspace-switcher"
          title="Manage workshop settings"
          onClick={() => setLocation("/app/settings")}
          style={{ cursor: "pointer", transition: "border-color 0.2s ease" }}
        >
          <span className="workshop-avatar">{workshop?.name?.slice(0, 2).toUpperCase() || "GW"}</span>
          <div>
            <strong>{workshop?.name || "GreenWay Auto"}</strong>
            <small>{workshop?.city || "Dubai"} · UAE</small>
          </div>
          <ChevronDown size={15} />
        </div>

        <div className="side-label">Workspace</div>
        <nav className="app-nav">
          {navigation.map((item) => {
            const active = activeNav.href === item.href;
            return (
              <NavItem
                key={item.href}
                item={item}
                active={active}
                onNavigate={() => {
                  setLocation(item.href);
                  setMobileNav(false);
                }}
              />
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <div className="capacity-label">
            <span>Today’s capacity</span>
            <strong>{metrics?.bayUtilisation || 72}%</strong>
          </div>
          <div className="capacity-track">
            <span style={{ width: `${metrics?.bayUtilisation || 72}%` }} />
          </div>
          <small>{metrics?.scheduledBays || 3} of {metrics?.totalBays || 16} bays scheduled</small>

          <div className="user-row" style={{ marginTop: "18px", paddingTop: "14px" }}>
            <span className="user-avatar">{(user.name || "User").slice(0, 2).toUpperCase()}</span>
            <span>
              <strong>{user.name || "User"}</strong>
              <small style={{ textTransform: "capitalize" }}>{user.role || "Admin"}</small>
            </span>
            <button
              className="icon-button"
              onClick={() => logoutMutation.mutate()}
              title="Sign out"
              style={{ color: "#91a2a4", marginLeft: "auto" }}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Workspace Area */}
      <div className="app-main">
        <header className="app-header">
          <button className="icon-button mobile-menu" onClick={() => setMobileNav(true)} aria-label="Open navigation">
            <Menu size={19} />
          </button>
          <div className="breadcrumbs">
            <span>{workshop?.name || "GreenWay Auto"}</span>
            <ChevronRight size={14} />
            <strong>{activeNav.label}</strong>
          </div>
          <div className="header-tools">
            <button className="header-search" onClick={() => setSearchOpen(true)}>
              <Search size={16} />
              <span>Search anything</span>
              <kbd>⌘ K</kbd>
            </button>
            <div style={{ position: "relative" }}>
              <button
                className="icon-button notification-button"
                aria-label="Notifications"
                onClick={() => setNotificationsOpen((prev) => !prev)}
              >
                <Bell size={18} />
                <i />
              </button>
              {notificationsOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    right: 0,
                    marginTop: "8px",
                    width: "320px",
                    background: "#fbfcfa",
                    border: "1px solid #ced8d5",
                    borderRadius: "6px",
                    boxShadow: "0 18px 45px rgba(10,24,28,0.22)",
                    zIndex: 100,
                    padding: "16px",
                    fontSize: "12px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", borderBottom: "1px solid #edf1f0", paddingBottom: "8px" }}>
                    <strong style={{ fontSize: "13px", color: "#223439" }}>Workshop Alerts</strong>
                    <span style={{ fontSize: "10px", color: "#4c9b79", fontWeight: 700, background: "#e5f1eb", padding: "2px 6px", borderRadius: "3px" }}>LIVE</span>
                  </div>
                  <div style={{ display: "grid", gap: "10px" }}>
                    <div style={{ display: "flex", gap: "10px", alignItems: "start" }}>
                      <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#4c9b79", marginTop: "4px", flexShrink: 0 }} />
                      <div>
                        <strong style={{ display: "block", color: "#25353a" }}>EG-2418 Ready for Handover</strong>
                        <small style={{ color: "#74868b" }}>Bay 03 · Porsche 911 GT3 · Gate pass pending</small>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "10px", alignItems: "start" }}>
                      <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#c38b47", marginTop: "4px", flexShrink: 0 }} />
                      <div>
                        <strong style={{ display: "block", color: "#25353a" }}>Approval Pending</strong>
                        <small style={{ color: "#74868b" }}>EG-2412 · Faisal Rahman (Land Cruiser 300)</small>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "10px", alignItems: "start" }}>
                      <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#327d94", marginTop: "4px", flexShrink: 0 }} />
                      <div>
                        <strong style={{ display: "block", color: "#25353a" }}>8-Point Inspection Completed</strong>
                        <small style={{ color: "#74868b" }}>EG-2401 · Defender 110 · 8/8 Passed</small>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="header-avatar" title={`${user.name || "User"} (${user.email})`}>
              {(user.name || "User").slice(0, 2).toUpperCase()}
            </div>
          </div>
        </header>

        <main className="workspace-content">
          {location.startsWith("/app/job-cards/") ? (
            <JobCardDetailWorkspace
              jobIdOrNumber={location.replace("/app/job-cards/", "")}
              workshop={workshop}
              onBack={() => setLocation("/app/job-cards")}
              onOpenHistory={(vid) => setHistoryVehicleId(vid)}
            />
          ) : activeNav.href === "/app" ? (
            <DashboardView
              user={user}
              onNewJob={() => setNewJobModal(true)}
              onNavigateDetail={(id) => setLocation(`/app/job-cards/${id}`)}
            />
          ) : (
            <ModuleView
              module={activeNav.label}
              onNewJob={() => setNewJobModal(true)}
              onAddCustomer={() => setAddCustomerModal(true)}
              onAddVehicle={() => setAddVehicleModal(true)}
              onOpenHistory={(vid) => setHistoryVehicleId(vid)}
            />
          )}
        </main>
      </div>

      {/* Global Command+K Search Dialog */}
      {searchOpen && (
        <GlobalSearchDialog
          onClose={() => setSearchOpen(false)}
          onSelect={(type, id) => {
            setSearchOpen(false);
            if (type === "job") setLocation("/app/invoices");
            else if (type === "customer") setLocation("/app/customers");
            else if (type === "vehicle") setLocation("/app/vehicles");
            else if (type === "part") setLocation("/app/parts");
          }}
        />
      )}

      {/* New Job Card Modal */}
      {newJobModal && (
        <NewJobCardModal
          onClose={() => setNewJobModal(false)}
          onSuccess={(jobId) => {
            setNewJobModal(false);
            setLocation(`/app/job-cards/${jobId}`);
          }}
        />
      )}

      {/* Add Customer Modal */}
      {addCustomerModal && (
        <AddCustomerModal onClose={() => setAddCustomerModal(false)} />
      )}

      {/* Add Vehicle Modal */}
      {addVehicleModal && (
        <AddVehicleModal onClose={() => setAddVehicleModal(false)} />
      )}

      {/* Vehicle History Passport Modal */}
      {historyVehicleId !== null && (
        <VehicleHistoryModal
          vehicleId={historyVehicleId}
          onClose={() => setHistoryVehicleId(null)}
        />
      )}
    </div>
  );
}

function NavItem({ item, active, count, onNavigate }: { item: (typeof navigation)[number]; active: boolean; count?: number; onNavigate: () => void }) {
  const Icon = item.icon;
  return (
    <a className={`app-nav-item ${active ? "active" : ""}`} href={item.href} onClick={(e) => { e.preventDefault(); onNavigate(); }}>
      <Icon size={17} strokeWidth={active ? 2.1 : 1.8} />
      <span>{item.label}</span>
      {count !== undefined && <span className="nav-count">{count}</span>}
    </a>
  );
}

// ============================================================================
// 1. DASHBOARD VIEW
// ============================================================================
function DashboardView({
  user,
  onNewJob,
}: {
  user: User & { workshop?: Workshop | null };
  onNewJob?: () => void;
  onNavigateDetail?: (id: string | number) => void;
}) {
  const utils = trpc.useUtils();
  const { data: activities = [] } = trpc.dashboard.getActivity.useQuery();
  const { data: techs = [] } = trpc.technicians.list.useQuery();
  const { data: inventory = [] } = trpc.inventory.list.useQuery();

  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow"><span className="eyebrow-line" /> Workshop Command Center</div>
          <h1>Good morning, {user.name ? user.name.split(" ")[0] : "Ahmed"}.</h1>
          <p>Live workshop operations, floor activity and team readiness.</p>
        </div>
        {onNewJob && (
          <div className="heading-actions">
            <button className="button button-accent" onClick={onNewJob}>
              <Plus size={17} /> New job card
            </button>
          </div>
        )}
      </div>

      <div className="dashboard-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>

        <section className="panel activity-panel">
          <div className="panel-heading">
            <div>
              <span className="panel-kicker">Across the floor</span>
              <h2>Activity</h2>
            </div>
            <button className="icon-button" title="Refresh live floor updates" onClick={() => utils.dashboard.getActivity.invalidate()}><SlidersHorizontal size={16} /></button>
          </div>
          <div className="activity-list">
            {activities.length === 0 ? (
              <div style={{ padding: "20px", color: "#74868c", fontSize: "12px" }}>No recent floor activity.</div>
            ) : (
              activities.slice(0, 5).map((act) => (
                <div className="activity-item" key={act.id}>
                  <span className={`activity-icon ${act.tone}`}>
                    {act.tone === "green" ? <Check size={15} /> : act.tone === "amber" ? <PackageCheck size={15} /> : <Wrench size={15} />}
                  </span>
                  <div>
                    <strong>{act.title}</strong>
                    <p>{act.copy}</p>
                  </div>
                  <time>{new Date(act.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</time>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <div className="lower-grid">
        <section className="panel capacity-panel">
          <div className="panel-heading">
            <div>
              <span className="panel-kicker">Technician load</span>
              <h2>Who’s on the floor</h2>
            </div>
            <span style={{ fontSize: "11px", color: "#5a6e74", fontWeight: 600 }}>
              {techs.length} Active Technicians
            </span>
          </div>
          <div className="tech-load">
            {techs.map((tech) => (
              <div className="tech-load-row" key={tech.id}>
                <span className="tech-avatar large">{tech.initials}</span>
                <div className="tech-name">
                  <strong>{tech.name}</strong>
                  <small>{tech.activeJobsCount} active jobs · {tech.specialty}</small>
                </div>
                <div className="load-bar">
                  <span
                    className={tech.loadPercentage > 80 ? "amber" : "blue"}
                    style={{ width: `${tech.loadPercentage}%` }}
                  />
                </div>
                <strong className="load-value">{tech.loadPercentage}%</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="panel inventory-panel">
          <div className="panel-heading">
            <div>
              <span className="panel-kicker">Stock watch</span>
              <h2>Parts attention</h2>
            </div>
          </div>
          <div className="stock-list">
            {inventory.slice(0, 4).map((part) => (
              <div className="stock-row" key={part.id}>
                <div>
                  <strong>{part.name}</strong>
                  <small>{part.category} · AED {part.unitPrice} · {part.binLocation || "Shelf"}</small>
                </div>
                <span className={part.onHand === 0 ? "stock-out" : part.onHand <= part.reorderPoint ? "stock-low" : "stock-ok"}>
                  {part.onHand === 0 ? "Out of stock" : `${part.onHand} left`}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

function Metric({ title, value, change, context, icon: Icon, tone }: { title: string; value: string; change: string; context: string; icon: Icon; tone: string }) {
  return (
    <div className="metric-card">
      <div className={`metric-icon ${tone}`}><Icon size={18} /></div>
      <div className="metric-info">
        <span>{title}</span>
        <strong>{value}</strong>
        <small><b className={tone === "amber" ? "amber-text" : "green-text"}>{change}</b> {context}</small>
      </div>
      <ArrowDownRight size={16} className="metric-trend" />
    </div>
  );
}

// ============================================================================
// 2. JOB CARD DETAIL WORKSPACE
// ============================================================================
function JobCardDetailWorkspace({
  jobIdOrNumber,
  workshop,
  onBack,
  onOpenHistory,
}: {
  jobIdOrNumber: string;
  workshop?: Workshop | null;
  onBack: () => void;
  onOpenHistory: (vehicleId: number) => void;
}) {
  const utils = trpc.useUtils();
  const { data: job, isLoading, error } = trpc.jobCards.getById.useQuery({ idOrNumber: jobIdOrNumber });

  const [addLabourModal, setAddLabourModal] = useState(false);
  const [addPartModal, setAddPartModal] = useState(false);
  const [invoiceModal, setInvoiceModal] = useState(false);
  const [paymentModal, setPaymentModal] = useState(false);

  const generateInvoiceMutation = trpc.invoices.generateFromJobCard.useMutation({
    onSuccess: () => {
      utils.jobCards.getById.invalidate({ idOrNumber: jobIdOrNumber });
      utils.jobCards.list.invalidate();
      utils.invoices.list.invalidate();
    },
  });

  const handleOpenInvoice = async () => {
    if (!job?.invoice) {
      try {
        await generateInvoiceMutation.mutateAsync({ jobCardId: job!.id });
        await utils.jobCards.getById.invalidate({ idOrNumber: jobIdOrNumber });
      } catch (err) {
        console.error("Failed to generate tax invoice:", err);
      }
    }
    setInvoiceModal(true);
  };

  const recordApprovalMutation = trpc.jobCards.recordApproval.useMutation({
    onSuccess: () => {
      utils.jobCards.getById.invalidate({ idOrNumber: jobIdOrNumber });
      utils.jobCards.list.invalidate();
    },
  });

  const updateStatusMutation = trpc.jobCards.updateStatus.useMutation({
    onSuccess: () => {
      utils.jobCards.getById.invalidate({ idOrNumber: jobIdOrNumber });
      utils.jobCards.list.invalidate();
    },
  });

  const updateInspectionMutation = trpc.inspections.updateItem.useMutation({
    onSuccess: () => {
      utils.jobCards.getById.invalidate({ idOrNumber: jobIdOrNumber });
    },
  });

  const deleteLabourMutation = trpc.jobCards.deleteLabour.useMutation({
    onSuccess: () => {
      utils.jobCards.getById.invalidate({ idOrNumber: jobIdOrNumber });
    },
  });

  const deletePartMutation = trpc.jobCards.deletePart.useMutation({
    onSuccess: () => {
      utils.jobCards.getById.invalidate({ idOrNumber: jobIdOrNumber });
      utils.inventory.list.invalidate();
    },
  });

  if (isLoading) {
    return (
      <div style={{ padding: "60px", textAlign: "center", color: "#54686e" }}>
        <Loader2 size={30} className="animate-spin" style={{ margin: "0 auto 12px", color: "#327d94" }} />
        <p style={{ fontWeight: 600, fontSize: "14px" }}>Loading job card {jobIdOrNumber}...</p>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div style={{ padding: "40px", background: "#fdf0ed", border: "1px solid #f3c7be", borderRadius: "6px", color: "#b94a42" }}>
        <h3>Job Card Not Found</h3>
        <p>Could not load the requested job card record ({jobIdOrNumber}).</p>
        <button className="button button-quiet" onClick={onBack} style={{ marginTop: "14px" }}>
          Back to job cards
        </button>
      </div>
    );
  }

  const isApproved = job.status === "approved" || job.status === "in_progress" || job.status === "inspection_passed" || job.status === "ready_for_handover" || job.status === "completed";

  // WhatsApp Message Composer
  const handleWhatsAppAction = () => {
    recordApprovalMutation.mutate({ id: job.id, notes: "Customer approval requested & recorded via WhatsApp." });

    const phoneClean = job.customer.phone.replace(/[^0-9]/g, "");
    const msg = `Hello ${job.customer.name},\nThis is GreenWay Auto regarding your ${job.vehicle.make} ${job.vehicle.model} (${job.vehicle.plateCode} ${job.vehicle.plateNumber}).\n\nYour workshop estimate for Job #${job.jobCardNumber}:\n• Subtotal: AED ${job.subtotal.toFixed(2)}\n• 5% VAT: AED ${job.vatAmount.toFixed(2)}\n• Total: AED ${job.totalAmount.toFixed(2)}\n\nPlease reply with 'APPROVE' to confirm work. Thank you!`;

    window.open(`https://wa.me/${phoneClean}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  return (
    <>
      <div className="detail-top">
        <div>
          <button className="back-link" onClick={onBack} style={{ background: "transparent", border: "none", cursor: "pointer" }}>
            <ArrowRight size={14} className="back-arrow" /> Back to job cards
          </button>
          <div className="detail-title">
            <span className="plate large-plate">{job.vehicle.plateCode} {job.vehicle.plateNumber}</span>
            <div>
              <div className="eyebrow"><span className="eyebrow-line" /> Job card · {job.jobCardNumber}</div>
              <h1>{job.vehicle.make} {job.vehicle.model} <span>· {job.vehicle.year}</span></h1>
              <p>{job.customer.name} ({job.customer.phone}) · {job.serviceSummary}</p>
            </div>
          </div>
        </div>

        <div className="heading-actions">
          <button
            className="button button-dark"
            onClick={handleOpenInvoice}
            disabled={generateInvoiceMutation.isPending}
          >
            <FileText size={16} />
            {generateInvoiceMutation.isPending ? "Generating Invoice..." : job.invoice ? "View Invoice" : "Generate Invoice"}
          </button>
          {job.status !== "completed" ? (
            <button
              className="button button-accent"
              onClick={() => updateStatusMutation.mutate({ id: job.id, status: "completed" })}
              disabled={updateStatusMutation.isPending}
            >
              <Check size={16} /> Mark Completed
            </button>
          ) : (
            <StatusBadge tone="success">Gate Pass Released</StatusBadge>
          )}
        </div>
      </div>

      {/* Stage Progression */}
      <div className="job-stage">
        <span className="stage-done">01 Intake <Check size={14} /></span>
        <span className={job.inspection?.status === "completed" ? "stage-done" : "stage-current"}>
          02 Inspection {job.inspection?.status === "completed" ? <Check size={14} /> : <Clock3 size={14} />}
        </span>
        <span className={isApproved ? "stage-done" : "stage-current"}>
          03 Approval {isApproved ? <Check size={14} /> : <Clock3 size={14} />}
        </span>
        <span className={job.status === "in_progress" ? "stage-current" : job.status === "completed" ? "stage-done" : ""}>
          04 Work
        </span>
        <span className={job.invoice?.status === "paid" ? "stage-done" : job.invoice ? "stage-current" : ""}>
          05 Invoice
        </span>
        <span className={job.status === "completed" ? "stage-done" : ""}>
          06 Handover
        </span>
      </div>

      <div className="detail-grid">
        <div className="detail-main">
          {/* Customer Approval & Estimate Panel */}
          <section className="panel detail-panel">
            <div className="panel-heading">
              <div>
                <span className="panel-kicker">Customer approval & items</span>
                <h2>Estimate for {job.customer.name}</h2>
              </div>
              <StatusBadge tone={isApproved ? "success" : "warning"}>
                {isApproved ? "Approval recorded" : "Awaiting response"}
              </StatusBadge>
            </div>

            <div className="estimate-lines">
              {job.labourItems.map((item) => (
                <div className="estimate-line" key={`labour-${item.id}`}>
                  <span className="line-icon"><Check size={14} /></span>
                  <div>
                    <strong>{item.description}</strong>
                    <small>{item.hours} hrs @ AED {item.hourlyRate}/hr (Labour)</small>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <Money>{parseFloat(item.amount).toLocaleString()}</Money>
                    <button
                      onClick={() => deleteLabourMutation.mutate({ id: item.id })}
                      title="Remove line"
                      style={{ border: "none", background: "transparent", color: "#aa6460", cursor: "pointer" }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}

              {job.parts.map((item) => (
                <div className="estimate-line" key={`part-${item.id}`}>
                  <span className="line-icon"><Boxes size={14} /></span>
                  <div>
                    <strong>{item.partName}</strong>
                    <small>Qty: {item.quantity} · Unit: AED {item.unitPrice}</small>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <Money>{parseFloat(item.totalPrice).toLocaleString()}</Money>
                    <button
                      onClick={() => deletePartMutation.mutate({ id: item.id })}
                      title="Remove part"
                      style={{ border: "none", background: "transparent", color: "#aa6460", cursor: "pointer" }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ padding: "12px 22px", display: "flex", gap: "10px" }}>
              <button className="button button-quiet" onClick={() => setAddLabourModal(true)}>
                <Plus size={14} /> Add labour item
              </button>
              <button className="button button-quiet" onClick={() => setAddPartModal(true)}>
                <Plus size={14} /> Add part from inventory
              </button>
            </div>

            <div className="estimate-total">
              <span>Subtotal</span>
              <Money>{job.subtotal.toFixed(2)}</Money>
              <span>5% UAE VAT</span>
              <Money>{job.vatAmount.toFixed(2)}</Money>
              <strong>Total due</strong>
              <Money>{job.totalAmount.toFixed(2)}</Money>
            </div>

            <div className="approval-actions">
              <button
                className="button button-accent"
                onClick={handleWhatsAppAction}
                disabled={recordApprovalMutation.isPending}
              >
                <span className="whatsapp-glyph">WA</span>
                {isApproved ? "Send update on WhatsApp" : "Send approval on WhatsApp"}
              </button>
              {!isApproved && (
                <button
                  className="button button-quiet"
                  onClick={() => recordApprovalMutation.mutate({ id: job.id, notes: "Direct customer verbal approval" })}
                >
                  Record direct approval
                </button>
              )}
            </div>
          </section>

          {/* 8-Point Inspection Checklist Panel */}
          <section className="panel detail-panel">
            <div className="panel-heading">
              <div>
                <span className="panel-kicker">Digital condition reporting</span>
                <h2>8-point inspection checklist</h2>
              </div>
              <StatusBadge tone="success">
                {job.inspection?.items.filter((i) => i.status === "pass").length || 0} / 8 Passed
              </StatusBadge>
            </div>

            <div className="inspection-grid">
              {job.inspection?.items.map((chk) => (
                <div className="inspection-check" key={chk.id}>
                  <span>
                    {chk.status === "pass" ? (
                      <Check size={13} />
                    ) : chk.status === "attention" ? (
                      <Clock3 size={13} style={{ color: "#c38b47" }} />
                    ) : (
                      <AlertCircle size={13} style={{ color: "#bb625b" }} />
                    )}
                  </span>
                  <div>
                    <strong>{chk.checkTitle}</strong>
                    <small>{chk.findings || "Good condition"} {chk.measurement ? `· ${chk.measurement}` : ""}</small>
                  </div>

                  {/* Interactive Status Toggles */}
                  <div className="inspection-toggles">
                    <button
                      className={`toggle-btn ${chk.status === "pass" ? "active-pass" : ""}`}
                      onClick={() => updateInspectionMutation.mutate({ itemId: chk.id, status: "pass", findings: "Pass verified" })}
                    >
                      Pass
                    </button>
                    <button
                      className={`toggle-btn ${chk.status === "attention" ? "active-attention" : ""}`}
                      onClick={() => updateInspectionMutation.mutate({ itemId: chk.id, status: "attention", measurement: "3.2 mm", findings: "Attention required" })}
                    >
                      Attn
                    </button>
                    <button
                      className={`toggle-btn ${chk.status === "fail" ? "active-fail" : ""}`}
                      onClick={() => updateInspectionMutation.mutate({ itemId: chk.id, status: "fail", findings: "Critical wear" })}
                    >
                      Fail
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar Context Panel */}
        <aside className="detail-side">
          <section className="panel side-panel">
            <div className="panel-kicker">Assigned workshop bay</div>
            <div className="bay-card">
              <span className="bay-number">{job.bayNumber?.replace(/[^0-9]/g, "") || "01"}</span>
              <div>
                <strong>{job.bayNumber} · General Service</strong>
                <small>{job.technician?.name || "Unassigned"} · {job.technician?.specialty || "General tech"}</small>
              </div>
            </div>
            <div className="side-rule" />
            <div className="side-detail">
              <span>Promise time</span>
              <strong>{job.promiseTime || "Today, 17:00"}</strong>
            </div>
            <div className="side-detail">
              <span>Vehicle mileage</span>
              <strong>{(job.mileageIn || job.vehicle.mileage).toLocaleString()} km</strong>
            </div>
            <div className="side-detail">
              <span>Customer phone</span>
              <strong>{job.customer.phone}</strong>
            </div>
            <div className="side-detail">
              <span>Customer email</span>
              <strong>{job.customer.email || "None registered"}</strong>
            </div>
          </section>

          <section className="panel side-panel">
            <div className="panel-kicker">Vehicle Digital Passport</div>
            <div className="vehicle-passport">
              <div className="vehicle-visual">
                <Car size={42} strokeWidth={1.1} />
              </div>
              <strong>{job.vehicle.make} {job.vehicle.model}</strong>
              <span>VIN · {job.vehicle.vin || "SALWA2BK7NA123456"}</span>
              <button
                className="panel-link"
                onClick={() => onOpenHistory(job.vehicle.id)}
                style={{ marginTop: "12px", border: "none", cursor: "pointer" }}
              >
                View service history <ArrowRight size={14} />
              </button>
            </div>
          </section>

          <section className="side-note">
            <Bell size={16} />
            <span>Customer approval status: <strong>{isApproved ? "Approved" : "Awaiting customer WhatsApp response"}</strong></span>
          </section>
        </aside>
      </div>

      {/* Add Labour Modal */}
      {addLabourModal && (
        <AddLabourModal
          jobCardId={job.id}
          onClose={() => setAddLabourModal(false)}
          onSuccess={() => {
            setAddLabourModal(false);
            utils.jobCards.getById.invalidate({ idOrNumber: jobIdOrNumber });
          }}
        />
      )}

      {/* Add Part Modal */}
      {addPartModal && (
        <AddJobCardPartModal
          jobCardId={job.id}
          onClose={() => setAddPartModal(false)}
          onSuccess={() => {
            setAddPartModal(false);
            utils.jobCards.getById.invalidate({ idOrNumber: jobIdOrNumber });
          }}
        />
      )}

      {/* UAE Tax Invoice Modal */}
      {invoiceModal && (
        <InvoiceModal
          job={job}
          workshop={workshop}
          onClose={() => setInvoiceModal(false)}
          onRecordPayment={() => {
            setInvoiceModal(false);
            setPaymentModal(true);
          }}
        />
      )}

      {/* Payment Recording Modal */}
      {paymentModal && (
        <PaymentModal
          job={job}
          onClose={() => setPaymentModal(false)}
          onSuccess={() => {
            setPaymentModal(false);
            utils.jobCards.getById.invalidate({ idOrNumber: jobIdOrNumber });
            utils.invoices.list.invalidate();
            utils.payments.list.invalidate();
          }}
        />
      )}
    </>
  );
}

// ============================================================================
// 3. DEDICATED MODULE PAGES (CUSTOMERS, VEHICLES, INVENTORY, ETC.)
// ============================================================================
function ModuleView({
  module,
  onNewJob,
  onAddCustomer,
  onAddVehicle,
  onOpenHistory,
}: {
  module: string;
  onNewJob?: () => void;
  onAddCustomer: () => void;
  onAddVehicle: () => void;
  onOpenHistory: (vehicleId: number) => void;
}) {
  const [, setLocation] = useLocation();

  if (module === "Job cards") {
    return (
      <JobCardsListPage
        onNewJob={() => onNewJob?.()}
        onNavigateDetail={(id) => setLocation(`/app/job-cards/${id}`)}
      />
    );
  }
  if (module === "Customers") {
    return <CustomersListPage onAddCustomer={onAddCustomer} />;
  }
  if (module === "Vehicles") {
    return <VehiclesListPage onAddVehicle={onAddVehicle} onOpenHistory={onOpenHistory} />;
  }
  if (module === "Parts" || module === "Inventory") {
    return <PartsListPage />;
  }
  if (module === "Technicians") {
    return <TechniciansListPage />;
  }
  if (module === "Invoices") {
    return <InvoicesListPage />;
  }
  if (module === "Payments") {
    return <PaymentsListPage />;
  }
  if (module === "Settings") {
    return <SettingsPage />;
  }

  return <div>Module {module}</div>;
}

// --- Job Cards List Page ---
function JobCardsListPage({ onNewJob, onNavigateDetail }: { onNewJob: () => void; onNavigateDetail: (id: string | number) => void }) {
  const { data: jobs = [], isLoading } = trpc.jobCards.list.useQuery();
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = jobs.filter((j) => {
    if (filter === "approval" && j.status !== "awaiting_approval") return false;
    if (filter === "in_progress" && j.status !== "in_progress" && j.status !== "diagnosing") return false;
    if (filter === "ready" && j.status !== "ready_for_handover") return false;
    if (filter === "completed" && j.status !== "completed") return false;

    if (!search.trim()) return true;
    const q = search.toLowerCase().trim();
    return (
      j.jobCardNumber.toLowerCase().includes(q) ||
      (j.customer?.name && j.customer.name.toLowerCase().includes(q)) ||
      (j.customer?.phone && j.customer.phone.includes(q)) ||
      (j.vehicle?.plateNumber && j.vehicle.plateNumber.toLowerCase().includes(q)) ||
      (j.vehicle?.make && j.vehicle.make.toLowerCase().includes(q)) ||
      (j.vehicle?.model && j.vehicle.model.toLowerCase().includes(q)) ||
      (j.technician?.name && j.technician.name.toLowerCase().includes(q)) ||
      (j.serviceSummary && j.serviceSummary.toLowerCase().includes(q)) ||
      (j.bayNumber && j.bayNumber.toLowerCase().includes(q))
    );
  });

  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow"><span className="eyebrow-line" /> Workshop Queue</div>
          <h1>Job cards</h1>
          <p>Live vehicle work orders from first intake to final gate pass release.</p>
        </div>
        <div className="heading-actions">
          <button className="button button-accent" onClick={onNewJob}>
            <Plus size={17} /> New job card
          </button>
        </div>
      </div>

      <div style={{ display: "flex", gap: "8px", marginBottom: "18px" }}>
        {["all", "approval", "in_progress", "ready", "completed"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`button ${filter === f ? "button-dark" : "button-quiet"}`}
            style={{ textTransform: "capitalize", padding: "8px 14px", fontSize: "11px" }}
          >
            {f.replace("_", " ")}
          </button>
        ))}
      </div>

      <section className="panel">
        <TableSearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search job cards by Job #, customer, plate, make, model, bay..."
          count={filtered.length}
          totalCount={jobs.length}
        />
        <div className="job-table">
          <div className="table-head">
            <span>Job / vehicle</span>
            <span>Work</span>
            <span>Technician</span>
            <span>Status</span>
            <span>Timing / Bay</span>
            <span />
          </div>

          {isLoading ? (
            <div style={{ padding: "30px", textAlign: "center" }}><Loader2 size={22} className="animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: "36px", textAlign: "center", color: "#6e8085" }}>
              {search.trim() ? (
                <>
                  No job cards matching "<strong>{search}</strong>".{" "}
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    style={{ border: "none", background: "none", color: "#327d94", fontWeight: 600, cursor: "pointer", textDecoration: "underline" }}
                  >
                    Clear search
                  </button>
                </>
              ) : (
                "No job cards found for this filter."
              )}
            </div>
          ) : (
            filtered.map((job) => (
              <div
                className="job-row"
                key={job.id}
                onClick={() => onNavigateDetail(job.id)}
                style={{ cursor: "pointer" }}
              >
                <div className="job-vehicle">
                  <span className="plate">{job.vehicle?.plateCode} {job.vehicle?.plateNumber}</span>
                  <div>
                    <strong>{job.jobCardNumber} · {job.customer?.name}</strong>
                    <small>{job.vehicle?.make} {job.vehicle?.model}</small>
                  </div>
                </div>
                <div className="job-work">
                  <strong>{job.serviceSummary}</strong>
                  <small>AED {job.totalAmount.toLocaleString()} · {job.labourItems.length + job.parts.length} line items</small>
                </div>
                <div className="job-tech">
                  {job.technician ? (
                    <>
                      <span className="tech-avatar">{job.technician.initials}</span>
                      {job.technician.name}
                    </>
                  ) : (
                    "Unassigned"
                  )}
                </div>
                <StatusBadge tone={job.status === "awaiting_approval" ? "warning" : job.status === "ready_for_handover" || job.status === "completed" ? "success" : "blue"}>
                  {job.status.replace("_", " ")}
                </StatusBadge>
                <span className="job-time">{job.bayNumber} · {job.promiseTime}</span>
                <ChevronRight size={16} className="row-arrow" />
              </div>
            ))
          )}
        </div>
      </section>
    </>
  );
}

// --- Reusable Search Bar for Workspace Tables ---
function TableSearchBar({
  value,
  onChange,
  placeholder,
  count,
  totalCount,
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
  count: number;
  totalCount: number;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        padding: "12px 24px",
        borderBottom: "1px solid #edf0ef",
        background: "#fafbfa",
        flexWrap: "wrap",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "9px",
          background: "#ffffff",
          border: "1px solid #d8e2e0",
          borderRadius: "5px",
          padding: "7px 12px",
          width: "min(420px, 100%)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
        }}
      >
        <Search size={15} style={{ color: "#74868b", flexShrink: 0 }} />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            border: "none",
            outline: "none",
            width: "100%",
            fontSize: "12px",
            color: "#25353a",
            background: "transparent",
          }}
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            style={{
              border: "none",
              background: "transparent",
              cursor: "pointer",
              padding: "0 2px",
              color: "#8a9b9f",
              display: "flex",
              alignItems: "center",
            }}
            title="Clear search"
          >
            <X size={14} />
          </button>
        )}
      </div>
      <div style={{ fontSize: "11px", color: "#788a8f", fontFamily: "'DM Mono', monospace" }}>
        {value.trim() ? (
          <>
            Showing <strong>{count}</strong> of {totalCount} matching
          </>
        ) : (
          <>
            Total: <strong>{totalCount}</strong> records
          </>
        )}
      </div>
    </div>
  );
}

// --- Customers List Page ---
function CustomersListPage({ onAddCustomer }: { onAddCustomer: () => void }) {
  const { data: customers = [], isLoading } = trpc.customers.list.useQuery();
  const [search, setSearch] = useState("");

  const filtered = customers.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase().trim();
    return (
      c.name.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      (c.address && c.address.toLowerCase().includes(q)) ||
      (c.notes && c.notes.toLowerCase().includes(q)) ||
      (c.companyName && c.companyName.toLowerCase().includes(q))
    );
  });

  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow"><span className="eyebrow-line" /> Relationships</div>
          <h1>Customers</h1>
          <p>Verified workshop client database, vehicle links and contact histories.</p>
        </div>
        <div className="heading-actions">
          <button className="button button-accent" onClick={onAddCustomer}>
            <Plus size={17} /> Add customer
          </button>
        </div>
      </div>

      <section className="panel">
        <TableSearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search customers by name, phone, email, address..."
          count={filtered.length}
          totalCount={customers.length}
        />
        <div style={{ padding: "0 24px" }}>
          {isLoading ? (
            <div style={{ padding: "30px", textAlign: "center" }}><Loader2 size={22} className="animate-spin" /></div>
          ) : customers.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#6b7d82" }}>No customers registered yet.</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#6b7d82" }}>
              No customers matching "<strong>{search}</strong>".{" "}
              <button
                type="button"
                onClick={() => setSearch("")}
                style={{ border: "none", background: "none", color: "#327d94", fontWeight: 600, cursor: "pointer", textDecoration: "underline" }}
              >
                Clear search
              </button>
            </div>
          ) : (
            filtered.map((c) => (
              <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 0", borderBottom: "1px solid #edf0ef" }}>
                <div>
                  <strong style={{ fontSize: "14px", color: "#25353a" }}>{c.name}</strong>
                  <div style={{ fontSize: "12px", color: "#61747a", marginTop: "4px" }}>
                    {c.phone} · {c.email || "No email"} · {c.address || "Dubai"}
                  </div>
                  {c.notes && <div style={{ fontSize: "11px", color: "#809297", marginTop: "4px" }}>{c.notes}</div>}
                </div>
                <StatusBadge tone="neutral">Active Client</StatusBadge>
              </div>
            ))
          )}
        </div>
      </section>
    </>
  );
}

// --- Vehicles List Page ---
function VehiclesListPage({ onAddVehicle, onOpenHistory }: { onAddVehicle: () => void; onOpenHistory: (vehicleId: number) => void }) {
  const { data: vehicles = [], isLoading } = trpc.vehicles.list.useQuery();
  const [search, setSearch] = useState("");

  const filtered = vehicles.filter((v) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase().trim();
    return (
      v.make.toLowerCase().includes(q) ||
      v.model.toLowerCase().includes(q) ||
      String(v.year).includes(q) ||
      v.plateNumber.toLowerCase().includes(q) ||
      v.plateCode.toLowerCase().includes(q) ||
      `${v.plateCode} ${v.plateNumber}`.toLowerCase().includes(q) ||
      (v.customer?.name && v.customer.name.toLowerCase().includes(q)) ||
      (v.vin && v.vin.toLowerCase().includes(q)) ||
      (v.color && v.color.toLowerCase().includes(q))
    );
  });

  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow"><span className="eyebrow-line" /> Digital Service Passports</div>
          <h1>Vehicles</h1>
          <p>Complete garage vehicle registry with VIN numbers, plate codes and service passports.</p>
        </div>
        <div className="heading-actions">
          <button className="button button-accent" onClick={onAddVehicle}>
            <Plus size={17} /> Register vehicle
          </button>
        </div>
      </div>

      <section className="panel">
        <TableSearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search vehicles by plate number, make, model, owner, VIN..."
          count={filtered.length}
          totalCount={vehicles.length}
        />
        <div style={{ padding: "0 24px" }}>
          {isLoading ? (
            <div style={{ padding: "30px", textAlign: "center" }}><Loader2 size={22} className="animate-spin" /></div>
          ) : vehicles.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#6b7d82" }}>No vehicles registered yet.</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#6b7d82" }}>
              No vehicles matching "<strong>{search}</strong>".{" "}
              <button
                type="button"
                onClick={() => setSearch("")}
                style={{ border: "none", background: "none", color: "#327d94", fontWeight: 600, cursor: "pointer", textDecoration: "underline" }}
              >
                Clear search
              </button>
            </div>
          ) : (
            filtered.map((v) => (
              <div key={v.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 0", borderBottom: "1px solid #edf0ef" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <span className="plate large-plate">{v.plateCode} {v.plateNumber}</span>
                  <div>
                    <strong style={{ fontSize: "14px", color: "#25353a" }}>{v.make} {v.model} ({v.year})</strong>
                    <div style={{ fontSize: "12px", color: "#61747a", marginTop: "4px" }}>
                      Owner: {v.customer?.name} · Mileage: {v.mileage.toLocaleString()} km · VIN: {v.vin || "—"}
                    </div>
                  </div>
                </div>
                <button className="button button-quiet" onClick={() => onOpenHistory(v.id)}>
                  View Passport <ArrowRight size={14} />
                </button>
              </div>
            ))
          )}
        </div>
      </section>
    </>
  );
}

// --- Parts List Page ---
function PartsListPage() {
  const { data: items = [], isLoading } = trpc.inventory.list.useQuery();
  const utils = trpc.useUtils();
  const [addPartModal, setAddPartModal] = useState(false);
  const [search, setSearch] = useState("");

  const adjustMutation = trpc.inventory.adjustStock.useMutation({
    onSuccess: () => utils.inventory.list.invalidate(),
  });

  const filtered = items.filter((item) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase().trim();
    return (
      item.name.toLowerCase().includes(q) ||
      item.partNumber.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      (item.supplier && item.supplier.toLowerCase().includes(q)) ||
      (item.binLocation && item.binLocation.toLowerCase().includes(q))
    );
  });

  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow"><span className="eyebrow-line" /> Parts & Stock Logistics</div>
          <h1>Parts</h1>
          <p>Real-time parts stock on shelf, reorder thresholds and replacement components.</p>
        </div>
        <div className="heading-actions">
          <button className="button button-accent" onClick={() => setAddPartModal(true)}>
            <Plus size={17} /> Add new part
          </button>
        </div>
      </div>

      <section className="panel">
        <TableSearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search parts by name, part #/SKU, category, supplier..."
          count={filtered.length}
          totalCount={items.length}
        />
        <div style={{ padding: "0 24px" }}>
          {isLoading ? (
            <div style={{ padding: "30px", textAlign: "center" }}><Loader2 size={22} className="animate-spin" /></div>
          ) : items.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#6b7d82" }}>No parts registered in catalog yet.</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#6b7d82" }}>
              No parts matching "<strong>{search}</strong>".{" "}
              <button
                type="button"
                onClick={() => setSearch("")}
                style={{ border: "none", background: "none", color: "#327d94", fontWeight: 600, cursor: "pointer", textDecoration: "underline" }}
              >
                Clear search
              </button>
            </div>
          ) : (
            filtered.map((item) => (
              <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 0", borderBottom: "1px solid #edf0ef" }}>
                <div>
                  <strong style={{ fontSize: "13px", color: "#25353a" }}>{item.name}</strong>
                  <div style={{ fontSize: "12px", color: "#607379", marginTop: "4px" }}>
                    Part #{item.partNumber} · Category: {item.category} · Unit: AED {item.unitPrice}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <span className={item.onHand === 0 ? "stock-out" : item.onHand <= item.reorderPoint ? "stock-low" : "stock-ok"}>
                    {item.onHand === 0 ? "Out of stock" : `${item.onHand} in stock`}
                  </span>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button
                      className="button button-quiet"
                      style={{ padding: "6px 10px", fontSize: "12px" }}
                      onClick={() => adjustMutation.mutate({ partId: item.id, delta: -1 })}
                      disabled={item.onHand <= 0}
                    >
                      -1
                    </button>
                    <button
                      className="button button-quiet"
                      style={{ padding: "6px 10px", fontSize: "12px" }}
                      onClick={() => adjustMutation.mutate({ partId: item.id, delta: 1 })}
                    >
                      +1
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {addPartModal && <AddPartModal onClose={() => setAddPartModal(false)} />}
    </>
  );
}

// --- Technicians List Page ---
function TechniciansListPage() {
  const { data: techs = [], isLoading } = trpc.technicians.list.useQuery();
  const [addTechModal, setAddTechModal] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = techs.filter((t) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase().trim();
    return (
      t.name.toLowerCase().includes(q) ||
      (t.specialty && t.specialty.toLowerCase().includes(q)) ||
      t.initials.toLowerCase().includes(q) ||
      (t.phone && t.phone.includes(q))
    );
  });

  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow"><span className="eyebrow-line" /> Workshop Crew</div>
          <h1>Technicians</h1>
          <p>Floor technicians, skill specialties and active workload.</p>
        </div>
        <div className="heading-actions">
          <button className="button button-accent" onClick={() => setAddTechModal(true)}>
            <Plus size={17} /> Add technician
          </button>
        </div>
      </div>

      <section className="panel">
        <TableSearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search technicians by name, specialty, initials, phone..."
          count={filtered.length}
          totalCount={techs.length}
        />
        <div style={{ padding: "0 24px" }}>
          {isLoading ? (
            <div style={{ padding: "30px", textAlign: "center" }}><Loader2 size={22} className="animate-spin" /></div>
          ) : techs.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#6b7d82" }}>No technicians registered yet.</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#6b7d82" }}>
              No technicians matching "<strong>{search}</strong>".{" "}
              <button
                type="button"
                onClick={() => setSearch("")}
                style={{ border: "none", background: "none", color: "#327d94", fontWeight: 600, cursor: "pointer", textDecoration: "underline" }}
              >
                Clear search
              </button>
            </div>
          ) : (
            filtered.map((t) => (
              <div key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 0", borderBottom: "1px solid #edf0ef" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <span className="tech-avatar large">{t.initials}</span>
                  <div>
                    <strong style={{ fontSize: "14px", color: "#25353a" }}>{t.name}</strong>
                    <div style={{ fontSize: "12px", color: "#5d7076", marginTop: "4px" }}>
                      {t.specialty} · Phone: {t.phone || "—"}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                  <span style={{ fontSize: "12px", fontWeight: 600, color: "#3d5056" }}>
                    {t.activeJobsCount} active jobs ({t.loadPercentage}% load)
                  </span>
                  <StatusBadge tone="success">On Duty</StatusBadge>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {addTechModal && <AddTechnicianModal onClose={() => setAddTechModal(false)} />}
    </>
  );
}

// --- Helper to Send Tax Invoice PDF via WhatsApp ---
function sendInvoiceWhatsApp(inv: any, workshopName?: string, workshopTrn?: string | null) {
  const customerPhone = inv.customer?.phone || "";
  const cleanPhone = customerPhone.replace(/[^\d]/g, "");
  let intlPhone = cleanPhone;
  if (cleanPhone.startsWith("05")) {
    intlPhone = "971" + cleanPhone.slice(1);
  } else if (cleanPhone.startsWith("5") && cleanPhone.length === 9) {
    intlPhone = "971" + cleanPhone;
  }

  let lineItemsDesc: string[] = [];
  if (inv.items && inv.items.length > 0) {
    lineItemsDesc = inv.items.map((it: any) => `• *${it.description}*: ${it.quantity} × AED ${parseFloat(it.rate || 0).toFixed(2)} = AED ${parseFloat(it.amount || 0).toFixed(2)}`);
  } else if (inv.jobCard) {
    const labours = (inv.jobCard.labourItems || []).map((l: any) => `• *${l.description}* (Labour): ${l.hours}h = AED ${parseFloat(l.amount).toFixed(2)}`);
    const parts = (inv.jobCard.parts || []).map((p: any) => `• *${p.partName}* (Part): ${p.quantity}x = AED ${parseFloat(p.totalPrice).toFixed(2)}`);
    lineItemsDesc = [...labours, ...parts];
  }

  const itemsText = lineItemsDesc.length > 0 ? `\n*SERVICES & PARTS:*\n${lineItemsDesc.join("\n")}\n` : "";
  const discountVal = Number(inv.discount || 0);
  const discountText = discountVal > 0 ? `*Discount:* -AED ${discountVal.toFixed(2)}\n` : "";

  const text = encodeURIComponent(
`📄 *INVOICE — ${(workshopName || "GREENWAY AUTO LLC").toUpperCase()}*
TRN: ${inv.trn || workshopTrn || "100234567890003"}
Invoice No: *${inv.invoiceNumber}*
Date: ${new Date(inv.issuedAt || Date.now()).toLocaleDateString("en-AE")}

Dear *${inv.customer?.name || "Valued Customer"}*,
Thank you for choosing ${workshopName || "our workshop"}. Here is your official invoice summary:
${itemsText}━━━━━━━━━━━━━━━━━━━━
*Subtotal:* AED ${parseFloat(inv.subtotal || 0).toFixed(2)}
${discountText}*5% UAE VAT:* AED ${parseFloat(inv.vatAmount || 0).toFixed(2)}
━━━━━━━━━━━━━━━━━━━━
*TOTAL DUE:* AED ${parseFloat(inv.totalAmount || 0).toFixed(2)}
*Status:* ${(inv.status || "draft").toUpperCase().replace("_", " ")}
━━━━━━━━━━━━━━━━━━━━

A stamped official PDF copy is available upon request.
Thank you for your business!`
  );

  const url = `https://wa.me/${intlPhone}?text=${text}`;
  window.open(url, "_blank");
}

// --- Generate Invoice Modal (Dual-Mode: With Job Card vs Without Job Card) ---
function GenerateInvoiceModal({
  onClose,
  onGenerated,
}: {
  onClose: () => void;
  onGenerated: (inv: any) => void;
}) {
  const utils = trpc.useUtils();
  const { data: customers = [] } = trpc.customers.list.useQuery();
  const { data: eligibleJobs = [], isLoading: loadingJobs } = trpc.invoices.listEligibleJobCards.useQuery();
  const { data: inventory = [] } = trpc.inventory.list.useQuery();

  const [invoiceType, setInvoiceType] = useState<"With Job Card" | "Without Job Card">("Without Job Card");

  // With Job Card state
  const [selectedJobCardId, setSelectedJobCardId] = useState<number | "">("");

  // Without Job Card state
  const [customerId, setCustomerId] = useState<number | "">("");
  const [invoiceDate, setInvoiceDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [note, setNote] = useState("");
  const [items, setItems] = useState<Array<{ id: string; partId?: number; description: string; quantity: number | ""; rate: number | ""; amount: number }>>([
    { id: "1", description: "", quantity: 1, rate: "", amount: 0 },
  ]);

  // Discount (applies to both cases)
  const [discount, setDiscount] = useState<number | "">("");

  useEffect(() => {
    if (eligibleJobs.length > 0 && !selectedJobCardId) {
      setSelectedJobCardId(eligibleJobs[0].id);
    }
  }, [eligibleJobs, selectedJobCardId]);

  const generateFromJobMutation = trpc.invoices.generateFromJobCard.useMutation();
  const createDirectMutation = trpc.invoices.createDirect.useMutation();

  const selectedJob = typeof selectedJobCardId === "number" ? eligibleJobs.find((j) => j.id === selectedJobCardId) : null;
  const estimatedSubtotal = invoiceType === "With Job Card"
    ? (selectedJob ? selectedJob.subtotal : 0)
    : items.reduce((sum, it) => sum + (Number(it.amount) || Number(it.quantity) * Number(it.rate) || 0), 0);

  const discountAmount = Math.max(0, Number(discount) || 0);
  const netAmount = Math.max(0, estimatedSubtotal - discountAmount);
  const vatAmount = Math.round(netAmount * 0.05 * 100) / 100;
  const totalAmount = Math.round((netAmount + vatAmount) * 100) / 100;

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      { id: String(Date.now()), description: "", quantity: 1, rate: "", amount: 0 },
    ]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const handleItemPartChange = (idx: number, partIdVal: string) => {
    const next = [...items];
    if (partIdVal === "custom" || !partIdVal) {
      next[idx].partId = undefined;
    } else {
      const pid = Number(partIdVal);
      const found = inventory.find((i) => i.id === pid);
      if (found) {
        const rate = parseFloat(found.unitPrice) || 0;
        const qty = Number(next[idx].quantity) || 1;
        next[idx].partId = pid;
        next[idx].description = found.name;
        next[idx].rate = rate;
        next[idx].amount = Math.round(qty * rate * 100) / 100;
      }
    }
    setItems(next);
  };

  const handleItemFieldChange = (idx: number, field: "description" | "quantity" | "rate", value: any) => {
    const next = [...items];
    if (field === "description") {
      next[idx].description = value;
    } else if (field === "quantity") {
      next[idx].quantity = value === "" ? "" : Number(value);
      const q = Number(next[idx].quantity) || 0;
      const r = Number(next[idx].rate) || 0;
      next[idx].amount = Math.round(q * r * 100) / 100;
    } else if (field === "rate") {
      next[idx].rate = value === "" ? "" : Number(value);
      const q = Number(next[idx].quantity) || 0;
      const r = Number(next[idx].rate) || 0;
      next[idx].amount = Math.round(q * r * 100) / 100;
    }
    setItems(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (invoiceType === "With Job Card") {
      if (!selectedJobCardId) {
        alert("Please select an eligible job card to invoice");
        return;
      }
      try {
        const res = await generateFromJobMutation.mutateAsync({
          jobCardId: Number(selectedJobCardId),
          discount: discountAmount,
        });
        await utils.invoices.list.invalidate();
        await utils.jobCards.list.invalidate();
        const full = await utils.invoices.getById.fetch({ id: res.id });
        onGenerated(full);
      } catch (err: any) {
        alert(err.message || "Failed to generate invoice");
      }
    } else {
      if (!customerId) {
        alert("Please select a customer");
        return;
      }
      const validItems = items.filter((it) => it.description.trim().length > 0);
      if (validItems.length === 0) {
        alert("Please provide at least one item description");
        return;
      }
      try {
        const res = await createDirectMutation.mutateAsync({
          customerId: Number(customerId),
          invoiceDate,
          note: note || undefined,
          discount: discountAmount,
          items: validItems.map((it) => ({
            description: it.description,
            quantity: Number(it.quantity) || 1,
            rate: Number(it.rate) || 0,
            amount: it.amount,
            partId: it.partId,
          })),
        });
        await utils.invoices.list.invalidate();
        const full = await utils.invoices.getById.fetch({ id: res.id });
        onGenerated(full);
      } catch (err: any) {
        alert(err.message || "Failed to generate direct invoice");
      }
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ width: "min(680px, 100%)" }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 style={{ fontSize: "20px" }}>Generate Invoice</h2>
          </div>
          <button className="icon-button" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <label>
            Invoice type
            <select
              value={invoiceType}
              onChange={(e) => setInvoiceType(e.target.value as any)}
              style={{ fontSize: "14px", fontWeight: 500 }}
            >
              <option value="With Job Card">With Job Card</option>
              <option value="Without Job Card">Without Job Card</option>
            </select>
          </label>

          {invoiceType === "With Job Card" ? (
            <>
              <label>
                Job Card (Ready or Delivered, not yet invoiced)
                <select
                  value={selectedJobCardId}
                  onChange={(e) => setSelectedJobCardId(Number(e.target.value))}
                  required
                >
                  <option value="">Select job card...</option>
                  {eligibleJobs.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.jobCardNumber} — {j.customer?.name} ({j.vehicle?.make} {j.vehicle?.model}) · AED {j.totalAmount.toFixed(2)}
                    </option>
                  ))}
                </select>
                {eligibleJobs.length === 0 && !loadingJobs && (
                  <span style={{ fontSize: "12px", color: "#74868b", marginTop: "4px" }}>
                    No eligible job cards. Mark a job as Ready or Delivered first.
                  </span>
                )}
              </label>

              <label>
                Discount (AED)
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="0"
                />
              </label>

              {selectedJob && (
                <div style={{ background: "#f5f8f7", padding: "14px 16px", borderRadius: "6px", fontSize: "12px", display: "grid", gap: "6px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Job Subtotal:</span>
                    <strong>AED {selectedJob.subtotal.toFixed(2)}</strong>
                  </div>
                  {discountAmount > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", color: "#b94a42" }}>
                      <span>Discount:</span>
                      <strong>-AED {discountAmount.toFixed(2)}</strong>
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>5% UAE VAT:</span>
                    <strong>AED {vatAmount.toFixed(2)}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px dashed #cfd9d6", paddingTop: "6px", fontSize: "13px" }}>
                    <span>Total Due:</span>
                    <strong style={{ color: "#327d94" }}>AED {totalAmount.toFixed(2)}</strong>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="form-row">
                <label>
                  Customer
                  <select
                    value={customerId}
                    onChange={(e) => setCustomerId(Number(e.target.value))}
                    required
                  >
                    <option value="" disabled>Select customer...</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.phone})
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Invoice date
                  <input
                    type="date"
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    required
                  />
                </label>
              </div>

              <label>
                Note
                <textarea
                  rows={2}
                  placeholder="Optional note..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </label>

              {/* Invoice Details Section */}
              <div className="invoice-details-card">
                <div className="invoice-details-header">
                  <strong style={{ fontSize: "13px", color: "#25353a" }}>Invoice details</strong>
                  <button
                    type="button"
                    className="button button-quiet"
                    style={{ padding: "6px 12px", fontSize: "11px" }}
                    onClick={handleAddItem}
                  >
                    Add item
                  </button>
                </div>

                <div className="invoice-item-header">
                  <span>Item</span>
                  <span>Description</span>
                  <span>Qty</span>
                  <span>Rate</span>
                  <span>Amount</span>
                  <span />
                </div>

                {items.map((it, idx) => (
                  <div className="invoice-item-row" key={it.id}>
                    <div>
                      <select
                        className="table-input"
                        value={it.partId || "custom"}
                        onChange={(e) => handleItemPartChange(idx, e.target.value)}
                      >
                        <option value="custom">Select it...</option>
                        {inventory.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <input
                        className="table-input"
                        placeholder="Description"
                        value={it.description}
                        onChange={(e) => handleItemFieldChange(idx, "description", e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <input
                        type="number"
                        min="1"
                        className="table-input"
                        value={it.quantity}
                        onChange={(e) => handleItemFieldChange(idx, "quantity", e.target.value)}
                        placeholder="1"
                        required
                      />
                    </div>
                    <div>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="table-input"
                        value={it.rate}
                        onChange={(e) => handleItemFieldChange(idx, "rate", e.target.value)}
                        placeholder="0"
                        required
                      />
                    </div>
                    <div style={{ fontFamily: "DM Mono, monospace", fontSize: "12px", fontWeight: 600 }}>
                      AED {(it.amount || (Number(it.quantity) || 0) * (Number(it.rate) || 0)).toFixed(2)}
                    </div>
                    <div>
                      <button
                        type="button"
                        className="button button-quiet"
                        style={{ padding: "5px 7px", fontSize: "11px", color: "#bb625b" }}
                        onClick={() => handleRemoveItem(it.id)}
                        disabled={items.length <= 1}
                        title="Remove row"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="form-row" style={{ marginTop: "8px" }}>
                <label>
                  Discount (AED)
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="0"
                  />
                </label>
                <label>
                  Estimated subtotal
                  <div
                    className="table-input"
                    style={{ background: "#f5f8f7", fontWeight: 700, fontSize: "13px", display: "flex", alignItems: "center" }}
                  >
                    AED {estimatedSubtotal.toFixed(2)}
                  </div>
                </label>
              </div>

              <div style={{ background: "#edf4f3", padding: "12px 14px", borderRadius: "5px", fontSize: "11px", color: "#365158", display: "flex", justifyContent: "space-between" }}>
                <span>Net Taxable: AED {netAmount.toFixed(2)}</span>
                <span>5% UAE VAT: AED {vatAmount.toFixed(2)}</span>
                <strong style={{ color: "#256c81", fontSize: "12px" }}>Total: AED {totalAmount.toFixed(2)}</strong>
              </div>
            </>
          )}

          <div className="form-actions" style={{ justifyContent: "flex-end" }}>
            <button type="button" className="button button-quiet" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="button button-dark"
              style={{ minWidth: "110px" }}
              disabled={generateFromJobMutation.isPending || createDirectMutation.isPending}
            >
              {generateFromJobMutation.isPending || createDirectMutation.isPending ? "Generating..." : "Generate"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --- Invoice Detail & Printable Modal with WhatsApp Dispatch ---
function InvoiceDetailPreviewModal({
  invoiceId,
  workshop,
  onClose,
}: {
  invoiceId: number;
  workshop?: Workshop | null;
  onClose: () => void;
}) {
  const { data: invoice, isLoading } = trpc.invoices.getById.useQuery({ id: invoiceId });

  if (isLoading || !invoice) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-card" style={{ padding: "40px", textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
          <Loader2 size={26} className="animate-spin" style={{ margin: "0 auto 12px", color: "#327d94" }} />
          <p style={{ fontSize: "13px", color: "#54686e" }}>Loading Invoice #{invoiceId}...</p>
        </div>
      </div>
    );
  }

  const items = invoice.items || [];
  const jobCard = invoice.jobCard;

  const handleWhatsApp = () => {
    sendInvoiceWhatsApp(invoice, workshop?.name, workshop?.trn);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card large-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <span className="panel-kicker">UAE Invoice Compliance</span>
            <h2>Invoice {invoice.invoiceNumber}</h2>
            <p>5% VAT compliant invoice format with UAE Tax Registration Number (TRN).</p>
          </div>
          <button className="icon-button" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="invoice-preview-card">
          <div className="invoice-top-bar">
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 700, fontSize: "18px" }}>
                <BrandMark size={22} /> GreenWay Auto
              </div>
              <div style={{ marginTop: "6px", fontSize: "11px", color: "#61747a" }}>
                {workshop?.name || "GreenWay Auto LLC"} · {workshop?.address || "Al Quoz Industrial 3, Dubai, UAE"}<br />
                TRN: <strong>{invoice.trn || workshop?.trn || "100234567890003"}</strong>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <h3 style={{ margin: "0 0 4px", fontSize: "20px", color: "#25353a" }}>INVOICE</h3>
              <div style={{ fontFamily: "DM Mono, monospace", fontSize: "12px", color: "#54686e" }}>
                Invoice #: <strong>{invoice.invoiceNumber}</strong><br />
                Date: {new Date(invoice.issuedAt).toLocaleDateString("en-AE")}
              </div>
            </div>
          </div>

          <div className="invoice-meta-grid">
            <div>
              <span className="panel-kicker">Bill To Customer</span>
              <div style={{ marginTop: "4px", fontSize: "13px", fontWeight: 600 }}>{invoice.customer.name}</div>
              <div style={{ color: "#617379", fontSize: "11px" }}>{invoice.customer.phone} · {invoice.customer.address || "Dubai"}</div>
            </div>
            <div>
              <span className="panel-kicker">Reference & Vehicle</span>
              {jobCard ? (
                <>
                  <div style={{ marginTop: "4px", fontSize: "13px", fontWeight: 600 }}>
                    {jobCard.vehicle.make} {jobCard.vehicle.model} ({jobCard.vehicle.year})
                  </div>
                  <div style={{ color: "#617379", fontSize: "11px" }}>
                    Plate: {jobCard.vehicle.plateCode} {jobCard.vehicle.plateNumber} · Job #{jobCard.jobCardNumber}
                  </div>
                </>
              ) : (
                <>
                  <div style={{ marginTop: "4px", fontSize: "13px", fontWeight: 600 }}>Direct Workshop Invoice</div>
                  <div style={{ color: "#617379", fontSize: "11px" }}>{invoice.note || "Counter parts & service invoice"}</div>
                </>
              )}
            </div>
          </div>

          <table className="invoice-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Qty / Hrs</th>
                <th className="text-right">Unit Price</th>
                <th className="text-right">Total (AED)</th>
              </tr>
            </thead>
            <tbody>
              {jobCard ? (
                <>
                  {jobCard.labourItems.map((l) => (
                    <tr key={l.id}>
                      <td>{l.description} (Labour)</td>
                      <td>{l.hours} hrs</td>
                      <td className="text-right">{parseFloat(l.hourlyRate).toFixed(2)}</td>
                      <td className="text-right">{parseFloat(l.amount).toFixed(2)}</td>
                    </tr>
                  ))}
                  {jobCard.parts.map((p) => (
                    <tr key={p.id}>
                      <td>{p.partName} (Part)</td>
                      <td>{p.quantity}</td>
                      <td className="text-right">{parseFloat(p.unitPrice).toFixed(2)}</td>
                      <td className="text-right">{parseFloat(p.totalPrice).toFixed(2)}</td>
                    </tr>
                  ))}
                </>
              ) : (
                items.map((it, idx) => (
                  <tr key={idx}>
                    <td>{it.description}</td>
                    <td>{it.quantity}</td>
                    <td className="text-right">{parseFloat(String(it.rate)).toFixed(2)}</td>
                    <td className="text-right">{parseFloat(String(it.amount)).toFixed(2)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <div className="invoice-summary-box">
            <div className="invoice-summary-row">
              <span>Subtotal</span>
              <strong>AED {parseFloat(invoice.subtotal).toFixed(2)}</strong>
            </div>
            {Number(invoice.discount || 0) > 0 && (
              <div className="invoice-summary-row">
                <span>Discount</span>
                <strong style={{ color: "#b94a42" }}>-AED {parseFloat(invoice.discount || "0").toFixed(2)}</strong>
              </div>
            )}
            <div className="invoice-summary-row">
              <span>5% UAE VAT</span>
              <strong>AED {parseFloat(invoice.vatAmount).toFixed(2)}</strong>
            </div>
            <div className="invoice-summary-row grand-total">
              <span>Total Due</span>
              <strong>AED {parseFloat(invoice.totalAmount).toFixed(2)}</strong>
            </div>
            <div className="invoice-summary-row" style={{ fontSize: "11px", color: "#6a7b80" }}>
              <span>Settlement Status</span>
              <strong>{invoice.status === "paid" ? "PAID IN FULL" : "PAYMENT PENDING"}</strong>
            </div>
          </div>
        </div>

        <div className="form-actions" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
          <div style={{ display: "flex", gap: "10px" }}>
            <button className="button button-whatsapp" onClick={handleWhatsApp}>
              <MessageCircle size={16} /> Send Invoice PDF on WhatsApp
            </button>
            <button className="button button-quiet" onClick={() => window.print()}>
              <Printer size={16} /> Print / Save PDF
            </button>
          </div>
          <button className="button button-quiet" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

// --- Invoices List Page ---
function InvoicesListPage() {
  const { data: invoices = [], isLoading } = trpc.invoices.list.useQuery();
  const { data: workshop } = trpc.workshop.getSettings.useQuery();
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [previewInvoiceId, setPreviewInvoiceId] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  const filtered = invoices.filter((inv) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase().trim();
    return (
      inv.invoiceNumber.toLowerCase().includes(q) ||
      (inv.customer?.name && inv.customer.name.toLowerCase().includes(q)) ||
      (inv.customer?.phone && inv.customer.phone.toLowerCase().includes(q)) ||
      (inv.status && inv.status.toLowerCase().includes(q)) ||
      (inv.trn && inv.trn.toLowerCase().includes(q)) ||
      String(inv.totalAmount).includes(q) ||
      String(inv.amountPaid).includes(q) ||
      (inv.jobCard?.jobCardNumber && inv.jobCard.jobCardNumber.toLowerCase().includes(q))
    );
  });

  const handleWhatsApp = (inv: any) => {
    sendInvoiceWhatsApp(inv, workshop?.name, workshop?.trn);
  };

  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow"><span className="eyebrow-line" /> Tax-Ready Billing</div>
          <h1>Invoices</h1>
          <p>Official UAE tax invoices with 5% VAT and 15-digit TRN compliance.</p>
        </div>
        <div className="heading-actions">
          <button className="button button-accent" onClick={() => setGenerateModalOpen(true)}>
            <Plus size={17} /> Generate invoice
          </button>
        </div>
      </div>

      <section className="panel">
        <TableSearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search invoices by number, customer, phone, job card, status, TRN..."
          count={filtered.length}
          totalCount={invoices.length}
        />
        <div style={{ padding: "0 24px" }}>
          {isLoading ? (
            <div style={{ padding: "30px", textAlign: "center" }}><Loader2 size={22} className="animate-spin" /></div>
          ) : invoices.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#6b7d82" }}>
              No invoices generated yet. Click <strong>Generate invoice</strong> to create one.
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#6b7d82" }}>
              No invoices matching "<strong>{search}</strong>".{" "}
              <button
                type="button"
                onClick={() => setSearch("")}
                style={{ border: "none", background: "none", color: "#327d94", fontWeight: 600, cursor: "pointer", textDecoration: "underline" }}
              >
                Clear search
              </button>
            </div>
          ) : (
            filtered.map((inv) => (
              <div key={inv.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 0", borderBottom: "1px solid #edf0ef", flexWrap: "wrap", gap: "12px" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <strong style={{ fontSize: "14px", color: "#25353a" }}>{inv.invoiceNumber}</strong>
                    <span style={{ fontSize: "13px", color: "#5d7076" }}>· {inv.customer?.name} ({inv.customer?.phone})</span>
                  </div>
                  <div style={{ fontSize: "12px", color: "#5d7076", marginTop: "4px" }}>
                    Date: {new Date(inv.issuedAt).toLocaleDateString("en-AE")} · Subtotal: AED {inv.subtotal} {Number(inv.discount || 0) > 0 ? `· Disc: -AED ${inv.discount}` : ""} + 5% VAT (AED {inv.vatAmount}) · TRN: {inv.trn || "100234567890003"}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ textAlign: "right" }}>
                    <strong style={{ fontSize: "15px", color: "#327d94" }}>AED {inv.totalAmount}</strong>
                    <div style={{ fontSize: "11px", color: "#809297" }}>Paid: AED {inv.amountPaid}</div>
                  </div>
                  <StatusBadge tone={inv.status === "paid" ? "success" : "warning"}>
                    {inv.status.replace("_", " ")}
                  </StatusBadge>
                  <button
                    className="button button-whatsapp"
                    style={{ padding: "7px 12px", fontSize: "11px" }}
                    title="Send Invoice PDF directly on WhatsApp"
                    onClick={() => handleWhatsApp(inv)}
                  >
                    <MessageCircle size={14} /> WhatsApp
                  </button>
                  <button
                    className="button button-quiet"
                    style={{ padding: "7px 12px", fontSize: "11px" }}
                    onClick={() => setPreviewInvoiceId(inv.id)}
                  >
                    <FileText size={14} /> View
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {generateModalOpen && (
        <GenerateInvoiceModal
          onClose={() => setGenerateModalOpen(false)}
          onGenerated={(inv) => {
            setGenerateModalOpen(false);
            setPreviewInvoiceId(inv.id);
          }}
        />
      )}

      {previewInvoiceId !== null && (
        <InvoiceDetailPreviewModal
          invoiceId={previewInvoiceId}
          workshop={workshop}
          onClose={() => setPreviewInvoiceId(null)}
        />
      )}
    </>
  );
}

// --- Lookup & Settle Invoice by ID Modal ---
function LookupInvoicePaymentModal({
  initialInvoiceId,
  workshop,
  onClose,
  onViewFullInvoice,
}: {
  initialInvoiceId?: number | null;
  workshop?: Workshop | null;
  onClose: () => void;
  onViewFullInvoice: (invoiceId: number) => void;
}) {
  const utils = trpc.useUtils();
  const { data: invoices = [] } = trpc.invoices.list.useQuery();
  const { data: payments = [] } = trpc.payments.list.useQuery();
  const { data: vehicles = [] } = trpc.vehicles.list.useQuery();

  const [inputVal, setInputVal] = useState("");
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(initialInvoiceId || null);

  // Settlement Form State
  const [payAmount, setPayAmount] = useState<number | "">("");
  const [payMethod, setPayMethod] = useState<"card" | "cash" | "bank_transfer" | "cheque">("card");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [recordSuccess, setRecordSuccess] = useState<string | null>(null);

  // Find invoice
  const matchedInvoice = useMemo(() => {
    if (selectedInvoiceId) {
      return invoices.find((inv) => inv.id === selectedInvoiceId) || null;
    }
    const q = inputVal.trim().toLowerCase();
    if (!q) return null;
    // exact match on invoice number
    const exact = invoices.find((inv) => inv.invoiceNumber.toLowerCase() === q);
    if (exact) return exact;
    // numeric match (e.g. user entered "20" or "0020" for "INV-0020" or db id)
    const digitsOnly = q.replace(/\D/g, "");
    if (digitsOnly) {
      const byDigits = invoices.find((inv) => {
        const invDigits = inv.invoiceNumber.replace(/\D/g, "");
        return invDigits === digitsOnly || String(inv.id) === digitsOnly || invDigits.endsWith(digitsOnly);
      });
      if (byDigits) return byDigits;
    }
    // partial inclusion
    const partial = invoices.find((inv) => inv.invoiceNumber.toLowerCase().includes(q));
    if (partial) return partial;
    return null;
  }, [invoices, selectedInvoiceId, inputVal]);

  // When matchedInvoice changes, initialize default pay amount to remaining balance
  useEffect(() => {
    if (matchedInvoice) {
      const total = Number(matchedInvoice.totalAmount) || 0;
      const paid = Number(matchedInvoice.amountPaid) || 0;
      const balance = Math.max(0, Math.round((total - paid) * 100) / 100);
      setPayAmount(balance);
      setRecordSuccess(null);
    }
  }, [matchedInvoice?.id, matchedInvoice?.amountPaid, matchedInvoice?.totalAmount]);

  const recordMutation = trpc.payments.recordPayment.useMutation({
    onSuccess: async (_, vars) => {
      await utils.payments.list.invalidate();
      await utils.invoices.list.invalidate();
      setRecordSuccess(`Payment of AED ${vars.amount.toFixed(2)} recorded successfully via ${vars.paymentMethod.toUpperCase()}!`);
      setReference("");
      setNotes("");
      setTimeout(() => setRecordSuccess(null), 4000);
    },
  });

  const handleRecordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!matchedInvoice) return;
    const num = Number(payAmount);
    if (!num || num <= 0) {
      alert("Please enter a valid payment amount");
      return;
    }
    recordMutation.mutate({
      invoiceId: matchedInvoice.id,
      customerId: matchedInvoice.customerId,
      amount: num,
      paymentMethod: payMethod,
      reference: reference || undefined,
      notes: notes || undefined,
    });
  };

  const invoicePayments = useMemo(() => {
    if (!matchedInvoice) return [];
    return payments.filter((p) => p.invoiceId === matchedInvoice.id);
  }, [matchedInvoice, payments]);

  const total = matchedInvoice ? Number(matchedInvoice.totalAmount) || 0 : 0;
  const paid = matchedInvoice ? Number(matchedInvoice.amountPaid) || 0 : 0;
  const balance = Math.max(0, Math.round((total - paid) * 100) / 100);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card large-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "780px" }}>
        <div className="modal-header">
          <div>
            <span className="panel-kicker">Payment Verification & Settlement</span>
            <h2>Invoice Settlement Lookup</h2>
            <p>Enter any Invoice ID to inspect settlement breakdown and record payments.</p>
          </div>
          <button className="icon-button" onClick={onClose}><X size={18} /></button>
        </div>

        <div style={{ padding: "0 28px 24px" }}>
          {/* Search Box & Quick Selector */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "12px", alignItems: "center", marginBottom: "20px" }}>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <Search size={16} style={{ position: "absolute", left: "12px", color: "#74868b" }} />
              <input
                type="text"
                value={inputVal}
                onChange={(e) => {
                  setInputVal(e.target.value);
                  setSelectedInvoiceId(null);
                }}
                placeholder="Enter Invoice ID or Number (e.g. INV-0020, 20)..."
                style={{
                  width: "100%",
                  padding: "10px 14px 10px 36px",
                  fontSize: "13px",
                  borderRadius: "6px",
                  border: "1px solid #ced8d5",
                  outline: "none",
                  background: "#ffffff",
                }}
                autoFocus
              />
              {inputVal && (
                <button
                  type="button"
                  onClick={() => {
                    setInputVal("");
                    setSelectedInvoiceId(null);
                  }}
                  style={{
                    position: "absolute",
                    right: "10px",
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    color: "#8a9b9f",
                  }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <select
              value={matchedInvoice ? matchedInvoice.id : ""}
              onChange={(e) => {
                const id = Number(e.target.value);
                if (id) {
                  setSelectedInvoiceId(id);
                  const found = invoices.find((i) => i.id === id);
                  if (found) setInputVal(found.invoiceNumber);
                } else {
                  setSelectedInvoiceId(null);
                  setInputVal("");
                }
              }}
              style={{
                padding: "10px 14px",
                fontSize: "13px",
                borderRadius: "6px",
                border: "1px solid #ced8d5",
                background: "#ffffff",
                color: "#25353a",
                cursor: "pointer",
                maxWidth: "240px",
              }}
            >
              <option value="">Or select invoice...</option>
              {invoices.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.invoiceNumber} — {inv.customer?.name} (AED {inv.totalAmount})
                </option>
              ))}
            </select>
          </div>

          {/* Matched Invoice View */}
          {matchedInvoice ? (
            <div style={{ display: "grid", gap: "16px" }}>
              {/* Invoice Summary Header */}
              <div
                style={{
                  background: "#f8faf9",
                  border: "1px solid #e1e8e6",
                  borderRadius: "8px",
                  padding: "16px 20px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <strong style={{ fontSize: "16px", color: "#25353a" }}>{matchedInvoice.invoiceNumber}</strong>
                      <StatusBadge tone={matchedInvoice.status === "paid" ? "success" : "warning"}>
                        {matchedInvoice.status.replace("_", " ")}
                      </StatusBadge>
                    </div>
                    <div style={{ fontSize: "12px", color: "#61747a", marginTop: "4px" }}>
                      Issued: {new Date(matchedInvoice.issuedAt).toLocaleDateString("en-AE")} · TRN: {matchedInvoice.trn || "100234567890003"}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      className="button button-whatsapp"
                      style={{ padding: "6px 12px", fontSize: "12px" }}
                      onClick={() => sendInvoiceWhatsApp(matchedInvoice, workshop?.name, workshop?.trn)}
                    >
                      <MessageCircle size={14} /> WhatsApp
                    </button>
                    <button
                      className="button button-quiet"
                      style={{ padding: "6px 12px", fontSize: "12px" }}
                      onClick={() => onViewFullInvoice(matchedInvoice.id)}
                    >
                      <FileText size={14} /> View Invoice
                    </button>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px", marginTop: "16px", paddingTop: "14px", borderTop: "1px solid #edf1f0" }}>
                  <div>
                    <span style={{ fontSize: "11px", textTransform: "uppercase", color: "#7a8c91", letterSpacing: "0.5px", fontWeight: 600 }}>Customer</span>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: "#223439", marginTop: "2px" }}>{matchedInvoice.customer?.name}</div>
                    <div style={{ fontSize: "11px", color: "#617379" }}>{matchedInvoice.customer?.phone} · {matchedInvoice.customer?.address || "Dubai"}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: "11px", textTransform: "uppercase", color: "#7a8c91", letterSpacing: "0.5px", fontWeight: 600 }}>Reference</span>
                    {matchedInvoice.jobCard ? (() => {
                      const linkedVehicle = matchedInvoice.jobCard?.vehicleId ? vehicles.find((v) => v.id === matchedInvoice.jobCard!.vehicleId) : null;
                      return (
                        <div>
                          <div style={{ fontSize: "13px", fontWeight: 600, color: "#223439", marginTop: "2px" }}>
                            {linkedVehicle ? `${linkedVehicle.make} ${linkedVehicle.model} (${linkedVehicle.year})` : `Job #${matchedInvoice.jobCard.jobCardNumber}`}
                          </div>
                          <div style={{ fontSize: "11px", color: "#617379" }}>
                            {linkedVehicle ? `Plate: ${linkedVehicle.plateCode} ${linkedVehicle.plateNumber} · ` : ""}Job #{matchedInvoice.jobCard.jobCardNumber}
                          </div>
                        </div>
                      );
                    })() : (
                      <div style={{ fontSize: "12px", color: "#617379", marginTop: "2px" }}>Direct Workshop Invoice</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Financial Metrics Cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
                <div style={{ background: "#ffffff", border: "1px solid #e1e8e6", borderRadius: "8px", padding: "14px", textAlign: "center" }}>
                  <div style={{ fontSize: "11px", color: "#788b90", textTransform: "uppercase", fontWeight: 600 }}>Total Billed</div>
                  <div style={{ fontSize: "18px", fontWeight: 700, color: "#25353a", marginTop: "4px" }}>AED {total.toFixed(2)}</div>
                  <div style={{ fontSize: "10px", color: "#95a5a9", marginTop: "2px" }}>Includes 5% VAT</div>
                </div>
                <div style={{ background: "#f0f8f4", border: "1px solid #c9e8d6", borderRadius: "8px", padding: "14px", textAlign: "center" }}>
                  <div style={{ fontSize: "11px", color: "#3a7f5a", textTransform: "uppercase", fontWeight: 600 }}>Amount Settled</div>
                  <div style={{ fontSize: "18px", fontWeight: 700, color: "#2b704c", marginTop: "4px" }}>AED {paid.toFixed(2)}</div>
                  <div style={{ fontSize: "10px", color: "#4f8d6d", marginTop: "2px" }}>{invoicePayments.length} payment(s)</div>
                </div>
                <div
                  style={{
                    background: balance > 0 ? "#fdf6ed" : "#edf7f2",
                    border: balance > 0 ? "1px solid #f2ddbf" : "1px solid #cce8d9",
                    borderRadius: "8px",
                    padding: "14px",
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: "11px", color: balance > 0 ? "#b27329" : "#327b56", textTransform: "uppercase", fontWeight: 600 }}>
                    Remaining Balance
                  </div>
                  <div style={{ fontSize: "18px", fontWeight: 700, color: balance > 0 ? "#b8621d" : "#2d7550", marginTop: "4px" }}>
                    AED {balance.toFixed(2)}
                  </div>
                  <div style={{ fontSize: "10px", color: balance > 0 ? "#b87034" : "#458564", marginTop: "2px" }}>
                    {balance > 0 ? "Payment Pending" : "Fully Settled"}
                  </div>
                </div>
              </div>

              {/* Settlement History Table */}
              <div style={{ background: "#ffffff", border: "1px solid #e1e8e6", borderRadius: "8px", overflow: "hidden" }}>
                <div style={{ padding: "12px 16px", background: "#f8faf9", borderBottom: "1px solid #e8efed", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <strong style={{ fontSize: "13px", color: "#25353a" }}>Settlement Ledger for this Invoice</strong>
                  <span style={{ fontSize: "11px", color: "#74868b" }}>{invoicePayments.length} record(s)</span>
                </div>
                {invoicePayments.length === 0 ? (
                  <div style={{ padding: "24px", textAlign: "center", color: "#7c8e93", fontSize: "12px" }}>
                    No payments recorded for this invoice yet.
                  </div>
                ) : (
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                    <thead>
                      <tr style={{ background: "#fdfefe", borderBottom: "1px solid #edf0ef", color: "#617379", textAlign: "left" }}>
                        <th style={{ padding: "10px 16px" }}>Date</th>
                        <th style={{ padding: "10px 16px" }}>Method</th>
                        <th style={{ padding: "10px 16px" }}>Reference</th>
                        <th style={{ padding: "10px 16px", textAlign: "right" }}>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoicePayments.map((p) => (
                        <tr key={p.id} style={{ borderBottom: "1px solid #f1f4f3" }}>
                          <td style={{ padding: "10px 16px" }}>{new Date(p.paidAt).toLocaleDateString("en-AE")}</td>
                          <td style={{ padding: "10px 16px" }}>
                            <span style={{ textTransform: "uppercase", fontWeight: 600, fontSize: "11px", background: "#eff5f3", padding: "2px 6px", borderRadius: "4px", color: "#284a51" }}>
                              {p.paymentMethod}
                            </span>
                          </td>
                          <td style={{ padding: "10px 16px", color: "#5d7076" }}>{p.reference || "—"}</td>
                          <td style={{ padding: "10px 16px", textAlign: "right", fontWeight: 700, color: "#25353a" }}>
                            AED {parseFloat(String(p.amount)).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Success Notification */}
              {recordSuccess && (
                <div style={{ padding: "12px 16px", background: "#e8f5ec", border: "1px solid #b7e3c4", borderRadius: "6px", color: "#2f724a", fontSize: "12px", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px" }}>
                  <Check size={16} /> {recordSuccess}
                </div>
              )}

              {/* Record New Settlement Form (if balance > 0) */}
              {balance > 0 ? (
                <form
                  onSubmit={handleRecordSubmit}
                  style={{
                    background: "#f9fbfa",
                    border: "1px dashed #b8ccc6",
                    borderRadius: "8px",
                    padding: "18px",
                    display: "grid",
                    gap: "12px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <strong style={{ fontSize: "13px", color: "#20343a", display: "flex", alignItems: "center", gap: "6px" }}>
                      <CircleDollarSign size={16} style={{ color: "#327d94" }} /> Record New Payment
                    </strong>
                    <button
                      type="button"
                      onClick={() => setPayAmount(balance)}
                      style={{ border: "none", background: "none", color: "#327d94", fontSize: "11px", fontWeight: 600, cursor: "pointer", textDecoration: "underline" }}
                    >
                      Fill Full Balance (AED {balance.toFixed(2)})
                    </button>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <label style={{ fontSize: "11px", color: "#4f6368", display: "flex", flexDirection: "column", gap: "4px" }}>
                      Amount (AED)
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        max={balance * 2}
                        value={payAmount}
                        onChange={(e) => setPayAmount(e.target.value === "" ? "" : Number(e.target.value))}
                        style={{ padding: "8px 10px", borderRadius: "5px", border: "1px solid #cfd9d6", fontSize: "13px" }}
                        required
                      />
                    </label>
                    <label style={{ fontSize: "11px", color: "#4f6368", display: "flex", flexDirection: "column", gap: "4px" }}>
                      Payment Method
                      <select
                        value={payMethod}
                        onChange={(e) => setPayMethod(e.target.value as any)}
                        style={{ padding: "8px 10px", borderRadius: "5px", border: "1px solid #cfd9d6", fontSize: "13px" }}
                      >
                        <option value="card">Credit / Debit Card (POS)</option>
                        <option value="cash">Cash (Counter Settlement)</option>
                        <option value="bank_transfer">Bank Transfer / Wire</option>
                        <option value="cheque">Cheque</option>
                      </select>
                    </label>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <label style={{ fontSize: "11px", color: "#4f6368", display: "flex", flexDirection: "column", gap: "4px" }}>
                      Reference
                      <input
                        type="text"
                        placeholder="e.g. POS Auth / Cheque #"
                        value={reference}
                        onChange={(e) => setReference(e.target.value)}
                        style={{ padding: "8px 10px", borderRadius: "5px", border: "1px solid #cfd9d6", fontSize: "13px" }}
                      />
                    </label>
                    <label style={{ fontSize: "11px", color: "#4f6368", display: "flex", flexDirection: "column", gap: "4px" }}>
                      Settlement Notes
                      <input
                        type="text"
                        placeholder="Optional notes..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        style={{ padding: "8px 10px", borderRadius: "5px", border: "1px solid #cfd9d6", fontSize: "13px" }}
                      />
                    </label>
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "4px" }}>
                    <button
                      type="submit"
                      className="button button-accent"
                      disabled={recordMutation.isPending}
                      style={{ padding: "8px 16px", fontSize: "12px" }}
                    >
                      {recordMutation.isPending ? "Recording Payment..." : "Record Payment & Update Invoice"}
                    </button>
                  </div>
                </form>
              ) : (
                <div style={{ padding: "14px", background: "#f0f8f4", border: "1px solid #c9e8d6", borderRadius: "6px", textAlign: "center", color: "#2f724a", fontSize: "12px", fontWeight: 600 }}>
                  ✓ This invoice has been paid in full. No outstanding balance.
                </div>
              )}
            </div>
          ) : (
            <div>
              {inputVal.trim() ? (
                <div style={{ padding: "36px", textAlign: "center", background: "#fafbfb", border: "1px dashed #d5dedb", borderRadius: "8px" }}>
                  <AlertCircle size={24} style={{ color: "#bd8941", margin: "0 auto 8px" }} />
                  <strong style={{ display: "block", color: "#25353a", fontSize: "14px" }}>
                    No invoice found matching "{inputVal}"
                  </strong>
                  <p style={{ fontSize: "12px", color: "#617379", maxWidth: "380px", margin: "6px auto 16px" }}>
                    Check that the invoice number is typed correctly (e.g. <code>INV-0020</code> or digits <code>20</code>), or select an invoice from the list below:
                  </p>
                </div>
              ) : (
                <div style={{ padding: "20px 0" }}>
                  <span style={{ fontSize: "11px", textTransform: "uppercase", color: "#74868b", fontWeight: 700, letterSpacing: "0.5px", display: "block", marginBottom: "10px" }}>
                    Recent Invoices ({invoices.length})
                  </span>
                  <div style={{ display: "grid", gap: "8px", maxHeight: "300px", overflowY: "auto" }}>
                    {invoices.slice(0, 10).map((inv) => {
                      const t = Number(inv.totalAmount) || 0;
                      const p = Number(inv.amountPaid) || 0;
                      const bal = Math.max(0, Math.round((t - p) * 100) / 100);
                      return (
                        <div
                          key={inv.id}
                          onClick={() => {
                            setSelectedInvoiceId(inv.id);
                            setInputVal(inv.invoiceNumber);
                          }}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "10px 14px",
                            background: "#ffffff",
                            border: "1px solid #e5ebe9",
                            borderRadius: "6px",
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#327d94")}
                          onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#e5ebe9")}
                        >
                          <div>
                            <strong style={{ fontSize: "13px", color: "#25353a" }}>{inv.invoiceNumber}</strong>
                            <span style={{ fontSize: "12px", color: "#617379", marginLeft: "8px" }}>
                              {inv.customer?.name} ({inv.customer?.phone})
                            </span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <span style={{ fontSize: "12px", fontFamily: "DM Mono, monospace", fontWeight: 600 }}>
                              AED {t.toFixed(2)}
                            </span>
                            <StatusBadge tone={bal === 0 ? "success" : "warning"}>
                              {bal === 0 ? "Settled" : `Bal: AED ${bal.toFixed(2)}`}
                            </StatusBadge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="form-actions" style={{ justifyContent: "flex-end", padding: "16px 28px", borderTop: "1px solid #eef2f1" }}>
          <button type="button" className="button button-quiet" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

// --- Payments List Page ---
function PaymentsListPage() {
  const { data: payments = [], isLoading } = trpc.payments.list.useQuery();
  const { data: workshop } = trpc.workshop.getSettings.useQuery();
  const [search, setSearch] = useState("");
  const [lookupModalOpen, setLookupModalOpen] = useState(false);
  const [selectedInvoiceIdForLookup, setSelectedInvoiceIdForLookup] = useState<number | null>(null);
  const [previewInvoiceId, setPreviewInvoiceId] = useState<number | null>(null);

  const filtered = payments.filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase().trim();
    return (
      (p.invoice?.invoiceNumber && p.invoice.invoiceNumber.toLowerCase().includes(q)) ||
      (p.customer?.name && p.customer.name.toLowerCase().includes(q)) ||
      (p.customer?.phone && p.customer.phone.toLowerCase().includes(q)) ||
      (p.paymentMethod && p.paymentMethod.toLowerCase().includes(q)) ||
      (p.reference && p.reference.toLowerCase().includes(q)) ||
      String(p.amount).includes(q) ||
      new Date(p.paidAt).toLocaleDateString("en-AE").toLowerCase().includes(q)
    );
  });

  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow"><span className="eyebrow-line" /> Settlement Ledger</div>
          <h1>Payments</h1>
          <p>Real-time audit log of customer settlements across Cash, Card and Bank Transfers.</p>
        </div>
        <div className="heading-actions">
          <button
            className="button button-accent"
            onClick={() => {
              setSelectedInvoiceIdForLookup(null);
              setLookupModalOpen(true);
            }}
          >
            <Receipt size={17} /> Lookup by Invoice ID
          </button>
        </div>
      </div>

      <section className="panel">
        <TableSearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search payments by invoice #, customer name, reference, method, amount..."
          count={filtered.length}
          totalCount={payments.length}
        />
        <div style={{ padding: "0 24px" }}>
          {isLoading ? (
            <div style={{ padding: "30px", textAlign: "center" }}><Loader2 size={22} className="animate-spin" /></div>
          ) : payments.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#6b7d82" }}>No payment records found yet.</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#6b7d82" }}>
              No payments matching "<strong>{search}</strong>".{" "}
              <button
                type="button"
                onClick={() => setSearch("")}
                style={{ border: "none", background: "none", color: "#327d94", fontWeight: 600, cursor: "pointer", textDecoration: "underline" }}
              >
                Clear search
              </button>
            </div>
          ) : (
            filtered.map((p) => (
              <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 0", borderBottom: "1px solid #edf0ef", flexWrap: "wrap", gap: "10px" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <strong style={{ fontSize: "14px", color: "#25353a" }}>AED {p.amount} · {p.paymentMethod.toUpperCase()}</strong>
                    {p.invoice && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedInvoiceIdForLookup(p.invoiceId);
                          setLookupModalOpen(true);
                        }}
                        style={{
                          background: "#eef6f5",
                          border: "1px solid #c9ded9",
                          borderRadius: "4px",
                          padding: "2px 7px",
                          fontSize: "11px",
                          fontWeight: 600,
                          color: "#275d6e",
                          cursor: "pointer",
                        }}
                        title="Click to lookup settlement & invoice breakdown"
                      >
                        #{p.invoice.invoiceNumber}
                      </button>
                    )}
                  </div>
                  <div style={{ fontSize: "12px", color: "#5d7076", marginTop: "4px" }}>
                    Customer: {p.customer?.name} ({p.customer?.phone || "—"}) · Ref: {p.reference || "None"}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                  <div style={{ textAlign: "right" }}>
                    <StatusBadge tone="success">Settled</StatusBadge>
                    <div style={{ fontSize: "11px", color: "#809297", marginTop: "4px" }}>
                      {new Date(p.paidAt).toLocaleDateString("en-AE")}
                    </div>
                  </div>
                  {p.invoiceId && (
                    <button
                      className="button button-quiet"
                      style={{ padding: "6px 10px", fontSize: "11px" }}
                      onClick={() => {
                        setSelectedInvoiceIdForLookup(p.invoiceId);
                        setLookupModalOpen(true);
                      }}
                      title="Inspect invoice settlement details"
                    >
                      <Receipt size={14} /> Details
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {lookupModalOpen && (
        <LookupInvoicePaymentModal
          initialInvoiceId={selectedInvoiceIdForLookup}
          workshop={workshop}
          onClose={() => {
            setLookupModalOpen(false);
            setSelectedInvoiceIdForLookup(null);
          }}
          onViewFullInvoice={(invId) => {
            setLookupModalOpen(false);
            setPreviewInvoiceId(invId);
          }}
        />
      )}

      {previewInvoiceId !== null && (
        <InvoiceDetailPreviewModal
          invoiceId={previewInvoiceId}
          workshop={workshop}
          onClose={() => setPreviewInvoiceId(null)}
        />
      )}
    </>
  );
}

// --- Settings Page ---
function SettingsPage() {
  const { data: workshop, isLoading } = trpc.workshop.getSettings.useQuery();
  const utils = trpc.useUtils();

  const [name, setName] = useState("");
  const [city, setCity] = useState("Dubai");
  const [phone, setPhone] = useState("");
  const [trn, setTrn] = useState("");
  const [bays, setBays] = useState(16);
  const [address, setAddress] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (workshop) {
      setName(workshop.name);
      setCity(workshop.city);
      setPhone(workshop.phone || "");
      setTrn(workshop.trn || "");
      setBays(workshop.totalBays);
      setAddress(workshop.address || "");
    }
  }, [workshop]);

  const updateMutation = trpc.workshop.updateSettings.useMutation({
    onSuccess: () => {
      utils.workshop.getSettings.invalidate();
      utils.auth.me.invalidate();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      name,
      city,
      phone,
      trn,
      totalBays: bays,
      address,
    });
  };

  if (isLoading) {
    return <div style={{ padding: "40px", textAlign: "center" }}><Loader2 size={24} className="animate-spin" /></div>;
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow"><span className="eyebrow-line" /> Workspace Configuration</div>
          <h1>Settings</h1>
          <p>Workshop profile, UAE TRN tax configuration and multi-tenant bay setup.</p>
        </div>
      </div>

      <section className="panel" style={{ maxWidth: "680px", padding: "32px" }}>
        {saved && (
          <div style={{ padding: "12px 16px", marginBottom: "20px", background: "#e8f5ec", border: "1px solid #b7e3c4", borderRadius: "5px", color: "#377d54", fontSize: "12px", fontWeight: 600 }}>
            Workshop settings updated successfully.
          </div>
        )}

        <form onSubmit={handleSubmit} className="modal-form">
          <label>
            Workshop Organization Name
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </label>

          <div className="form-row">
            <label>
              City
              <select value={city} onChange={(e) => setCity(e.target.value)}>
                <option>Dubai</option>
                <option>Abu Dhabi</option>
                <option>Sharjah</option>
                <option>Ajman</option>
              </select>
            </label>
            <label>
              Total Workshop Bays
              <input type="number" min={1} max={50} value={bays} onChange={(e) => setBays(Number(e.target.value))} required />
            </label>
          </div>

          <div className="form-row">
            <label>
              Primary Phone
              <input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </label>
            <label>
              UAE Tax Registration Number (TRN)
              <input value={trn} onChange={(e) => setTrn(e.target.value)} placeholder="100234567890003" />
            </label>
          </div>

          <label>
            Physical Address
            <textarea rows={3} value={address} onChange={(e) => setAddress(e.target.value)} />
          </label>

          <button type="submit" className="button button-accent" style={{ marginTop: "12px" }} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? "Saving changes..." : "Save workshop settings"}
          </button>
        </form>
      </section>
    </>
  );
}

// ============================================================================
// 4. MODALS & INTERACTIVE DIALOGS
// ============================================================================

// --- New Job Card Modal ---
function NewJobCardModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: (id: number) => void }) {
  const { data: customers = [] } = trpc.customers.list.useQuery();
  const { data: techs = [] } = trpc.technicians.list.useQuery();
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | "">(customers[0]?.id || "");
  const { data: vehicles = [] } = trpc.vehicles.getByCustomer.useQuery(
    { customerId: typeof selectedCustomerId === "number" ? selectedCustomerId : 0 },
    { enabled: typeof selectedCustomerId === "number" && selectedCustomerId > 0 }
  );

  const [vehicleId, setVehicleId] = useState<number | "">("");
  const [technicianId, setTechnicianId] = useState<number | "">("");
  const [bayNumber, setBayNumber] = useState("Bay 01");
  const [serviceSummary, setServiceSummary] = useState("");
  const [promiseTime, setPromiseTime] = useState("Today, 17:00");
  const [complaints, setComplaints] = useState("");

  const createJobMutation = trpc.jobCards.create.useMutation({
    onSuccess: (res) => onSuccess(res.id),
  });

  // Auto-select first customer when customers query loads
  useEffect(() => {
    if (customers.length > 0 && !selectedCustomerId) {
      setSelectedCustomerId(customers[0].id);
    }
  }, [customers, selectedCustomerId]);

  // Auto-select first vehicle when vehicles load
  useEffect(() => {
    if (vehicles.length > 0 && !vehicleId) {
      setVehicleId(vehicles[0].id);
    }
  }, [vehicles, vehicleId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId || !vehicleId || !serviceSummary) return;

    createJobMutation.mutate({
      customerId: Number(selectedCustomerId),
      vehicleId: Number(vehicleId),
      technicianId: technicianId ? Number(technicianId) : undefined,
      bayNumber,
      serviceSummary,
      promiseTime,
      customerComplaints: complaints,
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <span className="panel-kicker">New Intake</span>
            <h2>Create Work Order</h2>
            <p>Intake vehicle, customer and assign floor technician.</p>
          </div>
          <button className="icon-button" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <label>
            Customer
            <select
              value={selectedCustomerId}
              onChange={(e) => {
                setSelectedCustomerId(Number(e.target.value));
                setVehicleId("");
              }}
              required
            >
              <option value="" disabled>Select customer...</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
              ))}
            </select>
          </label>

          <label>
            Vehicle
            <select
              value={vehicleId}
              onChange={(e) => setVehicleId(Number(e.target.value))}
              required
              disabled={vehicles.length === 0}
            >
              <option value="" disabled>
                {vehicles.length === 0 ? "No vehicles found for customer" : "Select vehicle..."}
              </option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.plateCode} {v.plateNumber} · {v.make} {v.model} ({v.year})
                </option>
              ))}
            </select>
          </label>

          <label>
            Service Summary / Scope
            <input
              placeholder="e.g. Major service + brake inspection"
              value={serviceSummary}
              onChange={(e) => setServiceSummary(e.target.value)}
              required
            />
          </label>

          <div className="form-row">
            <label>
              Assign Technician
              <select value={technicianId} onChange={(e) => setTechnicianId(e.target.value ? Number(e.target.value) : "")}>
                <option value="">Unassigned</option>
                {techs.map((t) => (
                  <option key={t.id} value={t.id}>{t.name} ({t.initials})</option>
                ))}
              </select>
            </label>

            <label>
              Workshop Bay
              <select value={bayNumber} onChange={(e) => setBayNumber(e.target.value)}>
                <option>Bay 01</option>
                <option>Bay 02</option>
                <option>Bay 03</option>
                <option>Bay 04</option>
                <option>Bay 05</option>
                <option>Bay 06</option>
              </select>
            </label>
          </div>

          <label>
            Promise Time
            <input value={promiseTime} onChange={(e) => setPromiseTime(e.target.value)} placeholder="e.g. Today, 16:30" />
          </label>

          <label>
            Customer Complaints / Notes
            <textarea rows={2} value={complaints} onChange={(e) => setComplaints(e.target.value)} placeholder="e.g. Vibration on braking" />
          </label>

          <div className="form-actions">
            <button type="button" className="button button-quiet" onClick={onClose}>Cancel</button>
            <button type="submit" className="button button-accent" disabled={createJobMutation.isPending}>
              {createJobMutation.isPending ? "Creating..." : "Create job card"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --- Add Customer Modal ---
function AddCustomerModal({ onClose }: { onClose: () => void }) {
  const utils = trpc.useUtils();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+971 ");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState<string | null>(null);

  const createMutation = trpc.customers.create.useMutation({
    onSuccess: () => {
      utils.customers.list.invalidate();
      onClose();
    },
    onError: (err) => {
      setError(err.message || "Failed to create customer.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || name.trim().length < 2) {
      setError("Please enter the customer's full name (at least 2 characters).");
      return;
    }

    const subscriberDigits = phone.replace("+971", "").replace(/[^\d]/g, "");
    if (!subscriberDigits || subscriberDigits.length < 7) {
      setError("A valid phone number is required. Please enter at least 7 digits (e.g. +971 50 123 4567). Cannot be blank.");
      return;
    }

    createMutation.mutate({
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      address: address.trim() || undefined,
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <span className="panel-kicker">Client Registry</span>
            <h2>Add New Customer</h2>
            <p>Save customer contact details for billing and WhatsApp alerts.</p>
          </div>
          <button className="icon-button" onClick={onClose}><X size={18} /></button>
        </div>

        {error && (
          <div style={{ margin: "12px 0 0", padding: "10px 14px", background: "#fdf0ed", border: "1px solid #f5c4bc", borderRadius: "5px", color: "#b94a42", fontSize: "12px", fontWeight: 600 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="modal-form">
          <label>
            Full Name
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Tariq Al Habtoor" required />
          </label>

          <div className="form-row">
            <label>
              Phone Number (+971)
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+971 50 123 4567" required />
            </label>
            <label>
              Email Address
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tariq@example.ae" />
            </label>
          </div>

          <label>
            Address / Emirate
            <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="e.g. Al Barsha, Dubai" />
          </label>

          <div className="form-actions">
            <button type="button" className="button button-quiet" onClick={onClose}>Cancel</button>
            <button type="submit" className="button button-accent" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Saving..." : "Save customer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --- Add Vehicle Modal ---
function AddVehicleModal({ onClose }: { onClose: () => void }) {
  const { data: customers = [] } = trpc.customers.list.useQuery();
  const utils = trpc.useUtils();

  const [customerId, setCustomerId] = useState<number | "">("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState<number | "">("");
  const [plateCode, setPlateCode] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [emirate, setEmirate] = useState("Dubai");
  const [error, setError] = useState<string | null>(null);

  const createMutation = trpc.vehicles.create.useMutation({
    onSuccess: () => {
      utils.vehicles.list.invalidate();
      onClose();
    },
    onError: (err) => {
      setError(err.message || "Failed to register vehicle.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!customerId) {
      setError("Please select an assigned customer from the dropdown.");
      return;
    }

    if (!make.trim() || !model.trim()) {
      setError("Vehicle make and model are required.");
      return;
    }

    if (!plateCode.trim() || !plateNumber.trim()) {
      setError("Plate code and plate number are required.");
      return;
    }

    createMutation.mutate({
      customerId: Number(customerId),
      make: make.trim(),
      model: model.trim(),
      year: Number(year) || new Date().getFullYear(),
      plateCode: plateCode.trim(),
      plateNumber: plateNumber.trim(),
      emirate,
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <span className="panel-kicker">Garage Registry</span>
            <h2>Register Vehicle</h2>
            <p>Add vehicle to customer profile with UAE license plate demarcation.</p>
          </div>
          <button className="icon-button" onClick={onClose}><X size={18} /></button>
        </div>

        {error && (
          <div style={{ margin: "12px 0 0", padding: "10px 14px", background: "#fdf0ed", border: "1px solid #f5c4bc", borderRadius: "5px", color: "#b94a42", fontSize: "12px", fontWeight: 600 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="modal-form">
          <label>
            Assigned Customer
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value ? Number(e.target.value) : "")}
              required
            >
              <option value="" disabled>Select customer...</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
              ))}
            </select>
          </label>

          <div className="form-row">
            <label>
              Make
              <input value={make} onChange={(e) => setMake(e.target.value)} placeholder="e.g. Toyota" required />
            </label>
            <label>
              Model
              <input value={model} onChange={(e) => setModel(e.target.value)} placeholder="e.g. Land Cruiser" required />
            </label>
          </div>

          <div className="form-row">
            <label>
              Plate Code
              <input value={plateCode} onChange={(e) => setPlateCode(e.target.value)} placeholder="e.g. D" required />
            </label>
            <label>
              Plate Number
              <input value={plateNumber} onChange={(e) => setPlateNumber(e.target.value)} placeholder="e.g. 48291" required />
            </label>
          </div>

          <div className="form-row">
            <label>
              Emirate
              <select value={emirate} onChange={(e) => setEmirate(e.target.value)}>
                <option>Dubai</option>
                <option>Abu Dhabi</option>
                <option>Sharjah</option>
                <option>Ajman</option>
              </select>
            </label>
            <label>
              Model Year
              <input
                type="number"
                min={1980}
                max={2030}
                value={year}
                onChange={(e) => setYear(e.target.value ? Number(e.target.value) : "")}
                placeholder="e.g. 2024"
                required
              />
            </label>
          </div>

          <div className="form-actions">
            <button type="button" className="button button-quiet" onClick={onClose}>Cancel</button>
            <button type="submit" className="button button-accent" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Registering..." : "Register vehicle"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --- Add Labour Modal ---
function AddLabourModal({ jobCardId, onClose, onSuccess }: { jobCardId: number; onClose: () => void; onSuccess: () => void }) {
  const [description, setDescription] = useState("");
  const [hours, setHours] = useState(1.5);
  const [rate, setRate] = useState(180);

  const addMutation = trpc.jobCards.addLabour.useMutation({
    onSuccess,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description) return;
    addMutation.mutate({
      jobCardId,
      description,
      hours: Number(hours),
      hourlyRate: Number(rate),
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <span className="panel-kicker">Job Line Item</span>
            <h2>Add Labour Service</h2>
            <p>Record technician hours and labor rate for this work order.</p>
          </div>
          <button className="icon-button" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <label>
            Service Description
            <input
              placeholder="e.g. Rear brake pad installation & rotor skimming"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </label>

          <div className="form-row">
            <label>
              Labor Hours
              <input type="number" step="0.25" min="0.25" value={hours} onChange={(e) => setHours(Number(e.target.value))} required />
            </label>
            <label>
              Hourly Rate (AED)
              <input type="number" value={rate} onChange={(e) => setRate(Number(e.target.value))} required />
            </label>
          </div>

          <div style={{ padding: "12px", background: "#edf1f0", borderRadius: "4px", fontSize: "12px", color: "#3e5258" }}>
            Total Labour Amount: <strong>AED {(hours * rate).toFixed(2)}</strong> (5% VAT applies at checkout)
          </div>

          <div className="form-actions">
            <button type="button" className="button button-quiet" onClick={onClose}>Cancel</button>
            <button type="submit" className="button button-accent" disabled={addMutation.isPending}>
              {addMutation.isPending ? "Adding..." : "Add labour line"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --- Add Part To Job Card Modal ---
function AddJobCardPartModal({ jobCardId, onClose, onSuccess }: { jobCardId: number; onClose: () => void; onSuccess: () => void }) {
  const { data: inventory = [] } = trpc.inventory.list.useQuery();
  const [partId, setPartId] = useState<number | "">("");
  const [partName, setPartName] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(100);

  const addMutation = trpc.jobCards.addPart.useMutation({
    onSuccess,
  });

  const handleSelectInventory = (pid: number) => {
    setPartId(pid);
    const item = inventory.find((i) => i.id === pid);
    if (item) {
      setPartName(item.name);
      setUnitPrice(parseFloat(item.unitPrice));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partName) return;
    addMutation.mutate({
      jobCardId,
      partId: partId ? Number(partId) : undefined,
      partName,
      quantity: Number(quantity),
      unitPrice: Number(unitPrice),
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <span className="panel-kicker">Job Line Item</span>
            <h2>Allocate Part to Job</h2>
            <p>Select part from inventory to automatically decrement shelf stock.</p>
          </div>
          <button className="icon-button" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <label>
            Select From Stock Catalog
            <select value={partId} onChange={(e) => handleSelectInventory(Number(e.target.value))}>
              <option value="">Custom non-catalog part...</option>
              {inventory.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name} · AED {i.unitPrice} ({i.onHand} in stock)
                </option>
              ))}
            </select>
          </label>

          <label>
            Part Name / Number
            <input value={partName} onChange={(e) => setPartName(e.target.value)} required />
          </label>

          <div className="form-row">
            <label>
              Quantity
              <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} required />
            </label>
            <label>
              Unit Price (AED)
              <input type="number" value={unitPrice} onChange={(e) => setUnitPrice(Number(e.target.value))} required />
            </label>
          </div>

          <div style={{ padding: "12px", background: "#edf1f0", borderRadius: "4px", fontSize: "12px", color: "#3e5258" }}>
            Total Parts Amount: <strong>AED {(quantity * unitPrice).toFixed(2)}</strong>
          </div>

          <div className="form-actions">
            <button type="button" className="button button-quiet" onClick={onClose}>Cancel</button>
            <button type="submit" className="button button-accent" disabled={addMutation.isPending}>
              {addMutation.isPending ? "Allocating..." : "Add part"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --- UAE Tax Invoice Modal ---
function InvoiceModal({
  job,
  workshop,
  onClose,
  onRecordPayment,
}: {
  job: FullJobCard;
  workshop?: Workshop | null;
  onClose: () => void;
  onRecordPayment: () => void;
}) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card large-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <span className="panel-kicker">UAE Invoice Compliance</span>
            <h2>Invoice Preview</h2>
            <p>5% VAT compliant invoice format with UAE Tax Registration Number (TRN).</p>
          </div>
          <button className="icon-button" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="invoice-preview-card">
          <div className="invoice-top-bar">
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 700, fontSize: "18px" }}>
                <BrandMark size={22} /> GreenWay Auto
              </div>
              <div style={{ marginTop: "6px", fontSize: "11px", color: "#61747a" }}>
                {workshop?.name || "GreenWay Auto LLC"} · {workshop?.address || "Al Quoz Industrial 3, Dubai, UAE"}<br />
                TRN: <strong>{job.invoice?.trn || workshop?.trn || "100234567890003"}</strong>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <h3 style={{ margin: "0 0 4px", fontSize: "20px", color: "#25353a" }}>INVOICE</h3>
              <div style={{ fontFamily: "DM Mono, monospace", fontSize: "12px", color: "#54686e" }}>
                Invoice #: <strong>{job.invoice?.invoiceNumber || `INV-${job.jobCardNumber.replace("EG-", "")}`}</strong><br />
                Date: {new Date().toLocaleDateString("en-AE")}
              </div>
            </div>
          </div>

          <div className="invoice-meta-grid">
            <div>
              <span className="panel-kicker">Bill To Customer</span>
              <div style={{ marginTop: "4px", fontSize: "13px", fontWeight: 600 }}>{job.customer.name}</div>
              <div style={{ color: "#617379", fontSize: "11px" }}>{job.customer.phone} · {job.customer.address || "Dubai"}</div>
            </div>
            <div>
              <span className="panel-kicker">Vehicle Demarcation</span>
              <div style={{ marginTop: "4px", fontSize: "13px", fontWeight: 600 }}>
                {job.vehicle.make} {job.vehicle.model} ({job.vehicle.year})
              </div>
              <div style={{ color: "#617379", fontSize: "11px" }}>
                Plate: {job.vehicle.plateCode} {job.vehicle.plateNumber} · VIN: {job.vehicle.vin || "—"}
              </div>
            </div>
          </div>

          <table className="invoice-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Qty / Hrs</th>
                <th className="text-right">Unit Price</th>
                <th className="text-right">Total (AED)</th>
              </tr>
            </thead>
            <tbody>
              {job.labourItems.map((l) => (
                <tr key={l.id}>
                  <td>{l.description} (Labour)</td>
                  <td>{l.hours} hrs</td>
                  <td className="text-right">{parseFloat(l.hourlyRate).toFixed(2)}</td>
                  <td className="text-right">{parseFloat(l.amount).toFixed(2)}</td>
                </tr>
              ))}
              {job.parts.map((p) => (
                <tr key={p.id}>
                  <td>{p.partName} (Part)</td>
                  <td>{p.quantity}</td>
                  <td className="text-right">{parseFloat(p.unitPrice).toFixed(2)}</td>
                  <td className="text-right">{parseFloat(p.totalPrice).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="invoice-summary-box">
            <div className="invoice-summary-row">
              <span>Subtotal</span>
              <strong>AED {job.subtotal.toFixed(2)}</strong>
            </div>
            <div className="invoice-summary-row">
              <span>5% UAE VAT</span>
              <strong>AED {job.vatAmount.toFixed(2)}</strong>
            </div>
            <div className="invoice-summary-row grand-total">
              <span>Total Due</span>
              <strong>AED {job.totalAmount.toFixed(2)}</strong>
            </div>
            <div className="invoice-summary-row" style={{ fontSize: "11px", color: "#6a7b80" }}>
              <span>Settlement Status</span>
              <strong>{job.invoice?.status === "paid" ? "PAID IN FULL" : "PAYMENT PENDING"}</strong>
            </div>
          </div>
        </div>

        <div className="form-actions" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              className="button button-whatsapp"
              onClick={() => sendInvoiceWhatsApp(job.invoice ? { ...job.invoice, customer: job.customer, jobCard: job } : { customer: job.customer, jobCard: job, invoiceNumber: `INV-${job.jobCardNumber.replace("EG-", "")}`, subtotal: job.subtotal, vatAmount: job.vatAmount, totalAmount: job.totalAmount, status: "draft", trn: workshop?.trn }, workshop?.name, workshop?.trn)}
            >
              <MessageCircle size={16} /> Send Invoice PDF on WhatsApp
            </button>
            <button className="button button-quiet" onClick={() => window.print()}>
              <Printer size={16} /> Print / Save PDF
            </button>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button className="button button-quiet" onClick={onClose}>Close</button>
            {job.invoice?.status !== "paid" && (
              <button className="button button-accent" onClick={onRecordPayment}>
                <WalletCards size={16} /> Record Payment
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Payment Modal ---
function PaymentModal({ job, onClose, onSuccess }: { job: FullJobCard; onClose: () => void; onSuccess: () => void }) {
  const [amount, setAmount] = useState<number | "">(job.totalAmount);
  const [method, setMethod] = useState<"card" | "cash" | "bank_transfer" | "cheque">("card");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");

  const generateInvoiceMutation = trpc.invoices.generateFromJobCard.useMutation();
  const recordMutation = trpc.payments.recordPayment.useMutation({
    onSuccess,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let invoiceId = job.invoice?.id;
    if (!invoiceId) {
      try {
        const newInv = await generateInvoiceMutation.mutateAsync({ jobCardId: job.id });
        invoiceId = newInv.id;
      } catch (err) {
        console.error("Failed to generate invoice before recording payment:", err);
        return;
      }
    }
    recordMutation.mutate({
      invoiceId,
      customerId: job.customerId,
      amount: Number(amount),
      paymentMethod: method,
      reference: reference || undefined,
      notes: notes || undefined,
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <span className="panel-kicker">Settlement Processing</span>
            <h2>Record Payment</h2>
            <p>Invoice #{job.invoice?.invoiceNumber || "INV-2418"} · Total: AED {job.totalAmount.toFixed(2)}</p>
          </div>
          <button className="icon-button" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <label>
            Payment Amount (AED)
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
              placeholder="0.00"
              required
            />
          </label>

          <label>
            Payment Method
            <select value={method} onChange={(e) => setMethod(e.target.value as any)}>
              <option value="card">Credit / Debit Card (POS)</option>
              <option value="cash">Cash (Counter Settlement)</option>
              <option value="bank_transfer">Bank Transfer / Wire</option>
              <option value="cheque">Cheque</option>
            </select>
          </label>

          <label>
            Transaction Reference
            <input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="e.g. POS Auth 91823" />
          </label>

          <label>
            Settlement Notes
            <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional payment notes" />
          </label>

          <div className="form-actions">
            <button type="button" className="button button-quiet" onClick={onClose}>Cancel</button>
            <button
              type="submit"
              className="button button-accent"
              disabled={recordMutation.isPending || generateInvoiceMutation.isPending}
            >
              {recordMutation.isPending || generateInvoiceMutation.isPending ? "Processing..." : "Confirm & Settle Payment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --- Vehicle History Modal (Digital Service Passport) ---
function VehicleHistoryModal({ vehicleId, onClose }: { vehicleId: number; onClose: () => void }) {
  const { data: history, isLoading } = trpc.vehicles.getHistory.useQuery({ vehicleId });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card large-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <span className="panel-kicker">Digital Service Passport</span>
            <h2>{history?.vehicle.make} {history?.vehicle.model} ({history?.vehicle.year})</h2>
            <p>Plate: {history?.vehicle.plateCode} {history?.vehicle.plateNumber} · VIN: {history?.vehicle.vin || "—"}</p>
          </div>
          <button className="icon-button" onClick={onClose}><X size={18} /></button>
        </div>

        {isLoading ? (
          <div style={{ padding: "40px", textAlign: "center" }}><Loader2 size={24} className="animate-spin" /></div>
        ) : !history ? (
          <div style={{ padding: "30px", textAlign: "center" }}>No history found for vehicle.</div>
        ) : (
          <div>
            <div style={{ display: "flex", gap: "20px", padding: "14px 18px", background: "#edf2f0", borderRadius: "5px", marginBottom: "20px", fontSize: "12px" }}>
              <div><strong>Owner:</strong> {history.customer.name}</div>
              <div><strong>Odometer:</strong> {history.vehicle.mileage.toLocaleString()} km</div>
              <div><strong>Recorded Visits:</strong> {history.jobCards.length}</div>
            </div>

            <div style={{ display: "grid", gap: "14px" }}>
              {history.jobCards.map((job) => (
                <div key={job.id} style={{ border: "1px solid #e1e8e5", borderRadius: "6px", padding: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <div>
                      <strong style={{ fontSize: "14px", color: "#25353a" }}>{job.jobCardNumber} · {job.serviceSummary}</strong>
                      <div style={{ fontSize: "11px", color: "#6e8085", marginTop: "2px" }}>
                        {new Date(job.createdAt).toLocaleDateString("en-AE")} · Tech: {job.technician?.name || "Unassigned"}
                      </div>
                    </div>
                    <StatusBadge tone="success">{job.status.replace("_", " ")}</StatusBadge>
                  </div>

                  <div style={{ fontSize: "12px", color: "#4f6368" }}>
                    {job.labourItems.length + job.parts.length} line items · Total AED {(job.invoice ? Number(job.invoice.totalAmount) : (job.labourItems.reduce((acc, l) => acc + Number(l.amount), 0) + job.parts.reduce((acc, p) => acc + Number(p.totalPrice), 0))).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="form-actions">
          <button className="button button-dark" onClick={onClose}>Close Passport</button>
        </div>
      </div>
    </div>
  );
}

// --- Global Search Dialog (Command+K) ---
function GlobalSearchDialog({ onClose, onSelect }: { onClose: () => void; onSelect: (type: "job" | "customer" | "vehicle" | "part", id: number) => void }) {
  const [query, setQuery] = useState("");
  const { data: results, isLoading } = trpc.search.global.useQuery(
    { query },
    { enabled: query.trim().length > 1 }
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="search-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="search-input-wrap">
          <Search size={18} color="#6d8086" />
          <input
            autoFocus
            placeholder="Search by job #, customer name, phone, plate number or part..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button className="icon-button" onClick={onClose}><X size={17} /></button>
        </div>

        <div className="search-results">
          {query.trim().length <= 1 ? (
            <div style={{ padding: "26px", textAlign: "center", color: "#809297", fontSize: "12px" }}>
              Type at least 2 characters to search across all job cards, vehicles, clients and stock...
            </div>
          ) : isLoading ? (
            <div style={{ padding: "30px", textAlign: "center" }}><Loader2 size={20} className="animate-spin" /></div>
          ) : results && (results.jobCards.length === 0 && results.customers.length === 0 && results.vehicles.length === 0 && results.inventory.length === 0) ? (
            <div style={{ padding: "30px", textAlign: "center", color: "#74868c", fontSize: "13px" }}>
              No matches found for "{query}".
            </div>
          ) : (
            <>
              {results?.jobCards && results.jobCards.length > 0 && (
                <div>
                  <div className="search-group-title">Job Cards</div>
                  {results.jobCards.map((j) => (
                    <div
                      key={j.id}
                      onClick={() => onSelect("job", j.id)}
                      style={{ padding: "8px 10px", borderRadius: "4px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                      className="search-item-hover"
                    >
                      <div>
                        <strong style={{ fontSize: "12px", color: "#25353a" }}>{j.jobCardNumber} · {j.customerName}</strong>
                        <div style={{ fontSize: "11px", color: "#6e8085" }}>{j.vehicleSummary} · {j.status.replace("_", " ")}</div>
                      </div>
                      <ChevronRight size={14} color="#9aa7a9" />
                    </div>
                  ))}
                </div>
              )}

              {results?.customers && results.customers.length > 0 && (
                <div style={{ marginTop: "10px" }}>
                  <div className="search-group-title">Customers</div>
                  {results.customers.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => onSelect("customer", c.id)}
                      style={{ padding: "8px 10px", borderRadius: "4px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                    >
                      <div>
                        <strong style={{ fontSize: "12px", color: "#25353a" }}>{c.name}</strong>
                        <div style={{ fontSize: "11px", color: "#6e8085" }}>{c.phone} · {c.email || "No email"}</div>
                      </div>
                      <ChevronRight size={14} color="#9aa7a9" />
                    </div>
                  ))}
                </div>
              )}

              {results?.vehicles && results.vehicles.length > 0 && (
                <div style={{ marginTop: "10px" }}>
                  <div className="search-group-title">Vehicles</div>
                  {results.vehicles.map((v) => (
                    <div
                      key={v.id}
                      onClick={() => onSelect("vehicle", v.id)}
                      style={{ padding: "8px 10px", borderRadius: "4px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                    >
                      <div>
                        <strong style={{ fontSize: "12px", color: "#25353a" }}>{v.plateCode} {v.plateNumber} · {v.make} {v.model}</strong>
                        <div style={{ fontSize: "11px", color: "#6e8085" }}>Year: {v.year}</div>
                      </div>
                      <ChevronRight size={14} color="#9aa7a9" />
                    </div>
                  ))}
                </div>
              )}

              {results?.inventory && results.inventory.length > 0 && (
                <div style={{ marginTop: "10px" }}>
                  <div className="search-group-title">Parts Catalog</div>
                  {results.inventory.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => onSelect("part", p.id)}
                      style={{ padding: "8px 10px", borderRadius: "4px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                    >
                      <div>
                        <strong style={{ fontSize: "12px", color: "#25353a" }}>{p.name} (#{p.partNumber})</strong>
                        <div style={{ fontSize: "11px", color: "#6e8085" }}>{p.category} · AED {p.unitPrice} ({p.onHand} in stock)</div>
                      </div>
                      <ChevronRight size={14} color="#9aa7a9" />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Add Part Modal (Simplified: No stock count, no bin location) ---
function AddPartModal({ onClose }: { onClose: () => void }) {
  const utils = trpc.useUtils();
  const [partNumber, setPartNumber] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Brakes");
  const [unitPrice, setUnitPrice] = useState<number | "">("");
  const [costPrice, setCostPrice] = useState<number | "">("");

  const createMutation = trpc.inventory.create.useMutation({
    onSuccess: () => {
      utils.inventory.list.invalidate();
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      partNumber,
      name,
      category,
      unitPrice: Number(unitPrice) || 0,
      costPrice: Number(costPrice) || 0,
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <span className="panel-kicker">Parts Logistics</span>
            <h2>Add New Part</h2>
            <p>Define new replacement component and retail pricing.</p>
          </div>
          <button className="icon-button" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-row">
            <label>
              Part Number / Code
              <input value={partNumber} onChange={(e) => setPartNumber(e.target.value)} placeholder="e.g. 0986AF" required />
            </label>
            <label>
              Category
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option>Brakes</option>
                <option>Filters</option>
                <option>Fluids</option>
                <option>Tyres</option>
                <option>Electrical</option>
                <option>Suspension</option>
              </select>
            </label>
          </div>

          <label>
            Part Name
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Bosch Spark Plugs FR7DC+" required />
          </label>

          <div className="form-row">
            <label>
              Retail Price (AED)
              <input
                type="number"
                min="0"
                step="0.01"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="0"
                required
              />
            </label>
            <label>
              Cost Price (AED)
              <input
                type="number"
                min="0"
                step="0.01"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="0"
                required
              />
            </label>
          </div>

          <div className="form-actions">
            <button type="button" className="button button-quiet" onClick={onClose}>Cancel</button>
            <button type="submit" className="button button-accent" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Adding..." : "Add part"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --- Add Technician Modal (Simplified: No hourly rate) ---
function AddTechnicianModal({ onClose }: { onClose: () => void }) {
  const utils = trpc.useUtils();
  const [name, setName] = useState("");
  const [initials, setInitials] = useState("");
  const [phone, setPhone] = useState("+971 ");
  const [specialty, setSpecialty] = useState("Diagnostic Tech");

  const createMutation = trpc.technicians.create.useMutation({
    onSuccess: () => {
      utils.technicians.list.invalidate();
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      name,
      initials: initials.toUpperCase(),
      phone: phone || undefined,
      specialty,
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <span className="panel-kicker">Staff Management</span>
            <h2>Add Technician</h2>
            <p>Roster a new workshop floor technician.</p>
          </div>
          <button className="icon-button" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-row">
            <label>
              Full Name
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Tariq Mansoor" required />
            </label>
            <label>
              Initials (Badge)
              <input value={initials} onChange={(e) => setInitials(e.target.value)} placeholder="TM" maxLength={4} required />
            </label>
          </div>

          <div className="form-row">
            <label>
              Phone Number (+971)
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+971 50 000 0000" />
            </label>
            <label>
              Specialty / Skill Role
              <input value={specialty} onChange={(e) => setSpecialty(e.target.value)} placeholder="e.g. Master Engine Rebuilder" required />
            </label>
          </div>

          <div className="form-actions">
            <button type="button" className="button button-quiet" onClick={onClose}>Cancel</button>
            <button type="submit" className="button button-accent" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Adding..." : "Add technician"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
