import express from "express";
import cors from "cors";
import { apiRouter } from "./routes.js";
import type { AuthService } from "../../application/auth.service.js";
import type { InvoiceService } from "../../application/invoice.service.js";
import type { InvoiceTypeService } from "../../application/invoice-type.service.js";
export function createApp(
  auth: AuthService,
  invoices: InvoiceService,
  jwtSecret: string,
  origin: string, types: InvoiceTypeService,
) {
  const app = express();
  app.use(cors({ origin }));
  app.use(express.json());
  app.use("/api", apiRouter(auth, invoices, jwtSecret, types));
  return app;
}
