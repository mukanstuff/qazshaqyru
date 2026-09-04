/**
 * Publish a throwaway invitation from a template and issue a guest link for it,
 * so the template can be judged exactly the way a real guest sees it.
 *
 *   npx tsx scripts/preview-live.ts ak-otau
 *
 * It prints two URLs. The second one — with `?guest=<token>` — is the one that
 * matters: on a wedding, open RSVP is off by default and guests answer through
 * personal links, so the plain URL shows the "ask the host for your link"
 * notice where the poll should be. Only the personal link renders the real
 * form: a greeting by name and the attending / not-attending choice, with no
 * name or phone field to fill in.
 */
import { existsSync, readFileSync } from 'fs';
import { PrismaClient } from '@prisma/client';

// tsx does not read .env, and a guest token is an HMAC over SESSION_SECRET, so
// without this the script dies on token generation rather than on anything to
// do with the template.
for (const file of ['.env.local', '.env']) {
  if (!existsSync(file)) continue;
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const trimmed = line.trim();
    const eq = trimmed.indexOf('=');
    if (eq < 1 || trimmed.startsWith('#')) continue;
    const key = trimmed.slice(0, eq).trim();
    if (!/^[A-Z0-9_]+$/.test(key) || process.env[key]) continue;
    process.env[key] = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
  }
}

const prisma = new PrismaClient();
const EMAIL = 'preview-bot@qazshaqyru.internal';
const GUEST_NAME = 'Айжан Серікқызы';

async function main() {
  // Imported inside main, after the env loader above has run: the auth module
  // reads SESSION_SECRET when it hashes, and a top-level await is not available
  // in the CJS output tsx produces here.
  const { generateGuestToken } = await import('../src/lib/auth');

  const key = process.argv[2];
  if (!key) throw new Error('usage: preview-live.ts <templateSlug>');
  const t = await prisma.template.findUnique({ where: { slug: key } });
  if (!t?.canvas) throw new Error(`no canvas template ${key}`);

  let bot = await prisma.user.findFirst({ where: { email: EMAIL } });
  if (!bot) bot = await prisma.user.create({ data: { email: EMAIL, name: 'Preview bot' } });

  const slug = `live-${key}`;

  // Upsert, not delete-and-recreate: wishes and RSVP answers hang off the
  // invitation by foreign key, so recreating it wiped the very data you need in
  // order to see whether the wishes wall works.
  const existing = await prisma.invitation.findUnique({ where: { slug }, select: { id: true } });
  const invitation = existing
    ? await prisma.invitation.update({
        where: { id: existing.id },
        data: { templateKey: key, canvas: t.canvas as object, status: 'published' },
      })
    : await prisma.invitation.create({
        data: {
          userId: bot.id,
          title: `Live ${key}`,
          slug,
          eventType: 'wedding',
          eventDate: new Date('2027-05-15T12:00:00.000Z'),
          eventTimezone: 'Asia/Almaty',
          templateKey: key,
          status: 'published',
          canvas: t.canvas as object,
        },
      });

  // The token is stored only as a hash and revealed once, so a preview mints a
  // fresh one on every run.
  const { token, tokenHash } = generateGuestToken();

  const guest = await prisma.guest.findFirst({
    where: { invitationId: invitation.id, name: GUEST_NAME },
    select: { id: true },
  });
  if (guest) {
    await prisma.guest.update({ where: { id: guest.id }, data: { tokenHash, sentAt: new Date() } });
  } else {
    await prisma.guest.create({
      data: {
        invitationId: invitation.id,
        name: GUEST_NAME,
        phone: '+77015550101',
        tokenHash,
        sentAt: new Date(),
      },
    });
  }

  console.log(`plain:  http://localhost:3000/i/${slug}`);
  console.log(`guest:  http://localhost:3000/i/${slug}?guest=${token}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
