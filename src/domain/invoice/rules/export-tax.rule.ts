import type { Invoice } from '../invoice.types.js'; import type { TaxRule } from '../tax-calculator.js';
export class ExportTaxRule implements TaxRule { readonly type='EXPORT'; calculate(subtotal:number):Pick<Invoice,'tax'|'withholding'|'total'>{return {tax:0,withholding:0,total:subtotal};} }
