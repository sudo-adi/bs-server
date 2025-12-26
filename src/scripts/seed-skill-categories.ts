import prisma from '../config/prisma';

/**
 * Script to seed skill categories in the database
 * Blue collar: Mason, Carpenter, Bar Bender, Helper
 * White collar: Trainers, HR, Staff, Support, Accounts, Executive, Admin
 */

const skillCategories = [
  // Blue collar skills
  {
    name: 'Mason',
    description: 'Masonry and bricklaying work',
    categoryType: 'blue_collar',
    isActive: true,
  },
  {
    name: 'Carpenter',
    description: 'Carpentry and woodwork',
    categoryType: 'blue_collar',
    isActive: true,
  },
  {
    name: 'Bar Bender',
    description: 'Steel bar bending and reinforcement',
    categoryType: 'blue_collar',
    isActive: true,
  },
  {
    name: 'Helper',
    description: 'General construction helper',
    categoryType: 'blue_collar',
    isActive: true,
  },
  // White collar skills
  {
    name: 'Trainer',
    description: 'Training and development',
    categoryType: 'white_collar',
    isActive: true,
  },
  {
    name: 'HR',
    description: 'Human resources',
    categoryType: 'white_collar',
    isActive: true,
  },
  {
    name: 'Staff',
    description: 'General staff',
    categoryType: 'white_collar',
    isActive: true,
  },
  {
    name: 'Support',
    description: 'Support staff',
    categoryType: 'white_collar',
    isActive: true,
  },
  {
    name: 'Accounts',
    description: 'Accounting and finance',
    categoryType: 'white_collar',
    isActive: true,
  },
  {
    name: 'Executive',
    description: 'Executive level management',
    categoryType: 'white_collar',
    isActive: true,
  },
  {
    name: 'Admin',
    description: 'Administrative work',
    categoryType: 'white_collar',
    isActive: true,
  },
];

async function seedSkillCategories() {
  try {
    console.log('🌱 Starting skill categories seed...');

    // Check if any skills already exist
    const existingCount = await prisma.skillCategory.count();
    console.log(`📊 Found ${existingCount} existing skill categories`);

    // Create all skill categories
    for (const skill of skillCategories) {
      // Check if skill already exists
      const existing = await prisma.skillCategory.findFirst({
        where: { name: skill.name },
      });

      if (existing) {
        console.log(`⏭️  Skill "${skill.name}" already exists, skipping...`);
        continue;
      }

      const created = await prisma.skillCategory.create({
        data: skill,
      });

      console.log(`✅ Created: ${created.name} (${skill.categoryType}) - ID: ${created.id}`);
    }

    // Show final counts
    const blueCollarCount = await prisma.skillCategory.count({
      where: { categoryType: 'blue_collar' },
    });
    const whiteCollarCount = await prisma.skillCategory.count({
      where: { categoryType: 'white_collar' },
    });

    console.log('\n📈 Summary:');
    console.log(`   Blue collar skills: ${blueCollarCount}`);
    console.log(`   White collar skills: ${whiteCollarCount}`);
    console.log(`   Total: ${blueCollarCount + whiteCollarCount}`);
    console.log('\n✨ Skill categories seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding skill categories:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed
seedSkillCategories()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
