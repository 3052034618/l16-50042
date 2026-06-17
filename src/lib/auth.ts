import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-change-me-please-32";
const TOKEN_NAME = "blog_admin_token";
const TOKEN_EXPIRES_IN = "7d";

export interface JwtPayload {
  userId: string;
  email: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRES_IN });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

export function setAuthCookie(token: string) {
  cookies().set(TOKEN_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });
}

export function clearAuthCookie() {
  cookies().delete(TOKEN_NAME);
}

export function getTokenFromCookie(): string | undefined {
  return cookies().get(TOKEN_NAME)?.value;
}

export async function getCurrentUser() {
  const token = getTokenFromCookie();
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  const { prisma } = await import("@/lib/prisma");
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      email: true,
      nickname: true,
    },
  });

  return user;
}

export function generateFingerprint(ip: string, userAgent: string): string {
  const crypto = require("crypto");
  return crypto
    .createHash("sha256")
    .update(`${ip}|${userAgent}`)
    .digest("hex")
    .substring(0, 32);
}
