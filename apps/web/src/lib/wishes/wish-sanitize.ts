const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const HTML_TAG = /<[^>]*>/g;
const MULTI_SPACE = /\s{2,}/g;

/** Strip HTML/control chars and normalize whitespace for guest-submitted wishes. */
export function sanitizeWishText(input: string): string {
  return input
    .replace(HTML_TAG, '')
    .replace(CONTROL_CHARS, '')
    .replace(/\r\n/g, '\n')
    .trim()
    .replace(MULTI_SPACE, ' ');
}

export function sanitizeWishAuthorName(input: string): string {
  return sanitizeWishText(input).slice(0, 100);
}
