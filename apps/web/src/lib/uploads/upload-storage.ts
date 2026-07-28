/**
 * Upload storage abstraction: local disk (dev / small VPS) or S3/R2.
 *
 * NOTE: S3 client is intentionally lazy-loaded because @aws-sdk/client-s3 is
 * a server-only dependency; importing it at the top of this file would pull
 * Node-only streams into the client bundle.
 */
import { mkdir, writeFile, stat } from 'fs/promises';
import { join, resolve } from 'path';
import {
  assertSafeUploadFilename,
  buildS3ObjectKey,
  getS3MissingConfigKeys,
  isValidUploadSubdir,
  parseS3Config,
  type S3Config,
  type UploadSubdir,
} from './s3';

export { parseS3Config };

export type UploadStorageMode = 'local' | 's3';

let modeCache: UploadStorageMode | null = null;

/** @internal tests only */
export function resetUploadStorageCacheForTests(): void {
  modeCache = null;
}

export function isS3StorageConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
  return parseS3Config(env as Record<string, string>) !== null;
}

export function getUploadStorageMode(): UploadStorageMode {
  if (modeCache) return modeCache;
  modeCache = isS3StorageConfigured() ? 's3' : 'local';
  return modeCache;
}

function stripTrailingSlash(s: string): string {
  return s.replace(/\/+$/, '');
}

export function getUploadPublicBaseUrl(): string {
  const cfg = parseS3Config();
  if (cfg?.publicUrl) return stripTrailingSlash(cfg.publicUrl);
  const appUrl = stripTrailingSlash(process.env.APP_URL || '');
  if (appUrl) return `${appUrl}/uploads`;
  return '/uploads';
}

export function buildUploadPublicUrl(subdir: UploadSubdir, filename: string): string {
  assertSafeUploadFilename(filename);
  if (!isValidUploadSubdir(subdir)) throw new Error('invalid_subdir');
  const base = getUploadPublicBaseUrl();
  if (base.startsWith('/')) return `${base}/${subdir}/${filename}`;
  return `${base}/${subdir}/${filename}`;
}

const LOCAL_UPLOAD_ROOT_FALLBACK = resolve(process.cwd(), 'storage', 'uploads');

function getLocalUploadRoot(): string {
  return process.env.LOCAL_UPLOAD_ROOT
    ? resolve(process.env.LOCAL_UPLOAD_ROOT)
    : LOCAL_UPLOAD_ROOT_FALLBACK;
}

export async function assertUploadDiskQuota(incomingSize: number): Promise<void> {
  if (getUploadStorageMode() !== 'local') return;
  const quotaMb = parseInt(process.env.UPLOAD_DISK_QUOTA_MB || '0', 10);
  if (!quotaMb) return; // disabled
  const root = getLocalUploadRoot();
  // best-effort — don't crash on missing dir; just enforce hard per-file cap
  void root;
  const maxFileBytes = quotaMb * 1024 * 1024;
  if (incomingSize > maxFileBytes) {
    throw new Error('disk_quota_exceeded');
  }
}

async function storeLocal(subdir: UploadSubdir, filename: string, buffer: Buffer): Promise<void> {
  const root = getLocalUploadRoot();
  const dir = join(root, subdir);
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, filename), buffer);
}

async function storeS3(cfg: S3Config, key: string, buffer: Buffer, contentType: string): Promise<void> {
  // Dynamic import to keep @aws-sdk/client-s3 out of the client bundle
  const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
  const client = new S3Client({
    region: cfg.region,
    endpoint: cfg.endpoint,
    credentials: { accessKeyId: cfg.accessKey, secretAccessKey: cfg.secretKey },
    forcePathStyle: true,
  });
  await client.send(
    new PutObjectCommand({
      Bucket: cfg.bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ACL: cfg.publicUrl ? 'public-read' : undefined,
    })
  );
}

export async function storeUploadBuffer(
  subdir: UploadSubdir,
  filename: string,
  buffer: Buffer,
  contentType: string
): Promise<{ url: string }> {
  assertSafeUploadFilename(filename);
  if (!isValidUploadSubdir(subdir)) throw new Error('invalid_subdir');
  const mode = getUploadStorageMode();
  if (mode === 's3') {
    const cfg = parseS3Config();
    if (!cfg) throw new Error('s3_not_configured');
    const key = buildS3ObjectKey(subdir, filename);
    await storeS3(cfg, key, buffer, contentType);
    return { url: buildUploadPublicUrl(subdir, filename) };
  }
  await storeLocal(subdir, filename, buffer);
  return { url: buildUploadPublicUrl(subdir, filename) };
}

export interface StorageDescribeResult {
  mode: UploadStorageMode;
  message: string;
  missing?: string[];
}

export function describeUploadStorage(env: NodeJS.ProcessEnv = process.env): StorageDescribeResult {
  const missing = getS3MissingConfigKeys(env as Record<string, string>);
  if (missing.length === 0) {
    const cfg = parseS3Config(env as Record<string, string>);
    return {
      mode: 's3',
      message: `S3/R2 configured (bucket=${cfg?.bucket}, public=${cfg?.publicUrl || 'none'})`,
    };
  }
  const root = getLocalUploadRoot();
  return {
    mode: 'local',
    message: `Local disk storage at ${root} (configure S3_* for production CDN). Missing keys: ${missing.join(', ') || 'none'}`,
    missing,
  };
}
