import { PrismaClient } from '../src/generated/prisma';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabasePrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Function to create AWS RDS Prisma clients
function createAWSClient(database: string) {
  const url = `postgresql://postgres:PrimaryDB2024SecurePass!@bs-system-primary-db.c9kqi2aae04e.ap-south-1.rds.amazonaws.com:5432/${database}?sslmode=require`;
  return new PrismaClient({
    datasources: {
      db: { url },
    },
  });
}

const testingPrisma = createAWSClient('testing_db');
const productionPrisma = createAWSClient('production_db');
const primaryPrisma = createAWSClient('primary_db');

// Get all model names from Prisma schema (you'll need to list them manually)
const models = [
  'activityLog',
  'candidateSignup',
  'batchEnrollment',
  'blog',
  'documentCategory',
  'employerAuthorizedPerson',
  'employer',
  'employerStatusHistory',
  'newsUpdate',
  'notificationChannel',
  'notificationPreference',
  'notificationPreferenceChannel',
  'notificationTemplate',
  'notificationTemplateChannel',
  'notification',
  'profileAddress',
  'profileBankAccount',
  'profileDocument',
  'profileInteractionType',
  'profileInteraction',
  'profileQualificationType',
  'profileQualification',
  'profileRolePermission',
  'profileRole',
  'profileRoleAssignment',
  'profileSkill',
  'profileTrainingCertificate',
  'profile',
  'profileLanguage',
  'language',
  'profileCategory',
  'profileCategoryAssignment',
  'profileStatusHistory',
  'projectFinancial',
  'projectRequestRequirement',
  'projectRequest',
  'projectResourceRequirement',
  'projectWorkerAssignment',
  'project',
  'projectStatusHistory',
  'scraperWebsite',
  'skillCategory',
  'socialMediaPost',
  'socialMediaPostPlatform',
  'socialMediaPostTag',
  'socialMediaPostMedia',
  'socialMediaPlatformPost',
  'statusTrail',
  'calendarEvent',
  'trainingBatch',
  'trainingBatchTrainer',
  'trainingHistory',
  'projectDocument',
  'projectDocumentAssociation',
] as const;

async function migrateData(targetPrisma: PrismaClient, targetName: string) {
  console.log(`\n🚀 Starting migration to ${targetName}...`);
  let totalRecords = 0;

  for (const model of models) {
    try {
      // Get data from Supabase
      const data = await (supabasePrisma as any)[model].findMany();

      if (data.length === 0) {
        console.log(`  ℹ️  ${model}: No records to migrate`);
        continue;
      }

      // Insert data to AWS RDS
      await (targetPrisma as any)[model].createMany({
        data,
        skipDuplicates: true,
      });

      totalRecords += data.length;
      console.log(`  ✅ ${model}: Migrated ${data.length} records`);
    } catch (error: any) {
      console.error(`  ❌ ${model}: Error - ${error.message}`);
    }
  }

  console.log(`\n✨ ${targetName} migration complete! Total records: ${totalRecords}\n`);
}

async function main() {
  console.log('🔄 Starting data migration from Supabase to AWS RDS...\n');
  console.log('Databases to migrate to:');
  console.log('  1. testing_db');
  console.log('  2. production_db');
  console.log('  3. primary_db\n');

  try {
    // Connect to all databases
    await supabasePrisma.$connect();
    await testingPrisma.$connect();
    await productionPrisma.$connect();
    await primaryPrisma.$connect();
    console.log('✅ Connected to all databases\n');

    // Migrate to all three databases
    await migrateData(testingPrisma, 'testing_db');
    await migrateData(productionPrisma, 'production_db');
    await migrateData(primaryPrisma, 'primary_db');

    console.log('🎉 All migrations completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await supabasePrisma.$disconnect();
    await testingPrisma.$disconnect();
    await productionPrisma.$disconnect();
    await primaryPrisma.$disconnect();
  }
}

main();
