#!/bin/bash

# Complete Flow Test Script
# This tests the entire flow from employer registration to worker allocation

BASE_URL="http://localhost:3000"

echo "=========================================="
echo "COMPLETE FLOW TEST - BuildSewa"
echo "=========================================="
echo ""

# Store tokens and IDs
SUPERADMIN_TOKEN=""
EMPLOYER_TOKEN=""
EMPLOYER_ID=""
PROJECT_REQUEST_ID=""
PROJECT_ID=""
CANDIDATE_ID=""
BATCH_ID=""
ALLOCATION_ID=""

echo "Step 1: Register Employer with Project Request"
echo "----------------------------------------------"
EMPLOYER_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/v1/auth/employer/register" \
  -H "Content-Type: application/json" \
  -d '{
    "company_name": "Tech Construction Ltd",
    "client_name": "Tech Construction Client",
    "email": "techconstruction-$(date +%s)@example.com",
    "password": "TechConstruction@123",
    "phone": "9876543210",
    "alt_phone": "9876543211",
    "registered_address": "123 Construction Avenue, Building Block, Tech City",
    "company_registration_number": "CRN2024001",
    "gst_number": "29ABCDE1234F1Z5",
    "authorized_person_name": "Rajesh Kumar",
    "authorized_person_designation": "Project Manager",
    "authorized_person_email": "rajesh.kumar@techconstruction.com",
    "authorized_person_contact": "9876543212",
    "authorized_person_address": "456 Manager Street, Tech City",
    "project_name": "Downtown Office Complex",
    "project_description": "Construction of a 10-story office building with modern amenities and green building features",
    "site_address": "Plot 789, Downtown Area",
    "landmark": "Near City Mall",
    "city": "Bangalore",
    "district": "Bangalore Urban",
    "state": "Karnataka",
    "postal_code": "560001",
    "estimated_start_date": "2024-03-01T00:00:00.000Z",
    "estimated_duration_days": 365,
    "estimated_budget": 50000000,
    "additional_notes": "Priority project requiring skilled workers",
    "worker_requirements": [
      {
        "category": "Mason",
        "count": 10,
        "notes": "Experienced in high-rise construction"
      },
      {
        "category": "Carpenter",
        "count": 8,
        "notes": "Skilled in formwork and finishing"
      },
      {
        "category": "Electrician",
        "count": 5,
        "notes": "Licensed electricians preferred"
      }
    ]
  }')

echo "$EMPLOYER_RESPONSE" | jq '.'

EMPLOYER_TOKEN=$(echo "$EMPLOYER_RESPONSE" | jq -r '.data.token')
EMPLOYER_ID=$(echo "$EMPLOYER_RESPONSE" | jq -r '.data.employer.id')
PROJECT_REQUEST_ID=$(echo "$EMPLOYER_RESPONSE" | jq -r '.data.projectRequest.id')

if [ "$EMPLOYER_TOKEN" == "null" ] || [ -z "$EMPLOYER_TOKEN" ]; then
  echo "❌ Failed to register employer"
  exit 1
fi

echo "✅ Employer registered successfully"
echo "Employer ID: $EMPLOYER_ID"
echo "Project Request ID: $PROJECT_REQUEST_ID"
echo "Employer Token: ${EMPLOYER_TOKEN:0:20}..."
echo ""

sleep 1

echo "Step 2: Login as Super Admin"
echo "----------------------------------------------"
SUPERADMIN_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "superadmin",
    "password": "SuperAdmin@123"
  }')

echo "$SUPERADMIN_RESPONSE" | jq '.'

SUPERADMIN_TOKEN=$(echo "$SUPERADMIN_RESPONSE" | jq -r '.data.token')

if [ "$SUPERADMIN_TOKEN" == "null" ] || [ -z "$SUPERADMIN_TOKEN" ]; then
  echo "❌ Failed to login as superadmin"
  exit 1
fi

echo "✅ Superadmin logged in successfully"
echo "Superadmin Token: ${SUPERADMIN_TOKEN:0:20}..."
echo ""

sleep 1

echo "Step 3: Verify/Approve Employer"
echo "----------------------------------------------"
APPROVE_EMPLOYER_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/v1/employers/${EMPLOYER_ID}/verify" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPERADMIN_TOKEN")

echo "$APPROVE_EMPLOYER_RESPONSE" | jq '.'

if [ "$(echo "$APPROVE_EMPLOYER_RESPONSE" | jq -r '.success')" != "true" ]; then
  echo "❌ Failed to approve employer"
  exit 1
fi

echo "✅ Employer approved successfully"
echo ""

sleep 1

echo "Step 4: Approve Project Request and Convert to Project"
echo "----------------------------------------------"
APPROVE_PROJECT_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/v1/project-requests/${PROJECT_REQUEST_ID}/approve" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPERADMIN_TOKEN")

echo "$APPROVE_PROJECT_RESPONSE" | jq '.'

PROJECT_ID=$(echo "$APPROVE_PROJECT_RESPONSE" | jq -r '.data.project.id')

if [ "$PROJECT_ID" == "null" ] || [ -z "$PROJECT_ID" ]; then
  echo "❌ Failed to approve project request"
  exit 1
fi

echo "✅ Project request approved and converted to project"
echo "Project ID: $PROJECT_ID"
echo ""

sleep 1

echo "Step 5: Register New Candidate"
echo "----------------------------------------------"
CANDIDATE_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/v1/profiles/candidates/register" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPERADMIN_TOKEN" \
  -d '{
    "phone": "9123456780",
    "name": "Ramesh Singh",
    "date_of_birth": "1995-05-15",
    "gender": "male",
    "father_name": "Suresh Singh",
    "mother_name": "Meena Singh",
    "marital_status": "single",
    "email": "ramesh.singh@example.com",
    "emergency_contact_name": "Suresh Singh",
    "emergency_contact_phone": "9123456781",
    "emergency_contact_relation": "Father",
    "city": "Patna",
    "state": "Bihar",
    "district": "Patna",
    "pincode": "800001",
    "street_address": "123 Worker Colony",
    "aadhar_number": "123456789012",
    "pan_number": "ABCDE1234F",
    "skills": [
      {
        "skill_name": "Mason",
        "years_of_experience": 5,
        "is_primary": true
      }
    ]
  }')

echo "$CANDIDATE_RESPONSE" | jq '.'

CANDIDATE_ID=$(echo "$CANDIDATE_RESPONSE" | jq -r '.data.candidate.id')

if [ "$CANDIDATE_ID" == "null" ] || [ -z "$CANDIDATE_ID" ]; then
  echo "❌ Failed to register candidate"
  exit 1
fi

echo "✅ Candidate registered successfully"
echo "Candidate ID: $CANDIDATE_ID"
echo ""

sleep 1

echo "Step 6: Approve Candidate Profile"
echo "----------------------------------------------"
APPROVE_CANDIDATE_RESPONSE=$(curl -s -X PUT "${BASE_URL}/api/v1/profiles/candidates/${CANDIDATE_ID}/approve" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPERADMIN_TOKEN")

echo "$APPROVE_CANDIDATE_RESPONSE" | jq '.'

if [ "$(echo "$APPROVE_CANDIDATE_RESPONSE" | jq -r '.success')" != "true" ]; then
  echo "❌ Failed to approve candidate"
  exit 1
fi

echo "✅ Candidate approved successfully"
echo ""

sleep 1

echo "Step 7: Create Training Batch"
echo "----------------------------------------------"
BATCH_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/v1/training-batches" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPERADMIN_TOKEN" \
  -d '{
    "batch_name": "Mason Training Batch March 2024",
    "description": "Advanced masonry skills training",
    "start_date": "2024-03-01T00:00:00.000Z",
    "end_date": "2024-03-15T23:59:59.999Z",
    "max_capacity": 20,
    "location": "BuildSewa Training Center, Bangalore"
  }')

echo "$BATCH_RESPONSE" | jq '.'

BATCH_ID=$(echo "$BATCH_RESPONSE" | jq -r '.data.id')

if [ "$BATCH_ID" == "null" ] || [ -z "$BATCH_ID" ]; then
  echo "❌ Failed to create training batch"
  exit 1
fi

echo "✅ Training batch created successfully"
echo "Batch ID: $BATCH_ID"
echo ""

sleep 1

echo "Step 8: Enroll Candidate in Training Batch"
echo "----------------------------------------------"
ENROLL_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/v1/training-batches/${BATCH_ID}/enroll" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPERADMIN_TOKEN" \
  -d '{
    "candidate_id": "'"$CANDIDATE_ID"'"
  }')

echo "$ENROLL_RESPONSE" | jq '.'

if [ "$(echo "$ENROLL_RESPONSE" | jq -r '.success')" != "true" ]; then
  echo "❌ Failed to enroll candidate in batch"
  exit 1
fi

echo "✅ Candidate enrolled in training batch"
echo ""

sleep 1

echo "Step 9: Complete Training for Candidate"
echo "----------------------------------------------"
COMPLETE_TRAINING_RESPONSE=$(curl -s -X PUT "${BASE_URL}/api/v1/training-batches/${BATCH_ID}/complete-training/${CANDIDATE_ID}" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPERADMIN_TOKEN" \
  -d '{
    "attendance_percentage": 95,
    "performance_rating": 4.5,
    "remarks": "Excellent performance in training"
  }')

echo "$COMPLETE_TRAINING_RESPONSE" | jq '.'

if [ "$(echo "$COMPLETE_TRAINING_RESPONSE" | jq -r '.success')" != "true" ]; then
  echo "❌ Failed to complete training"
  exit 1
fi

echo "✅ Training completed for candidate"
echo ""

sleep 1

echo "Step 10: Allocate Candidate to Project"
echo "----------------------------------------------"
ALLOCATION_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/v1/projects/${PROJECT_ID}/allocate-worker" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPERADMIN_TOKEN" \
  -d '{
    "candidate_id": "'"$CANDIDATE_ID"'",
    "role": "Mason",
    "start_date": "2024-03-16T00:00:00.000Z"
  }')

echo "$ALLOCATION_RESPONSE" | jq '.'

ALLOCATION_ID=$(echo "$ALLOCATION_RESPONSE" | jq -r '.data.id')

if [ "$ALLOCATION_ID" == "null" ] || [ -z "$ALLOCATION_ID" ]; then
  echo "❌ Failed to allocate candidate to project"
  exit 1
fi

echo "✅ Candidate allocated to project"
echo "Allocation ID: $ALLOCATION_ID"
echo ""

sleep 1

echo "Step 11: Share Allocation with Employer"
echo "----------------------------------------------"
SHARE_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/v1/allocations/${ALLOCATION_ID}/share" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPERADMIN_TOKEN")

echo "$SHARE_RESPONSE" | jq '.'

if [ "$(echo "$SHARE_RESPONSE" | jq -r '.success')" != "true" ]; then
  echo "❌ Failed to share allocation with employer"
  exit 1
fi

echo "✅ Allocation shared with employer"
echo ""

echo "=========================================="
echo "FLOW TEST COMPLETED SUCCESSFULLY! ✅"
echo "=========================================="
echo ""
echo "Summary:"
echo "--------"
echo "Employer ID: $EMPLOYER_ID"
echo "Project Request ID: $PROJECT_REQUEST_ID"
echo "Project ID: $PROJECT_ID"
echo "Candidate ID: $CANDIDATE_ID"
echo "Batch ID: $BATCH_ID"
echo "Allocation ID: $ALLOCATION_ID"
echo ""
echo "All steps completed successfully!"
