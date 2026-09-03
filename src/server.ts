import { createServer } from "node:http";
import express, { type Express } from "express";
import { Server } from "socket.io";
import { env } from "./config/env.js";
import { createApplication } from "./application.js";

void express;
let io: Server;
// Vercel detecta Express porque este archivo lo importa y lo exporta por defecto.
const app: Express = await createApplication(() => io?.emit("invoice-created"));

export default app;

// Socket.IO solo se inicia en desarrollo local. Vercel ejecuta la aplicación
// exportada como una Function y no debe abrir un puerto propio.
if (!env.isVercel) {
  const http = createServer(app);
  io = new Server(http, { cors: { origin: env.clientOrigin } });
  http.listen(env.port, () =>
    console.log(`API disponible en http://localhost:${env.port}`),
  );
}
