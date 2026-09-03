import {
  PercentageTaxRule,
  TaxCalculator,
} from "../domain/invoice/tax-calculator.js";
import type { InvoiceTypeRepository } from "../domain/invoice/invoice.types.js";
export class InvoiceTypeService {
  constructor(
    private readonly repo: InvoiceTypeRepository,
    private readonly calculator: TaxCalculator,
  ) {}
  async load() {
    (await this.repo
      .all())
      .forEach((type) =>
        this.calculator.register(
          new PercentageTaxRule(type.code, type.vatRate, type.withholdingRate),
        ),
      );
  }
  all() {
    return this.repo.all();
  }
  async create(type: { code: string; name?: string; vatRate: number; withholdingRate: number }) {
    const created = await this.repo.create(type);
    this.calculator.register(
      new PercentageTaxRule(
        created.code,
        created.vatRate,
        created.withholdingRate,
      ),
    );
    return created;
  }
}
