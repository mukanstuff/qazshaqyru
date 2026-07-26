/** Shared FAQ keys for landing accordion and /faq page. */
export const FAQ_KEYS = ['price', 'whatsapp', 'rsvp', 'payment', 'edit'] as const;
export type FaqKey = (typeof FAQ_KEYS)[number];
