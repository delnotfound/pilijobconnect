import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { db } from "./db.js";
import { users, userSessions, type User } from "@shared/schema";
import { eq } from "drizzle-orm";

const JWT_SECRET = process.env.JWT_SECRET || "pili-jobs-dev-secret-key-2025";
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface AuthenticatedRequest extends Request {
  user?: number; // User ID
  userObject?: User; // Full user object if needed
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(payload: any): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export async function createSession(userId: number): Promise<string> {
  const sessionId = generateToken({ userId, type: "session" });
  const expiresAt = new Date(Date.now() + SESSION_DURATION);

  await db.insert(userSessions).values({
    id: sessionId,
    userId,
    expiresAt,
  });

  return sessionId;
}

export async function validateSession(sessionId: string): Promise<User | null> {
  try {
    const [session] = await db
      .select()
      .from(userSessions)
      .where(eq(userSessions.id, sessionId));

    if (!session || session.expiresAt < new Date()) {
      if (session) {
        await getDb()
          .delete(userSessions)
          .where(eq(userSessions.id, sessionId));
      }
      return null;
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, session.userId));

    return user || null;
  } catch (error) {
    return null;
  }
}

export async function destroySession(sessionId: string): Promise<void> {
  await db.delete(userSessions).where(eq(userSessions.id, sessionId));
}

export const requireAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const sessionToken = req.cookies?.session;

  if (!sessionToken) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const userObject = await validateSession(sessionToken);
  if (!userObject) {
    return res.status(401).json({ message: "Invalid or expired session" });
  }

  req.user = userObject.id;
  req.userObject = userObject;
  next();
};

export function requireRole(roles: string[]) {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    await requireAuth(req, res, () => {
      if (!req.userObject) {
        return res.status(401).json({ message: "Authentication required" });
      }

      if (!roles.includes(req.userObject.role)) {
        return res.status(403).json({
          message: "Insufficient permissions",
          required: roles,
          current: req.userObject.role,
        });
      }

      next();
    });
  };
}

export const requireJobSeeker = requireRole(["job_seeker"]);
export const requireEmployer = requireRole(["employer", "admin"]);
export const requireAdmin = requireRole(["admin"]);

