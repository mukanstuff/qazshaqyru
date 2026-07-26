import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/** Must match src/lib/templates/catalog.ts */
const CATALOG_TEMPLATE_SLUG = 'wedding-luxury';

const CATALOG_TEMPLATE = {
  slug: CATALOG_TEMPLATE_SLUG,
  nameRu: 'Шаблон',
  nameKz: 'Шаблон',
  descriptionRu: '',
  descriptionKz: '',
  category: 'wedding' as const,
  previewImageUrl: '/assets/templates/wedding-luxury/preview.jpg',
  isFeatured: true,
  isActive: true,
  sortOrder: 0,
  config: {
    colors: { primary: '#181818', secondary: '#fafaf8', accent: '#181818' },
    font: 'system-ui',
    layout: 'fullbleed',
  },
};

async function main() {
  console.log('Deactivating all catalog templates...');
  await prisma.template.updateMany({
    data: { isActive: false, isFeatured: false },
  });

  console.log(`Seeding catalog template: ${CATALOG_TEMPLATE_SLUG}`);
  await prisma.template.upsert({
    where: { slug: CATALOG_TEMPLATE_SLUG },
    create: {
      ...CATALOG_TEMPLATE,
      priceKzt: 0,
    },
    update: {
      ...CATALOG_TEMPLATE,
      priceKzt: 0,
    },
  });

  console.log('Catalog ready: 1 sales template');

  console.log('Seeding admin user...');
  if (!process.env.ADMIN_PHONE) {
    console.log('[seed] ADMIN_PHONE not set — admin user skipped. Set ADMIN_PHONE in .env to create admin.');
  } else {
    const adminPhone = process.env.ADMIN_PHONE;
    const adminUser = await prisma.user.upsert({
      where: { phone: adminPhone },
      create: {
        phone: adminPhone,
        language: 'ru',
        isAdmin: true,
      },
      update: { isAdmin: true },
    });
    console.log(`Admin user: ${adminUser.phone}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
