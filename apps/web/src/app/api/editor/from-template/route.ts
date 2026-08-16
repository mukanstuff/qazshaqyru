/**
 * POST /api/editor/from-template
 *
 * Creates a draft invitation for the given templateKey (or reuses an existing
 * one stored in the `editor:{templateKey}` cookie). Thin wrapper around
 * findOrCreateDraftForTemplate — see lib/editor/from-template.ts.
 */
import { NextRequest, NextResponse } from 'next/server';
import { findOrCreateDraftForTemplate } from '@/lib/editor/from-template';

export async function POST(request: NextRequest) {
  const { templateKey } = (await request.json().catch(() => ({}))) as { templateKey?: string };
  if (!templateKey) {
    return NextResponse.json({ error: 'templateKey required' }, { status: 400 });
  }

  const result = await findOrCreateDraftForTemplate(templateKey);
  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: result.error === 'unauthorized' ? 401 : 404 });
  }
  return NextResponse.json(result);
}
