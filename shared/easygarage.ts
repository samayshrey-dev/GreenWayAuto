export const UAE_VAT_RATE = 0.05;

export function calculateVat(subtotal: number): number {
  return Math.round(subtotal * UAE_VAT_RATE * 100) / 100;
}

export function calculateTotal(subtotal: number): number {
  return Math.round((subtotal + calculateVat(subtotal)) * 100) / 100;
}
