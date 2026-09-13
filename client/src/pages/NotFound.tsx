import { ArrowLeft, Home, LayoutDashboard } from "lucide-react";
import { useLocation } from "wouter";
import { BrandMark } from "@/components/BrandLogo";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        background: "#162327",
        color: "#e6f0ed",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <div
        style={{
          width: "min(520px, 100%)",
          background: "#1d2b30",
          border: "1px solid #2d3f45",
          borderRadius: "8px",
          padding: "44px 38px",
          textAlign: "center",
          boxShadow: "0 25px 60px rgba(7, 14, 16, 0.45)",
        }}
      >
        <div style={{ display: "inline-flex", alignItems: "center", gap: "10px", marginBottom: "28px" }}>
          <BrandMark size={34} />
          <span style={{ fontSize: "20px", fontWeight: 700, letterSpacing: "-0.03em" }}>
            easy<span style={{ color: "#327d94" }}>garage</span>
          </span>
        </div>

        <div style={{ marginBottom: "16px" }}>
          <span className="plate large-plate" style={{ background: "#24343a", color: "#d8e4e1", borderColor: "#3e5258" }}>
            ERR 404
          </span>
        </div>

        <h1
          style={{
            margin: "14px 0 10px",
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: "32px",
            letterSpacing: "-0.05em",
            color: "#ffffff",
          }}
        >
          Bay or Record Not Found
        </h1>

        <p style={{ margin: "0 auto 32px", color: "#95a8ab", fontSize: "14px", lineHeight: 1.6, maxWidth: "400px" }}>
          The work order, vehicle record, or system route you are looking for does not exist or may have been archived.
        </p>

        <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
          <button
            className="button button-accent"
            onClick={() => setLocation("/app")}
            style={{ padding: "13px 20px" }}
          >
            <LayoutDashboard size={16} /> Workshop Command Center
          </button>
          <button
            className="button button-quiet"
            onClick={() => setLocation("/")}
            style={{ padding: "13px 18px", color: "#d2dedb", borderColor: "#3d5056" }}
          >
            <Home size={15} /> Homepage
          </button>
        </div>
      </div>

      <div style={{ marginTop: "32px", fontSize: "11px", color: "#617377", fontFamily: "'DM Mono', monospace" }}>
        GREENWAY AUTO SAAS · SYSTEM STATUS: OPERATIONAL
      </div>
    </div>
  );
}
