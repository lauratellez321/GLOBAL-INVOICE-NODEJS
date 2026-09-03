import { Pool } from "pg";
import type {
  Invoice,
  InvoiceDraft,
  InvoiceRepository,
  InvoiceTypeConfig,
  InvoiceTypeRepository,
  User,
  UserRepository,
} from "../../domain/invoice/invoice.types.js";

type InvoiceRow = Omit<Invoice, "createdAt"> & { createdAt: Date | string };

function invoiceFromRow(row: InvoiceRow): Invoice {
  return { ...row, createdAt: new Date(row.createdAt).toISOString() };
}

export class PostgresDatabase {
  readonly pool: Pool;

  constructor(connectionString: string) {
    this.pool = new Pool({
      connectionString,
      ssl: connectionString.includes("localhost") ? false : { rejectUnauthorized: false },
    });
  }

  async initialize() {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('OPERATOR', 'AUDITOR'))
      );
      CREATE TABLE IF NOT EXISTS invoice_types (
        code TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        vat_rate DOUBLE PRECISION NOT NULL,
        withholding_rate DOUBLE PRECISION NOT NULL
      );
      CREATE TABLE IF NOT EXISTS invoices (
        id SERIAL PRIMARY KEY,
        type TEXT NOT NULL,
        subtotal DOUBLE PRECISION NOT NULL,
        customs_code TEXT,
        tax DOUBLE PRECISION NOT NULL,
        withholding DOUBLE PRECISION NOT NULL,
        total DOUBLE PRECISION NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      INSERT INTO invoice_types (code, name, vat_rate, withholding_rate)
      VALUES
        ('NATIONAL', 'Nacional', .19, 0),
        ('EXPORT', 'Exportación', 0, 0),
        ('GOVERNMENT', 'Gubernamental', .19, .05)
      ON CONFLICT (code) DO NOTHING;
    `);
  }
}

export class PostgresInvoiceRepository implements InvoiceRepository {
  constructor(private readonly db: PostgresDatabase) {}

  async create(draft: InvoiceDraft, values: Pick<Invoice, "tax" | "withholding" | "total">) {
    const { rows } = await this.db.pool.query<InvoiceRow>(
      `INSERT INTO invoices (type, subtotal, customs_code, tax, withholding, total)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING id, type, subtotal, customs_code AS "customsCode", tax, withholding, total, created_at AS "createdAt"`,
      [draft.type, draft.subtotal, draft.customsCode ?? null, values.tax, values.withholding, values.total],
    );
    return invoiceFromRow(rows[0]);
  }

  async update(id: number, draft: InvoiceDraft, values: Pick<Invoice, "tax" | "withholding" | "total">) {
    const { rows } = await this.db.pool.query<InvoiceRow>(
      `UPDATE invoices SET type=$1, subtotal=$2, customs_code=$3, tax=$4, withholding=$5, total=$6
       WHERE id=$7
       RETURNING id, type, subtotal, customs_code AS "customsCode", tax, withholding, total, created_at AS "createdAt"`,
      [draft.type, draft.subtotal, draft.customsCode ?? null, values.tax, values.withholding, values.total, id],
    );
    return rows[0] ? invoiceFromRow(rows[0]) : undefined;
  }

  async delete(id: number) {
    const result = await this.db.pool.query("DELETE FROM invoices WHERE id=$1", [id]);
    return result.rowCount === 1;
  }

  async all() {
    const { rows } = await this.db.pool.query<InvoiceRow>(
      `SELECT id, type, subtotal, customs_code AS "customsCode", tax, withholding, total, created_at AS "createdAt"
       FROM invoices ORDER BY id DESC`,
    );
    return rows.map(invoiceFromRow);
  }

  async findById(id: number) {
    const { rows } = await this.db.pool.query<InvoiceRow>(
      `SELECT id, type, subtotal, customs_code AS "customsCode", tax, withholding, total, created_at AS "createdAt"
       FROM invoices WHERE id=$1`, [id],
    );
    return rows[0] ? invoiceFromRow(rows[0]) : undefined;
  }

  async totals() {
    const { rows } = await this.db.pool.query<{ type: string; total: number }>(
      "SELECT type, ROUND(SUM(total)::numeric, 2)::float8 AS total FROM invoices GROUP BY type",
    );
    return rows;
  }
}

export class PostgresInvoiceTypeRepository implements InvoiceTypeRepository {
  constructor(private readonly db: PostgresDatabase) {}

  async all() {
    const { rows } = await this.db.pool.query<InvoiceTypeConfig>(
      'SELECT code, name, vat_rate AS "vatRate", withholding_rate AS "withholdingRate" FROM invoice_types ORDER BY code',
    );
    return rows;
  }

  async create(type: Omit<InvoiceTypeConfig, "name"> & { name?: string }) {
    const name = type.name ?? type.code;
    const { rows } = await this.db.pool.query<InvoiceTypeConfig>(
      `INSERT INTO invoice_types (code, name, vat_rate, withholding_rate) VALUES ($1,$2,$3,$4)
       RETURNING code, name, vat_rate AS "vatRate", withholding_rate AS "withholdingRate"`,
      [type.code, name, type.vatRate, type.withholdingRate],
    );
    return rows[0];
  }
}

export class PostgresUserRepository implements UserRepository {
  constructor(private readonly db: PostgresDatabase) {}

  async find(email: string) {
    const { rows } = await this.db.pool.query<User>(
      'SELECT id, email, password_hash AS "passwordHash", role FROM users WHERE email=$1', [email],
    );
    return rows[0];
  }

  async create(user: Omit<User, "id">) {
    await this.db.pool.query(
      "INSERT INTO users (email, password_hash, role) VALUES ($1,$2,$3)",
      [user.email, user.passwordHash, user.role],
    );
  }
}
