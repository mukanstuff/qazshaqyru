/**
 * Image upload endpoint for invitation backgrounds and photos.
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
import { detectImageType, processImageBuffer, ImageProcessingError } from '@/lib/uploads/upload-validation';
import {
  assertUploadDiskQuota,
  buildUploadPublicUrl,
  storeUploadBuffer,
} from '@/lib/uploads/upload-storage';
import { registerUpload } from '@/lib/uploads/upload-registry';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

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
      invitationId ? `upload:image:${invitationId}` : 'upload:image:anon',
      invitationId ? RATE_LIMITS.GUEST_UPLOAD : RATE_LIMITS.ANON_UPLOAD
    );
    if (!rate.allowed) return rateLimitResponse(rate);

    if (!file) {
      return NextResponse.json({ error: 'no_file', message: 'Файл не выбран' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'file_too_large', message: 'Файл должен быть менее 10 МБ' },
        { status: 400 }
      );
    }

    await assertUploadDiskQuota(file.size);

    const bytes = await file.arrayBuffer();
    let buffer = Buffer.from(bytes);
    const detected = detectImageType(buffer);

    if (!detected) {
      return NextResponse.json(
        { error: 'invalid_type', message: 'Допускаются только JPG, PNG, WEBP, GIF' },
        { status: 400 }
      );
    }

    try {
      buffer = Buffer.from(await processImageBuffer(buffer, detected.mime));
    } catch (err) {
      if (err instanceof ImageProcessingError) {
        return NextResponse.json({ error: err.code, message: err.message }, { status: 400 });
      }
      throw err;
    }

    const filename = `${randomUUID()}.${detected.ext}`;
    await storeUploadBuffer('invitations', filename, buffer, detected.mime);

    const publicUrl = buildUploadPublicUrl('invitations', filename);
    const session = await getCurrentSession();

    await registerUpload({
      publicPath: publicUrl,
      kind: 'image',
      sizeBytes: buffer.length,
      invitationId,
      userId: session?.user.id ?? null,
    });

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename,
      size: buffer.length,
      mime: detected.mime,
    });
  } catch (err) {
    return apiErrorResponse(err as Error, 'Upload image');
  }
}
