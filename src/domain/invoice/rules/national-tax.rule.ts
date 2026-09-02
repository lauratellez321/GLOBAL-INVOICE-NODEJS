import type { Invoice } from '../invoice.types.js'; import type { TaxRule } from '../tax-calculator.js';
export class NationalTaxRule implements TaxRule { readonly type='NATIONAL'; calculate(subtotal:number):Pick<Invoice,'tax'|'withholding'|'total'>{const tax=subtotal*.19;return {tax,withholding:0,total:subtotal+tax};} }
