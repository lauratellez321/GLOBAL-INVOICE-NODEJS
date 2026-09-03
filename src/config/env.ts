import "dotenv/config";

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret || jwtSecret.length < 32)
  throw new Error("JWT_SECRET debe tener al menos 32 caracteres");

export const env = {
  port: Number(process.env.PORT ?? 3000),
  jwtSecret,
  // El único directorio escribible de una Vercel Function es /tmp.
  // Para producción se recomienda una base de datos gestionada; ver README.
  databasePath:
    process.env.DATABASE_PATH ??
    (process.env.VERCEL ? "/tmp/global-invoice.db" : "./data/global-invoice.db"),
  databaseUrl: process.env.DATABASE_URL,
  isVercel: Boolean(process.env.VERCEL),
  clientOrigin: process.env.CLIENT_ORIGIN ?? "http://localhost:4200",
};
