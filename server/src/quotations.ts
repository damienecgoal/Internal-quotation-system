import { formatQuotationNo, priceQuotation } from "./calc.ts";
import type { ChargeBasis, PricingType } from "./catalog.ts";
import { getSql, listCategories, listItems } from "./db.ts";
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

type QuotationHeader = QuotationSummary & {
  shortCode: string;
  attn: string;
  tel: string;
  email: string;
  address: string;
  subject: string;
  customerNo: string;
  yourRef: string;
  revision: string;
  contractMonths: number;
  contractWeeks: number;
  discount: number;
  discountNote: string;
};

type QuotationLineRow = {
  priceItemId: string;
  quantity: number;
  unitPrice: number;
  chargeBasis: string;
  pricingType: string;
  amount: number;
  included: number;
  categoryId: string;
  displayCode: string;
  name: string;
  sortOrder: number;
  categorySort: number;
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

export async function getPriceList(): Promise<{ categories: Array<Awaited<ReturnType<typeof listCategories>>[number] & { items: ApiItem[] }> }> {
  const categories = await listCategories();
  const items = (await listItems()).map((item) => ({
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

async function readQuotation(id: string) {
  const sql = getSql();
  const header = await sql.get<QuotationHeader>(
    `SELECT id, quotation_no AS "quotationNo", customer_name AS "customerName", short_code AS "shortCode",
            attn, tel, email, address, subject, customer_no AS "customerNo", your_ref AS "yourRef",
            revision, quotation_date AS "quotationDate", contract_months AS "contractMonths",
            contract_weeks AS "contractWeeks", discount, discount_note AS "discountNote", total,
            created_at AS "createdAt"
     FROM quotations WHERE id = ?`,
    [id],
  );
  if (!header) return null;
  const lines = (
    await sql.all<QuotationLineRow>(
      `SELECT l.price_item_id AS "priceItemId", l.quantity, l.unit_price AS "unitPrice",
              l.charge_basis AS "chargeBasis", l.pricing_type AS "pricingType", l.amount, l.included,
              i.category_id AS "categoryId", i.display_code AS "displayCode", i.name, i.sort_order AS "sortOrder",
              c.sort_order AS "categorySort"
       FROM quotation_lines l
       INNER JOIN price_items i ON i.id = l.price_item_id
       INNER JOIN price_categories c ON c.id = i.category_id
       WHERE l.quotation_id = ?`,
      [id],
    )
  ).sort((a, b) => a.categorySort - b.categorySort || a.sortOrder - b.sortOrder);

  const categories = await listCategories();
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

export async function listQuotations(): Promise<QuotationSummary[]> {
  return getSql().all<QuotationSummary>(
    `SELECT id, quotation_no AS "quotationNo", customer_name AS "customerName",
            quotation_date AS "quotationDate", total, created_at AS "createdAt"
     FROM quotations
     ORDER BY created_at DESC, quotation_no DESC`,
  );
}

export async function createQuotation(input: CreateQuotationInput) {
  const sql = getSql();
  const categories = await listCategories();
  const items = (await listItems()).map((item) => ({
    id: item.id,
    categoryId: item.categoryId,
    unitPrice: item.unitPrice,
    pricingType: asPricingType(item.pricingType),
    chargeBasis: asChargeBasis(item.chargeBasis),
    quantityLocked: item.quantityLocked === 1,
  }));
  const priced = priceQuotation(categories, items, input.quantities, input.discount, input.included);
  const id = crypto.randomUUID();
  const sequence = await sql.get<{ lastSeq: number }>(
    `INSERT INTO quotation_sequences (short_code, last_seq) VALUES (?, 1)
     ON CONFLICT(short_code) DO UPDATE SET last_seq = last_seq + 1
     RETURNING last_seq AS "lastSeq"`,
    [input.shortCode],
  );
  if (!sequence) throw new Error("Could not assign a quotation number.");
  const quotationNo = formatQuotationNo(input.quotationDate, input.shortCode, sequence.lastSeq);
  await sql.run(
    `INSERT INTO quotations (
       id, quotation_no, customer_name, short_code, attn, tel, email, address, subject, customer_no,
       your_ref, revision, quotation_date, contract_months, contract_weeks, discount, discount_note, total, created_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      quotationNo,
      input.customerName,
      input.shortCode,
      input.attn,
      input.tel,
      input.email,
      input.address,
      input.subject,
      input.customerNo,
      input.yourRef,
      input.revision,
      input.quotationDate,
      input.contractMonths,
      input.contractWeeks,
      input.discount,
      input.discountNote,
      priced.total,
      new Date().toISOString(),
    ],
  );
  for (const line of priced.lines) {
    await sql.run(
      `INSERT INTO quotation_lines (quotation_id, price_item_id, quantity, unit_price, charge_basis, pricing_type, amount, included)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        line.priceItemId,
        line.quantity,
        line.unitPrice,
        line.chargeBasis,
        line.pricingType,
        line.amount,
        line.included ? 1 : 0,
      ],
    );
  }

  const saved = await readQuotation(id);
  if (!saved) throw new Error("Saved quotation could not be read back.");
  return saved;
}
