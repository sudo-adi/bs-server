import { prisma } from '../config/prisma';

async function main() {
  const profile = await prisma.profile.findFirst({ select: { id: true } });
  const notification = await prisma.notification.findFirst({ select: { id: true } });
  console.log(JSON.stringify({ profileId: profile?.id, notificationId: notification?.id }));
  await prisma.$disconnect();
}
main();
