import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./authenticate";
import { AuditLogService } from "../services/auditLog.service";

export type UserRole =
  | "ADMIN"
  | "DOCTOR"
  | "NURSE"
  | "PATIENT"
  | "CAREGIVER"
  | "CHW"
  | "PAYER";

export type Scope =
  | "user:read"
  | "user:write"
  | "patient:read"
  | "patient:write"
  | "signal:read"
  | "signal:write"
  | "memory:read"
  | "memory:write"
  | "referral:read"
  | "referral:write"
  | "admin:all";

/**
 * Role-to-Scope Mappings
 * Defines what each role can access
 */
export const ROLE_SCOPES: Record<UserRole, Scope[]> = {
  // Admin has full access
  ADMIN: ["admin:all"],

  // Clinical roles can read/write patient data
  DOCTOR: [
    "user:read",
    "patient:read",
    "patient:write",
    "signal:read",
    "signal:write",
    "memory:read",
    "referral:read",
    "referral:write",
  ],

  NURSE: [
    "user:read",
    "patient:read",
    "patient:write",
    "signal:read",
    "signal:write",
    "memory:read",
    "referral:read",
  ],

  // Community Health Workers have limited write access
  CHW: [
    "user:read",
    "patient:read",
    "signal:read",
    "signal:write", // CHW can record signals
    "memory:read",
    "referral:read",
  ],

  // Patients can only access their own data
  PATIENT: ["user:read", "signal:read", "memory:read", "referral:read"],

  // Caregivers have read-only access to patient data
  CAREGIVER: ["user:read", "patient:read", "signal:read", "memory:read"],

  // Payers have read-only access for analytics/reporting
  PAYER: ["patient:read", "signal:read", "referral:read"],
};

/**
 * Get scopes for a given role
 */
export function getScopesForRole(role: UserRole): Scope[] {
  return ROLE_SCOPES[role] || [];
}

/**
 * Check if a role has a specific scope
 */
export function hasScope(role: UserRole, requiredScope: Scope): boolean {
  const scopes = getScopesForRole(role);

  // Admin has all scopes
  if (scopes.includes("admin:all")) {
    return true;
  }

  return scopes.includes(requiredScope);
}

/**
 * Middleware: Require user to have specific role
 * Usage: router.get('/admin', requireRole('ADMIN'), handler)
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;
    const userRole = authReq.user?.role as UserRole;

    if (!userRole) {
      return res.status(401).json({ error: "Unauthorized - No role found" });
    }

    if (!allowedRoles.includes(userRole)) {
      // Log failed role check
      await AuditLogService.logScopeFailure(
        authReq.user!.id,
        req,
        `role:${allowedRoles.join(",")}`
      );

      return res.status(403).json({
        error: "Forbidden - Insufficient role",
        required: allowedRoles,
        current: userRole,
      });
    }

    next();
  };
}

/**
 * Middleware: Require user to have specific scope
 * Usage: router.post('/signals', requireScope('signal:write'), handler)
 */
export function requireScope(requiredScope: Scope) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;
    const userRole = authReq.user?.role as UserRole;

    if (!userRole) {
      return res.status(401).json({ error: "Unauthorized - No role found" });
    }

    if (!hasScope(userRole, requiredScope)) {
      // Log failed scope check to audit log
      await AuditLogService.logScopeFailure(
        authReq.user!.id,
        req,
        requiredScope
      );

      return res.status(403).json({
        error: "Forbidden - Insufficient permissions",
        required: requiredScope,
        userRole,
      });
    }

    // Log successful scope check (optional - can be noisy)
    // await AuditLogService.logScopeSuccess(authReq.user!.id, req, requiredScope);

    next();
  };
}

/**
 * Middleware: Require multiple scopes (user must have ALL)
 * Usage: router.post('/admin/signals', requireScopes(['signal:write', 'admin:all']), handler)
 */
export function requireScopes(requiredScopes: Scope[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;
    const userRole = authReq.user?.role as UserRole;

    if (!userRole) {
      return res.status(401).json({ error: "Unauthorized - No role found" });
    }

    // Check if user has ALL required scopes
    const missingScopes = requiredScopes.filter(
      (scope) => !hasScope(userRole, scope)
    );

    if (missingScopes.length > 0) {
      // Log failed scope check
      await AuditLogService.logScopeFailure(
        authReq.user!.id,
        req,
        missingScopes.join(", ")
      );

      return res.status(403).json({
        error: "Forbidden - Missing required scopes",
        missing: missingScopes,
        userRole,
      });
    }

    next();
  };
}

/**
 * Middleware: Require at least one of the specified scopes
 * Usage: router.get('/data', requireAnyScope(['patient:read', 'signal:read']), handler)
 */
export function requireAnyScope(acceptedScopes: Scope[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;
    const userRole = authReq.user?.role as UserRole;

    if (!userRole) {
      return res.status(401).json({ error: "Unauthorized - No role found" });
    }

    // Check if user has ANY of the accepted scopes
    const hasAnyScope = acceptedScopes.some((scope) =>
      hasScope(userRole, scope)
    );

    if (!hasAnyScope) {
      // Log failed scope check
      await AuditLogService.logScopeFailure(
        authReq.user!.id,
        req,
        `any of: ${acceptedScopes.join(", ")}`
      );

      return res.status(403).json({
        error: "Forbidden - No matching permissions",
        accepted: acceptedScopes,
        userRole,
      });
    }

    next();
  };
}
