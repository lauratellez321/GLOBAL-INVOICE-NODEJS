import type { Invoice, InvoiceType } from './invoice.types.js';
export interface TaxRule { readonly type: InvoiceType; calculate(subtotal:number): Pick<Invoice,'tax'|'withholding'|'total'>; }
export class PercentageTaxRule implements TaxRule { constructor(readonly type:string,private readonly vatRate:number,private readonly withholdingRate:number){} calculate(subtotal:number){const tax=subtotal*this.vatRate,withholding=subtotal*this.withholdingRate;return {tax,withholding,total:subtotal+tax-withholding};} }
export class UnknownInvoiceTypeError extends Error { constructor(type:string){super(`Tipo de factura no soportado: ${type}`);} }
export class TaxCalculator {
  private readonly rules: Map<InvoiceType,TaxRule>;
  constructor(rules:Iterable<TaxRule>){this.rules=new Map([...rules].map(rule=>[rule.type,rule]));}
  calculate(type:InvoiceType,subtotal:number){const rule=this.rules.get(type);if(!rule)throw new UnknownInvoiceTypeError(type);return rule.calculate(subtotal);}
  register(rule:TaxRule){this.rules.set(rule.type,rule);}
  supportedTypes(){return [...this.rules.keys()];}
}
