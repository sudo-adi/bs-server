import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function testNotificationQuery() {
  console.log('\n🔍 Testing Notification Query Logic...\n');

  const adminUserId = 'c3751218-3c27-491f-b285-3894252d032e';
  const adminEmail = 'superadmin@buildsewa.com';

  try {
    // Test 1: Query with the new logic (userId OR email OR system-wide)
    console.log('1. Testing new query logic:');
    console.log(`   Admin ID: ${adminUserId}`);
    console.log(`   Admin Email: ${adminEmail}\n`);

    const notifications = await prisma.notifications.findMany({
      where: {
        OR: [
          { recipient_user_id: adminUserId },
          { recipient_email: adminEmail },
          {
            AND: [{ recipient_user_id: null }, { recipient_email: null }],
          },
        ],
      },
      orderBy: { created_at: 'desc' },
      take: 10,
    });

    console.log(`   ✅ Found ${notifications.length} notifications\n`);

    notifications.forEach((n, idx) => {
      console.log(`   ${idx + 1}. ${n.title}`);
      console.log(`      Type: ${n.type}`);
      console.log(`      Status: ${n.status}`);
      console.log(`      Recipient ID: ${n.recipient_user_id || 'NULL (system-wide)'}`);
      console.log(`      Recipient Email: ${n.recipient_email || 'NULL (system-wide)'}`);
      console.log('');
    });

    // Test 2: Count unread
    const unreadCount = await prisma.notifications.count({
      where: {
        read_at: null,
        OR: [
          { recipient_user_id: adminUserId },
          { recipient_email: adminEmail },
          {
            AND: [{ recipient_user_id: null }, { recipient_email: null }],
          },
        ],
      },
    });

    console.log(`2. Unread notifications: ${unreadCount}\n`);

    console.log('✨ Query test complete!\n');
    console.log('🎯 System-wide notifications (NULL recipient) are now included for admins.\n');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testNotificationQuery();
