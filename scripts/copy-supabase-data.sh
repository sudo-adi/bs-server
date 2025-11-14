#!/bin/bash

# ============================================
# Copy Data from Supabase to Local PostgreSQL
# ============================================
# This script copies data from Supabase to your local database

set -e

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
LOCAL_DB="postgresql://postgres:postgres@localhost:5432/buildsewa_dev"
SUPABASE_DB="postgresql://postgres.pxmmbncxiknrhbgtwyyd:M28UUiGNduO4e4zD@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres"

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}Copying Data: Supabase → Local PostgreSQL${NC}"
echo -e "${BLUE}============================================${NC}\n"

echo -e "${YELLOW}⚠️  This will copy ALL data from Supabase to your local database${NC}"
echo -e "${YELLOW}⚠️  This may take several minutes depending on data size${NC}\n"

read -p "Continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 1
fi

echo -e "\n${BLUE}Copying data...${NC}\n"

# Get list of tables from Supabase
echo "Getting table list..."
TABLES=$(psql "$SUPABASE_DB" -t -c "
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
" | grep -v '^$' | tr -d ' ')

# Copy each table
for TABLE in $TABLES; do
    echo -e "${YELLOW}Copying table: $TABLE${NC}"
    
    # Disable foreign key checks temporarily
    psql "$LOCAL_DB" -c "SET session_replication_role = 'replica';" >/dev/null 2>&1
    
    # Truncate local table
    psql "$LOCAL_DB" -c "TRUNCATE TABLE $TABLE CASCADE;" >/dev/null 2>&1 || true
    
    # Copy data using COPY command (much faster than INSERT)
    psql "$SUPABASE_DB" -c "COPY $TABLE TO STDOUT;" | psql "$LOCAL_DB" -c "COPY $TABLE FROM STDIN;" 2>/dev/null || {
        echo -e "  ⚠️  Skipped (no data or error)"
        continue
    }
    
    # Re-enable foreign key checks
    psql "$LOCAL_DB" -c "SET session_replication_role = 'origin';" >/dev/null 2>&1
    
    echo -e "${GREEN}  ✓ $TABLE copied${NC}"
done

# Reset sequences
echo -e "\n${BLUE}Resetting sequences...${NC}"
psql "$LOCAL_DB" -c "
SELECT setval(pg_get_serial_sequence(quote_ident(schemaname) || '.' || quote_ident(tablename), columnname), 
              COALESCE((SELECT MAX(\"$columnname\") FROM \"$tablename\"), 1), 
              true)
FROM (
    SELECT schemaname, tablename, columnname
    FROM pg_attribute a
    JOIN pg_class c ON a.attrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE a.atthasdef = true
    AND pg_get_expr(d.adbin, d.adrelid) LIKE 'nextval%'
    AND n.nspname = 'public'
) AS sequences;
" >/dev/null 2>&1 || true

echo -e "${GREEN}✓ Sequences reset${NC}\n"

echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}✓ Data copy completed!${NC}"
echo -e "${GREEN}============================================${NC}\n"

echo -e "${YELLOW}Verify the data:${NC}"
echo -e "  ${BLUE}psql -U postgres -d buildsewa_dev${NC}\n"
