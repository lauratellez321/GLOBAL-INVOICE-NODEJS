import { createServer } from "node:http";
import { Server } from "socket.io";
import { env } from "./config/env.js";
import { createApplication } from "./application.js";
let io: Server;
const app = await createApplication(() => io.emit("invoice-created"));
const http = createServer(app);
io = new Server(http, { cors: { origin: env.clientOrigin } });
http.listen(env.port);
