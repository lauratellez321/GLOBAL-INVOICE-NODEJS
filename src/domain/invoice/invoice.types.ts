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
  ): Invoice;
  update(id:number,draft:InvoiceDraft,values:Pick<Invoice,"tax"|"withholding"|"total">):Invoice|undefined;
  delete(id:number):boolean;
  all(): Invoice[];
  findById(id: number): Invoice | undefined;
  totals(): { type: InvoiceType; total: number }[];
}
export interface User {
  id: number;
  email: string;
  passwordHash: string;
  role: Role;
}
export interface UserRepository {
  find(email: string): User | undefined;
}
export interface NumberWordsGateway {
  toWords(value: number): Promise<string>;
}
