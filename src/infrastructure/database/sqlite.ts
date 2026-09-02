import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import type {
  Invoice,
  InvoiceDraft,
  InvoiceRepository,
  Role,
  User,
  UserRepository,
} from "../../domain/invoice/invoice.types.js";

export function openDatabase(path: string) {
  if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
  const db = new Database(path);
  db.pragma("foreign_keys = ON");
  db.exec(
    `CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN ('OPERATOR','AUDITOR'))); CREATE TABLE IF NOT EXISTS invoices (id INTEGER PRIMARY KEY, type TEXT NOT NULL, subtotal REAL NOT NULL, customs_code TEXT, tax REAL NOT NULL, withholding REAL NOT NULL, total REAL NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP); CREATE TABLE IF NOT EXISTS invoice_types (code TEXT PRIMARY KEY, name TEXT NOT NULL, vat_rate REAL NOT NULL, withholding_rate REAL NOT NULL);`,
  );
  const columns = db.prepare('PRAGMA table_info(invoice_types)').all() as {name:string}[];
  if (!columns.some(column => column.name === 'name')) db.exec("ALTER TABLE invoice_types ADD COLUMN name TEXT NOT NULL DEFAULT ''");
  db.prepare("INSERT OR IGNORE INTO invoice_types (code,name,vat_rate,withholding_rate) VALUES ('NATIONAL','Nacional',.19,0),('EXPORT','Exportación',0,0),('GOVERNMENT','Gubernamental',.19,.05)").run();
  db.prepare("UPDATE invoice_types SET name=CASE code WHEN 'NATIONAL' THEN 'Nacional' WHEN 'EXPORT' THEN 'Exportación' WHEN 'GOVERNMENT' THEN 'Gubernamental' ELSE name END WHERE name='' ").run();
  const invoiceTableSql = String(db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='invoices'").pluck().get() ?? '');
  if (invoiceTableSql.includes("CHECK(type")) {
    db.exec(`ALTER TABLE invoices RENAME TO invoices_legacy;
      CREATE TABLE invoices (id INTEGER PRIMARY KEY, type TEXT NOT NULL, subtotal REAL NOT NULL, customs_code TEXT, tax REAL NOT NULL, withholding REAL NOT NULL, total REAL NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
      INSERT INTO invoices (id,type,subtotal,customs_code,tax,withholding,total,created_at) SELECT id,type,subtotal,customs_code,tax,withholding,total,created_at FROM invoices_legacy;
      DROP TABLE invoices_legacy;`);
  }
  return db;
}
export class SqliteInvoiceTypeRepository { constructor(private readonly db:Database.Database){} all(){return this.db.prepare('SELECT code,name,vat_rate as vatRate,withholding_rate as withholdingRate FROM invoice_types').all() as {code:string;name:string;vatRate:number;withholdingRate:number}[];} create(type:{code:string;vatRate:number;withholdingRate:number}){this.db.prepare('INSERT INTO invoice_types (code,name,vat_rate,withholding_rate) VALUES (?,?,?,?)').run(type.code,type.code,type.vatRate,type.withholdingRate);return {...type,name:type.code};} }
export class SqliteInvoiceRepository implements InvoiceRepository {
  constructor(private readonly db: Database.Database) {}
  create(
    draft: InvoiceDraft,
    values: Pick<Invoice, "tax" | "withholding" | "total">,
  ): Invoice {
    const result = this.db
      .prepare(
        "INSERT INTO invoices (type,subtotal,customs_code,tax,withholding,total) VALUES (?,?,?,?,?,?)",
      )
      .run(
        draft.type,
        draft.subtotal,
        draft.customsCode ?? null,
        values.tax,
        values.withholding,
        values.total,
      );
    return this.findById(Number(result.lastInsertRowid))!;
  }
  update(id:number,draft:InvoiceDraft,values:Pick<Invoice,"tax"|"withholding"|"total">){const result=this.db.prepare('UPDATE invoices SET type=?,subtotal=?,customs_code=?,tax=?,withholding=?,total=? WHERE id=?').run(draft.type,draft.subtotal,draft.customsCode??null,values.tax,values.withholding,values.total,id);return result.changes?this.findById(id):undefined;}
  delete(id:number){return this.db.prepare('DELETE FROM invoices WHERE id=?').run(id).changes>0;}
  all(): Invoice[] {
    return this.db
      .prepare(
        "SELECT id,type,subtotal,customs_code as customsCode,tax,withholding,total,created_at as createdAt FROM invoices ORDER BY id DESC",
      )
      .all() as Invoice[];
  }
  findById(id: number): Invoice | undefined {
    return this.db
      .prepare(
        "SELECT id,type,subtotal,customs_code as customsCode,tax,withholding,total,created_at as createdAt FROM invoices WHERE id=?",
      )
      .get(id) as Invoice | undefined;
  }
  totals() {
    return this.db
      .prepare(
        "SELECT type,ROUND(SUM(total),2) total FROM invoices GROUP BY type",
      )
      .all() as { type: Invoice["type"]; total: number }[];
  }
}
export class SqliteUserRepository implements UserRepository {
  constructor(private readonly db: Database.Database) {}
  find(email: string) {
    return this.db
      .prepare(
        "SELECT id,email,password_hash as passwordHash,role FROM users WHERE email=?",
      )
      .get(email) as User | undefined;
  }
}
