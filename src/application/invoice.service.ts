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
    return Promise.all(this.invoices.all().map(async invoice => ({ ...invoice, totalInWords: await this.words.toWords(invoice.total) })));
  }
  create(draft: InvoiceDraft) {
    const invoice = this.invoices.create(
      draft,
      this.calculator.calculate(draft.type, draft.subtotal),
    );
    this.onCreated();
    return invoice;
  }
  totals() {
    return this.invoices.totals();
  }
  update(id:number,draft:InvoiceDraft){const invoice=this.invoices.update(id,draft,this.calculator.calculate(draft.type,draft.subtotal));if(invoice)this.onCreated();return invoice;}
  delete(id:number){const deleted=this.invoices.delete(id);if(deleted)this.onCreated();return deleted;}
}
