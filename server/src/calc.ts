import type { ChargeBasis, PricingType } from "./catalog.ts";

export type PriceListItem = {
  id: string;
  categoryId: string;
  unitPrice: number;
  pricingType: PricingType;
  chargeBasis: ChargeBasis;
  quantityLocked: boolean;
};

export type PricedLine = {
  priceItemId: string;
  categoryId: string;
  quantity: number;
  unitPrice: number;
  chargeBasis: ChargeBasis;
  pricingType: PricingType;
  amount: number;
  included: boolean;
};

export function normalizeShortCode(value: string): string {
  return value.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function formatQuotationNo(isoDate: string, shortCode: string, seq: number): string {
  const [year, month, day] = isoDate.split("-");
  return `KR-${day}${month}${year}${shortCode}-${String(seq).padStart(3, "0")}`;
}

/** Excel serial date, matching the 1899-12-30 epoch used by the reference workbook. */
export function excelSerial(isoDate: string): number {
  const [year, month, day] = isoDate.split("-").map(Number);
  const utc = Date.UTC(year, month - 1, day);
  const epoch = Date.UTC(1899, 11, 30);
  return Math.round((utc - epoch) / 86_400_000);
}

export function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export function lineAmount(item: { pricingType: PricingType; unitPrice: number }, quantity: number): number {
  if (item.pricingType !== "calculated") return 0;
  return item.unitPrice * quantity;
}

export function priceQuotation(
  categories: { id: string }[],
  items: PriceListItem[],
  quantities: Record<string, number>,
  discount: number,
  included?: Record<string, boolean>,
): {
  lines: PricedLine[];
  categorySubtotals: { categoryId: string; subtotal: number }[];
  beforeDiscount: number;
  total: number;
} {
  const lines = items.map((item) => {
    const quantity = item.quantityLocked ? 0 : (quantities[item.id] ?? 0);
    const selected = included ? included[item.id] === true : true;
    return {
      priceItemId: item.id,
      categoryId: item.categoryId,
      quantity,
      unitPrice: item.unitPrice,
      chargeBasis: item.chargeBasis,
      pricingType: item.pricingType,
      included: selected,
      amount: selected ? lineAmount(item, quantity) : 0,
    };
  });
  const categorySubtotals = categories.map((category) => ({
    categoryId: category.id,
    subtotal: lines
      .filter((line) => line.categoryId === category.id)
      .reduce((sum, line) => sum + line.amount, 0),
  }));
  const beforeDiscount = categorySubtotals.reduce((sum, category) => sum + category.subtotal, 0);
  return {
    lines,
    categorySubtotals,
    beforeDiscount,
    total: beforeDiscount - discount,
  };
}
