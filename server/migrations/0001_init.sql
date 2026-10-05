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
