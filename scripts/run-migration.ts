import prisma from '../src/config/prisma';

async function runMigration() {
  try {
    console.log('Starting migration...');

    // Add new fields to projects table
    await prisma.$executeRawUnsafe(`
      ALTER TABLE projects
      ADD COLUMN IF NOT EXISTS status_changed_at TIMESTAMP(6),
      ADD COLUMN IF NOT EXISTS status_change_reason TEXT,
      ADD COLUMN IF NOT EXISTS actual_start_date DATE,
      ADD COLUMN IF NOT EXISTS actual_end_date DATE,
      ADD COLUMN IF NOT EXISTS current_attributable_to VARCHAR(50);
    `);
    console.log('✓ Added new fields to projects table');

    // Add previous_stage field to profiles table
    await prisma.$executeRawUnsafe(`
      ALTER TABLE profiles
      ADD COLUMN IF NOT EXISTS previous_stage VARCHAR(50);
    `);
    console.log('✓ Added previous_stage field to profiles table');

    // Create project_status_history table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS project_status_history (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        from_status VARCHAR(50),
        to_status VARCHAR(50) NOT NULL,
        change_reason TEXT,
        attributable_to VARCHAR(50),
        status_date TIMESTAMP(6) NOT NULL,
        changed_by_user_id UUID REFERENCES users(id),
        created_at TIMESTAMP(6) DEFAULT NOW()
      );
    `);
    console.log('✓ Created project_status_history table');

    // Create indexes for project_status_history
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_project_status_history_project_date
      ON project_status_history(project_id, created_at DESC);
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_project_status_history_status
      ON project_status_history(to_status);
    `);
    console.log('✓ Created indexes for project_status_history');

    // Create project_status_documents table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS project_status_documents (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        project_status_history_id UUID NOT NULL REFERENCES project_status_history(id) ON DELETE CASCADE,
        project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        status VARCHAR(50) NOT NULL,
        document_title VARCHAR(500) NOT NULL,
        file_url VARCHAR(1000) NOT NULL,
        uploaded_by_user_id UUID REFERENCES users(id),
        created_at TIMESTAMP(6) DEFAULT NOW()
      );
    `);
    console.log('✓ Created project_status_documents table');

    // Create indexes for project_status_documents
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_project_status_documents_project
      ON project_status_documents(project_id);
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_project_status_documents_history
      ON project_status_documents(project_status_history_id);
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_project_status_documents_status
      ON project_status_documents(status);
    `);
    console.log('✓ Created indexes for project_status_documents');

    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

runMigration()
  .then(() => {
    console.log('\nMigration script finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nMigration script failed:', error);
    process.exit(1);
  });
