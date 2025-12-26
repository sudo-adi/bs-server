#!/bin/bash

# Script to fix property naming from snake_case to camelCase
echo "🔧 Fixing property names from snake_case to camelCase..."

# Fix common property access patterns
find src -name "*.ts" -type f ! -path "*/generated/*" ! -path "*/middlewares/validation.ts" -exec sed -i '' \
  -e 's/\.is_active\b/.isActive/g' \
  -e 's/\.is_verified\b/.isVerified/g' \
  -e 's/\.is_blacklisted\b/.isBlacklisted/g' \
  -e 's/\.is_primary\b/.isPrimary/g' \
  -e 's/\.first_name\b/.firstName/g' \
  -e 's/\.last_name\b/.lastName/g' \
  -e 's/\.middle_name\b/.middleName/g' \
  -e 's/\.fathers_name\b/.fathersName/g' \
  -e 's/\.date_of_birth\b/.dateOfBirth/g' \
  -e 's/\.phone_number\b/.phoneNumber/g' \
  -e 's/\.alt_phone\b/.altPhone/g' \
  -e 's/\.profile_photo\b/.profilePhoto/g' \
  -e 's/\.created_at\b/.createdAt/g' \
  -e 's/\.updated_at\b/.updatedAt/g' \
  -e 's/\.deleted_at\b/.deletedAt/g' \
  -e 's/\.candidate_code\b/.candidateCode/g' \
  -e 's/\.worker_code\b/.workerCode/g' \
  -e 's/\.company_name\b/.companyName/g' \
  -e 's/\.skill_category\b/.skillCategory/g' \
  -e 's/\.training_batch\b/.trainingBatch/g' \
  {} \;

echo "✅ Fixed property names"

# Fix object literal keys in where clauses
find src -name "*.ts" -type f ! -path "*/generated/*" ! -path "*/middlewares/validation.ts" -exec sed -i '' \
  -e 's/is_active:/isActive:/g' \
  -e 's/is_verified:/isVerified:/g' \
  -e 's/is_blacklisted:/isBlacklisted:/g' \
  -e 's/first_name:/firstName:/g' \
  -e 's/last_name:/lastName:/g' \
  {} \;

echo "✅ Fixed object literal keys"
echo "✨ Done!"
