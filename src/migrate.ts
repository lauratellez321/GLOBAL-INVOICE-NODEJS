import { env } from "./config/env.js";
import { PostgresDatabase } from "./infrastructure/database/postgres.js";

if (!env.databaseUrl) throw new Error("DATABASE_URL es obligatoria para ejecutar migraciones");

const database = new PostgresDatabase(env.databaseUrl);
await database.initialize();
await database.pool.end();
console.log("Migraciones PostgreSQL aplicadas correctamente.");
