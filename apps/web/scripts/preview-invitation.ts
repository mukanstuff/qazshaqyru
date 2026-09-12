/**
 * Publish a throwaway invitation from a catalogue template so it can be looked at.
 *
 *   npx tsx scripts/preview-invitation.ts syrmaq
 *   pnpm shot http://localhost:3000/i/preview-syrmaq out.png
 *
 * Template work has no feedback loop without this. A canvas document can pass
 * the Zod schema, typecheck and every unit test and still render with its
 * names under a photograph or a section 300px tall that needed 600 — and the
 * guest page is the only place that truth shows up, because it is the only
 * renderer that applies stage scaling, fonts, masks and scroll animation
 * together.
 *
 * Idempotent: re-running after a reseed republishes the same slug, so the
 * screenshot URL never changes.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const slug = process.argv[2];
  if (!slug) {
    console.error('usage: npx tsx scripts/preview-invitation.ts <template-slug>');
    process.exit(1);
  }

  const template = await prisma.template.findUnique({ where: { slug } });
  if (!template) throw new Error(`no template with slug "${slug}"`);
  if (!template.canvas) throw new Error(`template "${slug}" has no canvas`);

  // Any account will do — this row is never shown in a dashboard.
  const user = await prisma.user.findFirst({ orderBy: { createdAt: 'asc' } });
  if (!user) throw new Error('no users in the database; register one at /login first');

  const previewSlug = `preview-${slug}`;

  const data = {
    userId: user.id,
    templateId: template.id,
    title: template.nameKz,
    eventType: 'kyz_uzatu' as never,
    eventDate: new Date('2027-05-15T12:00:00.000Z'),
    eventTime: '17:00',
    eventPlace: '«Салтанат» сарайы',
    address: 'Астана қаласы, Тәуелсіздік даңғылы 12',
    canvas: template.canvas as object,
    // Open RSVP is off by default for weddings, so a preview otherwise renders
    // the 'answer via your personal link' notice and the RSVP form — the screen
    // the whole product exists for — is never seen while designing it.
    customText: { openRsvp: true } as object,
    status: 'published' as never,
    publishedAt: new Date(),
  };

  await prisma.invitation.upsert({
    where: { slug: previewSlug },
    create: { ...data, slug: previewSlug },
    update: data,
  });

  const doc = template.canvas as { elements?: unknown[]; height?: number };
  console.log(
    `/i/${previewSlug}  —  ${doc.elements?.length ?? 0} elements, ${doc.height ?? '?'}px`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
