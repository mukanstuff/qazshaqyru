import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (['node_modules', '.next', 'coverage', 'snapshots'].includes(entry.name)) continue;
      walk(full, acc);
    } else if (/\.(ts|tsx|mjs)$/.test(entry.name)) {
      acc.push(full);
    }
  }
  return acc;
}

let changed = 0;
for (const file of walk(path.join(root, 'src')).concat(walk(path.join(root, 'scripts')))) {
  const original = fs.readFileSync(file, 'utf8');
  const updated = original
    .replaceAll('@/lib/payments/', '@/lib/payments/')
    .replaceAll('@/lib/payments', '@/lib/payments');
  if (updated !== original) {
    fs.writeFileSync(file, updated);
    changed++;
  }
}
console.log(`Fixed payments paths in ${changed} files`);
