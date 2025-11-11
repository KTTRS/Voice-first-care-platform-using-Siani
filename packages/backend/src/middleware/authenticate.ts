import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { Scope } from "./rbac";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email?: string;
    role?: string;
    scopes?: Scope[]; // Add scopes to user object
  };
}

/**
 * JWT Authentication Middleware
 * Verifies Bearer token and attaches user info to request
 */
export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized - No token provided" });
  }

  const token = header.split(" ")[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
      email?: string;
      role?: string;
      scopes?: Scope[];
    };

    // Attach user info to request (including scopes)
    (req as any).user = {
      id: payload.userId,
      email: payload.email,
      role: payload.role,
      scopes: payload.scopes || [],
    };

    next();
  } catch (error) {
    return res.status(403).json({ error: "Invalid or expired token" });
  }
};
