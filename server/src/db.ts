import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";
import { CATEGORIES, ITEMS, SEEDED_SEQUENCES } from "./catalog.ts";
import { getContext } from "./context.ts";
import { SCHEMA_SQL } from "./schema-sql.ts";
import { sqliteSql, type Sql } from "./sql.ts";

export type CategoryRow = {
  id: string;
  code: string;
  name: string;
  description: string;
  productLine: string;
  sortOrder: number;
};

export type ItemRow = {
  id: string;
  categoryId: string;
  displayCode: string;
  name: string;
  chargeBasis: string;
  unitPrice: number;
  pricingType: string;
  sortOrder: number;
  notes: string;
  groupLabel: string;
  quantityLocked: number;
  quantityLabel: string;
  sampleQuantity: number;
};

let sqlite: Database.Database | null = null;
let sqliteApi: Sql | null = null;
const ready = new WeakMap<Sql, Promise<void>>();

function databasePath(): string {
  if (process.env.DATABASE_PATH) return process.env.DATABASE_PATH;
  return fileURLToPath(new URL("../data/quotation.db", import.meta.url));
}

function openSqlite(): Database.Database {
  if (sqlite) return sqlite;
  const file = databasePath();
  mkdirSync(path.dirname(file), { recursive: true });
  sqlite = new Database(file);
  sqlite.pragma("foreign_keys = ON");
  return sqlite;
}

export function getSql(): Sql {
  const bound = getContext()?.sql;
  if (bound) return bound;
  sqliteApi ??= sqliteSql(openSqlite());
  return sqliteApi;
}

async function execScript(sql: Sql, script: string) {
  const statements = script
    .split(";")
    .map((statement) => statement.trim())
    .filter((statement) => statement !== "");
  for (const statement of statements) {
    await sql.run(statement);
  }
}

async function seed(sql: Sql) {
  const count = await sql.get<{ n: number }>("SELECT COUNT(*) AS n FROM price_categories");
  if (Number(count?.n ?? 0) === 0) {
    for (const category of CATEGORIES) {
      await sql.run(
        `INSERT INTO price_categories (id, code, name, description, product_line, sort_order)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [category.id, category.code, category.name, category.description, category.productLine, category.sortOrder],
      );
    }
    for (const item of ITEMS) {
      await sql.run(
        `INSERT INTO price_items (
           id, category_id, display_code, name, charge_basis, unit_price, pricing_type, sort_order,
           notes, group_label, quantity_locked, quantity_label, sample_quantity
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          item.id,
          item.categoryId,
          item.displayCode,
          item.name,
          item.chargeBasis,
          item.unitPrice,
          item.pricingType,
          item.sortOrder,
          JSON.stringify(item.notes),
          item.group,
          item.quantityLocked ? 1 : 0,
          item.quantityLabel,
          item.sampleQuantity,
        ],
      );
    }
  }

  for (const sequence of SEEDED_SEQUENCES) {
    await sql.run(
      `INSERT INTO quotation_sequences (short_code, last_seq) VALUES (?, ?)
       ON CONFLICT(short_code) DO NOTHING`,
      [sequence.shortCode, sequence.lastSeq],
    );
  }
}

export function ensureReady(): Promise<void> {
  const sql = getSql();
  const existing = ready.get(sql);
  if (existing) return existing;
  const pending = (async () => {
    await execScript(sql, SCHEMA_SQL);
    const columns = await sql.all<{ name: string }>("PRAGMA table_info(quotation_lines)");
    if (!columns.some((column) => column.name === "included")) {
      await sql.run("ALTER TABLE quotation_lines ADD COLUMN included INTEGER NOT NULL DEFAULT 1");
    }
    await seed(sql);
  })();
  ready.set(sql, pending);
  return pending;
}

export async function listCategories(): Promise<CategoryRow[]> {
  return getSql().all<CategoryRow>(
    `SELECT id, code, name, description, product_line AS "productLine", sort_order AS "sortOrder"
     FROM price_categories
     ORDER BY sort_order`,
  );
}

export async function listItems(): Promise<ItemRow[]> {
  return getSql().all<ItemRow>(
    `SELECT id, category_id AS "categoryId", display_code AS "displayCode", name,
            charge_basis AS "chargeBasis", unit_price AS "unitPrice", pricing_type AS "pricingType",
            sort_order AS "sortOrder", notes, group_label AS "groupLabel",
            quantity_locked AS "quantityLocked", quantity_label AS "quantityLabel",
            sample_quantity AS "sampleQuantity"
     FROM price_items
     ORDER BY sort_order`,
  );
}
