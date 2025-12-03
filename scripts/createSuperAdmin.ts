import bcrypt from 'bcrypt';
import { PrismaClient } from '../src/generated/prisma';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const MODULES = [
  'users',
  'roles',
  'profiles',
  'addresses',
  'bank_accounts',
  'qualifications',
  'skills',
  'documents',
  'interactions',
  'training_batches',
  'batch_enrollments',
  'projects',
  'project_assignments',
  'project_requests',
  'employers',
  'employer_authorized_persons',
  'news_updates',
  'scraper_websites',
  'social_media_posts',
  'blogs',
  'blacklist',
  'salary_slips',
  'dashboard',
  'reports',
];

async function createSuperAdmin() {
  // Create a simple Prisma client without event handlers
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

  try {
    console.log('\n🚀 Creating Super Admin...\n');

    // Check if super admin role exists
    let superAdminRole = await prisma.roles.findFirst({
      where: { name: 'Super Admin' },
    });

    if (superAdminRole) {
      console.log('✅ Super Admin role already exists');
    } else {
      // Create Super Admin role
      console.log('📝 Creating Super Admin role...');
      superAdminRole = await prisma.roles.create({
        data: {
          name: 'Super Admin',
          description: 'Super Admin with full system access and all permissions',
          is_active: true,
        },
      });
      console.log('✅ Super Admin role created');
    }

    // Check if permissions exist for this role
    const existingPermissions = await prisma.role_permissions.findMany({
      where: { role_id: superAdminRole.id },
    });

    if (existingPermissions.length === 0) {
      console.log('\n📝 Creating permissions for all modules...');

      // Create permissions for all modules
      const permissions = MODULES.map((module) => ({
        role_id: superAdminRole!.id,
        module_name: module,
        can_view: true,
        can_manage: true,
        can_export: true,
        is_super_admin: true,
      }));

      await prisma.role_permissions.createMany({
        data: permissions,
      });

      console.log(`✅ Created permissions for ${MODULES.length} modules`);
    } else {
      console.log(`✅ Permissions already exist (${existingPermissions.length} modules)`);
    }

    // Check if super admin user exists
    const existingUser = await prisma.users.findFirst({
      where: { username: 'superadmin' },
    });

    if (existingUser) {
      console.log('\n✅ Super Admin user already exists');
      console.log('Username: superadmin');
      console.log('User ID:', existingUser.id);
      console.log('\nIf you need to reset the password, you can update it manually.');
    } else {
      // Create super admin user
      console.log('\n📝 Creating Super Admin user...');

      const password = 'Admin@123'; // Default password
      const passwordHash = await bcrypt.hash(password, 10);

      const user = await prisma.users.create({
        data: {
          username: 'superadmin',
          email: 'superadmin@buildsewa.com',
          password_hash: passwordHash,
          full_name: 'Super Admin',
          phone: '9999999999',
          role_id: superAdminRole.id,
          is_active: true,
        },
      });

      console.log('\n✅ Super Admin user created successfully!');
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📋 Login Credentials:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('Username:', user.username);
      console.log('Password:', password);
      console.log('User ID:', user.id);
      console.log('Email:', user.email);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('\n⚠️  IMPORTANT: Change the password after first login!');
    }

    console.log('\n✅ Super Admin setup complete!\n');
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

createSuperAdmin();
