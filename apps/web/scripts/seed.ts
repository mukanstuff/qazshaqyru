import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TEMPLATES = [
  {
    slug: 'classic-wedding',
    nameRu: 'Классическая свадьба',
    nameKz: 'Классикалық той',
    descriptionRu: 'Элегантный классический стиль с золотыми акцентами. Подходит для традиционной свадьбы.',
    descriptionKz: 'Алтын акценттері бар талғампаз классикалық стиль. Дәстүрлі тойға жарамды.',
    category: 'wedding' as const,
    previewImageUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80',
    priceKzt: 14900,
    isFeatured: true,
    sortOrder: 1,
    config: {
      colors: { primary: '#c9a96e', secondary: '#f5f0e8' },
      font: 'Cormorant Garamond',
      cover: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1920&q=80',
    },
  },
  {
    slug: 'elegant-wedding',
    nameRu: 'Элегантная свадьба',
    nameKz: 'Талғампаз той',
    descriptionRu: 'Минималистичный дизайн с фиолетовыми оттенками. Идеально для современной церемонии.',
    descriptionKz: 'Күлгін реңктері бар минималистік дизайн. Заманауи салтанатқа тамаша.',
    category: 'wedding' as const,
    previewImageUrl: 'https://images.unsplash.com/photo-1519225425429-c6f1f6b9a8c4?w=800&q=80',
    priceKzt: 14900,
    isFeatured: true,
    sortOrder: 2,
    config: {
      colors: { primary: '#a78bfa', secondary: '#faf5ff' },
      font: 'Playfair Display',
      cover: 'https://images.unsplash.com/photo-1519225425429-c6f1f6b9a8c4?w=1920&q=80',
    },
  },
  {
    slug: 'ornament-wedding',
    nameRu: 'Свадьба с орнаментом',
    nameKz: 'Ою-өрнекті той',
    descriptionRu: 'Казахский национальный орнамент на корешке. Традиции + современный стиль.',
    descriptionKz: 'Қазақтың ұлттық ою-өрнегі. Дәстүр мен заманауи стиль.',
    category: 'wedding' as const,
    previewImageUrl: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800&q=80',
    priceKzt: 17900,
    isFeatured: true,
    sortOrder: 3,
    config: {
      colors: { primary: '#b91c1c', secondary: '#fef2f2' },
      font: 'Cormorant Garamond',
      cover: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=1920&q=80',
    },
  },
  {
    slug: 'modern-wedding',
    nameRu: 'Современная свадьба',
    nameKz: 'Заманауи той',
    descriptionRu: 'Чистый минимализм с акцентами. Для пар, которые ценят лаконичность.',
    descriptionKz: 'Таза минимализм. Қысқалықты бағалайтын жұптарға.',
    category: 'wedding' as const,
    previewImageUrl: 'https://images.unsplash.com/photo-1544928147-79a2dbc1f389?w=800&q=80',
    priceKzt: 12900,
    sortOrder: 4,
    config: {
      colors: { primary: '#71717a', secondary: '#fafafa' },
      font: 'DM Sans',
      cover: 'https://images.unsplash.com/photo-1544928147-79a2dbc1f389?w=1920&q=80',
    },
  },
  {
    slug: 'golden-toy',
    nameRu: 'Золотой той',
    nameKz: 'Алтын той',
    descriptionRu: 'Богатый дизайн в золотых тонах. Для торжественных семейных торжеств.',
    descriptionKz: 'Алтын түстердегі бай дизайн. Салтанатты отбасылық тойларға.',
    category: 'toy' as const,
    previewImageUrl: 'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?w=800&q=80',
    priceKzt: 14900,
    isFeatured: true,
    sortOrder: 5,
    config: {
      colors: { primary: '#fbbf24', secondary: '#fffbeb' },
      font: 'Cormorant Garamond',
      cover: 'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?w=1920&q=80',
    },
  },
  {
    slug: 'nature-toy',
    nameRu: 'Той на природе',
    nameKz: 'Табиғаттағы той',
    descriptionRu: 'Зелёные и бирюзовые оттенки. Идеально для торжеств на свежем воздухе.',
    descriptionKz: 'Жасыл-бирюза реңктері. Таза ауада өткізілетін тойларға.',
    category: 'toy' as const,
    previewImageUrl: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&q=80',
    priceKzt: 12900,
    sortOrder: 6,
    config: {
      colors: { primary: '#34d399', secondary: '#ecfdf5' },
      font: 'DM Sans',
      cover: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=1920&q=80',
    },
  },
  {
    slug: 'romantic-toy',
    nameRu: 'Романтический той',
    nameKz: 'Романтикалық той',
    descriptionRu: 'Нежные розовые оттенки с цветочными элементами.',
    descriptionKz: 'Гүлді элементтері бар нәзік қызғылт реңктер.',
    category: 'toy' as const,
    previewImageUrl: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=800&q=80',
    priceKzt: 12900,
    sortOrder: 7,
    config: {
      colors: { primary: '#fb7185', secondary: '#fff1f2' },
      font: 'Cormorant Garamond',
      cover: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=1920&q=80',
    },
  },
  {
    slug: 'betashar-warm',
    nameRu: 'Беташар тёплый',
    nameKz: 'Жылы беташар',
    descriptionRu: 'Тёплые кремовые оттенки. Подходит для уютной домашней церемонии.',
    descriptionKz: 'Жылы крем реңктері. Үйдегі жайлы салтанатқа.',
    category: 'betashar' as const,
    previewImageUrl: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&q=80',
    priceKzt: 12900,
    isFeatured: true,
    sortOrder: 8,
    config: {
      colors: { primary: '#d97706', secondary: '#fffbeb' },
      font: 'Cormorant Garamond',
      cover: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=1920&q=80',
    },
  },
  {
    slug: 'betashar-oriental',
    nameRu: 'Беташар восточный',
    nameKz: 'Шығыс беташары',
    descriptionRu: 'Восточные мотивы с богатым декором. Национальный колорит.',
    descriptionKz: 'Бай безендірілген шығыс мотивтері. Ұлттық бояу.',
    category: 'betashar' as const,
    previewImageUrl: 'https://images.unsplash.com/photo-1545071677-c0c5da4a3f00?w=800&q=80',
    priceKzt: 14900,
    sortOrder: 9,
    config: {
      colors: { primary: '#92400e', secondary: '#fef3c7' },
      font: 'Playfair Display',
      cover: 'https://images.unsplash.com/photo-1545071677-c0c5da4a3f00?w=1920&q=80',
    },
  },
  {
    slug: 'kyz-uzatu-traditional',
    nameRu: 'Кыз узату традиционный',
    nameKz: 'Дәстүрлі қыз ұзату',
    descriptionRu: 'Традиционные мотивы в красных и золотых тонах.',
    descriptionKz: 'Қызыл-алтын түстердегі дәстүрлі мотивтер.',
    category: 'kyz_uzatu' as const,
    previewImageUrl: 'https://images.unsplash.com/photo-1597157639073-69284dc0fdaf?w=800&q=80',
    priceKzt: 14900,
    isFeatured: true,
    sortOrder: 10,
    config: {
      colors: { primary: '#b91c1c', secondary: '#fef2f2' },
      font: 'Cormorant Garamond',
      cover: 'https://images.unsplash.com/photo-1597157639073-69284dc0fdaf?w=1920&q=80',
    },
  },
  {
    slug: 'kyz-uzatu-modern',
    nameRu: 'Кыз узату современный',
    nameKz: 'Заманауи қыз ұзату',
    descriptionRu: 'Современная интерпретация традиции. Элегантность и простота.',
    descriptionKz: 'Дәстүрдің заманауи интерпретациясы. Талғампаздық пен қарапайымдылық.',
    category: 'kyz_uzatu' as const,
    previewImageUrl: 'https://images.unsplash.com/photo-1465495976277-4387d4b0e4a6?w=800&q=80',
    priceKzt: 12900,
    sortOrder: 11,
    config: {
      colors: { primary: '#7c3aed', secondary: '#faf5ff' },
      font: 'Playfair Display',
      cover: 'https://images.unsplash.com/photo-1465495976277-4387d4b0e4a6?w=1920&q=80',
    },
  },
  {
    slug: 'birthday-classic',
    nameRu: 'День рождения — классика',
    nameKz: 'Туған күн — классика',
    descriptionRu: 'Яркий праздничный дизайн. Подходит для любого возраста.',
    descriptionKz: 'Жарқын мерекелік дизайн. Кез келген жасқа жарамды.',
    category: 'birthday' as const,
    previewImageUrl: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800&q=80',
    priceKzt: 9900,
    sortOrder: 12,
    config: {
      colors: { primary: '#ec4899', secondary: '#fdf2f8' },
      font: 'DM Sans',
      cover: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=1920&q=80',
    },
  },
  {
    slug: 'anniversary-golden',
    nameRu: 'Юбилей золотой',
    nameKz: 'Алтын мерейтой',
    descriptionRu: 'Торжественный дизайн для юбилея. Золото и элегантность.',
    descriptionKz: 'Мерейтойға арналған салтанатты дизайн. Алтын мен талғампаздық.',
    category: 'anniversary' as const,
    previewImageUrl: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&q=80',
    priceKzt: 12900,
    sortOrder: 13,
    config: {
      colors: { primary: '#d97706', secondary: '#fffbeb' },
      font: 'Cormorant Garamond',
      cover: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=1920&q=80',
    },
  },
  {
    slug: 'corporate-modern',
    nameRu: 'Корпоратив современный',
    nameKz: 'Заманауи корпоратив',
    descriptionRu: 'Деловой стиль для корпоративных мероприятий.',
    descriptionKz: 'Корпоративтік іс-шараларға арналған іскер стиль.',
    category: 'corporate' as const,
    previewImageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80',
    priceKzt: 14900,
    sortOrder: 14,
    config: {
      colors: { primary: '#0f172a', secondary: '#f1f5f9' },
      font: 'DM Sans',
      cover: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1920&q=80',
    },
  },
];

async function main() {
  console.log('Seeding templates...');
  for (const template of TEMPLATES) {
    await prisma.template.upsert({
      where: { slug: template.slug },
      create: template,
      update: template,
    });
  }
  console.log(`Seeded ${TEMPLATES.length} templates`);

  console.log('Seeding admin user...');
  const adminPhone = process.env.ADMIN_PHONE || '+77001234567';
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

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
