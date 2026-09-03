# Global Invoice API

API REST para Global Invoice. Incluye JWT, autorización por rol, SQLite, reglas tributarias extensibles, integración SOAP y Socket.IO.

## Ejecutar

1. Copie `.env.example` a `.env` y configure un `JWT_SECRET` de al menos 32 caracteres.
2. Ejecute `pnpm install`.
3. Ejecute `pnpm dev`.

La API se publica en `http://localhost:3000`. El cliente permitido por defecto es `http://localhost:4200`.

## Despliegue en Vercel

El archivo `api/index.ts` expone Express como una Vercel Function; `src/server.ts` se conserva únicamente para desarrollo local con Socket.IO.

En el proyecto de Vercel configure estas variables de entorno:

- `JWT_SECRET`: cadena secreta de 32 caracteres o más.
- `CLIENT_ORIGIN`: URL pública del frontend, sin `/` final.
- `SEED_OPERATOR_EMAIL`, `SEED_OPERATOR_PASSWORD`, `SEED_AUDITOR_EMAIL` y `SEED_AUDITOR_PASSWORD`: credenciales iniciales.
- `DATABASE_URL`: cadena de conexión PostgreSQL proporcionada por Neon, Supabase o Vercel Marketplace.

SQLite se mantiene únicamente para desarrollo local. En Vercel, `DATABASE_URL` es obligatoria: al primer despliegue se crean automáticamente las tablas, los tres tipos base y los usuarios definidos en `SEED_*`.

Si deseas conservar los datos que ya tienes en SQLite, configura `DATABASE_URL` en tu archivo `.env` y, desde tu equipo, ejecuta una sola vez:

```bash
pnpm migrate:sqlite
```

El comando copia tipos, usuarios y facturas a PostgreSQL sin eliminar la base SQLite. Para aplicar solamente el esquema a una base vacía, usa `pnpm migrate`.

Después de desplegar, use `https://<tu-api>.vercel.app/api` como valor de `window.__GLOBAL_INVOICE_API_URL__` en el frontend.
