/**
 * Client-side helpers for uploading files to our /api/upload endpoints.
 * These run in the browser only.
 */

export interface UploadResult {
  success: boolean;
  url?: string;
  filename?: string;
  size?: number;
  mime?: string;
  error?: string;
  message?: string;
}

async function getUploadToken(invitationId?: string | null): Promise<string> {
  const url = invitationId
    ? `/api/upload/token?invitationId=${encodeURIComponent(invitationId)}`
    : '/api/upload/token';
  const res = await fetch(url, { credentials: 'same-origin' });
  if (!res.ok) throw new Error('upload_token_failed');
  const data = await res.json();
  return data.token;
}

async function uploadFile(
  endpoint: '/api/upload/image' | '/api/upload/music',
  file: File,
  invitationId?: string | null
): Promise<UploadResult> {
  const token = await getUploadToken(invitationId);
  const fd = new FormData();
  fd.append('file', file);
  if (invitationId) fd.append('invitationId', invitationId);
  fd.append('uploadToken', token);
  const res = await fetch(endpoint, { method: 'POST', body: fd, credentials: 'same-origin' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { success: false, error: data.error || 'upload_failed', message: data.message };
  }
  return {
    success: true,
    url: data.url,
    filename: data.filename,
    size: data.size,
    mime: data.mime,
  };
}

export function uploadImageFile(file: File, invitationId?: string | null) {
  return uploadFile('/api/upload/image', file, invitationId);
}

export function uploadMusicFile(file: File, invitationId?: string | null) {
  return uploadFile('/api/upload/music', file, invitationId);
}
