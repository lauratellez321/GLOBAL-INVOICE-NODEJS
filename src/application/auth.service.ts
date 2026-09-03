import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { Role, UserRepository } from "../domain/invoice/invoice.types.js";
export class AuthService {
  constructor(
    private readonly users: UserRepository,
    private readonly jwtSecret: string,
  ) {}
  async login(email: string, password: string) {
    const user = await this.users.find(email);
    if (!user || !(await bcrypt.compare(password, user.passwordHash)))
      return undefined;
    return {
      token: jwt.sign({ id: user.id, role: user.role }, this.jwtSecret, {
        expiresIn: "8h",
      }),
      role: user.role,
    };
  }
  async register(email: string, password: string, role: Role) {
    await this.users.create({
      email,
      passwordHash: await bcrypt.hash(password, 12),
      role,
    });
  }
}
