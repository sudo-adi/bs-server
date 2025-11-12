#!/bin/bash

BASE_URL="http://localhost:3000/api/v1"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "Testing Blacklist API Refactoring"
echo "=================================="

# Use an existing profile ID from the database
PROFILE_ID="e7b96376-5189-4a4b-b00d-272e869c83f7"

echo -e "\n${BLUE}1. Check if profile is blacklisted${NC}"
response=$(curl -s -w "\n%{http_code}" "$BASE_URL/profiles/blacklist/profile/$PROFILE_ID")
status=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)
echo "Status: $status"
echo "$body" | jq -r '.'
[ "$status" = "200" ] && echo -e "${GREEN}✓ PASS${NC}" || echo -e "${RED}✗ FAIL${NC}"

echo -e "\n${BLUE}2. Get blacklist history for profile${NC}"
response=$(curl -s -w "\n%{http_code}" "$BASE_URL/profiles/blacklist/profile/$PROFILE_ID/history")
status=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)
echo "Status: $status"
echo "$body" | jq -r '.'
[ "$status" = "200" ] && echo -e "${GREEN}✓ PASS${NC}" || echo -e "${RED}✗ FAIL${NC}"

echo -e "\n${BLUE}3. Blacklist the profile${NC}"
response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/profiles/blacklist/profile/$PROFILE_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Test blacklist - API refactoring verification"
  }')
status=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)
echo "Status: $status"
echo "$body" | jq -r '.'
BLACKLIST_ID=$(echo "$body" | jq -r '.data.id')
echo "Blacklist ID: $BLACKLIST_ID"
[ "$status" = "201" ] && echo -e "${GREEN}✓ PASS${NC}" || echo -e "${RED}✗ FAIL${NC}"

echo -e "\n${BLUE}4. Get all blacklisted profiles (NEW ROUTE)${NC}"
response=$(curl -s -w "\n%{http_code}" "$BASE_URL/profiles/blacklist")
status=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)
echo "Status: $status"
echo "$body" | jq -r '.total'
[ "$status" = "200" ] && echo -e "${GREEN}✓ PASS - This is the key endpoint that was failing!${NC}" || echo -e "${RED}✗ FAIL${NC}"

echo -e "\n${BLUE}5. Get specific blacklist entry by ID (NEW ENDPOINT)${NC}"
response=$(curl -s -w "\n%{http_code}" "$BASE_URL/profiles/blacklist/$BLACKLIST_ID")
status=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)
echo "Status: $status"
echo "$body" | jq -r '.data.id'
[ "$status" = "200" ] && echo -e "${GREEN}✓ PASS - New RESTful endpoint working!${NC}" || echo -e "${RED}✗ FAIL${NC}"

echo -e "\n${BLUE}6. Update blacklist entry by ID${NC}"
response=$(curl -s -w "\n%{http_code}" -X PATCH "$BASE_URL/profiles/blacklist/$BLACKLIST_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Updated reason - issue resolved"
  }')
status=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)
echo "Status: $status"
echo "$body" | jq -r '.data.reason'
[ "$status" = "200" ] && echo -e "${GREEN}✓ PASS${NC}" || echo -e "${RED}✗ FAIL${NC}"

echo -e "\n${BLUE}7. Remove profile from blacklist${NC}"
response=$(curl -s -w "\n%{http_code}" -X DELETE "$BASE_URL/profiles/blacklist/profile/$PROFILE_ID")
status=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)
echo "Status: $status"
echo "$body" | jq -r '.message'
[ "$status" = "200" ] && echo -e "${GREEN}✓ PASS${NC}" || echo -e "${RED}✗ FAIL${NC}"

echo -e "\n=================================="
echo "Blacklist API Refactoring Test Complete"
echo "=================================="
