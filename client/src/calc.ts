import type { PricingType } from "./types";

export function lineAmount(pricingType: PricingType, unitPrice: number, quantity: number): number {
  if (pricingType !== "calculated") return 0;
  return unitPrice * quantity;
}

export function parseCount(value: string): number {
  if (value.trim() === "") return 0;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) return Number.NaN;
  return parsed;
}

export function wholeCountInput(value: string): string | null {
  if (value.trim() === "") return "";
  if (!/^\d+$/.test(value)) return null;
  return String(Number(value));
}

export function formatHkd(amount: number): string {
  return `HK$${amount.toLocaleString("en-HK")}`;
}

export function todayIso(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}
