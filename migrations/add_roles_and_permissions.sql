-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for roles
CREATE INDEX IF NOT EXISTS idx_roles_name ON roles(name);
CREATE INDEX IF NOT EXISTS idx_roles_is_active ON roles(is_active);

-- Create role_permissions table
CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_id UUID NOT NULL,
    module_name VARCHAR(100) NOT NULL,
    can_view BOOLEAN DEFAULT false,
    can_manage BOOLEAN DEFAULT false,
    can_export BOOLEAN DEFAULT false,
    is_super_admin BOOLEAN DEFAULT false,
    created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_role_permissions_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    CONSTRAINT uq_role_module UNIQUE (role_id, module_name)
);

-- Create indexes for role_permissions
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_module_name ON role_permissions(module_name);

-- Add role_id column to users table (only if users table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users') THEN
        ALTER TABLE users ADD COLUMN IF NOT EXISTS role_id UUID;
        
        -- Create index for users.role_id
        CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);
        
        -- Add foreign key constraint for users.role_id
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'fk_users_role' AND table_name = 'users'
        ) THEN
            ALTER TABLE users ADD CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles(id);
        END IF;
    END IF;
END $$;

-- Insert Super Admin Role
INSERT INTO roles (name, description, is_active)
VALUES ('Super Admin', 'Full system access with all permissions', true)
ON CONFLICT (name) DO NOTHING;

-- Get the super admin role ID
DO $$
DECLARE
    super_admin_role_id UUID;
BEGIN
    SELECT id INTO super_admin_role_id FROM roles WHERE name = 'Super Admin';
    
    -- Insert permissions for all modules for Super Admin
    INSERT INTO role_permissions (role_id, module_name, can_view, can_manage, can_export, is_super_admin)
    VALUES 
        (super_admin_role_id, 'workers', true, true, true, true),
        (super_admin_role_id, 'candidates', true, true, true, true),
        (super_admin_role_id, 'projects', true, true, true, true),
        (super_admin_role_id, 'trainings', true, true, true, true),
        (super_admin_role_id, 'attendance', true, true, true, true),
        (super_admin_role_id, 'analytics', true, true, true, true),
        (super_admin_role_id, 'ai_tools', true, true, true, true),
        (super_admin_role_id, 'notifications', true, true, true, true),
        (super_admin_role_id, 'content_management', true, true, true, true),
        (super_admin_role_id, 'users_roles', true, true, true, true)
    ON CONFLICT (role_id, module_name) DO NOTHING;
END $$;

-- Create default super admin user (only if users table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users') THEN
        -- Password: SuperAdmin@123 (hashed with bcrypt, cost 10)
        INSERT INTO users (username, email, password_hash, full_name, is_active, role_id)
        SELECT 
            'superadmin',
            'superadmin@buildsewa.com',
            '$2a$10$YourHashedPasswordHere',
            'Super Administrator',
            true,
            (SELECT id FROM roles WHERE name = 'Super Admin')
        WHERE NOT EXISTS (
            SELECT 1 FROM users WHERE username = 'superadmin'
        );
    END IF;
END $$;

COMMENT ON TABLE roles IS 'Stores user roles for access control';
COMMENT ON TABLE role_permissions IS 'Stores granular permissions for each role across different modules';
COMMENT ON COLUMN role_permissions.module_name IS 'Module names: workers, candidates, projects, trainings, attendance, analytics, ai_tools, notifications, content_management, users_roles';
