import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { trpc } from "./lib/trpc";
import Home, { AuthPage, OnboardingPage } from "./pages/Home";
import Workspace from "./pages/Workspace";

function ProtectedWorkspace() {
  const { data: user, isLoading } = trpc.auth.me.useQuery(undefined, { retry: false });
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/login");
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#f4f6f4" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", color: "#54686e" }}>
          <Loader2 size={26} className="animate-spin" style={{ color: "#327d94" }} />
          <span style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 600, fontSize: "14px" }}>
            Connecting to workshop command center...
          </span>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <Workspace user={user} />;
}

function PublicAuthPage({ mode }: { mode: "login" | "signup" }) {
  const { data: user, isLoading } = trpc.auth.me.useQuery(undefined, { retry: false });
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && user) {
      setLocation("/app");
    }
  }, [user, isLoading, setLocation]);

  return <AuthPage mode={mode} />;
}

const LoginPage = () => <PublicAuthPage mode="login" />;
const SignupPage = () => <PublicAuthPage mode="signup" />;

function ProtectedOnboarding() {
  const { data: user, isLoading } = trpc.auth.me.useQuery(undefined, { retry: false });
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/login");
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#f4f6f4" }}>
        <Loader2 size={26} className="animate-spin" style={{ color: "#327d94" }} />
      </div>
    );
  }

  if (!user) return null;
  return <OnboardingPage />;
}

function AppRouter() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={LoginPage} />
      <Route path="/signup" component={SignupPage} />
      <Route path="/onboarding" component={ProtectedOnboarding} />

      {/* Protected SaaS Workspace Routes */}
      <Route path="/app" component={ProtectedWorkspace} />
      <Route path="/app/dashboard" component={ProtectedWorkspace} />
      <Route path="/app/job-cards" component={ProtectedWorkspace} />
      <Route path="/app/job-cards/:id" component={ProtectedWorkspace} />
      <Route path="/app/customers" component={ProtectedWorkspace} />
      <Route path="/app/vehicles" component={ProtectedWorkspace} />
      <Route path="/app/parts" component={ProtectedWorkspace} />
      <Route path="/app/inventory" component={ProtectedWorkspace} />
      <Route path="/app/technicians" component={ProtectedWorkspace} />
      <Route path="/app/invoices" component={ProtectedWorkspace} />
      <Route path="/app/payments" component={ProtectedWorkspace} />
      <Route path="/app/settings" component={ProtectedWorkspace} />

      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <AppRouter />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
