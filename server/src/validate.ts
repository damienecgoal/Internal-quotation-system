import { isIsoDate, normalizeShortCode } from "./calc.ts";
import type { ChargeBasis, PricingType } from "./catalog.ts";

export type StoredItem = {
  id: string;
  categoryId: string;
  unitPrice: number;
  pricingType: string;
  chargeBasis: string;
  quantityLocked: number;
};

export type CreateQuotationInput = {
  customerName: string;
  shortCode: string;
  attn: string;
  tel: string;
  email: string;
  address: string;
  subject: string;
  customerNo: string;
  yourRef: string;
  revision: string;
  quotationDate: string;
  contractMonths: number;
  contractWeeks: number;
  discount: number;
  discountNote: string;
  quantities: Record<string, number>;
  included: Record<string, boolean>;
};

const MAX_COUNT = 1_000_000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function optionalText(record: Record<string, unknown>, key: string): string | null {
  const value = record[key];
  if (value == null) return "";
  if (typeof value !== "string") return null;
  return value.trim();
}

function requiredText(record: Record<string, unknown>, key: string): string | null {
  const value = optionalText(record, key);
  if (value == null || value === "") return null;
  return value;
}

function wholeNumber(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0 || value > MAX_COUNT) return null;
  return value;
}

export function validateCreate(
  body: unknown,
  items: StoredItem[],
): { ok: true; value: CreateQuotationInput } | { ok: false; message: string } {
  if (!isRecord(body)) return { ok: false, message: "Quotation body must be an object." };

  const customerName = requiredText(body, "customerName");
  if (!customerName) return { ok: false, message: "Customer name is required." };

  const rawShortCode = requiredText(body, "shortCode");
  if (!rawShortCode) return { ok: false, message: "Short code is required." };
  const shortCode = normalizeShortCode(rawShortCode);
  if (!shortCode) return { ok: false, message: "Short code must contain letters or numbers." };

  const quotationDate = requiredText(body, "quotationDate");
  if (!quotationDate || !isIsoDate(quotationDate)) {
    return { ok: false, message: "Quotation date must be YYYY-MM-DD." };
  }

  const contractMonths = wholeNumber(body.contractMonths);
  if (contractMonths == null) return { ok: false, message: "Contract months must be a whole number." };
  const contractWeeks = wholeNumber(body.contractWeeks);
  if (contractWeeks == null) return { ok: false, message: "Contract weeks must be a whole number." };
  const discount = wholeNumber(body.discount);
  if (discount == null) return { ok: false, message: "Discount must be a whole number." };

  const text = (key: string, label: string): string | { message: string } => {
    const value = optionalText(body, key);
    if (value == null) return { message: `${label} must be text.` };
    return value;
  };
  const attn = text("attn", "Attention");
  const tel = text("tel", "Telephone");
  const email = text("email", "Email");
  const address = text("address", "Address");
  const subject = text("subject", "Subject");
  const customerNo = text("customerNo", "Customer number");
  const yourRef = text("yourRef", "Your reference");
  const revision = text("revision", "Revision");
  const discountNote = text("discountNote", "Discount note");
  for (const field of [attn, tel, email, address, subject, customerNo, yourRef, revision, discountNote]) {
    if (typeof field !== "string") return { ok: false, message: field.message };
  }

  if (!Array.isArray(body.lines)) return { ok: false, message: "Lines must be a list." };
  const known = new Set(items.map((item) => item.id));
  const quantities: Record<string, number> = {};
  const included: Record<string, boolean> = {};
  for (const line of body.lines) {
    if (!isRecord(line) || typeof line.priceItemId !== "string") {
      return { ok: false, message: "Each line needs a price item id." };
    }
    if (!known.has(line.priceItemId)) {
      return { ok: false, message: `Unknown price item ${line.priceItemId}.` };
    }
    if (quantities[line.priceItemId] != null) {
      return { ok: false, message: `Duplicate price item ${line.priceItemId}.` };
    }
    const quantity = wholeNumber(line.quantity);
    if (quantity == null) return { ok: false, message: "Each quantity must be a whole number." };
    if (line.included != null && typeof line.included !== "boolean") {
      return { ok: false, message: "Each line needs an included flag." };
    }
    quantities[line.priceItemId] = quantity;
    included[line.priceItemId] = line.included !== false;
  }

  return {
    ok: true,
    value: {
      customerName,
      shortCode,
      attn: attn as string,
      tel: tel as string,
      email: email as string,
      address: address as string,
      subject: subject as string,
      customerNo: customerNo as string,
      yourRef: yourRef as string,
      revision: revision as string,
      quotationDate,
      contractMonths,
      contractWeeks,
      discount,
      discountNote: discountNote as string,
      quantities,
      included,
    },
  };
}

export function asChargeBasis(value: string): ChargeBasis {
  if (value === "unit" || value === "month" || value === "week") return value;
  throw new Error(`Unknown charge basis ${value}`);
}

export function asPricingType(value: string): PricingType {
  if (value === "calculated" || value === "rate_only") return value;
  throw new Error(`Unknown pricing type ${value}`);
}
