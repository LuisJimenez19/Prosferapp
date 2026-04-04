import type { MigrationDefinition } from '@/src/types/database';
import { SYNC_STATUS } from '@/src/types/common';

export const migration002Business: MigrationDefinition = {
  id: 2,
  name: '002_business',
  sql: `
CREATE TABLE IF NOT EXISTS businesses (
  local_id TEXT PRIMARY KEY NOT NULL,
  server_id TEXT UNIQUE,
  owner_type TEXT NOT NULL,
  owner_local_id TEXT NOT NULL,
  name TEXT NOT NULL,
  legal_name TEXT,
  tax_id TEXT,
  default_currency TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address_line TEXT,
  notes TEXT,
  sync_status TEXT NOT NULL DEFAULT '${SYNC_STATUS.PENDING}',
  version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS customers (
  local_id TEXT PRIMARY KEY NOT NULL,
  server_id TEXT UNIQUE,
  owner_type TEXT NOT NULL,
  owner_local_id TEXT NOT NULL,
  business_local_id TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address_line TEXT,
  notes TEXT,
  sync_status TEXT NOT NULL DEFAULT '${SYNC_STATUS.PENDING}',
  version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TEXT,
  FOREIGN KEY (business_local_id) REFERENCES businesses(local_id)
);

CREATE TABLE IF NOT EXISTS suppliers (
  local_id TEXT PRIMARY KEY NOT NULL,
  server_id TEXT UNIQUE,
  owner_type TEXT NOT NULL,
  owner_local_id TEXT NOT NULL,
  business_local_id TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address_line TEXT,
  notes TEXT,
  sync_status TEXT NOT NULL DEFAULT '${SYNC_STATUS.PENDING}',
  version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TEXT,
  FOREIGN KEY (business_local_id) REFERENCES businesses(local_id)
);

CREATE TABLE IF NOT EXISTS products (
  local_id TEXT PRIMARY KEY NOT NULL,
  server_id TEXT UNIQUE,
  owner_type TEXT NOT NULL,
  owner_local_id TEXT NOT NULL,
  business_local_id TEXT NOT NULL,
  name TEXT NOT NULL,
  sku TEXT,
  description TEXT,
  unit_name TEXT,
  sale_price REAL NOT NULL DEFAULT 0,
  cost_price REAL NOT NULL DEFAULT 0,
  currency_code TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  sync_status TEXT NOT NULL DEFAULT '${SYNC_STATUS.PENDING}',
  version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TEXT,
  FOREIGN KEY (business_local_id) REFERENCES businesses(local_id)
);

CREATE TABLE IF NOT EXISTS services (
  local_id TEXT PRIMARY KEY NOT NULL,
  server_id TEXT UNIQUE,
  owner_type TEXT NOT NULL,
  owner_local_id TEXT NOT NULL,
  business_local_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  default_price REAL NOT NULL DEFAULT 0,
  currency_code TEXT NOT NULL,
  duration_minutes INTEGER,
  is_active INTEGER NOT NULL DEFAULT 1,
  sync_status TEXT NOT NULL DEFAULT '${SYNC_STATUS.PENDING}',
  version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TEXT,
  FOREIGN KEY (business_local_id) REFERENCES businesses(local_id)
);

CREATE TABLE IF NOT EXISTS sales (
  local_id TEXT PRIMARY KEY NOT NULL,
  server_id TEXT UNIQUE,
  owner_type TEXT NOT NULL,
  owner_local_id TEXT NOT NULL,
  business_local_id TEXT NOT NULL,
  customer_local_id TEXT,
  status TEXT NOT NULL,
  subtotal_amount REAL NOT NULL DEFAULT 0,
  discount_amount REAL NOT NULL DEFAULT 0,
  tax_amount REAL NOT NULL DEFAULT 0,
  total_amount REAL NOT NULL DEFAULT 0,
  currency_code TEXT NOT NULL,
  occurred_at TEXT NOT NULL,
  note TEXT,
  sync_status TEXT NOT NULL DEFAULT '${SYNC_STATUS.PENDING}',
  version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TEXT,
  FOREIGN KEY (business_local_id) REFERENCES businesses(local_id),
  FOREIGN KEY (customer_local_id) REFERENCES customers(local_id)
);

CREATE TABLE IF NOT EXISTS sale_items (
  local_id TEXT PRIMARY KEY NOT NULL,
  server_id TEXT UNIQUE,
  sale_local_id TEXT NOT NULL,
  item_type TEXT NOT NULL,
  product_local_id TEXT,
  service_local_id TEXT,
  item_name_snapshot TEXT NOT NULL,
  quantity REAL NOT NULL DEFAULT 1,
  unit_price REAL NOT NULL DEFAULT 0,
  line_total REAL NOT NULL DEFAULT 0,
  sync_status TEXT NOT NULL DEFAULT '${SYNC_STATUS.PENDING}',
  version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TEXT,
  FOREIGN KEY (sale_local_id) REFERENCES sales(local_id),
  FOREIGN KEY (product_local_id) REFERENCES products(local_id),
  FOREIGN KEY (service_local_id) REFERENCES services(local_id)
);

CREATE TABLE IF NOT EXISTS purchases (
  local_id TEXT PRIMARY KEY NOT NULL,
  server_id TEXT UNIQUE,
  owner_type TEXT NOT NULL,
  owner_local_id TEXT NOT NULL,
  business_local_id TEXT NOT NULL,
  supplier_local_id TEXT,
  status TEXT NOT NULL,
  subtotal_amount REAL NOT NULL DEFAULT 0,
  discount_amount REAL NOT NULL DEFAULT 0,
  tax_amount REAL NOT NULL DEFAULT 0,
  total_amount REAL NOT NULL DEFAULT 0,
  currency_code TEXT NOT NULL,
  occurred_at TEXT NOT NULL,
  note TEXT,
  sync_status TEXT NOT NULL DEFAULT '${SYNC_STATUS.PENDING}',
  version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TEXT,
  FOREIGN KEY (business_local_id) REFERENCES businesses(local_id),
  FOREIGN KEY (supplier_local_id) REFERENCES suppliers(local_id)
);

CREATE TABLE IF NOT EXISTS purchase_items (
  local_id TEXT PRIMARY KEY NOT NULL,
  server_id TEXT UNIQUE,
  purchase_local_id TEXT NOT NULL,
  product_local_id TEXT NOT NULL,
  item_name_snapshot TEXT NOT NULL,
  quantity REAL NOT NULL DEFAULT 1,
  unit_cost REAL NOT NULL DEFAULT 0,
  line_total REAL NOT NULL DEFAULT 0,
  sync_status TEXT NOT NULL DEFAULT '${SYNC_STATUS.PENDING}',
  version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TEXT,
  FOREIGN KEY (purchase_local_id) REFERENCES purchases(local_id),
  FOREIGN KEY (product_local_id) REFERENCES products(local_id)
);

CREATE INDEX IF NOT EXISTS idx_businesses_owner ON businesses(owner_type, owner_local_id);
CREATE INDEX IF NOT EXISTS idx_customers_business ON customers(business_local_id, name);
CREATE INDEX IF NOT EXISTS idx_suppliers_business ON suppliers(business_local_id, name);
CREATE INDEX IF NOT EXISTS idx_products_business ON products(business_local_id, name);
CREATE INDEX IF NOT EXISTS idx_services_business ON services(business_local_id, name);
CREATE INDEX IF NOT EXISTS idx_sales_business ON sales(business_local_id, occurred_at);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_local_id);
CREATE INDEX IF NOT EXISTS idx_purchases_business ON purchases(business_local_id, occurred_at);
CREATE INDEX IF NOT EXISTS idx_purchase_items_purchase ON purchase_items(purchase_local_id);
`,
};
