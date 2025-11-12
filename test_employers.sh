#!/bin/bash

# Employer APIs Test Script
# Tests all employer-related endpoints with curl

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Base URL
BASE_URL="${API_URL:-http://localhost:3000/api/v1}"

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Function to print section headers
print_section() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

# Function to print test results
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ PASSED${NC}: $2"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}✗ FAILED${NC}: $2"
        ((TESTS_FAILED++))
    fi
}

# Function to test API endpoint
test_api() {
    local method=$1
    local endpoint=$2
    local data=$3
    local description=$4
    
    echo -e "${YELLOW}Testing:${NC} $description"
    echo -e "${YELLOW}Method:${NC} $method"
    echo -e "${YELLOW}Endpoint:${NC} $BASE_URL$endpoint"
    
    if [ -n "$data" ]; then
        echo -e "${YELLOW}Data:${NC} $data"
        response=$(curl -s -w "\n%{http_code}" -X $method \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$BASE_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X $method \
            -H "Content-Type: application/json" \
            "$BASE_URL$endpoint")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    echo -e "${YELLOW}Response Code:${NC} $http_code"
    echo -e "${YELLOW}Response Body:${NC}"
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
    
    # Check if status code indicates success (2xx)
    if [[ $http_code =~ ^2[0-9]{2}$ ]]; then
        print_result 0 "$description"
        echo "$body"
        return 0
    else
        print_result 1 "$description (HTTP $http_code)"
        return 1
    fi
}

# Store IDs for dependent tests
EMPLOYER_ID=""
AUTHORIZED_PERSON_ID=""
PROJECT_REQUEST_ID=""

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Employer APIs Test Suite            ║${NC}"
echo -e "${BLUE}║   Testing: $BASE_URL${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"

# ============================================
# 1. EMPLOYER CRUD OPERATIONS
# ============================================
print_section "1. EMPLOYER CRUD OPERATIONS"

# Create Employer
employer_data='{
  "company_name": "Tech Solutions Pvt Ltd",
  "company_registration_number": "CRN123456789",
  "industry_type": "Information Technology",
  "company_size": "50-200",
  "website": "https://techsolutions.example.com",
  "description": "Leading IT solutions provider",
  "email": "hr@techsolutions.example.com",
  "phone": "9876543210",
  "address": "123 Tech Park, Bangalore",
  "city": "Bangalore",
  "state": "Karnataka",
  "postal_code": "560001",
  "gst_number": "29ABCDE1234F1Z5",
  "pan_number": "ABCDE1234F"
}'

response=$(test_api "POST" "/employers" "$employer_data" "Create new employer")
if [ $? -eq 0 ]; then
    EMPLOYER_ID=$(echo "$response" | jq -r '.data.id // .id' 2>/dev/null)
    echo -e "${GREEN}Created Employer ID: $EMPLOYER_ID${NC}"
fi

sleep 1

# Get All Employers
test_api "GET" "/employers" "" "Get all employers"
sleep 1

# Get Employer by ID
if [ -n "$EMPLOYER_ID" ]; then
    test_api "GET" "/employers/$EMPLOYER_ID" "" "Get employer by ID"
    sleep 1
fi

# Update Employer
if [ -n "$EMPLOYER_ID" ]; then
    update_data='{
      "company_name": "Tech Solutions Pvt Ltd - Updated",
      "company_size": "200-500"
    }'
    test_api "PATCH" "/employers/$EMPLOYER_ID" "$update_data" "Update employer"
    sleep 1
fi

# Approve Employer
if [ -n "$EMPLOYER_ID" ]; then
    approve_data='{
      "approval_status": "approved",
      "approval_notes": "All documents verified"
    }'
    test_api "POST" "/employers/$EMPLOYER_ID/approve" "$approve_data" "Approve employer"
    sleep 1
fi

# ============================================
# 2. AUTHORIZED PERSONS MANAGEMENT
# ============================================
print_section "2. AUTHORIZED PERSONS MANAGEMENT"

if [ -n "$EMPLOYER_ID" ]; then
    # Create Authorized Person
    authorized_person_data='{
      "employer_id": "'$EMPLOYER_ID'",
      "full_name": "John Doe",
      "designation": "HR Manager",
      "email": "john.doe@techsolutions.com",
      "phone": "9876543211",
      "is_primary_contact": true
    }'
    
    response=$(test_api "POST" "/employers/authorized-persons" "$authorized_person_data" "Create authorized person")
    if [ $? -eq 0 ]; then
        AUTHORIZED_PERSON_ID=$(echo "$response" | jq -r '.data.id // .id' 2>/dev/null)
        echo -e "${GREEN}Created Authorized Person ID: $AUTHORIZED_PERSON_ID${NC}"
    fi
    sleep 1
    
    # Get all authorized persons for employer
    test_api "GET" "/employers/authorized-persons/employer/$EMPLOYER_ID" "" "Get authorized persons by employer"
    sleep 1
    
    # Get authorized person by ID
    if [ -n "$AUTHORIZED_PERSON_ID" ]; then
        test_api "GET" "/employers/authorized-persons/$AUTHORIZED_PERSON_ID" "" "Get authorized person by ID"
        sleep 1
        
        # Update authorized person
        update_person_data='{
          "designation": "Senior HR Manager",
          "phone": "9876543299"
        }'
        test_api "PATCH" "/employers/authorized-persons/$AUTHORIZED_PERSON_ID" "$update_person_data" "Update authorized person"
        sleep 1
    fi
fi

# ============================================
# 3. PROJECT REQUESTS MANAGEMENT
# ============================================
print_section "3. PROJECT REQUESTS MANAGEMENT"

if [ -n "$EMPLOYER_ID" ]; then
    # Create Project Request
    project_request_data='{
      "employer_id": "'$EMPLOYER_ID'",
      "project_title": "Mobile App Development",
      "project_description": "Need experienced developers for mobile app development",
      "project_type": "contract",
      "project_duration_months": 6,
      "budget_min": 500000,
      "budget_max": 1000000,
      "required_skills": ["React Native", "Node.js", "MongoDB"],
      "number_of_positions": 5,
      "location": "Bangalore",
      "work_mode": "hybrid",
      "start_date": "2025-12-01",
      "priority": "high"
    }'
    
    response=$(test_api "POST" "/employers/project-requests" "$project_request_data" "Create project request")
    if [ $? -eq 0 ]; then
        PROJECT_REQUEST_ID=$(echo "$response" | jq -r '.data.id // .id' 2>/dev/null)
        echo -e "${GREEN}Created Project Request ID: $PROJECT_REQUEST_ID${NC}"
    fi
    sleep 1
    
    # Get all project requests
    test_api "GET" "/employers/project-requests" "" "Get all project requests"
    sleep 1
    
    # Get project requests by employer
    test_api "GET" "/employers/project-requests/employer/$EMPLOYER_ID" "" "Get project requests by employer"
    sleep 1
    
    # Get project request by ID
    if [ -n "$PROJECT_REQUEST_ID" ]; then
        test_api "GET" "/employers/project-requests/$PROJECT_REQUEST_ID" "" "Get project request by ID"
        sleep 1
        
        # Update project request
        update_project_data='{
          "project_title": "Mobile App Development - Updated",
          "number_of_positions": 7
        }'
        test_api "PATCH" "/employers/project-requests/$PROJECT_REQUEST_ID" "$update_project_data" "Update project request"
        sleep 1
        
        # Review project request
        review_data='{
          "review_status": "approved",
          "review_notes": "Project requirements are clear and feasible"
        }'
        test_api "POST" "/employers/project-requests/$PROJECT_REQUEST_ID/review" "$review_data" "Review project request"
        sleep 1
    fi
fi

# ============================================
# 4. EMPLOYEE REGISTRATION (PUBLIC)
# ============================================
print_section "4. EMPLOYEE REGISTRATION (PUBLIC)"

# Register Employee
employee_data='{
  "phone": "9876543299",
  "full_name": "Rajesh Kumar Singh",
  "fathers_name": "Ram Kumar Singh",
  "village": "Dharavi",
  "district": "Mumbai",
  "state": "Maharashtra",
  "postal_code": "400017"
}'

test_api "POST" "/employee/register" "$employee_data" "Register employee"
sleep 1

# Check Registration Status
test_api "GET" "/employee/status/9876543299" "" "Check employee registration status"
sleep 1

# ============================================
# 5. CLEANUP (DELETE OPERATIONS)
# ============================================
print_section "5. CLEANUP - DELETE OPERATIONS"

# Delete project request
if [ -n "$PROJECT_REQUEST_ID" ]; then
    test_api "DELETE" "/employers/project-requests/$PROJECT_REQUEST_ID" "" "Delete project request"
    sleep 1
fi

# Delete authorized person
if [ -n "$AUTHORIZED_PERSON_ID" ]; then
    test_api "DELETE" "/employers/authorized-persons/$AUTHORIZED_PERSON_ID" "" "Delete authorized person"
    sleep 1
fi

# Delete employer
if [ -n "$EMPLOYER_ID" ]; then
    test_api "DELETE" "/employers/$EMPLOYER_ID" "" "Delete employer"
    sleep 1
fi

# ============================================
# TEST SUMMARY
# ============================================
print_section "TEST SUMMARY"

TOTAL_TESTS=$((TESTS_PASSED + TESTS_FAILED))
SUCCESS_RATE=$(awk "BEGIN {printf \"%.2f\", ($TESTS_PASSED/$TOTAL_TESTS)*100}")

echo -e "${BLUE}Total Tests:${NC} $TOTAL_TESTS"
echo -e "${GREEN}Passed:${NC} $TESTS_PASSED"
echo -e "${RED}Failed:${NC} $TESTS_FAILED"
echo -e "${BLUE}Success Rate:${NC} $SUCCESS_RATE%"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "\n${GREEN}╔════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║   ALL TESTS PASSED! ✓                 ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
    exit 0
else
    echo -e "\n${RED}╔════════════════════════════════════════╗${NC}"
    echo -e "${RED}║   SOME TESTS FAILED ✗                 ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════╝${NC}"
    exit 1
fi
