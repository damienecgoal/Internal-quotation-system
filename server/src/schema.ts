import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const priceCategories = sqliteTable("price_categories", {
  id: text("id").primaryKey(),
  code: text("code").notNull(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  productLine: text("product_line").notNull().default(""),
  sortOrder: integer("sort_order").notNull(),
});

export const priceItems = sqliteTable("price_items", {
  id: text("id").primaryKey(),
  categoryId: text("category_id")
    .notNull()
    .references(() => priceCategories.id),
  displayCode: text("display_code").notNull().default(""),
  name: text("name").notNull(),
  chargeBasis: text("charge_basis").notNull(),
  unitPrice: integer("unit_price").notNull(),
  pricingType: text("pricing_type").notNull(),
  sortOrder: integer("sort_order").notNull(),
  notes: text("notes").notNull().default("[]"),
  groupLabel: text("group_label").notNull().default(""),
  quantityLocked: integer("quantity_locked").notNull().default(0),
  quantityLabel: text("quantity_label").notNull().default(""),
  sampleQuantity: integer("sample_quantity").notNull().default(0),
});

export const quotations = sqliteTable("quotations", {
  id: text("id").primaryKey(),
  quotationNo: text("quotation_no").notNull().unique(),
  customerName: text("customer_name").notNull(),
  shortCode: text("short_code").notNull(),
  attn: text("attn").notNull().default(""),
  tel: text("tel").notNull().default(""),
  email: text("email").notNull().default(""),
  address: text("address").notNull().default(""),
  subject: text("subject").notNull().default(""),
  customerNo: text("customer_no").notNull().default(""),
  yourRef: text("your_ref").notNull().default(""),
  revision: text("revision").notNull().default(""),
  quotationDate: text("quotation_date").notNull(),
  contractMonths: integer("contract_months").notNull().default(0),
  contractWeeks: integer("contract_weeks").notNull().default(0),
  discount: integer("discount").notNull().default(0),
  discountNote: text("discount_note").notNull().default(""),
  total: integer("total").notNull(),
  createdAt: text("created_at").notNull(),
});

export const quotationLines = sqliteTable("quotation_lines", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  quotationId: text("quotation_id")
    .notNull()
    .references(() => quotations.id),
  priceItemId: text("price_item_id")
    .notNull()
    .references(() => priceItems.id),
  quantity: integer("quantity").notNull(),
  unitPrice: integer("unit_price").notNull(),
  chargeBasis: text("charge_basis").notNull(),
  pricingType: text("pricing_type").notNull(),
  amount: integer("amount").notNull(),
  included: integer("included").notNull().default(1),
});

export const quotationSequences = sqliteTable("quotation_sequences", {
  shortCode: text("short_code").primaryKey(),
  lastSeq: integer("last_seq").notNull(),
});
