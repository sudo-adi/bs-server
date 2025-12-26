import prisma from '../config/prisma';

async function fixWorkers() {
  try {
    console.log('🔧 Fixing BSW workers...');

    // Update all BSW workers to be blue collar
    const result = await prisma.profile.updateMany({
      where: {
        workerCode: {
          startsWith: 'BSW-',
        },
      },
      data: {
        isBlueCollar: true,
      },
    });

    console.log(`✅ Updated ${result.count} workers to isBlueCollar: true`);

    // Verify the update
    const workers = await prisma.profile.findMany({
      where: {
        workerCode: {
          startsWith: 'BSW-',
        },
      },
      select: {
        workerCode: true,
        firstName: true,
        lastName: true,
        isBlueCollar: true,
        currentStage: true,
      },
    });

    console.log('\n📊 BSW Workers:');
    workers.forEach((w) => {
      console.log(
        `  ${w.workerCode} - ${w.firstName} ${w.lastName} - ${w.currentStage} - isBlueCollar: ${w.isBlueCollar}`
      );
    });
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixWorkers();
