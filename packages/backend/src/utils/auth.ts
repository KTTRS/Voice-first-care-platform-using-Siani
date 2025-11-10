import { NextFunction, Request, Response } from "express";

const TEST_TOKEN = "test-token";

export function authenticate(req: any, res: Response, next: NextFunction) {
  console.log("🔐 Auth middleware called for:", req.method, req.path);
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    console.log("❌ Auth failed: missing/invalid header");
    return res
      .status(401)
      .json({ error: "Missing or invalid authorization header" });
  }

  const token = header.substring("Bearer ".length);
  if (token !== TEST_TOKEN) {
    console.log("❌ Auth failed: invalid token");
    return res.status(401).json({ error: "Invalid token" });
  }

  // Set a test user for development
  req.user = {
    id: "6916d6e8-a69d-4501-b703-d278c6d62947", // John Doe from seed data
    email: "john.doe@example.com",
    role: "PATIENT",
  };

  console.log("✅ Auth passed");
  return next();
}
