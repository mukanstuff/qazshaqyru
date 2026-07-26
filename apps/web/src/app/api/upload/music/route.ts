/**
 * Audio/Music upload endpoint for invitations.
 */

import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import {
  apiErrorResponse,
  applyRateLimit,
  checkSameOrigin,
  getCurrentSession,
  rateLimitResponse,
  RATE_LIMITS,
  requireUploadAccess,
} from '@/lib/shared/api';
import { detectAudioType } from '@/lib/uploads/upload-validation';
import {
  assertUploadDiskQuota,
  buildUploadPublicUrl,
  storeUploadBuffer,
} from '@/lib/uploads/upload-storage';
import { registerUpload } from '@/lib/uploads/upload-registry';

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

export async function POST(request: NextRequest) {
  try {
    if (!checkSameOrigin(request)) {
      return NextResponse.json({ error: 'forbidden', message: 'Неверный origin' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const invitationId = (formData.get('invitationId') as string | null)?.trim() || null;

    await requireUploadAccess(request, invitationId);

    const rate = await applyRateLimit(
      request,
      invitationId ? `upload:music:${invitationId}` : 'upload:music:anon',
      invitationId ? RATE_LIMITS.GUEST_UPLOAD : RATE_LIMITS.ANON_UPLOAD
    );
    if (!rate.allowed) return rateLimitResponse(rate);

    if (!file) {
      return NextResponse.json({ error: 'no_file', message: 'Файл не выбран' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'file_too_large', message: 'Файл должен быть менее 20 МБ' },
        { status: 400 }
      );
    }

    await assertUploadDiskQuota(file.size);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const detected = detectAudioType(buffer);

    if (!detected) {
      return NextResponse.json(
        { error: 'invalid_type', message: 'Допускаются только MP3, WAV, OGG, M4A, WEBM' },
        { status: 400 }
      );
    }

    const filename = `${randomUUID()}.${detected.ext}`;
    await storeUploadBuffer('music', filename, buffer, detected.mime);

    const publicUrl = buildUploadPublicUrl('music', filename);
    const session = await getCurrentSession();

    await registerUpload({
      publicPath: publicUrl,
      kind: 'music',
      sizeBytes: buffer.length,
      invitationId,
      userId: session?.user.id ?? null,
    });

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename,
      size: file.size,
      mime: detected.mime,
    });
  } catch (err) {
    return apiErrorResponse(err as Error, 'Upload music');
  }
}
