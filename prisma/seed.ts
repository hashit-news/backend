import { PrismaClient, RoleType } from '@prisma/client';
import * as dotenv from 'dotenv';
dotenv.config({ path: __dirname + '/.env' });

const prisma = new PrismaClient();
async function main() {
  const adminRole = await prisma.role.upsert({
    where: { id: 1 },
    update: { role: RoleType.Admin },
    create: { role: RoleType.Admin },
  });

  const userRole = await prisma.role.upsert({
    where: { id: 2 },
    update: { role: RoleType.User },
    create: { role: RoleType.User },
  });

  await prisma.user.upsert({
    where: { id: process.env.SEED_ADMIN_USER_ID },
    update: { username: process.env.SEED_ADMIN_USERNAME },
    create: {
      id: process.env.SEED_ADMIN_USER_ID,
      username: process.env.SEED_ADMIN_USERNAME,
      roles: {
        create: [
          {
            roleId: adminRole.id,
          },
          {
            roleId: userRole.id,
          },
        ],
      },
    },
  });
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
