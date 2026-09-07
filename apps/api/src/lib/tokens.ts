import { createHash } from "node:crypto";
import { nanoid } from "nanoid";

export function generateDeviceToken(): string {
  return nanoid(32);
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function generateInviteCode(): string {
  // 6 uppercase alphanumeric characters -- short enough to read aloud/type on a phone.
  return nanoid(6).toUpperCase();
}
