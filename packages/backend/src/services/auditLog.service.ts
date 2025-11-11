import prisma from "../utils/db";
import { Request } from "express";

export interface AuditLogData {
  userId?: string;
  action: string;
  resource?: string;
  success: boolean;
  errorMessage?: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Audit Log Service
 * Tracks all authentication and authorization events for security and compliance
 */
export class AuditLogService {
  /**
   * Log authentication event (login, logout, register)
   */
  static async logAuthEvent(data: AuditLogData): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          userId: data.userId,
          action: data.action,
          resource: data.resource,
          success: data.success,
          errorMessage: data.errorMessage,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
        },
      });
    } catch (error) {
      // Don't throw - audit logging should never break the app
      console.error("❌ Failed to write audit log:", error);
    }
  }

  /**
   * Log successful login
   */
  static async logLogin(
    userId: string,
    req: Request,
    success: boolean = true
  ): Promise<void> {
    await this.logAuthEvent({
      userId,
      action: "LOGIN",
      success,
      ipAddress: this.getIpAddress(req),
      userAgent: req.get("user-agent"),
    });
  }

  /**
   * Log failed login attempt
   */
  static async logFailedLogin(
    email: string,
    req: Request,
    reason: string
  ): Promise<void> {
    await this.logAuthEvent({
      action: "LOGIN_FAILED",
      resource: email, // Store email in resource field for failed login
      success: false,
      errorMessage: reason,
      ipAddress: this.getIpAddress(req),
      userAgent: req.get("user-agent"),
    });
  }

  /**
   * Log user registration
   */
  static async logRegister(userId: string, req: Request): Promise<void> {
    await this.logAuthEvent({
      userId,
      action: "REGISTER",
      success: true,
      ipAddress: this.getIpAddress(req),
      userAgent: req.get("user-agent"),
    });
  }

  /**
   * Log logout
   */
  static async logLogout(userId: string, req: Request): Promise<void> {
    await this.logAuthEvent({
      userId,
      action: "LOGOUT",
      success: true,
      ipAddress: this.getIpAddress(req),
      userAgent: req.get("user-agent"),
    });
  }

  /**
   * Log RBAC scope check failure (403 response)
   */
  static async logScopeFailure(
    userId: string,
    req: Request,
    requiredScope: string
  ): Promise<void> {
    await this.logAuthEvent({
      userId,
      action: "SCOPE_CHECK_FAILED",
      resource: `${req.method} ${req.path}`,
      success: false,
      errorMessage: `Missing required scope: ${requiredScope}`,
      ipAddress: this.getIpAddress(req),
      userAgent: req.get("user-agent"),
    });
  }

  /**
   * Log successful scope check
   */
  static async logScopeSuccess(
    userId: string,
    req: Request,
    scope: string
  ): Promise<void> {
    await this.logAuthEvent({
      userId,
      action: "SCOPE_CHECK_SUCCESS",
      resource: `${req.method} ${req.path}`,
      success: true,
      errorMessage: `Granted scope: ${scope}`,
      ipAddress: this.getIpAddress(req),
      userAgent: req.get("user-agent"),
    });
  }

  /**
   * Log token refresh
   */
  static async logTokenRefresh(userId: string, req: Request): Promise<void> {
    await this.logAuthEvent({
      userId,
      action: "TOKEN_REFRESH",
      success: true,
      ipAddress: this.getIpAddress(req),
      userAgent: req.get("user-agent"),
    });
  }

  /**
   * Extract IP address from request
   * Handles reverse proxies (x-forwarded-for)
   */
  private static getIpAddress(req: Request): string {
    const forwarded = req.get("x-forwarded-for");
    if (forwarded) {
      return forwarded.split(",")[0].trim();
    }
    return req.ip || req.socket.remoteAddress || "unknown";
  }

  /**
   * Get recent audit logs for a user
   */
  static async getUserAuditLogs(
    userId: string,
    limit: number = 50
  ): Promise<any[]> {
    return prisma.auditLog.findMany({
      where: { userId },
      orderBy: { timestamp: "desc" },
      take: limit,
    });
  }

  /**
   * Get all failed login attempts
   */
  static async getFailedLogins(limit: number = 100): Promise<any[]> {
    return prisma.auditLog.findMany({
      where: {
        action: "LOGIN_FAILED",
        success: false,
      },
      orderBy: { timestamp: "desc" },
      take: limit,
    });
  }

  /**
   * Get all scope failures for security monitoring
   */
  static async getScopeFailures(limit: number = 100): Promise<any[]> {
    return prisma.auditLog.findMany({
      where: {
        action: "SCOPE_CHECK_FAILED",
        success: false,
      },
      orderBy: { timestamp: "desc" },
      take: limit,
    });
  }
}
