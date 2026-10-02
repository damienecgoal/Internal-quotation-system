import { randomUUID } from "node:crypto";
import { desc, eq } from "drizzle-orm";
import { formatQuotationNo, priceQuotation } from "./calc.ts";
import type { ChargeBasis, PricingType } from "./catalog.ts";
import { getDb, getSqlite, listCategories, listItems } from "./db.ts";
import { priceCategories, priceItems, quotationLines, quotationSequences, quotations } from "./schema.ts";
import type { CreateQuotationInput } from "./validate.ts";
import { asChargeBasis, asPricingType } from "./validate.ts";

export type ApiItem = {
  id: string;
  categoryId: string;
  displayCode: string;
  name: string;
  chargeBasis: ChargeBasis;
  unitPrice: number;
  pricingType: PricingType;
  notes: string[];
  group: string;
  quantityLocked: boolean;
  quantityLabel: string;
  sampleQuantity: number;
  sortOrder: number;
};

export type QuotationSummary = {
  id: string;
  quotationNo: string;
  customerName: string;
  quotationDate: string;
  total: number;
  createdAt: string;
};

function parseNotes(value: string): string[] {
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((note): note is string => typeof note === "string");
  } catch {
    return [];
  }
}

export function getPriceList(): { categories: Array<ReturnType<typeof listCategories>[number] & { items: ApiItem[] }> } {
  const categories = listCategories();
  const items = listItems().map((item) => ({
    id: item.id,
    categoryId: item.categoryId,
    displayCode: item.displayCode,
    name: item.name,
    chargeBasis: asChargeBasis(item.chargeBasis),
    unitPrice: item.unitPrice,
    pricingType: asPricingType(item.pricingType),
    notes: parseNotes(item.notes),
    group: item.groupLabel,
    quantityLocked: item.quantityLocked === 1,
    quantityLabel: item.quantityLabel,
    sampleQuantity: item.sampleQuantity,
    sortOrder: item.sortOrder,
  }));
  return {
    categories: categories.map((category) => ({
      ...category,
      items: items.filter((item) => item.categoryId === category.id),
    })),
  };
}

function readQuotation(id: string) {
  const db = getDb();
  const header = db.select().from(quotations).where(eq(quotations.id, id)).get();
  if (!header) return null;
  const lines = db
    .select({
      priceItemId: quotationLines.priceItemId,
      quantity: quotationLines.quantity,
      unitPrice: quotationLines.unitPrice,
      chargeBasis: quotationLines.chargeBasis,
      pricingType: quotationLines.pricingType,
      amount: quotationLines.amount,
      included: quotationLines.included,
      categoryId: priceItems.categoryId,
      displayCode: priceItems.displayCode,
      name: priceItems.name,
      sortOrder: priceItems.sortOrder,
      categorySort: priceCategories.sortOrder,
    })
    .from(quotationLines)
    .innerJoin(priceItems, eq(quotationLines.priceItemId, priceItems.id))
    .innerJoin(priceCategories, eq(priceItems.categoryId, priceCategories.id))
    .where(eq(quotationLines.quotationId, id))
    .all()
    .sort((a, b) => a.categorySort - b.categorySort || a.sortOrder - b.sortOrder);

  const categories = listCategories();
  const categorySubtotals = categories.map((category) => ({
    categoryId: category.id,
    code: category.code,
    name: category.name,
    subtotal: lines.filter((line) => line.categoryId === category.id).reduce((sum, line) => sum + line.amount, 0),
  }));

  return {
    id: header.id,
    quotationNo: header.quotationNo,
    customerName: header.customerName,
    shortCode: header.shortCode,
    attn: header.attn,
    tel: header.tel,
    email: header.email,
    address: header.address,
    subject: header.subject,
    customerNo: header.customerNo,
    yourRef: header.yourRef,
    revision: header.revision,
    quotationDate: header.quotationDate,
    contractMonths: header.contractMonths,
    contractWeeks: header.contractWeeks,
    discount: header.discount,
    discountNote: header.discountNote,
    total: header.total,
    createdAt: header.createdAt,
    lines: lines.map((line) => ({
      priceItemId: line.priceItemId,
      categoryId: line.categoryId,
      displayCode: line.displayCode,
      name: line.name,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      chargeBasis: asChargeBasis(line.chargeBasis),
      pricingType: asPricingType(line.pricingType),
      amount: line.amount,
      included: line.included === 1,
    })),
    categorySubtotals,
  };
}

export function getQuotation(id: string) {
  return readQuotation(id);
}

export function listQuotations(): QuotationSummary[] {
  return getDb()
    .select({
      id: quotations.id,
      quotationNo: quotations.quotationNo,
      customerName: quotations.customerName,
      quotationDate: quotations.quotationDate,
      total: quotations.total,
      createdAt: quotations.createdAt,
    })
    .from(quotations)
    .orderBy(desc(quotations.createdAt), desc(quotations.quotationNo))
    .all();
}

export function createQuotation(input: CreateQuotationInput) {
  const db = getDb();
  const sqlite = getSqlite();
  const categories = listCategories();
  const items = listItems().map((item) => ({
    id: item.id,
    categoryId: item.categoryId,
    unitPrice: item.unitPrice,
    pricingType: asPricingType(item.pricingType),
    chargeBasis: asChargeBasis(item.chargeBasis),
    quantityLocked: item.quantityLocked === 1,
  }));
  const priced = priceQuotation(categories, items, input.quantities, input.discount, input.included);
  const id = randomUUID();
  let quotationNo = "";

  const save = sqlite.transaction(() => {
    const current = db
      .select()
      .from(quotationSequences)
      .where(eq(quotationSequences.shortCode, input.shortCode))
      .get();
    const next = (current?.lastSeq ?? 0) + 1;
    if (current) {
      db.update(quotationSequences)
        .set({ lastSeq: next })
        .where(eq(quotationSequences.shortCode, input.shortCode))
        .run();
    } else {
      db.insert(quotationSequences).values({ shortCode: input.shortCode, lastSeq: next }).run();
    }
    quotationNo = formatQuotationNo(input.quotationDate, input.shortCode, next);
    db.insert(quotations)
      .values({
        id,
        quotationNo,
        customerName: input.customerName,
        shortCode: input.shortCode,
        attn: input.attn,
        tel: input.tel,
        email: input.email,
        address: input.address,
        subject: input.subject,
        customerNo: input.customerNo,
        yourRef: input.yourRef,
        revision: input.revision,
        quotationDate: input.quotationDate,
        contractMonths: input.contractMonths,
        contractWeeks: input.contractWeeks,
        discount: input.discount,
        discountNote: input.discountNote,
        total: priced.total,
        createdAt: new Date().toISOString(),
      })
      .run();
    if (priced.lines.length > 0) {
      db.insert(quotationLines)
        .values(
          priced.lines.map((line) => ({
            quotationId: id,
            priceItemId: line.priceItemId,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            chargeBasis: line.chargeBasis,
            pricingType: line.pricingType,
            amount: line.amount,
            included: line.included ? 1 : 0,
          })),
        )
        .run();
    }
  });
  save();

  const saved = readQuotation(id);
  if (!saved) throw new Error("Saved quotation could not be read back.");
  return saved;
}
