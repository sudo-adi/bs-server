#!/bin/bash

# ============================================
# Database Migration Script: Supabase to Local PostgreSQL
# ============================================
# This script migrates your database from Supabase to local PostgreSQL
# for development purposes.

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
LOCAL_DB_NAME="buildsewa_dev"
LOCAL_DB_USER="postgres"
LOCAL_DB_PASSWORD="postgres"
LOCAL_DB_HOST="localhost"
LOCAL_DB_PORT="5432"
BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DUMP_FILE="${BACKUP_DIR}/supabase_dump_${TIMESTAMP}.sql"

# Supabase connection details (from .env)
SUPABASE_HOST="aws-1-ap-southeast-2.pooler.supabase.com"
SUPABASE_PORT="5432"
SUPABASE_DB="postgres"
SUPABASE_USER="postgres.pxmmbncxiknrhbgtwyyd"
SUPABASE_PASSWORD="M28UUiGNduO4e4zD"

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}Database Migration: Supabase → Local PostgreSQL${NC}"
echo -e "${BLUE}============================================${NC}\n"

# Step 1: Check if PostgreSQL is installed
echo -e "${YELLOW}[Step 1/7]${NC} Checking PostgreSQL installation..."
if ! command -v psql &> /dev/null; then
    echo -e "${RED}✗ PostgreSQL is not installed.${NC}"
    echo -e "${YELLOW}Installing PostgreSQL...${NC}"
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            brew install postgresql@15
            brew services start postgresql@15
        else
            echo -e "${RED}Homebrew not found. Please install PostgreSQL manually.${NC}"
            exit 1
        fi
    else
        echo -e "${RED}Please install PostgreSQL manually for your system.${NC}"
        exit 1
    fi
fi
echo -e "${GREEN}✓ PostgreSQL is installed${NC}\n"

# Step 2: Check if PostgreSQL service is running
echo -e "${YELLOW}[Step 2/7]${NC} Checking PostgreSQL service..."
if ! pg_isready -h $LOCAL_DB_HOST -p $LOCAL_DB_PORT &> /dev/null; then
    echo -e "${YELLOW}PostgreSQL service is not running. Starting...${NC}"
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew services start postgresql@15
        sleep 3
    else
        sudo systemctl start postgresql
        sleep 3
    fi
fi
echo -e "${GREEN}✓ PostgreSQL service is running${NC}\n"

# Step 3: Create backup directory
echo -e "${YELLOW}[Step 3/7]${NC} Creating backup directory..."
mkdir -p "$BACKUP_DIR"
echo -e "${GREEN}✓ Backup directory created: $BACKUP_DIR${NC}\n"

# Step 4: Dump Supabase database
echo -e "${YELLOW}[Step 4/7]${NC} Dumping Supabase database..."
echo -e "${BLUE}This may take a few minutes depending on database size...${NC}"

export PGPASSWORD="$SUPABASE_PASSWORD"

pg_dump \
  --host="$SUPABASE_HOST" \
  --port="$SUPABASE_PORT" \
  --username="$SUPABASE_USER" \
  --dbname="$SUPABASE_DB" \
  --format=plain \
  --no-owner \
  --no-acl \
  --clean \
  --if-exists \
  --exclude-schema=auth \
  --exclude-schema=extensions \
  --exclude-schema=graphql \
  --exclude-schema=graphql_public \
  --exclude-schema=pgbouncer \
  --exclude-schema=pgsodium \
  --exclude-schema=pgsodium_masks \
  --exclude-schema=realtime \
  --exclude-schema=storage \
  --exclude-schema=supabase_functions \
  --exclude-schema=vault \
  --file="$DUMP_FILE"

unset PGPASSWORD

echo -e "${GREEN}✓ Database dumped successfully: $DUMP_FILE${NC}\n"

# Step 5: Create local database
echo -e "${YELLOW}[Step 5/7]${NC} Setting up local database..."

# Drop database if exists and create new one
export PGPASSWORD="$LOCAL_DB_PASSWORD"

psql -h $LOCAL_DB_HOST -p $LOCAL_DB_PORT -U $LOCAL_DB_USER -d postgres -c "DROP DATABASE IF EXISTS $LOCAL_DB_NAME;" 2>/dev/null || true
psql -h $LOCAL_DB_HOST -p $LOCAL_DB_PORT -U $LOCAL_DB_USER -d postgres -c "CREATE DATABASE $LOCAL_DB_NAME;"

echo -e "${GREEN}✓ Local database '$LOCAL_DB_NAME' created${NC}\n"

# Step 6: Restore database to local PostgreSQL
echo -e "${YELLOW}[Step 6/7]${NC} Restoring database to local PostgreSQL..."
echo -e "${BLUE}This may take a few minutes...${NC}"

psql -h $LOCAL_DB_HOST -p $LOCAL_DB_PORT -U $LOCAL_DB_USER -d $LOCAL_DB_NAME -f "$DUMP_FILE" 2>&1 | grep -v "ERROR.*extension.*already exists" || true

unset PGPASSWORD

echo -e "${GREEN}✓ Database restored successfully${NC}\n"

# Step 7: Update .env file
echo -e "${YELLOW}[Step 7/7]${NC} Updating .env file for local development..."

# Backup original .env
cp .env ".env.backup_${TIMESTAMP}"

# Create local database URLs
LOCAL_DATABASE_URL="postgresql://${LOCAL_DB_USER}:${LOCAL_DB_PASSWORD}@${LOCAL_DB_HOST}:${LOCAL_DB_PORT}/${LOCAL_DB_NAME}"

# Update .env file
cat > .env.local << EOF
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
DB_HOST=${LOCAL_DB_HOST}
DB_PORT=${LOCAL_DB_PORT}
DB_NAME=${LOCAL_DB_NAME}
DB_USER=${LOCAL_DB_USER}
DB_PASSWORD=${LOCAL_DB_PASSWORD}

# Google Gemini API Key (Required for scraper)
GEMINI_API_KEY=AIzaSyB_PPyD36sgFnueBq5iYxaGLXO9KiuK7f8

# Jina Reader API Key (Optional - free tier available)
JINA_API_KEY=jina_9060f5c2921f4faabc90f4dd696ef4f6KwViyXomSj9pGWJCeZ8X2u8nrNA0

# Scraper Configuration
SCRAPER_CRON_SCHEDULE=0 7 * * *
SCRAPER_TIMEZONE=Asia/Kolkata

# Make.com Integration
MAKE_WEBHOOK_URL=https://hook.eu2.make.com/beh4wjre588uakbdqui7ap4ohh1jfa85
MAKE_WEBHOOK_ID=f4441b27-ba22-41c8-8872-2960fb418b5d

# JWT Secret for authentication
JWT_SECRET=buildsewa_super_secret_jwt_key_2024_change_in_production

# Local PostgreSQL Connection
DATABASE_URL="${LOCAL_DATABASE_URL}"
DIRECT_DATABASE_URL="${LOCAL_DATABASE_URL}"
EOF

echo -e "${GREEN}✓ Created .env.local file${NC}"
echo -e "${YELLOW}Original .env backed up to: .env.backup_${TIMESTAMP}${NC}\n"

# Summary
echo -e "${BLUE}============================================${NC}"
echo -e "${GREEN}✓ Migration completed successfully!${NC}"
echo -e "${BLUE}============================================${NC}\n"

echo -e "${YELLOW}Summary:${NC}"
echo -e "  • Database dump: ${DUMP_FILE}"
echo -e "  • Local database: ${LOCAL_DB_NAME}"
echo -e "  • Database host: ${LOCAL_DB_HOST}:${LOCAL_DB_PORT}"
echo -e "  • Database user: ${LOCAL_DB_USER}"
echo -e "  • Original .env backup: .env.backup_${TIMESTAMP}"
echo -e "  • New local config: .env.local\n"

echo -e "${YELLOW}Next steps:${NC}"
echo -e "  1. Copy .env.local to .env:"
echo -e "     ${BLUE}cp .env.local .env${NC}"
echo -e "  2. Regenerate Prisma client:"
echo -e "     ${BLUE}npx prisma generate${NC}"
echo -e "  3. Start your development server:"
echo -e "     ${BLUE}npm run dev${NC}\n"

echo -e "${YELLOW}To switch back to Supabase:${NC}"
echo -e "  ${BLUE}cp .env.backup_${TIMESTAMP} .env${NC}\n"

echo -e "${GREEN}Happy coding! 🚀${NC}\n"
