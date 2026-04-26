/**
 * One canonical email form for one-account-per-email lookups.
 * Use at every store/lookup boundary so case + whitespace can't create duplicates.
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
