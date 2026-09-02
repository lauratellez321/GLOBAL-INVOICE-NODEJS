import type { Invoice } from '../invoice.types.js'; import type { TaxRule } from '../tax-calculator.js';
export class GovernmentTaxRule implements TaxRule { readonly type='GOVERNMENT'; calculate(subtotal:number):Pick<Invoice,'tax'|'withholding'|'total'>{const tax=subtotal*.19,withholding=subtotal*.05;return {tax,withholding,total:subtotal+tax-withholding};} }
