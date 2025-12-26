import prisma from '../config/prisma';

/**
 * Update existing skill categories to correct categoryType
 */

async function updateSkillCategories() {
  try {
    console.log('🔄 Updating skill categories...');

    // Update Mason and Carpenter to blue_collar
    const skillsToUpdate = ['Mason', 'Carpenter'];

    for (const skillName of skillsToUpdate) {
      const updated = await prisma.skillCategory.updateMany({
        where: { name: skillName },
        data: { categoryType: 'blue_collar' },
      });

      if (updated.count > 0) {
        console.log(`✅ Updated ${skillName} to blue_collar`);
      }
    }

    // Show final counts
    const blueCollarSkills = await prisma.skillCategory.findMany({
      where: { categoryType: 'blue_collar' },
      select: { name: true },
    });

    const whiteCollarSkills = await prisma.skillCategory.findMany({
      where: { categoryType: 'white_collar' },
      select: { name: true },
    });

    console.log('\n📈 Summary:');
    console.log(
      `   Blue collar skills (${blueCollarSkills.length}): ${blueCollarSkills.map((s) => s.name).join(', ')}`
    );
    console.log(
      `   White collar skills (${whiteCollarSkills.length}): ${whiteCollarSkills.map((s) => s.name).join(', ')}`
    );
    console.log('\n✨ Skills updated successfully!');
  } catch (error) {
    console.error('❌ Error updating skills:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the update
updateSkillCategories()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
