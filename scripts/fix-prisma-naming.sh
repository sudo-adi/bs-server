#!/bin/bash

# Script to fix Prisma naming issues across the codebase
# This converts snake_case Prisma references to camelCase

echo "🔧 Fixing Prisma client property names..."

# Fix db.model_name to db.modelName (camelCase)
find src -name "*.ts" -type f ! -path "*/generated/*" -exec sed -i '' \
  -e 's/db\.profiles\b/db.profile/g' \
  -e 's/db\.activity_logs\b/db.activityLog/g' \
  -e 's/db\.employers\b/db.employer/g' \
  -e 's/db\.social_media_posts\b/db.socialMediaPost/g' \
  -e 's/db\.roles\b/db.profileRole/g' \
  -e 's/db\.users\b/db.profile/g' \
  -e 's/db\.role_permissions\b/db.profileRolePermission/g' \
  -e 's/db\.news_updates\b/db.newsUpdate/g' \
  -e 's/db\.training_batches\b/db.trainingBatch/g' \
  -e 's/db\.batch_enrollments\b/db.batchEnrollment/g' \
  -e 's/db\.skill_categories\b/db.skillCategory/g' \
  -e 's/db\.projects\b/db.project/g' \
  -e 's/db\.project_worker_assignments\b/db.projectWorkerAssignment/g' \
  {} \;

echo "✅ Fixed Prisma client property names"

echo "🔧 Fixing Prisma type imports..."

# Fix type imports from snake_case to PascalCase
find src -name "*.ts" -type f ! -path "*/generated/*" -exec sed -i '' \
  -e 's/: profiles\b/: Profile/g' \
  -e 's/<profiles>/<Profile>/g' \
  -e 's/activity_logs/ActivityLog/g' \
  -e 's/social_media_posts/SocialMediaPost/g' \
  -e 's/: employers\b/: Employer/g' \
  -e 's/<employers>/<Employer>/g' \
  {} \;

echo "✅ Fixed Prisma type imports"

echo "🔧 Fixing Prisma WhereInput types..."

# Fix Prisma.ModelWhereInput types
find src -name "*.ts" -type f ! -path "*/generated/*" -exec sed -i '' \
  -e 's/Prisma\.activity_logsWhereInput/Prisma.ActivityLogWhereInput/g' \
  -e 's/Prisma\.social_media_postsWhereInput/Prisma.SocialMediaPostWhereInput/g' \
  -e 's/Prisma\.profilesWhereInput/Prisma.ProfileWhereInput/g' \
  {} \;

echo "✅ Fixed Prisma WhereInput types"

echo "✨ Done! Run 'npx tsc --noEmit' to check for remaining errors."
