import { describe, expect, it } from "vitest";
import { calculateTotal, calculateVat, UAE_VAT_RATE } from "@shared/easygarage";

describe("EasyGarage UAE invoice math", () => {
  it("uses the configured 5% VAT rate", () => {
    expect(UAE_VAT_RATE).toBe(0.05);
    expect(calculateVat(2360)).toBe(118);
  });

  it("returns a subtotal plus VAT total", () => {
    expect(calculateTotal(2360)).toBe(2478);
    expect(calculateTotal(100)).toBe(105);
  });
});
