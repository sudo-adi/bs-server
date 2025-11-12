import bcrypt from 'bcrypt';
import logger from '../config/logger';
import { prisma } from '../config/prisma';

const SUPER_ADMIN_USERNAME = 'superadmin';
const SUPER_ADMIN_EMAIL = 'superadmin@buildsewa.com';
const SUPER_ADMIN_PASSWORD = 'SuperAdmin@123';
const SUPER_ADMIN_FULL_NAME = 'Super Administrator';

const MODULES = [
  'workers',
  'candidates',
  'projects',
  'trainings',
  'attendance',
  'analytics',
  'ai_tools',
  'notifications',
  'content_management',
  'users_roles',
];

async function seedSuperAdmin() {
  try {
    logger.info('Starting super admin seed process...');

    // Create Super Admin Role
    logger.info('Creating Super Admin role...');
    const superAdminRole = await prisma.roles.upsert({
      where: { name: 'Super Admin' },
      update: {},
      create: {
        name: 'Super Admin',
        description: 'Full system access with all permissions',
        is_active: true,
      },
    });

    logger.info(`Super Admin role created/found: ${superAdminRole.id}`);

    // Create permissions for all modules
    logger.info('Creating permissions for all modules...');
    for (const module of MODULES) {
      await prisma.role_permissions.upsert({
        where: {
          role_id_module_name: {
            role_id: superAdminRole.id,
            module_name: module,
          },
        },
        update: {
          can_view: true,
          can_manage: true,
          can_export: true,
          is_super_admin: true,
        },
        create: {
          role_id: superAdminRole.id,
          module_name: module,
          can_view: true,
          can_manage: true,
          can_export: true,
          is_super_admin: true,
        },
      });
      logger.info(`Permission created for module: ${module}`);
    }

    // Check if super admin user already exists
    const existingUser = await prisma.users.findUnique({
      where: { username: SUPER_ADMIN_USERNAME },
    });

    if (existingUser) {
      logger.info('Super admin user already exists. Updating role...');
      await prisma.users.update({
        where: { id: existingUser.id },
        data: {
          role_id: superAdminRole.id,
          is_active: true,
        },
      });
      logger.info('Super admin user updated successfully');
    } else {
      // Create super admin user
      logger.info('Creating super admin user...');
      const hashedPassword = await bcrypt.hash(SUPER_ADMIN_PASSWORD, 10);

      const superAdminUser = await prisma.users.create({
        data: {
          username: SUPER_ADMIN_USERNAME,
          email: SUPER_ADMIN_EMAIL,
          password_hash: hashedPassword,
          full_name: SUPER_ADMIN_FULL_NAME,
          is_active: true,
          role_id: superAdminRole.id,
        },
      });

      logger.info(`Super admin user created: ${superAdminUser.id}`);
      logger.info('='.repeat(50));
      logger.info('Super Admin Credentials:');
      logger.info(`Username: ${SUPER_ADMIN_USERNAME}`);
      logger.info(`Email: ${SUPER_ADMIN_EMAIL}`);
      logger.info(`Password: ${SUPER_ADMIN_PASSWORD}`);
      logger.info('='.repeat(50));
    }

    logger.info('Super admin seed completed successfully!');
  } catch (error) {
    logger.error('Error seeding super admin:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedSuperAdmin()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    logger.error('Error in seed process:', error);
    process.exit(1);
  });
