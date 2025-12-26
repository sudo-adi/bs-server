import prisma from '../config/prisma';

/**
 * Script to seed test workers in the database
 * Creates workers with BSW-XXXXX codes and assigns skills
 */

const testWorkers = [
  {
    firstName: 'Rajesh',
    lastName: 'Kumar',
    phone: '9876543210',
    email: 'rajesh.kumar@example.com',
    gender: 'male',
    isBlueCollar: true,
    currentStage: 'DEPLOYED',
    skillName: 'Mason',
  },
  {
    firstName: 'Amit',
    lastName: 'Singh',
    phone: '9876543211',
    email: 'amit.singh@example.com',
    gender: 'male',
    isBlueCollar: true,
    currentStage: 'BENCHED',
    skillName: 'Carpenter',
  },
  {
    firstName: 'Priya',
    lastName: 'Sharma',
    phone: '9876543212',
    email: 'priya.sharma@example.com',
    gender: 'female',
    isBlueCollar: true,
    currentStage: 'DEPLOYED',
    skillName: 'Bar Bender',
  },
  {
    firstName: 'Suresh',
    lastName: 'Patel',
    phone: '9876543213',
    email: 'suresh.patel@example.com',
    gender: 'male',
    isBlueCollar: true,
    currentStage: 'BENCHED',
    skillName: 'Helper',
  },
  {
    firstName: 'Deepak',
    lastName: 'Verma',
    phone: '9876543214',
    email: 'deepak.verma@example.com',
    gender: 'male',
    isBlueCollar: true,
    currentStage: 'DEPLOYED',
    skillName: 'Mason',
  },
];

async function seedWorkers() {
  try {
    console.log('🌱 Starting workers seed...');

    // Get skill categories for assignment
    const skills = await prisma.skillCategory.findMany({
      where: { categoryType: 'blue_collar' },
    });

    console.log(`📊 Found ${skills.length} blue collar skills`);

    // Get the last worker code to continue sequence
    const lastWorker = await prisma.profile.findFirst({
      where: { workerCode: { not: null, startsWith: 'BSW-' } },
      orderBy: { workerCodeAssignedAt: 'desc' },
      select: { workerCode: true },
    });

    let lastNumber = 0;
    if (lastWorker?.workerCode) {
      lastNumber = parseInt(lastWorker.workerCode.replace(/\D/g, '')) || 0;
    }

    console.log(
      `🔢 Starting worker code sequence from: BSW-${String(lastNumber + 1).padStart(5, '0')}`
    );

    // Create workers
    for (const workerData of testWorkers) {
      // Check if worker already exists
      const existing = await prisma.profile.findFirst({
        where: { phone: workerData.phone },
      });

      if (existing) {
        console.log(`⏭️  Worker with phone ${workerData.phone} already exists, skipping...`);
        continue;
      }

      // Generate worker code
      lastNumber++;
      const workerCode = `BSW-${String(lastNumber).padStart(5, '0')}`;

      // Find the skill category
      const skillCategory = skills.find((s) => s.name === workerData.skillName);

      if (!skillCategory) {
        console.log(`⚠️  Skill "${workerData.skillName}" not found, skipping worker...`);
        continue;
      }

      // Create worker profile
      const worker = await prisma.profile.create({
        data: {
          firstName: workerData.firstName,
          lastName: workerData.lastName,
          phone: workerData.phone,
          email: workerData.email,
          gender: workerData.gender,
          isBlueCollar: workerData.isBlueCollar,
          isActive: true,
          currentStage: workerData.currentStage,
          workerCode: workerCode,
          workerCodeAssignedAt: new Date(),
        },
      });

      // Assign skill to worker
      await prisma.profileSkill.create({
        data: {
          profile: {
            connect: { id: worker.id },
          },
          skillCategory: {
            connect: { id: skillCategory.id },
          },
          isPrimary: true,
          yearsOfExperience: Math.floor(Math.random() * 5) + 1, // 1-5 years
        },
      });

      console.log(
        `✅ Created: ${worker.firstName} ${worker.lastName} (${workerCode}) - ${workerData.skillName} - ${workerData.currentStage}`
      );
    }

    // Show final counts
    const deployedCount = await prisma.profile.count({
      where: {
        workerCode: { not: null, startsWith: 'BSW-' },
        currentStage: 'DEPLOYED',
      },
    });

    const benchedCount = await prisma.profile.count({
      where: {
        workerCode: { not: null, startsWith: 'BSW-' },
        currentStage: 'BENCHED',
      },
    });

    const totalWorkers = await prisma.profile.count({
      where: { workerCode: { not: null, startsWith: 'BSW-' } },
    });

    console.log('\n📈 Summary:');
    console.log(`   Total BSW workers: ${totalWorkers}`);
    console.log(`   Deployed workers: ${deployedCount}`);
    console.log(`   Benched workers: ${benchedCount}`);
    console.log('\n✨ Workers seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding workers:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed
seedWorkers()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
