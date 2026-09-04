/**
 * Shared review settings.
 *
 * Lives outside the route file because a Next.js route segment may only export
 * its handlers and a fixed set of config keys — an extra named export there is
 * a build error, not a style preference.
 */

/**
 * Below this the landing's review section renders nothing at all.
 *
 * Three is the smallest count that reads as a sample rather than as one
 * enthusiastic relative, and a proof block built from a single review does more
 * harm than an absent one.
 */
export const MIN_REVIEWS_TO_SHOW = 3;
