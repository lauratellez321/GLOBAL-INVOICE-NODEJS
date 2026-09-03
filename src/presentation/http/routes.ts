import { Router } from "express";
import { z } from "zod";
import { AuthService } from "../../application/auth.service.js";
import { InvoiceService } from "../../application/invoice.service.js";
import { UnknownInvoiceTypeError } from "../../domain/invoice/tax-calculator.js";
import { InvoiceTypeService } from "../../application/invoice-type.service.js";
import { allow, authenticate } from "./middleware/auth.middleware.js";
export function apiRouter(
  auth: AuthService,
  invoices: InvoiceService,
  jwtSecret: string, types: InvoiceTypeService,
) {
  const router = Router();
  const secured = authenticate(jwtSecret);
  router.get('/invoice-types', secured, allow('OPERATOR','AUDITOR'), async (_req,res) => res.json(await types.all()));
  router.post('/invoice-types', secured, allow('OPERATOR'), async (req,res) => { const input=z.object({code:z.string().trim().min(2).max(30).regex(/^[A-Z0-9_]+$/),vatRate:z.number().min(0).max(1),withholdingRate:z.number().min(0).max(1)}).safeParse(req.body); if(!input.success)return res.status(400).json({message:'Configuración inválida'}); try{return res.status(201).json(await types.create(input.data));}catch{return res.status(409).json({message:'El tipo ya existe'});} });
  router.post("/auth/login", async (req, res) => {
    const input = z
      .object({ email: z.string().email(), password: z.string().min(1) })
      .safeParse(req.body);
    if (!input.success)
      return res.status(400).json({ message: "Credenciales inválidas" });
    const result = await auth.login(input.data.email, input.data.password);
    return result
      ? res.json(result)
      : res.status(401).json({ message: "Credenciales inválidas" });
  });
  const schema = z
    .object({
      type: z.string().min(1),
      subtotal: z.number().positive(),
      customsCode: z.string().trim().optional(),
    })
    .superRefine((value, context) => {
      if (value.type === "EXPORT" && !value.customsCode)
        context.addIssue({
          code: "custom",
          message: "Código Aduanero es obligatorio",
        });
    });
  router.get("/invoices", secured, allow("OPERATOR", "AUDITOR"), async (_req, res) => {
    try { return res.json(await invoices.list()); } catch { return res.status(502).json({ message: "No fue posible consultar el servicio SOAP" }); }
  });
  router.post("/invoices", secured, allow("OPERATOR"), async (req, res) => {
    const input = schema.safeParse(req.body);
    if (!input.success)
      return res.status(400).json({ message: input.error.issues[0].message });
    try {
      return res.status(201).json(await invoices.create(input.data));
    } catch (error) {
      if (error instanceof UnknownInvoiceTypeError)
        return res.status(400).json({ message: error.message });
      throw error;
    }
  });
  router.put('/invoices/:id',secured,allow('OPERATOR'),async (req,res)=>{const input=schema.safeParse(req.body);if(!input.success)return res.status(400).json({message:input.error.issues[0].message});try{const invoice=await invoices.update(Number(req.params.id),input.data);return invoice?res.json(invoice):res.sendStatus(404);}catch(error){if(error instanceof UnknownInvoiceTypeError)return res.status(400).json({message:error.message});throw error;}});
  router.get("/dashboard", secured, allow("AUDITOR"), async (_req, res) =>
    res.json(await invoices.totals()),
  );
  router.delete('/invoices/:id',secured,allow('OPERATOR'),async (req,res)=>(await invoices.delete(Number(req.params.id)))?res.sendStatus(204):res.sendStatus(404));
  return router;
}
