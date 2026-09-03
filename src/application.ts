import { env } from "./config/env.js";
import {
  openDatabase,
  SqliteInvoiceRepository,
  SqliteInvoiceTypeRepository,
  SqliteUserRepository,
} from "./infrastructure/database/sqlite.js";
import {
  PostgresDatabase,
  PostgresInvoiceRepository,
  PostgresInvoiceTypeRepository,
  PostgresUserRepository,
} from "./infrastructure/database/postgres.js";
import { DataFlexNumberWordsGateway } from "./infrastructure/soap/dataflex-number-words.gateway.js";
import { TaxCalculator } from "./domain/invoice/tax-calculator.js";
import { NationalTaxRule } from "./domain/invoice/rules/national-tax.rule.js";
import { ExportTaxRule } from "./domain/invoice/rules/export-tax.rule.js";
import { GovernmentTaxRule } from "./domain/invoice/rules/government-tax.rule.js";
import { AuthService } from "./application/auth.service.js";
import { InvoiceService } from "./application/invoice.service.js";
import { InvoiceTypeService } from "./application/invoice-type.service.js";
import { createApp } from "./presentation/http/app.js";
import type {
  InvoiceRepository,
  InvoiceTypeRepository,
  UserRepository,
} from "./domain/invoice/invoice.types.js";

/** Construye la aplicación sin abrir un puerto; reutilizable por Vercel y local. */
export async function createApplication(onInvoiceChanged = () => {}) {
  let invoiceRepository: InvoiceRepository;
  let typeRepository: InvoiceTypeRepository;
  let userRepository: UserRepository;

  if (env.databaseUrl) {
    const database = new PostgresDatabase(env.databaseUrl);
    await database.initialize();
    invoiceRepository = new PostgresInvoiceRepository(database);
    typeRepository = new PostgresInvoiceTypeRepository(database);
    userRepository = new PostgresUserRepository(database);
  } else {
    if (env.isVercel)
      throw new Error("DATABASE_URL es obligatoria al ejecutar la API en Vercel");
    const database = openDatabase(env.databasePath);
    invoiceRepository = new SqliteInvoiceRepository(database);
    typeRepository = new SqliteInvoiceTypeRepository(database);
    userRepository = new SqliteUserRepository(database);
  }

  const calculator = new TaxCalculator([
    new NationalTaxRule(), new ExportTaxRule(), new GovernmentTaxRule(),
  ]);
  const typeService = new InvoiceTypeService(
    typeRepository, calculator,
  );
  await typeService.load();

  const invoiceService = new InvoiceService(
    invoiceRepository, calculator,
    new DataFlexNumberWordsGateway(), onInvoiceChanged,
  );
  return createApp(
    new AuthService(userRepository, env.jwtSecret),
    invoiceService, env.jwtSecret, env.clientOrigin, typeService,
  );
}
