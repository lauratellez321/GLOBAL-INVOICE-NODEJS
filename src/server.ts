import { createServer } from "node:http";
import bcrypt from "bcryptjs";
import { Server } from "socket.io";
import { env } from "./config/env.js";
import {
  openDatabase,
  SqliteInvoiceRepository,
  SqliteUserRepository,
  SqliteInvoiceTypeRepository,
} from "./infrastructure/database/sqlite.js";
import { DataFlexNumberWordsGateway } from "./infrastructure/soap/dataflex-number-words.gateway.js";
import { TaxCalculator } from "./domain/invoice/tax-calculator.js";
import { NationalTaxRule } from "./domain/invoice/rules/national-tax.rule.js";
import { ExportTaxRule } from "./domain/invoice/rules/export-tax.rule.js";
import { GovernmentTaxRule } from "./domain/invoice/rules/government-tax.rule.js";
import { AuthService } from "./application/auth.service.js";
import { InvoiceService } from "./application/invoice.service.js";
import { InvoiceTypeService } from "./application/invoice-type.service.js";
import { createApp } from "./presentation/http/app.js";
const db = openDatabase(env.databasePath);
for (const seed of env.seeds) {
  if (
    seed.email &&
    seed.password &&
    !db.prepare("SELECT 1 FROM users WHERE email=?").get(seed.email)
  ) {
    db.prepare(
      "INSERT INTO users (email,password_hash,role) VALUES (?,?,?)",
    ).run(seed.email, await bcrypt.hash(seed.password, 12), seed.role);
  }
}

const invoiceRepository = new SqliteInvoiceRepository(db);
const userRepository = new SqliteUserRepository(db);
const typeRepository = new SqliteInvoiceTypeRepository(db);
let io: Server;
const taxCalculator = new TaxCalculator([
  new NationalTaxRule(), new ExportTaxRule(), new GovernmentTaxRule(),
]);
const typeService = new InvoiceTypeService(typeRepository, taxCalculator);
typeService.load();
const invoiceService = new InvoiceService(
  invoiceRepository,
  taxCalculator,
  new DataFlexNumberWordsGateway(),
  () => io.emit("invoice-created"),
);
const app = createApp(
  new AuthService(userRepository, env.jwtSecret),
  invoiceService,
  env.jwtSecret,
  env.clientOrigin,
  typeService,
);
const http = createServer(app);
io = new Server(http, { cors: { origin: env.clientOrigin } });
http.listen(env.port);
