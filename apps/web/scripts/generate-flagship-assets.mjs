#!/usr/bin/env node
/**
 * Generate flagship template assets via Gemini 2.5 Flash Image (free tier).
 * Usage: pnpm assets:flagship [--slug wedding-luxury] [--dry-run]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WEB_ROOT = path.resolve(__dirname, '..');
const MANIFEST_PATH = path.join(__dirname, 'flagship-asset-manifest.json');
const ASSETS_ROOT = path.join(WEB_ROOT, 'public', 'assets', 'templates');
const ENV_PATH = path.join(WEB_ROOT, '.env');

const MODEL = process.env.GEMINI_IMAGE_MODEL || 'gemini-3-pro-image-preview';
const API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

function loadEnv() {
  if (!fs.existsSync(ENV_PATH)) return {};
  const text = fs.readFileSync(ENV_PATH, 'utf8');
  const env = {};
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  }
  return env;
}

function parseArgs() {
  const args = process.argv.slice(2);
  let slug = null;
  let dryRun = false;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--slug' && args[i + 1]) slug = args[++i];
    if (args[i] === '--dry-run') dryRun = true;
  }
  return { slug, dryRun };
}

async function generateImage(apiKey, prompt) {
  const url = `${API_BASE}/models/${MODEL}:generateContent?key=${apiKey}`;
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseModalities: ['IMAGE'],
    },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || JSON.stringify(data));
  }

  const parts = data.candidates?.[0]?.content?.parts ?? [];
  for (const part of parts) {
    if (part.inlineData?.data) {
      return Buffer.from(part.inlineData.data, 'base64');
    }
  }
  throw new Error('No image data in response');
}

async function main() {
  const { slug: filterSlug, dryRun } = parseArgs();
  const env = loadEnv();
  const apiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY;

  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  const slugs = filterSlug ? [filterSlug] : Object.keys(manifest.templates);

  if (!apiKey) {
    console.error('GEMINI_API_KEY not found in apps/web/.env — skipping generation.');
    console.error('Existing assets in public/assets/templates/ will be used.');
    process.exit(0);
  }

  console.log(`Model: ${manifest.model || MODEL}`);
  console.log(`Flagships: ${slugs.join(', ')}`);
  if (dryRun) {
    console.log('Dry run — no API calls.');
    process.exit(0);
  }

  let generated = 0;
  let failed = 0;
  const failures = [];

  for (const slug of slugs) {
    const entry = manifest.templates[slug];
    if (!entry) {
      console.warn(`Unknown slug: ${slug}`);
      continue;
    }

    const outDir = path.join(ASSETS_ROOT, slug);
    fs.mkdirSync(outDir, { recursive: true });

    for (const asset of entry.assets) {
      const dest = path.join(outDir, asset.path);
      if (fs.existsSync(dest)) {
        console.log(`  skip (exists): ${slug}/${asset.path}`);
        continue;
      }

      fs.mkdirSync(path.dirname(dest), { recursive: true });
      const prompt = `${asset.prompt}. Kazakhstan wedding invitation context. High quality, not generic stock photo.`;

      try {
        console.log(`  generating: ${slug}/${asset.path}...`);
        const buffer = await generateImage(apiKey, prompt);
        fs.writeFileSync(dest, buffer);
        generated++;
        console.log(`  saved: ${dest} (${buffer.length} bytes)`);
        await new Promise((r) => setTimeout(r, 1500));
      } catch (err) {
        failed++;
        const msg = err instanceof Error ? err.message : String(err);
        failures.push({ slug, path: asset.path, error: msg });
        console.error(`  FAILED: ${slug}/${asset.path}: ${msg}`);
      }
    }
  }

  console.log(`\nDone. Generated: ${generated}, Failed: ${failed}`);
  if (failures.length > 0) {
    console.log('Failures:', JSON.stringify(failures, null, 2));
    process.exit(failures.length > 0 && generated === 0 ? 1 : 0);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
