import crypto from 'crypto';

/**
 * Generate a cryptographically secure random key.
 */
export function generateSecureKey(prefix: string = 'sk_os_'): string {
  return prefix + crypto.randomBytes(32).toString('hex');
}

/**
 * Hash a string using SHA-256.
 */
export function hashKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}
