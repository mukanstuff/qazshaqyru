/**
 * Stand-in thumbnail for a template that has no preview yet.
 *
 * Three places wrote `/assets/placeholder.jpg` — the admin's create form, the
 * create endpoint and the clone endpoint — and that file has never existed.
 * The one on disk is `placeholder.svg`, so every template made through the
 * admin was born pointing at a 404 and showed a broken image in the very list
 * the owner uses to manage templates. One constant, so the next rename cannot
 * split them again.
 */
export const PLACEHOLDER_PREVIEW = '/assets/placeholder.svg';
