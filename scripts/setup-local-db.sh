#!/bin/bash

# ============================================
# Simple Database Migration using Prisma
# ============================================
# This script uses Prisma to pull schema and creates a migration

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
LOCAL_DB_NAME="buildsewa_dev"
LOCAL_DB_USER="postgres"
LOCAL_DB_PASSWORD="postgres"
LOCAL_DB_HOST="localhost"
LOCAL_DB_PORT="5432"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}Database Migration: Supabase → Local PostgreSQL${NC}"
echo -e "${BLUE}============================================${NC}\n"

# Step 1: Check PostgreSQL
echo -e "${YELLOW}[Step 1/5]${NC} Checking PostgreSQL..."
if ! command -v psql &> /dev/null; then
    echo -e "${RED}✗ PostgreSQL not found${NC}"
    exit 1
fi
echo -e "${GREEN}✓ PostgreSQL is available${NC}\n"

# Step 2: Create local database
echo -e "${YELLOW}[Step 2/5]${NC} Creating local database..."
export PGPASSWORD="$LOCAL_DB_PASSWORD"

psql -h $LOCAL_DB_HOST -p $LOCAL_DB_PORT -U $LOCAL_DB_USER -d postgres -c "DROP DATABASE IF EXISTS $LOCAL_DB_NAME;" 2>/dev/null || true
psql -h $LOCAL_DB_HOST -p $LOCAL_DB_PORT -U $LOCAL_DB_USER -d postgres -c "CREATE DATABASE $LOCAL_DB_NAME;"

# Enable required extensions
psql -h $LOCAL_DB_HOST -p $LOCAL_DB_PORT -U $LOCAL_DB_USER -d $LOCAL_DB_NAME -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";" >/dev/null 2>&1

unset PGPASSWORD

echo -e "${GREEN}✓ Database '$LOCAL_DB_NAME' created with extensions${NC}\n"

# Step 3: Backup .env
echo -e "${YELLOW}[Step 3/5]${NC} Backing up .env file..."
cp .env ".env.backup_${TIMESTAMP}"
echo -e "${GREEN}✓ Backup created: .env.backup_${TIMESTAMP}${NC}\n"

# Step 4: Create local .env
echo -e "${YELLOW}[Step 4/5]${NC} Creating local database configuration..."

LOCAL_DATABASE_URL="postgresql://${LOCAL_DB_USER}:${LOCAL_DB_PASSWORD}@${LOCAL_DB_HOST}:${LOCAL_DB_PORT}/${LOCAL_DB_NAME}"

cat > .env.local << 'EOF'
# Server Configuration
NODE_ENV=development
PORT=3000
HOST=localhost

# API Configuration
API_PREFIX=/api/v1

# CORS Configuration
CORS_ORIGIN=*

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info

# Local Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=buildsewa_dev
DB_USER=postgres
DB_PASSWORD=postgres

# Google Gemini API Key
GEMINI_API_KEY=AIzaSyB_PPyD36sgFnueBq5iYxaGLXO9KiuK7f8

# Jina Reader API Key
JINA_API_KEY=jina_9060f5c2921f4faabc90f4dd696ef4f6KwViyXomSj9pGWJCeZ8X2u8nrNA0

# Scraper Configuration
SCRAPER_CRON_SCHEDULE=0 7 * * *
SCRAPER_TIMEZONE=Asia/Kolkata

# Make.com Integration
MAKE_WEBHOOK_URL=https://hook.eu2.make.com/beh4wjre588uakbdqui7ap4ohh1jfa85
MAKE_WEBHOOK_ID=f4441b27-ba22-41c8-8872-2960fb418b5d

# JWT Secret
JWT_SECRET=buildsewa_super_secret_jwt_key_2024_change_in_production

# Local PostgreSQL Connection
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/buildsewa_dev"
DIRECT_DATABASE_URL="postgresql://postgres:postgres@localhost:5432/buildsewa_dev"
EOF

echo -e "${GREEN}✓ Created .env.local${NC}\n"

# Step 5: Push schema to local database
echo -e "${YELLOW}[Step 5/5]${NC} Pushing schema to local database using Prisma..."
echo -e "${BLUE}This will create all tables and schema...${NC}\n"

npx prisma db push --accept-data-loss

echo -e "${GREEN}✓ Schema pushed to local database${NC}\n"

# Summary
echo -e "${BLUE}============================================${NC}"
echo -e "${GREEN}✓ Migration setup completed!${NC}"
echo -e "${BLUE}============================================${NC}\n"

echo -e "${YELLOW}Summary:${NC}"
echo -e "  • Local database: ${LOCAL_DB_NAME}"
echo -e "  • Database host: ${LOCAL_DB_HOST}:${LOCAL_DB_PORT}"
echo -e "  • Database user: ${LOCAL_DB_USER}"
echo -e "  • Configuration: .env.local"
echo -e "  • Backup: .env.backup_${TIMESTAMP}\n"

echo -e "${YELLOW}⚠️  Important: The local database has the schema but NO DATA${NC}\n"

echo -e "${YELLOW}Next steps:${NC}"
echo -e "  1. Switch to local database:"
echo -e "     ${BLUE}cp .env.local .env${NC}"
echo -e "  2. Regenerate Prisma client:"
echo -e "     ${BLUE}npx prisma generate${NC}"
echo -e "  3. (Optional) Seed database with test data:"
echo -e "     ${BLUE}npm run seed${NC}"
echo -e "  4. Start development server:"
echo -e "     ${BLUE}npm run dev${NC}\n"

echo -e "${YELLOW}To copy data from Supabase (optional):${NC}"
echo -e "  Run: ${BLUE}./scripts/copy-supabase-data.sh${NC}\n"

echo -e "${YELLOW}To switch back to Supabase:${NC}"
echo -e "  ${BLUE}cp .env.backup_${TIMESTAMP} .env && npx prisma generate${NC}\n"

echo -e "${GREEN}Happy coding! 🚀${NC}\n"
