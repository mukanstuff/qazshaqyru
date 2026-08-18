const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const tables = await p.$queryRaw`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name
  `;
  console.log('Tables:', tables.map(r => r.table_name).join(', '));

  const safeCounts = {};
  for (const row of tables) {
    const name = row.table_name;
    try {
      const result = await p.$queryRawUnsafe('SELECT COUNT(*) as cnt FROM "' + name + '"');
      safeCounts[name] = Number(result[0]?.cnt ?? 0);
    } catch(e) {
      safeCounts[name] = 'ERR: ' + e.message.split('\n')[0];
    }
  }
  console.log('\nRow counts:');
  for (const [k, v] of Object.entries(safeCounts)) {
    console.log('  ' + k + ': ' + v);
  }
}

main()
  .finally(() => p.$disconnect())
  .catch(e => { console.error(e.message.split('\n')[0]); process.exit(1); });
