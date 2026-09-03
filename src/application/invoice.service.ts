import type {
  InvoiceDraft,
  InvoiceRepository,
  NumberWordsGateway,
} from "../domain/invoice/invoice.types.js";
import { TaxCalculator } from "../domain/invoice/tax-calculator.js";
export class InvoiceService {
  constructor(
    private readonly invoices: InvoiceRepository,
    private readonly calculator: TaxCalculator,
    private readonly words: NumberWordsGateway,
    private readonly onCreated: () => void,
  ) {}
  async list() {
    return Promise.all(
      (await this.invoices
        .all())
        .map(async (invoice) => ({
          ...invoice,
          totalInWords: await this.words.toWords(invoice.total),
        })),
    );
  }
  async create(draft: InvoiceDraft) {
    const invoice = await this.invoices.create(
      draft,
      this.calculator.calculate(draft.type, draft.subtotal),
    );
    this.onCreated();
    return invoice;
  }
  totals() {
    return this.invoices.totals();
  }
  async update(id: number, draft: InvoiceDraft) {
    const invoice = await this.invoices.update(
      id,
      draft,
      this.calculator.calculate(draft.type, draft.subtotal),
    );
    if (invoice) this.onCreated();
    return invoice;
  }
  async delete(id: number) {
    const deleted = await this.invoices.delete(id);
    if (deleted) this.onCreated();
    return deleted;
  }
}
