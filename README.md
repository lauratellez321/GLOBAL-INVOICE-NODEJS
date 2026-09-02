# Global Invoice API

API REST para Global Invoice. Incluye JWT, autorización por rol, SQLite, reglas tributarias extensibles, integración SOAP y Socket.IO.

## Ejecutar

1. Copie `.env.example` a `.env` y configure un `JWT_SECRET` de al menos 32 caracteres.
2. Ejecute `pnpm install`.
3. Ejecute `pnpm dev`.

La API se publica en `http://localhost:3000`. El cliente permitido por defecto es `http://localhost:4200`.
