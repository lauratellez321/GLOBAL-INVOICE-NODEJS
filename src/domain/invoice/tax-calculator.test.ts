import { describe, expect, it } from "vitest";
import { TaxCalculator } from "./tax-calculator.js";
import { NationalTaxRule } from "./rules/national-tax.rule.js";
import { ExportTaxRule } from "./rules/export-tax.rule.js";
import { GovernmentTaxRule } from "./rules/government-tax.rule.js";
import { UnknownInvoiceTypeError } from "./tax-calculator.js";
describe("TaxCalculator", () => {
  const calculator = new TaxCalculator([new NationalTaxRule(), new ExportTaxRule(), new GovernmentTaxRule()]);
  it.each([
    ["NATIONAL", 119, 19, 0],
    ["EXPORT", 100, 0, 0],
    ["GOVERNMENT", 114, 19, 5],
  ] as const)("calculates %s", (type, total, tax, withholding) =>
    expect(calculator.calculate(type, 100)).toEqual({
      total,
      tax,
      withholding,
    }),
  );
  it("rejects an unregistered invoice type", () => expect(() => calculator.calculate("NGO", 100)).toThrow(UnknownInvoiceTypeError));
});
