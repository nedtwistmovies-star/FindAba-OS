import crypto from 'crypto';

// src/utils/secureCompare.ts
// Timing-safe constant-time comparison to avoid leaking signature verification timing
export function secureCompare(a: string | Buffer, b: string | Buffer) {
  const bufA = Buffer.isBuffer(a) ? a : Buffer.from(String(a));
  const bufB = Buffer.isBuffer(b) ? b : Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  try {
    return crypto.timingSafeEqual(bufA, bufB);
  } catch (e) {
    return false;
  }
}
