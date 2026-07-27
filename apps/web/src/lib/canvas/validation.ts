/**
 * Helpers to safely parse/unparse a CanvasDocument from untrusted JSON
 * (request bodies, DB rows).
 */
import { ZodError } from 'zod';
import { canvasDocumentSchema } from './schemas';
import type { InvitationCanvasDocument } from './types';
import { createEmptyDocument } from './mutations';

export interface ValidationResult {
  ok: boolean;
  document?: InvitationCanvasDocument;
  error?: string;
  issues?: ZodError['issues'];
}

export function validateCanvasDocument(input: unknown): ValidationResult {
  const parsed = canvasDocumentSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: 'invalid_canvas_document',
      issues: parsed.error.issues,
    };
  }
  return { ok: true, document: parsed.data as unknown as InvitationCanvasDocument };
}

/**
 * Parse a canvas document from raw DB JSON. If null/invalid, returns a new
 * empty document — useful for new invitations where `canvas` column is null.
 */
export function parseCanvasOrEmpty(raw: unknown, width = 390): InvitationCanvasDocument {
  if (!raw || typeof raw !== 'object') return createEmptyDocument(width);
  const result = validateCanvasDocument(raw);
  return result.ok && result.document ? result.document : createEmptyDocument(width);
}

/**
 * Sanitize user-supplied strings (text content) to strip anything that
 * could be interpreted as a script or HTML event handler.
 */
export function sanitizeText(input: string): string {
  return input
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/on\w+\s*=\s*"[^"]*"/gi, '')
    .replace(/on\w+\s*=\s*'[^']*'/gi, '');
}
