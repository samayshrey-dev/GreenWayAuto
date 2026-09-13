import {
  ArrowRight,
  Boxes,
  Check,
  ChevronRight,
  ClipboardCheck,
  FileText,
  Loader2,
  MessageCircle,
  Receipt,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { BrandMark } from "@/components/BrandLogo";

type AuthMode = "login" | "signup";

const workflow = [
  { step: "01", label: "Intake", copy: "Capture verified +971 customer contacts and UAE fleet plates in one pass.", icon: ClipboardCheck },
  { step: "02", label: "Parts & Items", copy: "Select live workshop inventory items or counter services with AED rates.", icon: Boxes },
  { step: "03", label: "Dual-Mode Invoice", copy: "Generate compliant tax invoices instantly — with or without a job card.", icon: Receipt },
  { step: "04", label: "WhatsApp Dispatch", copy: "Send the itemized 5% VAT invoice directly to customer's WhatsApp in one click.", icon: MessageCircle },
];

const productPillars = [
  { icon: Receipt, title: "Dual-Mode Tax Invoices", copy: "Choose between full repair orders or direct walk-in counter sales with 5% VAT and TRN." },
  { icon: Boxes, title: "Parts & Inventory Control", copy: "Keep track of on-shelf stock, SKUs, and unit pricing in AED with zero friction." },
  { icon: Users, title: "UAE Fleet & Customer Hub", copy: "Maintain verified phone numbers, plate registrations, and complete customer records." },
  { icon: MessageCircle, title: "1-Click WhatsApp Dispatch", copy: "Send itemized tax invoices and payment summaries directly to your customer's phone." },
];

export default function Home() {
  return (
    <main className="site-shell">
      <div className="announcement">
        <span>NEW</span> Multi-Tenant Workshop command center for the UAE{" "}
        <a href="/signup">Start a free workspace <ArrowRight size={14} /></a>
      </div>
      <header className="site-header">
        <a className="brand" href="/">
          <span className="brand-mark"><BrandMark size={19} /></span>
          <span>Green<span>Way</span> Auto</span>
        </a>
        <nav className="site-nav" aria-label="Primary navigation">
          <a href="#workflow">How it works</a>
          <a href="#product">Product</a>
          <a href="#trust">Built for the Gulf</a>
        </nav>
        <div className="header-actions">
          <a className="text-link" href="/login">Sign in</a>
          <a className="button button-dark" href="/signup">Open workspace <ArrowRight size={16} /></a>
        </div>
      </header>

      <section className="hero container">
        <div className="hero-copy reveal">
          <div className="eyebrow"><span className="eyebrow-line" /> Workshop operations, without the drag</div>
          <h1>Run the counter<br /><em>with precision.</em></h1>
          <p className="hero-lead">
            GreenWay Auto brings vehicle intake, live parts inventory, dual-mode UAE tax invoicing, and instant WhatsApp dispatch into one calm command center built for ambitious workshops.
          </p>
          <div className="hero-actions">
            <a className="button button-accent" href="/signup">Build your workspace <ArrowRight size={17} /></a>
            <a className="play-link" href="#product"><span className="play-icon">↗</span> See the product</a>
          </div>
          <div className="hero-proof">
            <div className="avatar-stack"><span>AM</span><span>RK</span><span>ZA</span><span>+</span></div>
            <div><strong>Trusted by workshop teams</strong><small>Dubai · Abu Dhabi · Sharjah</small></div>
          </div>
        </div>
        <div className="hero-visual reveal reveal-delay-1">
          <div className="image-frame">
            <img src="/images/workshop.svg" alt="Technician working in a premium automotive workshop" />
            <div className="image-overlay" />
            <div className="hero-float top-float">
              <span className="status-dot" /> Invoice #INV-2418 <strong>5% UAE VAT Compliant</strong>
            </div>
            <div className="hero-float bottom-float">
              <span className="float-icon"><Check size={15} /></span>
              <div>
                <small>Dispatched to WhatsApp</small>
                <strong>Customer #971-50 · AED 2,478</strong>
              </div>
            </div>
          </div>
          <div className="hero-visual-note">
            <span>01 / 04</span>
            <span>From intake to WhatsApp delivery</span>
          </div>
        </div>
      </section>

      <section className="trust-strip" id="trust">
        <div className="container trust-inner">
          <span>Designed around the details that matter</span>
          <div><strong>AED</strong><span>Currency native</span></div>
          <div><strong>5%</strong><span>VAT ready</span></div>
          <div><strong>TRN</strong><span>Invoice compliant</span></div>
          <div><strong>WA</strong><span>1-Click dispatch</span></div>
          <div><strong>SaaS</strong><span>Multi-tenant isolation</span></div>
        </div>
      </section>

      <section className="section container" id="product">
        <div className="section-heading">
          <div>
            <div className="eyebrow"><span className="eyebrow-line" /> The GreenWay Auto operating system</div>
            <h2>Fast counter. Clean invoices.<br /><span>One source of truth.</span></h2>
          </div>
          <p>
            Serious workshops need more than messy spreadsheets or bloated legacy software. GreenWay Auto is the fast, clean connective tissue between your front desk, parts shelf, and customer.
          </p>
        </div>
        <div className="pillar-grid">
          {productPillars.map((item, index) => {
            const Icon = item.icon;
            return (
              <div className="pillar" key={item.title}>
                <div className="pillar-top">
                  <span className="pillar-index">0{index + 1}</span>
                  <Icon size={21} />
                </div>
                <h3>{item.title}</h3>
                <p>{item.copy}</p>
                <a href="/app" aria-label={`Open ${item.title}`}>Explore module <ChevronRight size={14} /></a>
              </div>
            );
          })}
        </div>
      </section>

      <section className="workflow-section" id="workflow">
        <div className="container workflow-layout">
          <div className="workflow-intro">
            <div className="eyebrow"><span className="eyebrow-line" /> The workflow</div>
            <h2>From arrival<br />to <em>settlement.</em></h2>
            <p>A streamlined operational flow keeps your counter fast, fully compliant with 5% UAE VAT, and directly connected with customers via WhatsApp.</p>
            <a className="button button-light" href="/app/invoices">Create Invoice <ArrowRight size={16} /></a>
          </div>
          <div className="workflow-list">
            {workflow.map((item) => {
              const Icon = item.icon;
              return (
                <div className="workflow-row" key={item.step}>
                  <span className="workflow-number">{item.step}</span>
                  <span className="workflow-icon"><Icon size={18} /></span>
                  <div>
                    <h3>{item.label}</h3>
                    <p>{item.copy}</p>
                  </div>
                  <ChevronRight className="workflow-arrow" size={18} />
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section container testimonial-section">
        <div className="testimonial-mark">“</div>
        <blockquote>
          We stopped chasing invoices and manual paperwork. Invoicing takes 30 seconds, customers get it on WhatsApp immediately, and 5% VAT is calculated cleanly with our TRN.
        </blockquote>
        <div className="quote-meta">
          <span className="quote-avatar">AH</span>
          <div>
            <strong>Ahmed Hassan</strong>
            <small>Operations lead · Al Quoz, Dubai</small>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="container cta-inner">
          <div>
            <div className="eyebrow eyebrow-light"><span className="eyebrow-line" /> The next shift starts here</div>
            <h2>Your workshop,<br /><em>in control.</em></h2>
          </div>
          <div>
            <p>Set up your first workspace in under 2 minutes. Multi-tenant data isolation, AED, 5% VAT and WhatsApp dispatch ready.</p>
            <a className="button button-accent" href="/signup">Start with GreenWay Auto <ArrowRight size={17} /></a>
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <div className="container footer-inner">
          <a className="brand brand-footer" href="/">
            <span className="brand-mark"><BrandMark size={18} /></span>
            <span>Green<span>Way</span> Auto</span>
          </a>
          <span>Workshop software, engineered for the Gulf.</span>
          <div className="footer-links">
            <a href="/login">Sign in</a>
            <a href="/signup">Create workspace</a>
          </div>
        </div>
      </footer>
    </main>
  );
}

export function AuthPage({ mode }: { mode: AuthMode }) {
  const isLogin = mode === "login";
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  const [email, setEmail] = useState(isLogin ? "ops@greenwayauto.ae" : "");
  const [password, setPassword] = useState(isLogin ? "password" : "");
  const [name, setName] = useState(isLogin ? "" : "Ahmed Khan");
  const [workshopName, setWorkshopName] = useState(isLogin ? "" : "GreenWay Auto");
  const [error, setError] = useState<string | null>(null);

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: (data) => {
      if (data.sessionToken) {
        localStorage.setItem("easygarage_token", data.sessionToken);
      }
      utils.auth.me.invalidate();
      setLocation("/app");
    },
    onError: (err) => {
      setError(err.message || "Failed to sign in. Please verify your credentials.");
    },
  });

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: (data) => {
      if (data.sessionToken) {
        localStorage.setItem("easygarage_token", data.sessionToken);
      }
      utils.auth.me.invalidate();
      setLocation("/app");
    },
    onError: (err) => {
      setError(err.message || "Failed to create workshop organization.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isLogin) {
      loginMutation.mutate({ email, password });
    } else {
      if (!workshopName.trim()) {
        setError("Workshop name is required.");
        return;
      }
      registerMutation.mutate({ email, password, name, workshopName });
    }
  };

  const isLoading = loginMutation.isPending || registerMutation.isPending;

  return (
    <main className="auth-shell">
      <div className="auth-panel">
        <a className="brand" href="/">
          <span className="brand-mark"><BrandMark size={19} /></span>
          <span>Green<span>Way</span> Auto</span>
        </a>
        <div className="auth-copy">
          <div className="eyebrow"><span className="eyebrow-line" /> {isLogin ? "Welcome back" : "Built for your next shift"}</div>
          <h1>{isLogin ? "Back to the floor." : "Start with a cleaner bay."}</h1>
          <p>
            {isLogin
              ? "Sign in to your workshop command center. Demo account: ops@greenwayauto.ae"
              : "Create a dedicated, isolated workspace for your workshop team. AED, VAT and WhatsApp ready from day one."}
          </p>
        </div>

        {error && (
          <div style={{ padding: "12px 14px", margin: "18px 0 0", background: "#fdf0ed", border: "1px solid #f3c7be", borderRadius: "5px", color: "#b94a42", fontSize: "12px", fontWeight: 600 }}>
            {error}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          {!isLogin && (
            <>
              <label>
                Your name
                <input
                  type="text"
                  placeholder="e.g. Ahmed Khan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </label>
              <label>
                Workshop organization name
                <input
                  type="text"
                  placeholder="e.g. GreenWay Auto"
                  value={workshopName}
                  onChange={(e) => setWorkshopName(e.target.value)}
                  required
                />
              </label>
            </>
          )}

          <label>
            Work email
            <input
              type="email"
              placeholder="you@workshop.ae"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          <button
            type="submit"
            className="button button-accent button-full"
            disabled={isLoading}
            style={{ cursor: isLoading ? "not-allowed" : "pointer" }}
          >
            {isLoading ? (
              <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                <Loader2 size={16} className="animate-spin" />
                {isLogin ? "Signing in..." : "Creating workspace..."}
              </span>
            ) : (
              <>
                {isLogin ? "Sign in to workspace" : "Create workspace"}
                <ArrowRight size={17} />
              </>
            )}
          </button>
        </form>

        <p className="auth-switch">
          {isLogin ? "New to GreenWay Auto?" : "Already have a workspace?"}{" "}
          <a href={isLogin ? "/signup" : "/login"}>{isLogin ? "Create one" : "Sign in"}</a>
        </p>
      </div>

      <div className="auth-aside">
        <div className="auth-aside-grid" />
        <div className="auth-aside-copy">
          <span className="aside-kicker">GREENWAY AUTO / MULTI-TENANT</span>
          <h2>The quiet advantage<br />of a <em>well-run</em> floor.</h2>
          <div className="aside-metric">
            <strong>+18%</strong>
            <span>more jobs closed on time<br />with connected workflows</span>
          </div>
        </div>
      </div>
    </main>
  );
}

export function OnboardingPage() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  const [workshopName, setWorkshopName] = useState("GreenWay Auto");
  const [city, setCity] = useState("Dubai");
  const [bays, setBays] = useState(4);
  const [phone, setPhone] = useState("+971 4 340 0000");

  const updateSettings = trpc.workshop.updateSettings.useMutation({
    onSuccess: () => {
      utils.workshop.getSettings.invalidate();
      setLocation("/app");
    },
  });

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings.mutate({
      name: workshopName,
      city,
      totalBays: bays,
      phone,
    });
  };

  return (
    <main className="onboarding-shell">
      <div className="onboarding-card">
        <a className="brand" href="/">
          <span className="brand-mark"><BrandMark size={19} /></span>
          <span>Green<span>Way</span> Auto</span>
        </a>
        <div className="onboarding-progress">
          <span className="active" /><span /><span /><span />
        </div>
        <div className="eyebrow"><span className="eyebrow-line" /> Workspace setup · 01</div>
        <h1>Tell us how your floor works.</h1>
        <p>We’ll shape the workspace around your bays, your team and the way customers move through the day.</p>
        <form onSubmit={handleContinue}>
          <div className="setup-grid">
            <label>
              Workshop name
              <input value={workshopName} onChange={(e) => setWorkshopName(e.target.value)} required />
            </label>
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
              Number of bays
              <select value={bays} onChange={(e) => setBays(Number(e.target.value))}>
                <option value={2}>2 bays</option>
                <option value={4}>4 bays</option>
                <option value={6}>6 bays</option>
                <option value={8}>8 bays</option>
                <option value={16}>16 bays</option>
              </select>
            </label>
            <label>
              Primary phone
              <input value={phone} onChange={(e) => setPhone(e.target.value)} required />
            </label>
          </div>
          <button type="submit" className="button button-accent">
            {updateSettings.isPending ? "Saving..." : "Continue to workspace"} <ArrowRight size={17} />
          </button>
        </form>
        <span className="setup-note">You can update these details anytime in Settings.</span>
      </div>
    </main>
  );
}
