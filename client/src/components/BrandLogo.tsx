import React from "react";

export function BrandMark({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      style={{ display: "block", flexShrink: 0 }}
      aria-label="GreenWay Auto Logo"
    >
      <rect x="2" y="2" width="60" height="60" rx="14" fill="#0c1815" stroke="#1e382f" strokeWidth="2" />
      <rect x="4" y="4" width="56" height="56" rx="12" fill="none" stroke="#22c55e" strokeWidth="1.5" strokeOpacity="0.6" />
      <path d="M11 16 H29 L31 18 V24 H17 V40 H29 V34 H23 V28 H31 V46 H11 Z" fill="#ffffff" />
      <path d="M34 17 L38 47 L43 27 L48 47 L52 17" stroke="#22c55e" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx="52" cy="17" r="2.8" fill="#86efac" />
    </svg>
  );
}

export function BrandWordmark({ size = 22 }: { size?: number }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: "9px" }}>
      <BrandMark size={size} />
      <span style={{ fontWeight: 700, letterSpacing: "-0.04em", fontSize: `${size * 0.9}px` }}>
        Green<span style={{ color: "#22c55e" }}>Way</span> Auto
      </span>
    </div>
  );
}
