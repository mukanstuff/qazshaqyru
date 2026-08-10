import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.$executeRaw`
    UPDATE "User" 
    SET "isAdmin" = true 
    WHERE "email" = 'kao.a1tbay@gmail.com' 
       OR "email" = 'nasralvrakovinu@gmail.com'
  `;
  console.log('Updated rows:', result);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
