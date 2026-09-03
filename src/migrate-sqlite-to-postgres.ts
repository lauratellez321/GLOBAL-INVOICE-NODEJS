import { env } from "./config/env.js";
import { openDatabase } from "./infrastructure/database/sqlite.js";
import { PostgresDatabase } from "./infrastructure/database/postgres.js";

if (!env.databaseUrl)
  throw new Error("DATABASE_URL es obligatoria para migrar los datos");

const sqlite = openDatabase(env.databasePath);
const postgres = new PostgresDatabase(env.databaseUrl);

try {
  await postgres.initialize();
  const invoiceTypes = sqlite
    .prepare(
      "SELECT code, name, vat_rate AS vatRate, withholding_rate AS withholdingRate FROM invoice_types",
    )
    .all() as {
    code: string;
    name: string;
    vatRate: number;
    withholdingRate: number;
  }[];
  for (const type of invoiceTypes) {
    await postgres.pool.query(
      `INSERT INTO invoice_types (code,name,vat_rate,withholding_rate) VALUES ($1,$2,$3,$4)
       ON CONFLICT (code) DO UPDATE SET name=EXCLUDED.name, vat_rate=EXCLUDED.vat_rate, withholding_rate=EXCLUDED.withholding_rate`,
      [type.code, type.name, type.vatRate, type.withholdingRate],
    );
  }

  const users = sqlite
    .prepare("SELECT id, email, password_hash AS passwordHash, role FROM users")
    .all() as {
    id: number;
    email: string;
    passwordHash: string;
    role: string;
  }[];
  for (const user of users) {
    await postgres.pool.query(
      `INSERT INTO users (id,email,password_hash,role) VALUES ($1,$2,$3,$4)
       ON CONFLICT (email) DO UPDATE SET password_hash=EXCLUDED.password_hash, role=EXCLUDED.role`,
      [user.id, user.email, user.passwordHash, user.role],
    );
  }

  const invoices = sqlite
    .prepare(
      "SELECT id,type,subtotal,customs_code AS customsCode,tax,withholding,total,created_at AS createdAt FROM invoices",
    )
    .all() as {
    id: number;
    type: string;
    subtotal: number;
    customsCode: string | null;
    tax: number;
    withholding: number;
    total: number;
    createdAt: string;
  }[];
  for (const invoice of invoices) {
    await postgres.pool.query(
      `INSERT INTO invoices (id,type,subtotal,customs_code,tax,withholding,total,created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (id) DO UPDATE SET type=EXCLUDED.type, subtotal=EXCLUDED.subtotal, customs_code=EXCLUDED.customs_code, tax=EXCLUDED.tax, withholding=EXCLUDED.withholding, total=EXCLUDED.total, created_at=EXCLUDED.created_at`,
      [
        invoice.id,
        invoice.type,
        invoice.subtotal,
        invoice.customsCode,
        invoice.tax,
        invoice.withholding,
        invoice.total,
        invoice.createdAt,
      ],
    );
  }
  await postgres.pool.query(
    "SELECT setval(pg_get_serial_sequence('users', 'id'), GREATEST(COALESCE((SELECT MAX(id) FROM users), 1), 1), true)",
  );
  await postgres.pool.query(
    "SELECT setval(pg_get_serial_sequence('invoices', 'id'), GREATEST(COALESCE((SELECT MAX(id) FROM invoices), 1), 1), true)",
  );
  console.log(
    `Migrados ${invoiceTypes.length} tipos, ${users.length} usuarios y ${invoices.length} facturas.`,
  );
} finally {
  await postgres.pool.end();
}
