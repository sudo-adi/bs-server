#!/bin/bash

# ============================================
# Quick Database Dump from Supabase
# ============================================
# This script creates a SQL dump of your Supabase database
# that can be easily imported into local PostgreSQL

set -e

# Configuration
BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DUMP_FILE="${BACKUP_DIR}/supabase_schema_and_data_${TIMESTAMP}.sql"

# Supabase connection details
SUPABASE_HOST="aws-1-ap-southeast-2.pooler.supabase.com"
SUPABASE_PORT="5432"
SUPABASE_DB="postgres"
SUPABASE_USER="postgres.pxmmbncxiknrhbgtwyyd"
SUPABASE_PASSWORD="M28UUiGNduO4e4zD"

echo "🔄 Creating database dump from Supabase..."

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Set password for pg_dump
export PGPASSWORD="$SUPABASE_PASSWORD"

# Dump the database (excluding Supabase internal schemas)
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

echo "✅ Database dump created successfully!"
echo "📁 File: $DUMP_FILE"
echo ""
echo "To import into local PostgreSQL:"
echo "  1. Create database: createdb buildsewa_dev"
echo "  2. Import dump: psql -U postgres -d buildsewa_dev -f $DUMP_FILE"
