import { prisma } from '../config/prisma';

async function main() {
  const userCount = await prisma.user.count();
  console.log(`Connection successful. Current user count: ${userCount}`);
}

main()
  .catch((e) => {
    console.error('Connection failed:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });