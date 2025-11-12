#!/bin/bash

# Profile API Testing Script
# This script tests all profile-related endpoints in the correct dependency order
# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Base URL - modify as needed
BASE_URL="http://localhost:3000/api/v1"

# Store created IDs for later use
SKILL_CATEGORY_ID=""
PROFILE_ID=""
ADDRESS_ID=""
PROFILE_SKILL_ID=""
QUALIFICATION_ID=""
DOCUMENT_ID=""
BANK_ACCOUNT_ID=""
INTERACTION_ID=""
BLACKLIST_ID=""

# Function to print section headers
print_section() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

# Function to print success
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Function to print error
print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Function to print info
print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Function to extract ID from JSON response
extract_id() {
    echo "$1" | grep -o '"id":"[^"]*"' | head -1 | sed 's/"id":"\([^"]*\)"/\1/'
}

# Function to make API call and extract ID
api_call() {
    local method=$1
    local endpoint=$2
    local data=$3
    local description=$4
    
    print_info "Testing: $description"
    echo "Request: $method $BASE_URL$endpoint"
    
    if [ -z "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X $method "$BASE_URL$endpoint" \
            -H "Content-Type: application/json")
    else
        echo "Data: $data"
        response=$(curl -s -w "\n%{http_code}" -X $method "$BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data")
    fi
    
    # Split response and status code
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    echo "Status: $http_code"
    echo "Response: $body" | jq '.' 2>/dev/null || echo "$body"
    
    if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
        print_success "Success: $description"
        echo "$body"
    else
        print_error "Failed: $description (HTTP $http_code)"
        echo ""
        return 1
    fi
    
    echo ""
}

#############################################
# START TESTING
#############################################

echo -e "${GREEN}"
echo "╔════════════════════════════════════════╗"
echo "║   Profile API End-to-End Test Suite   ║"
echo "╚════════════════════════════════════════╝"
echo -e "${NC}"

print_info "Base URL: $BASE_URL"
print_info "Starting comprehensive profile API testing..."
echo ""

#############################################
# 1. SKILL CATEGORIES (Prerequisite)
#############################################
print_section "1. SKILL CATEGORIES"

# Create Skill Category
response=$(api_call "POST" "/skill-categories" '{
  "name": "Test Construction Skill",
  "description": "Test skill category for construction workers",
  "is_active": true
}' "Create skill category")

if [ $? -eq 0 ]; then
    SKILL_CATEGORY_ID=$(extract_id "$response")
    print_success "Created skill category with ID: $SKILL_CATEGORY_ID"
fi

# Get all skill categories
response=$(api_call "GET" "/skill-categories" "" "Get all skill categories")

# Extract first skill category ID if we don't have one
if [ -z "$SKILL_CATEGORY_ID" ] && [ $? -eq 0 ]; then
    SKILL_CATEGORY_ID=$(echo "$response" | grep -o '"id":"[^"]*"' | head -1 | sed 's/"id":"\([^"]*\)"/\1/')
    if [ -n "$SKILL_CATEGORY_ID" ]; then
        print_success "Using existing skill category with ID: $SKILL_CATEGORY_ID"
    fi
fi

# Get specific skill category
if [ -n "$SKILL_CATEGORY_ID" ]; then
    api_call "GET" "/skill-categories/$SKILL_CATEGORY_ID" "" "Get skill category by ID"
fi

#############################################
# 2. PROFILES (Base Entity)
#############################################
print_section "2. PROFILES"

# Create Profile with unique phone number (using timestamp)
TIMESTAMP=$(date +%s)
TEST_PHONE="98765${TIMESTAMP: -5}"  # Use last 5 digits of timestamp for uniqueness
response=$(api_call "POST" "/profiles" "{
  \"phone\": \"$TEST_PHONE\",
  \"email\": \"test.profile.${TIMESTAMP}@example.com\",
  \"first_name\": \"Test\",
  \"middle_name\": \"Kumar\",
  \"last_name\": \"Singh\",
  \"fathers_name\": \"Ram Singh\",
  \"gender\": \"male\",
  \"date_of_birth\": \"1995-05-15\",
  \"is_active\": true
}" "Create profile")

if [ $? -eq 0 ]; then
    PROFILE_ID=$(extract_id "$response")
    print_success "Created profile with ID: $PROFILE_ID"
fi

# Get all profiles
api_call "GET" "/profiles?page=1&limit=10" "" "Get all profiles with pagination"

# Check mobile number
if [ -n "$TEST_PHONE" ]; then
    api_call "GET" "/profiles/check-mobile?mobile=$TEST_PHONE" "" "Check if mobile number exists"
fi

# Get specific profile
if [ -n "$PROFILE_ID" ]; then
    api_call "GET" "/profiles/$PROFILE_ID" "" "Get profile by ID"
    
    # Update profile
    api_call "PATCH" "/profiles/$PROFILE_ID" '{
      "email": "updated.profile@example.com",
      "last_name": "Updated Singh"
    }' "Update profile"
fi

#############################################
# 3. ADDRESSES
#############################################
print_section "3. ADDRESSES"

if [ -n "$PROFILE_ID" ]; then
    # Add address
    response=$(api_call "POST" "/profiles/$PROFILE_ID/addresses" '{
      "address_type": "permanent",
      "house_number": "123",
      "village_or_city": "Test City",
      "district": "Test District",
      "state": "Test State",
      "postal_code": "123456",
      "landmark": "Near Test Temple",
      "police_station": "Test PS",
      "post_office": "Test PO",
      "is_current": true
    }' "Add address to profile")
    
    if [ $? -eq 0 ]; then
        ADDRESS_ID=$(extract_id "$response")
        print_success "Created address with ID: $ADDRESS_ID"
    fi
    
    # Get all addresses for profile
    api_call "GET" "/profiles/$PROFILE_ID/addresses" "" "Get all addresses for profile"
    
    # Update address
    if [ -n "$ADDRESS_ID" ]; then
        api_call "PATCH" "/profiles/$PROFILE_ID/addresses/$ADDRESS_ID" '{
          "landmark": "Near Updated Temple",
          "is_current": false
        }' "Update address"
    fi
fi

#############################################
# 4. PROFILE SKILLS
#############################################
print_section "4. PROFILE SKILLS"

if [ -n "$PROFILE_ID" ] && [ -n "$SKILL_CATEGORY_ID" ]; then
    # Add skill to profile
    response=$(api_call "POST" "/profiles/$PROFILE_ID/skills" '{
      "skill_category_id": "'"$SKILL_CATEGORY_ID"'",
      "years_of_experience": 3,
      "is_primary": true
    }' "Add skill to profile")
    
    if [ $? -eq 0 ]; then
        PROFILE_SKILL_ID=$(extract_id "$response")
        print_success "Created profile skill with ID: $PROFILE_SKILL_ID"
    fi
    
    # Get all skills for profile
    api_call "GET" "/profiles/$PROFILE_ID/skills" "" "Get all skills for profile"
    
    # Update skill
    if [ -n "$PROFILE_SKILL_ID" ]; then
        api_call "PATCH" "/profiles/$PROFILE_ID/skills/$PROFILE_SKILL_ID" '{
          "years_of_experience": 5,
          "is_primary": true
        }' "Update profile skill"
        
        # Verify skill
        api_call "POST" "/profiles/$PROFILE_ID/skills/$PROFILE_SKILL_ID/verify" '{}' "Verify profile skill"
    fi
fi

#############################################
# 5. QUALIFICATIONS
#############################################
print_section "5. QUALIFICATIONS"

if [ -n "$PROFILE_ID" ]; then
    # Add qualification
    response=$(api_call "POST" "/profiles/$PROFILE_ID/qualifications" '{
      "institution_name": "Test University",
      "field_of_study": "Civil Engineering",
      "year_of_completion": 2018,
      "percentage_or_grade": "75%"
    }' "Add qualification to profile")
    
    if [ $? -eq 0 ]; then
        QUALIFICATION_ID=$(extract_id "$response")
        print_success "Created qualification with ID: $QUALIFICATION_ID"
    fi
    
    # Get all qualifications for profile
    api_call "GET" "/profiles/$PROFILE_ID/qualifications" "" "Get all qualifications for profile"
    
    # Update qualification
    if [ -n "$QUALIFICATION_ID" ]; then
        api_call "PATCH" "/profiles/$PROFILE_ID/qualifications/$QUALIFICATION_ID" '{
          "percentage_or_grade": "80%"
        }' "Update qualification"
        
        # Verify qualification
        api_call "POST" "/profiles/$PROFILE_ID/qualifications/$QUALIFICATION_ID/verify" '{}' "Verify qualification"
    fi
fi

#############################################
# 6. DOCUMENTS
#############################################
print_section "6. DOCUMENTS"

if [ -n "$PROFILE_ID" ]; then
    # Add document
    response=$(api_call "POST" "/profiles/$PROFILE_ID/documents" '{
      "file_name": "test_document.pdf",
      "file_url": "https://example.com/documents/test_document.pdf",
      "file_size": 102400,
      "document_number": "DOC123456"
    }' "Add document to profile")
    
    if [ $? -eq 0 ]; then
        DOCUMENT_ID=$(extract_id "$response")
        print_success "Created document with ID: $DOCUMENT_ID"
    fi
    
    # Get all documents for profile
    api_call "GET" "/profiles/$PROFILE_ID/documents" "" "Get all documents for profile"
    
    # Update document
    if [ -n "$DOCUMENT_ID" ]; then
        api_call "PATCH" "/profiles/$PROFILE_ID/documents/$DOCUMENT_ID" '{
          "verification_status": "verified"
        }' "Update document"
        
        # Verify document
        api_call "POST" "/profiles/$PROFILE_ID/documents/$DOCUMENT_ID/verify" '{}' "Verify document"
    fi
fi

#############################################
# 7. BANK ACCOUNTS
#############################################
print_section "7. BANK ACCOUNTS"

if [ -n "$PROFILE_ID" ]; then
    # Add bank account
    response=$(api_call "POST" "/profiles/$PROFILE_ID/bank-accounts" '{
      "account_holder_name": "Test Kumar Singh",
      "account_number": "1234567890",
      "ifsc_code": "SBIN0001234",
      "bank_name": "State Bank of India",
      "branch_name": "Test Branch",
      "account_type": "savings",
      "is_primary": true
    }' "Add bank account to profile")
    
    if [ $? -eq 0 ]; then
        BANK_ACCOUNT_ID=$(extract_id "$response")
        print_success "Created bank account with ID: $BANK_ACCOUNT_ID"
    fi
    
    # Get all bank accounts for profile
    api_call "GET" "/profiles/$PROFILE_ID/bank-accounts" "" "Get all bank accounts for profile"
    
    # Update bank account
    if [ -n "$BANK_ACCOUNT_ID" ]; then
        api_call "PATCH" "/profiles/$PROFILE_ID/bank-accounts/$BANK_ACCOUNT_ID" '{
          "verification_status": "verified"
        }' "Update bank account"
        
        # Verify bank account
        api_call "POST" "/profiles/$PROFILE_ID/bank-accounts/$BANK_ACCOUNT_ID/verify" '{}' "Verify bank account"
    fi
fi

#############################################
# 8. INTERACTIONS
#############################################
print_section "8. INTERACTIONS"

if [ -n "$PROFILE_ID" ]; then
    # Add interaction
    response=$(api_call "POST" "/profiles/$PROFILE_ID/interactions" '{
      "subject": "Initial Contact",
      "description": "First interaction with the candidate",
      "outcome": "positive",
      "next_follow_up_date": "2024-12-01"
    }' "Add interaction to profile")
    
    if [ $? -eq 0 ]; then
        INTERACTION_ID=$(extract_id "$response")
        print_success "Created interaction with ID: $INTERACTION_ID"
    fi
    
    # Get all interactions for profile
    api_call "GET" "/profiles/$PROFILE_ID/interactions" "" "Get all interactions for profile"
    
    # Update interaction
    if [ -n "$INTERACTION_ID" ]; then
        api_call "PATCH" "/profiles/$PROFILE_ID/interactions/$INTERACTION_ID" '{
          "outcome": "very positive",
          "next_follow_up_date": "2024-11-25"
        }' "Update interaction"
    fi
fi

#############################################
# 9. PROFILE BLACKLIST
#############################################
print_section "9. PROFILE BLACKLIST"

if [ -n "$PROFILE_ID" ]; then
    # Check if profile is blacklisted
    api_call "GET" "/profiles/blacklist/profile/$PROFILE_ID" "" "Check if profile is blacklisted"
    
    # Get blacklist history
    api_call "GET" "/profiles/blacklist/profile/$PROFILE_ID/history" "" "Get profile blacklist history"
    
    # Blacklist profile
    response=$(api_call "POST" "/profiles/blacklist/profile/$PROFILE_ID" '{
      "reason": "Test blacklist reason - inappropriate behavior during interview"
    }' "Blacklist profile")
    
    if [ $? -eq 0 ]; then
        BLACKLIST_ID=$(extract_id "$response")
        print_success "Blacklisted profile with ID: $BLACKLIST_ID"
    fi
    
    # Get all blacklisted profiles (collection endpoint)
    api_call "GET" "/profiles/blacklist" "" "Get all blacklisted profiles"
    
    # Get specific blacklist entry by ID
    if [ -n "$BLACKLIST_ID" ]; then
        api_call "GET" "/profiles/blacklist/$BLACKLIST_ID" "" "Get blacklist entry by ID"
    fi
    
    # Update blacklist entry
    if [ -n "$BLACKLIST_ID" ]; then
        api_call "PATCH" "/profiles/blacklist/$BLACKLIST_ID" '{
          "reason": "Updated reason - issue resolved"
        }' "Update blacklist entry"
    fi
    
    # Remove from blacklist (reactivate the entry first so DELETE can work)
    if [ -n "$BLACKLIST_ID" ]; then
        # First reactivate the blacklist entry
        api_call "PATCH" "/profiles/blacklist/$BLACKLIST_ID" '{
          "is_active": true
        }' "Reactivate blacklist entry"
        
        # Now remove from blacklist
        api_call "DELETE" "/profiles/blacklist/profile/$PROFILE_ID" "" "Remove profile from blacklist"
    fi
fi

#############################################
# 10. STAGE MANAGEMENT
#############################################
print_section "10. STAGE MANAGEMENT"

if [ -n "$PROFILE_ID" ]; then
    # Change profile stage
    api_call "POST" "/profiles/$PROFILE_ID/stage" '{
      "to_stage": "interviewed",
      "notes": "Profile moved to interviewed stage"
    }' "Change profile stage"
fi

#############################################
# CLEANUP (Optional - Delete created entities)
#############################################
print_section "11. CLEANUP (Deleting Test Data)"

print_info "Do you want to delete the test data? (y/n)"
read -r -t 10 cleanup_response || cleanup_response="n"

if [ "$cleanup_response" = "y" ] || [ "$cleanup_response" = "Y" ]; then
    # Delete in reverse order of creation
    
    if [ -n "$PROFILE_ID" ] && [ -n "$INTERACTION_ID" ]; then
        api_call "DELETE" "/profiles/$PROFILE_ID/interactions/$INTERACTION_ID" "" "Delete interaction"
    fi
    
    if [ -n "$PROFILE_ID" ] && [ -n "$BANK_ACCOUNT_ID" ]; then
        api_call "DELETE" "/profiles/$PROFILE_ID/bank-accounts/$BANK_ACCOUNT_ID" "" "Delete bank account"
    fi
    
    if [ -n "$PROFILE_ID" ] && [ -n "$DOCUMENT_ID" ]; then
        api_call "DELETE" "/profiles/$PROFILE_ID/documents/$DOCUMENT_ID" "" "Delete document"
    fi
    
    if [ -n "$PROFILE_ID" ] && [ -n "$QUALIFICATION_ID" ]; then
        api_call "DELETE" "/profiles/$PROFILE_ID/qualifications/$QUALIFICATION_ID" "" "Delete qualification"
    fi
    
    if [ -n "$PROFILE_ID" ] && [ -n "$PROFILE_SKILL_ID" ]; then
        api_call "DELETE" "/profiles/$PROFILE_ID/skills/$PROFILE_SKILL_ID" "" "Delete profile skill"
    fi
    
    if [ -n "$PROFILE_ID" ] && [ -n "$ADDRESS_ID" ]; then
        api_call "DELETE" "/profiles/$PROFILE_ID/addresses/$ADDRESS_ID" "" "Delete address"
    fi
    
    if [ -n "$PROFILE_ID" ]; then
        api_call "DELETE" "/profiles/$PROFILE_ID" "" "Delete profile"
    fi
    
    if [ -n "$SKILL_CATEGORY_ID" ]; then
        api_call "DELETE" "/skill-categories/$SKILL_CATEGORY_ID" "" "Delete skill category"
    fi
    
    print_success "Cleanup completed!"
else
    print_info "Skipping cleanup. Test data remains in the database."
    echo ""
    print_info "Created entity IDs (for manual cleanup if needed):"
    [ -n "$SKILL_CATEGORY_ID" ] && echo "  Skill Category ID: $SKILL_CATEGORY_ID"
    [ -n "$PROFILE_ID" ] && echo "  Profile ID: $PROFILE_ID"
    [ -n "$ADDRESS_ID" ] && echo "  Address ID: $ADDRESS_ID"
    [ -n "$PROFILE_SKILL_ID" ] && echo "  Profile Skill ID: $PROFILE_SKILL_ID"
    [ -n "$QUALIFICATION_ID" ] && echo "  Qualification ID: $QUALIFICATION_ID"
    [ -n "$DOCUMENT_ID" ] && echo "  Document ID: $DOCUMENT_ID"
    [ -n "$BANK_ACCOUNT_ID" ] && echo "  Bank Account ID: $BANK_ACCOUNT_ID"
    [ -n "$INTERACTION_ID" ] && echo "  Interaction ID: $INTERACTION_ID"
    [ -n "$BLACKLIST_ID" ] && echo "  Blacklist ID: $BLACKLIST_ID"
fi

#############################################
# SUMMARY
#############################################
echo ""
print_section "TEST SUMMARY"
echo -e "${GREEN}✓ All profile API endpoints have been tested${NC}"
echo -e "${YELLOW}ℹ Review the output above for any failed tests${NC}"
echo -e "${BLUE}ℹ Base URL used: $BASE_URL${NC}"
echo ""
echo -e "${GREEN}Testing completed!${NC}"
