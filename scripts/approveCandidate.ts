import prisma from '../src/config/prisma';

async function approveCandidate(phone: string) {
  try {
    // Find profile
    const profile = await prisma.profiles.findFirst({
      where: { phone, deleted_at: null },
      include: {
        stage_transitions: {
          orderBy: { transitioned_at: 'desc' },
          take: 1,
        },
      },
    });

    if (!profile) {
      console.log('❌ Profile not found for phone:', phone);
      console.log('Please register first or check the phone number.');
      return;
    }

    console.log('\n✅ Profile found:');
    console.log('ID:', profile.id);
    console.log('Name:', profile.first_name, profile.last_name);
    console.log('Candidate Code:', profile.candidate_code);
    console.log('Is Active:', profile.is_active);
    console.log('Current Stage:', profile.stage_transitions[0]?.to_stage || 'No stage set');

    // Check if already approved
    const currentStage = profile.stage_transitions[0]?.to_stage;
    if (currentStage === 'ready_to_deploy') {
      console.log('\n✅ Profile is already approved (ready_to_deploy)');
      console.log('You can now login with this number.');
      return;
    }

    // Approve the profile
    console.log('\n🔄 Approving profile...');
    await prisma.stage_transitions.create({
      data: {
        profile_id: profile.id,
        from_stage: currentStage || null,
        to_stage: 'ready_to_deploy',
        notes: 'Approved for candidate portal access',
      },
    });

    // Ensure profile is active
    if (!profile.is_active) {
      await prisma.profiles.update({
        where: { id: profile.id },
        data: { is_active: true },
      });
      console.log('✅ Profile activated');
    }

    console.log('\n✅ Profile approved successfully!');
    console.log('Stage changed to: ready_to_deploy');
    console.log('\nYou can now login with phone:', phone);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Get phone from command line argument
const phone = process.argv[2];

if (!phone) {
  console.log('Usage: npm run approve-candidate <phone_number>');
  console.log('Example: npm run approve-candidate 9891331101');
  process.exit(1);
}

approveCandidate(phone);
