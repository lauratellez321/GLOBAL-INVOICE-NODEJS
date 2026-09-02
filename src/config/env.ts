import "dotenv/config";

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret || jwtSecret.length < 32)
  throw new Error("JWT_SECRET debe tener al menos 32 caracteres");

export const env = {
  port: Number(process.env.PORT ?? 3000),
  jwtSecret,
  databasePath: process.env.DATABASE_PATH ?? "./data/global-invoice.db",
  clientOrigin: process.env.CLIENT_ORIGIN ?? "http://localhost:4200",
  seeds: [
    {
      email: process.env.SEED_OPERATOR_EMAIL,
      password: process.env.SEED_OPERATOR_PASSWORD,
      role: "OPERATOR" as const,
    },
    {
      email: process.env.SEED_AUDITOR_EMAIL,
      password: process.env.SEED_AUDITOR_PASSWORD,
      role: "AUDITOR" as const,
    },
  ],
};
