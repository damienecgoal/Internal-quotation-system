import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { asc, eq } from "drizzle-orm";
import { CATEGORIES, ITEMS, SEEDED_SEQUENCES } from "./catalog.ts";
import * as schema from "./schema.ts";
import { priceCategories, priceItems, quotationSequences } from "./schema.ts";

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS price_categories (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  product_line TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS price_items (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL REFERENCES price_categories(id),
  display_code TEXT NOT NULL DEFAULT '',
  name TEXT NOT NULL,
  charge_basis TEXT NOT NULL,
  unit_price INTEGER NOT NULL,
  pricing_type TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  notes TEXT NOT NULL DEFAULT '[]',
  group_label TEXT NOT NULL DEFAULT '',
  quantity_locked INTEGER NOT NULL DEFAULT 0,
  quantity_label TEXT NOT NULL DEFAULT '',
  sample_quantity INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS quotations (
  id TEXT PRIMARY KEY,
  quotation_no TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  short_code TEXT NOT NULL,
  attn TEXT NOT NULL DEFAULT '',
  tel TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  subject TEXT NOT NULL DEFAULT '',
  customer_no TEXT NOT NULL DEFAULT '',
  your_ref TEXT NOT NULL DEFAULT '',
  revision TEXT NOT NULL DEFAULT '',
  quotation_date TEXT NOT NULL,
  contract_months INTEGER NOT NULL DEFAULT 0,
  contract_weeks INTEGER NOT NULL DEFAULT 0,
  discount INTEGER NOT NULL DEFAULT 0,
  discount_note TEXT NOT NULL DEFAULT '',
  total INTEGER NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS quotation_lines (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  quotation_id TEXT NOT NULL REFERENCES quotations(id),
  price_item_id TEXT NOT NULL REFERENCES price_items(id),
  quantity INTEGER NOT NULL,
  unit_price INTEGER NOT NULL,
  charge_basis TEXT NOT NULL,
  pricing_type TEXT NOT NULL,
  amount INTEGER NOT NULL,
  included INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS quotation_sequences (
  short_code TEXT PRIMARY KEY,
  last_seq INTEGER NOT NULL
);
`;

function databasePath(): string {
  if (process.env.DATABASE_PATH) return process.env.DATABASE_PATH;
  return fileURLToPath(new URL("../data/quotation.db", import.meta.url));
}

let sqlite: Database.Database | null = null;
let orm: ReturnType<typeof drizzle<typeof schema>> | null = null;

function seed(db: NonNullable<typeof orm>, connection: Database.Database) {
  const count = connection.prepare("SELECT COUNT(*) AS n FROM price_categories").get() as { n: number };
  if (count.n === 0) {
    const insertCatalog = connection.transaction(() => {
      for (const category of CATEGORIES) {
        db.insert(priceCategories)
          .values({
            id: category.id,
            code: category.code,
            name: category.name,
            description: category.description,
            productLine: category.productLine,
            sortOrder: category.sortOrder,
          })
          .run();
      }
      for (const item of ITEMS) {
        db.insert(priceItems)
          .values({
            id: item.id,
            categoryId: item.categoryId,
            displayCode: item.displayCode,
            name: item.name,
            chargeBasis: item.chargeBasis,
            unitPrice: item.unitPrice,
            pricingType: item.pricingType,
            sortOrder: item.sortOrder,
            notes: JSON.stringify(item.notes),
            groupLabel: item.group,
            quantityLocked: item.quantityLocked ? 1 : 0,
            quantityLabel: item.quantityLabel,
            sampleQuantity: item.sampleQuantity,
          })
          .run();
      }
    });
    insertCatalog();
  }

  for (const sequence of SEEDED_SEQUENCES) {
    const existing = db
      .select()
      .from(quotationSequences)
      .where(eq(quotationSequences.shortCode, sequence.shortCode))
      .get();
    if (!existing) {
      db.insert(quotationSequences)
        .values({ shortCode: sequence.shortCode, lastSeq: sequence.lastSeq })
        .run();
    }
  }
}

function open() {
  if (sqlite && orm) return;
  const file = databasePath();
  mkdirSync(path.dirname(file), { recursive: true });
  sqlite = new Database(file);
  sqlite.pragma("foreign_keys = ON");
  sqlite.exec(SCHEMA_SQL);
  const lineColumns = sqlite.prepare("PRAGMA table_info(quotation_lines)").all() as { name: string }[];
  if (!lineColumns.some((column) => column.name === "included")) {
    sqlite.exec("ALTER TABLE quotation_lines ADD COLUMN included INTEGER NOT NULL DEFAULT 1");
  }
  orm = drizzle(sqlite, { schema });
  seed(orm, sqlite);
}

export function getSqlite(): Database.Database {
  open();
  return sqlite as Database.Database;
}

export function getDb() {
  open();
  return orm as NonNullable<typeof orm>;
}

export function listCategories() {
  return getDb().select().from(priceCategories).orderBy(asc(priceCategories.sortOrder)).all();
}

export function listItems() {
  return getDb().select().from(priceItems).orderBy(asc(priceItems.sortOrder)).all();
}
