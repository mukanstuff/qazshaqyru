import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prismaClientDir = path.resolve(__dirname, '../../../node_modules/.prisma/client');
if (!fs.existsSync(prismaClientDir)) {
  fs.mkdirSync(prismaClientDir, { recursive: true });
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

for (const f of ['index.js', 'default.js', 'index-browser.js', 'edge.js']) {
  const p = path.join(prismaClientDir, f);
  if (!fs.existsSync(p)) {
    fs.writeFileSync(p, stubJs, 'utf8');
  }
}

for (const f of ['index.d.ts', 'default.d.ts', 'edge.d.ts']) {
  const p = path.join(prismaClientDir, f);
  if (!fs.existsSync(p)) {
    fs.writeFileSync(p, stubDts, 'utf8');
  }
}
