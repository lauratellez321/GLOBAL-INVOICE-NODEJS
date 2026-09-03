export type InvoiceType = string;
export type Role = "OPERATOR" | "AUDITOR";
export interface InvoiceDraft {
  type: InvoiceType;
  subtotal: number;
  customsCode?: string;
}
export interface Invoice extends InvoiceDraft {
  id: number;
  tax: number;
  withholding: number;
  total: number;
  createdAt: string;
}
export interface InvoiceRepository {
  create(
    draft: InvoiceDraft,
    values: Pick<Invoice, "tax" | "withholding" | "total">,
  ): Promise<Invoice>;
  update(id:number,draft:InvoiceDraft,values:Pick<Invoice,"tax"|"withholding"|"total">):Promise<Invoice|undefined>;
  delete(id:number):Promise<boolean>;
  all(): Promise<Invoice[]>;
  findById(id: number): Promise<Invoice | undefined>;
  totals(): Promise<{ type: InvoiceType; total: number }[]>;
}
export interface User {
  id: number;
  email: string;
  passwordHash: string;
  role: Role;
}
export interface UserRepository {
  find(email: string): Promise<User | undefined>;
  create(user: Omit<User, "id">): Promise<void>;
}
export interface InvoiceTypeConfig {
  code: string;
  name: string;
  vatRate: number;
  withholdingRate: number;
}
export interface InvoiceTypeRepository {
  all(): Promise<InvoiceTypeConfig[]>;
  create(type: Omit<InvoiceTypeConfig, "name"> & { name?: string }): Promise<InvoiceTypeConfig>;
}
export interface NumberWordsGateway {
  toWords(value: number): Promise<string>;
}
