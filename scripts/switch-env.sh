#!/bin/bash

# ============================================
# Environment Switcher
# ============================================
# Quickly switch between local and Supabase databases

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check current environment
if grep -q "localhost:5432" .env 2>/dev/null; then
    CURRENT="local"
else
    CURRENT="supabase"
fi

echo -e "${BLUE}Current environment: ${YELLOW}$CURRENT${NC}\n"

echo "Select environment:"
echo "  1) Local PostgreSQL"
echo "  2) Supabase (Production)"
echo "  3) Show current config"
echo "  4) Exit"
echo ""
read -p "Choice (1-4): " choice

case $choice in
    1)
        if [ "$CURRENT" = "local" ]; then
            echo -e "${YELLOW}Already using local database${NC}"
            exit 0
        fi
        
        if [ ! -f .env.local ]; then
            echo -e "${YELLOW}⚠️  .env.local not found. Run ./scripts/setup-local-db.sh first${NC}"
            exit 1
        fi
        
        echo -e "${BLUE}Switching to local database...${NC}"
        cp .env .env.backup_manual_$(date +%Y%m%d_%H%M%S)
        cp .env.local .env
        npx prisma generate >/dev/null 2>&1
        echo -e "${GREEN}✓ Switched to local PostgreSQL${NC}"
        echo -e "${YELLOW}Connection: postgresql://postgres:postgres@localhost:5432/buildsewa_dev${NC}"
        ;;
    
    2)
        if [ "$CURRENT" = "supabase" ]; then
            echo -e "${YELLOW}Already using Supabase${NC}"
            exit 0
        fi
        
        # Find most recent backup
        BACKUP=$(ls -t .env.backup_* 2>/dev/null | head -1)
        
        if [ -z "$BACKUP" ]; then
            echo -e "${YELLOW}⚠️  No Supabase backup found${NC}"
            exit 1
        fi
        
        echo -e "${BLUE}Switching to Supabase...${NC}"
        cp "$BACKUP" .env
        npx prisma generate >/dev/null 2>&1
        echo -e "${GREEN}✓ Switched to Supabase${NC}"
        echo -e "${YELLOW}Restored from: $BACKUP${NC}"
        ;;
    
    3)
        echo -e "\n${BLUE}Current configuration:${NC}"
        echo -e "${YELLOW}DATABASE_URL:${NC}"
        grep "^DATABASE_URL=" .env | sed 's/DATABASE_URL=//'
        echo ""
        echo -e "${YELLOW}Environment:${NC} $CURRENT"
        ;;
    
    4)
        echo "Bye!"
        exit 0
        ;;
    
    *)
        echo -e "${YELLOW}Invalid choice${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}Ready to start server:${NC} ${BLUE}npm run dev${NC}"
