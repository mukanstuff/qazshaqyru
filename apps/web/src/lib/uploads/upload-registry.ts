/**
 * Upload registry — remember which public paths we have served, so cleanup
 * jobs can prune unreferenced files. Writes to `storage/.upload-registry.json`
 * in local mode; in S3 mode this is a lightweight DB record stub that falls
 * back to a no-op when no DB is in scope (the route is responsible for
 * persisting if needed).
 */
import { promises as fs } from 'fs';
import { join } from 'path';
import { isValidPublicObjectPath, parsePublicObjectPath } from './s3';

export interface UploadRecord {
  publicPath: string;
  kind: 'image' | 'music' | 'other';
  sizeBytes: number;
  invitationId: string | null;
  userId: string | null;
  createdAt?: string;
}

const REGISTRY_DIR = process.env.LOCAL_UPLOAD_ROOT
  ? process.env.LOCAL_UPLOAD_ROOT
  : join(process.cwd(), 'storage');
const REGISTRY_FILE = join(REGISTRY_DIR, '.upload-registry.json');

async function loadRegistry(): Promise<UploadRecord[]> {
  try {
    const raw = await fs.readFile(REGISTRY_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function saveRegistry(records: UploadRecord[]): Promise<void> {
  await fs.mkdir(REGISTRY_DIR, { recursive: true });
  await fs.writeFile(REGISTRY_FILE, JSON.stringify(records, null, 2));
}

export async function registerUpload(rec: UploadRecord): Promise<void> {
  if (!rec.publicPath || !isValidPublicObjectPath(rec.publicPath)) return;
  const records = await loadRegistry();
  // De-dupe
  if (!records.some((r) => r.publicPath === rec.publicPath)) {
    records.push({ ...rec, createdAt: rec.createdAt || new Date().toISOString() });
    await saveRegistry(records);
  }
}

export function loadRegistryProtectedPaths(): Set<string> {
  // Files referenced by current invitations are protected. Simplified stub:
  // the cleanup job in lib/shared/cleanup.ts will cross-reference DB records.
  return new Set<string>();
}

export async function pruneUploadRegistry(predicate: (rec: UploadRecord) => boolean): Promise<number> {
  const records = await loadRegistry();
  const kept = records.filter(predicate);
  await saveRegistry(kept);
  return records.length - kept.length;
}

export { parsePublicObjectPath };
