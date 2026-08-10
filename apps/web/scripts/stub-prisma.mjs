import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootNodeModules = path.resolve(__dirname, '../../../node_modules');

// Collect every location where `.prisma/client` may be resolved from:
// 1. the hoisted root node_modules
// 2. the pnpm virtual store next to @prisma/client (webpack resolves this one)
const prismaClientDirs = [path.join(rootNodeModules, '.prisma/client')];

const pnpmDir = path.join(rootNodeModules, '.pnpm');
if (fs.existsSync(pnpmDir)) {
  for (const entry of fs.readdirSync(pnpmDir)) {
    if (entry.startsWith('@prisma+client@')) {
      prismaClientDirs.push(path.join(pnpmDir, entry, 'node_modules/.prisma/client'));
    }
  }
}

const stubJs = `
class PrismaClient {
  constructor() {}
}
module.exports = {
  PrismaClient,
  Prisma: {},
};
`;

const stubDts = `
export class PrismaClient {
  constructor(options?: any);
  [key: string]: any;
}
export namespace Prisma {
  export type InputJsonValue = any;
  export type JsonValue = any;
}
`;

const needsStub = (p) => {
  if (!fs.existsSync(p)) return true;
  try {
    // Prisma ships a placeholder that throws "did not initialize yet" until
    // `prisma generate` succeeds. In offline sandboxes generate can't download
    // engines, so replace the placeholder with a harmless stub.
    return fs.readFileSync(p, 'utf8').includes('did not initialize yet');
  } catch {
    return true;
  }
};

for (const prismaClientDir of prismaClientDirs) {
  fs.mkdirSync(prismaClientDir, { recursive: true });

  for (const f of ['index.js', 'default.js', 'index-browser.js', 'edge.js']) {
    const p = path.join(prismaClientDir, f);
    if (needsStub(p)) {
      fs.writeFileSync(p, stubJs, 'utf8');
    }
  }

  for (const f of ['index.d.ts', 'default.d.ts', 'edge.d.ts']) {
    const p = path.join(prismaClientDir, f);
    if (!fs.existsSync(p)) {
      fs.writeFileSync(p, stubDts, 'utf8');
    }
  }

  const pkgJson = path.join(prismaClientDir, 'package.json');
  if (!fs.existsSync(pkgJson)) {
    fs.writeFileSync(
      pkgJson,
      JSON.stringify({ name: '.prisma/client', main: 'index.js', types: 'index.d.ts' }, null, 2),
      'utf8'
    );
  }
}
