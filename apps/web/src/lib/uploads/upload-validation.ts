/**
 * Server-side upload validation: detect image/audio type from magic bytes,
 * optionally process images (resize/re-encode) using sharp.
 *
 * Image processing is best-effort: if sharp is unavailable or fails with an
 * `ImageProcessingError` we return a structured error so the route can respond
 * with 400 instead of 500.
 */

export class ImageProcessingError extends Error {
  constructor(public code: string, message: string) {
    super(message);
    this.name = 'ImageProcessingError';
  }
}

const MAGIC: { bytes: number[]; mask?: number[]; ext: string; mime: string }[] = [
  { bytes: [0xff, 0xd8, 0xff], ext: 'jpg', mime: 'image/jpeg' },
  { bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], ext: 'png', mime: 'image/png' },
  { bytes: [0x47, 0x49, 0x46, 0x38], ext: 'gif', mime: 'image/gif' },
  { bytes: [0x52, 0x49, 0x46, 0x46], ext: 'webp', mime: 'image/webp' }, // RIFF…WEBP
];

const AUDIO_MAGIC: { bytes: number[]; ext: string; mime: string }[] = [
  // ID3 / MP3 frame sync
  { bytes: [0x49, 0x44, 0x33], ext: 'mp3', mime: 'audio/mpeg' },
  { bytes: [0xff, 0xfb], ext: 'mp3', mime: 'audio/mpeg' },
  // OGG
  { bytes: [0x4f, 0x67, 0x67, 0x53], ext: 'ogg', mime: 'audio/ogg' },
  // WAV: RIFF....WAVE
  { bytes: [0x52, 0x49, 0x46, 0x46], ext: 'wav', mime: 'audio/wav' },
  // M4A ftyp box (offset 4)
];

export interface DetectedMedia {
  ext: string;
  mime: string;
}

export function detectImageType(buffer: Buffer): DetectedMedia | null {
  if (!buffer || buffer.length < 4) return null;
  if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46) {
    if (buffer.length >= 12 && buffer.toString('ascii', 8, 12) === 'WEBP') {
      return { ext: 'webp', mime: 'image/webp' };
    }
  }
  for (const m of MAGIC) {
    if (m.ext === 'webp') continue; // handled above
    let ok = true;
    for (let i = 0; i < m.bytes.length; i++) {
      if (buffer[i] !== m.bytes[i]) {
        ok = false;
        break;
      }
    }
    if (ok) return { ext: m.ext, mime: m.mime };
  }
  return null;
}

export function detectAudioType(buffer: Buffer): DetectedMedia | null {
  if (!buffer || buffer.length < 4) return null;
  if (buffer[0] === 0x49 && buffer[1] === 0x44 && buffer[2] === 0x33) {
    return { ext: 'mp3', mime: 'audio/mpeg' };
  }
  if (buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0) {
    return { ext: 'mp3', mime: 'audio/mpeg' };
  }
  if (buffer[0] === 0x4f && buffer[1] === 0x67 && buffer[2] === 0x67 && buffer[3] === 0x53) {
    return { ext: 'ogg', mime: 'audio/ogg' };
  }
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer.length >= 12 &&
    buffer.toString('ascii', 8, 12) === 'WAVE'
  ) {
    return { ext: 'wav', mime: 'audio/wav' };
  }
  return null;
}

const MAX_DIM = 2560;
const JPEG_QUALITY = 85;

/**
 * Re-encodes the image to a web-friendly format and caps dimensions.
 * Falls back to the original buffer if sharp throws.
 */
export async function processImageBuffer(buffer: Buffer, mime: string): Promise<Buffer> {
  try {
    const sharp = (await import('sharp')).default;
    const pipeline = sharp(buffer, { failOn: 'none' }).rotate();
    const meta = await pipeline.metadata();
    const w = meta.width || 0;
    const h = meta.height || 0;
    if (w > MAX_DIM || h > MAX_DIM) {
      pipeline.resize({ width: MAX_DIM, height: MAX_DIM, fit: 'inside', withoutEnlargement: true });
    }
    if (mime === 'image/jpeg') {
      return pipeline.jpeg({ quality: JPEG_QUALITY, mozjpeg: true }).toBuffer();
    }
    if (mime === 'image/png') {
      return pipeline.png({ compressionLevel: 8 }).toBuffer();
    }
    if (mime === 'image/webp') {
      return pipeline.webp({ quality: JPEG_QUALITY }).toBuffer();
    }
    return pipeline.toBuffer();
  } catch (err) {
    throw new ImageProcessingError('process_failed', (err as Error).message);
  }
}
