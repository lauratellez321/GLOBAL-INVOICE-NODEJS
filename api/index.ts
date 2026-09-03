import { createApplication } from "../src/application.js";

// Vercel ejecuta este módulo como una Function; no se debe llamar listen().
const app = await createApplication();

export default app;
