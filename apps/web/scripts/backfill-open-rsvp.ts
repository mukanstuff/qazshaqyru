/**
 * Remove the machine-written `openRsvp` flag from every invitation.
 *
 * Publishing used to stamp `customText.openRsvp` from the event type, and
 * `isOpenRsvpEnabled` treats a stored value as the host's own decision — so a
 * guess made by the publish path became permanent, and no screen in the
 * product could undo it. No host ever set the flag, because until now there
 * was no control for it. Stripping it restores the default (open) and leaves
 * the key free to mean what it now means: a choice the host made in the hub.
 *
 *   npx tsx scripts/backfill-open-rsvp.ts          # report only
 *   npx tsx scripts/backfill-open-rsvp.ts --apply  # write
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const apply = process.argv.includes('--apply');

async function main() {
  const rows = await prisma.invitation.findMany({ select: { id: true, slug: true, customText: true } });
  const touched: string[] = [];

  for (const row of rows) {
    const ct = row.customText;
    if (!ct || typeof ct !== 'object' || Array.isArray(ct)) continue;
    const obj = ct as Record<string, unknown>;
    if (!('openRsvp' in obj)) continue;
    touched.push(`${row.slug} (openRsvp=${String(obj.openRsvp)})`);
    if (apply) {
      const { openRsvp: _dropped, ...rest } = obj;
      await prisma.invitation.update({ where: { id: row.id }, data: { customText: rest } });
    }
  }

  console.log(`${rows.length} invitations, ${touched.length} carrying the flag`);
  for (const t of touched) console.log('  ' + t);
  if (!apply && touched.length > 0) console.log('\nre-run with --apply to strip it');
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
