/**
 * Auth constants that both the server and the browser need.
 *
 * Kept out of `lib/auth/index.ts` on purpose: that module imports bcryptjs and
 * node:crypto, so a client component importing a single number from it would
 * drag bcrypt into the browser bundle.
 */

/** Shortest password the sign-up form and the register route will accept. */
export const MIN_PASSWORD_LENGTH = 8;
