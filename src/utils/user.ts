// ============================================================
// Studio OS — User Utilities
// ============================================================

import type { User } from 'firebase/auth';

/**
 * Returns the user's display name. If none is set, attempts to derive
 * a name from the email address before the @ symbol.
 */
export function getDisplayName(user?: User | null): string {
  if (!user) return 'Guest';
  if (user.displayName) return user.displayName;
  if (user.email) {
    const parts = user.email.split('@');
    if (parts.length > 0) {
      // Capitalize first letter of email prefix
      const prefix = parts[0];
      return prefix.charAt(0).toUpperCase() + prefix.slice(1);
    }
  }
  return 'User';
}

/**
 * Generates initials based on a name or email address.
 */
export function getInitials(name?: string | null, email?: string | null): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    if (parts.length === 1 && parts[0].length > 1) {
      return (parts[0][0] + parts[0][1]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }
  if (email) return email.substring(0, 2).toUpperCase();
  return 'U';
}
