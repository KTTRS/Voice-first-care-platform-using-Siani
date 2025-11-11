import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import prisma from "../utils/db";
import { authenticate, AuthenticatedRequest } from "../middleware/authenticate";
import { AuditLogService } from "../services/auditLog.service";
import { getScopesForRole, UserRole } from "../middleware/rbac";

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z
    .enum(["ADMIN", "DOCTOR", "NURSE", "PATIENT", "CAREGIVER", "CHW", "PAYER"])
    .optional(),
  phone: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

router.post("/register", async (req: Request, res: Response) => {
  try {
    const data = registerSchema.parse(req.body);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        role: (data.role || "PATIENT") as any, // Cast to avoid TypeScript error before migration
        phone: data.phone,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      },
    });

    // Log successful registration
    await AuditLogService.logRegister(user.id, req);

    // Generate JWT with role-based scopes
    const scopes = getScopesForRole(user.role as UserRole);
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        scopes, // Include scopes in JWT payload
      },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" } as jwt.SignOptions
    );

    res.status(201).json({ user, token });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: "Registration failed" });
  }
});

router.post("/login", async (req: Request, res: Response) => {
  try {
    const data = loginSchema.parse(req.body);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      await AuditLogService.logFailedLogin(data.email, req, "User not found");
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Verify password
    const validPassword = await bcrypt.compare(data.password, user.password);
    if (!validPassword) {
      await AuditLogService.logFailedLogin(data.email, req, "Invalid password");
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Log successful login
    await AuditLogService.logLogin(user.id, req);

    // Generate JWT with role-based scopes
    const scopes = getScopesForRole(user.role as UserRole);
    const accessToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        scopes, // Include scopes in JWT payload
      },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" } as jwt.SignOptions
    );

    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      accessToken,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: "Login failed" });
  }
});

/**
 * GET /auth/me - Get current user context
 * Returns user info with role and permissions
 */
router.get("/me", authenticate, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        phone: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Get scopes for user's role
    const scopes = getScopesForRole(user.role as UserRole);

    res.json({
      user: {
        ...user,
        scopes, // Include scopes in response
      },
    });
  } catch (error) {
    console.error("❌ /auth/me error:", error);
    res.status(500).json({ error: "Failed to fetch user context" });
  }
});

/**
 * POST /auth/logout - Logout user
 * Logs logout event to audit trail
 */
router.post("/logout", authenticate, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Log logout event
    await AuditLogService.logLogout(userId, req);

    res.json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    console.error("❌ /auth/logout error:", error);
    res.status(500).json({ error: "Logout failed" });
  }
});

/**
 * GET /auth/roles - List available roles
 * Returns all roles with descriptions
 */
router.get("/roles", async (_req: Request, res: Response) => {
  const roles = [
    {
      value: "PATIENT",
      label: "Patient",
      description: "End user receiving care",
    },
    {
      value: "CHW",
      label: "Community Health Worker",
      description: "Field worker supporting patients",
    },
    {
      value: "NURSE",
      label: "Nurse",
      description: "Clinical care provider",
    },
    {
      value: "DOCTOR",
      label: "Doctor",
      description: "Primary care physician",
    },
    {
      value: "CAREGIVER",
      label: "Caregiver",
      description: "Family member or support person",
    },
    {
      value: "PAYER",
      label: "Payer Organization",
      description: "Insurance or healthcare payer",
    },
    {
      value: "ADMIN",
      label: "Administrator",
      description: "System administrator with full access",
    },
  ];

  res.json({ roles });
});

export { router as authRouter };
