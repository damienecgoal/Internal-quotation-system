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

export type SharedItemInput = {
  id: string;
  displayCode: string;
  name: string;
  chargeBasis: ChargeBasis;
  unitPrice: number;
  group: string;
  notes: string[];
};

export function validateSharedItems(
  body: unknown,
  existingIds: string[],
  noteCapacity: Record<string, number>,
): { ok: true; value: SharedItemInput[] } | { ok: false; message: string } {
  if (!isRecord(body) || !Array.isArray(body.items)) {
    return { ok: false, message: "Price list body must include items." };
  }
  const seen = new Set<string>();
  const items: SharedItemInput[] = [];
  for (const entry of body.items) {
    if (!isRecord(entry) || typeof entry.id !== "string" || !existingIds.includes(entry.id)) {
      return { ok: false, message: "Each item must be an existing shared item." };
    }
    if (seen.has(entry.id)) return { ok: false, message: `Duplicate item ${entry.id}.` };
    seen.add(entry.id);
    const name = requiredText(entry, "name");
    if (!name) return { ok: false, message: "Each item needs a name." };
    const displayCode = optionalText(entry, "displayCode");
    if (displayCode == null) return { ok: false, message: "Each item code must be text." };
    const group = optionalText(entry, "group");
    if (group == null) return { ok: false, message: "Each item group must be text." };
    if (entry.chargeBasis !== "unit" && entry.chargeBasis !== "month" && entry.chargeBasis !== "week") {
      return { ok: false, message: "Each item needs a charge basis of unit, month, or week." };
    }
    const unitPrice = wholeNumber(entry.unitPrice);
    if (unitPrice == null) return { ok: false, message: "Each unit price must be a whole number or zero." };
    if (!Array.isArray(entry.notes) || entry.notes.some((note) => typeof note !== "string")) {
      return { ok: false, message: "Each item's sub-items must be text." };
    }
    const notes = entry.notes.map((note) => note.trim()).filter((note) => note !== "");
    const capacity = noteCapacity[entry.id] ?? 0;
    if (notes.length > capacity) {
      return { ok: false, message: `${displayCode || entry.id} can hold ${capacity} sub-items.` };
    }
    items.push({
      id: entry.id,
      displayCode,
      name,
      chargeBasis: entry.chargeBasis,
      unitPrice,
      group,
      notes,
    });
  }
  if (seen.size !== existingIds.length) return { ok: false, message: "Save every shared item together." };
  return { ok: true, value: items };
}
