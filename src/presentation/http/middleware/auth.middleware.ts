import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import type { Role } from "../../../domain/invoice/invoice.types.js";
declare global {
  namespace Express {
    interface Request {
      user?: { id: number; role: Role };
    }
  }
}
export const authenticate =
  (secret: string): RequestHandler =>
  (req, res, next) => {
    const token = req.header("authorization")?.replace(/^Bearer\s+/, "");
    try {
      req.user = jwt.verify(token!, secret) as { id: number; role: Role };
      next();
    } catch {
      res.status(401).json({ message: "Token inválido o ausente" });
    }
  };
export const allow =
  (...roles: Role[]): RequestHandler =>
  (req, res, next) =>
    roles.includes(req.user!.role)
      ? next()
      : res.status(403).json({ message: "No autorizado" });
