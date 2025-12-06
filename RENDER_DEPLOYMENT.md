# Render Deployment Guide

## Issue Fixed

The deployment was failing with:
```
Error: Cannot find module '/opt/render/project/src/dist/index.js'
```

This was caused by:
1. Missing `render.yaml` configuration file
2. TypeScript compilation errors in the codebase

## Fixes Applied

### 1. Created `render.yaml` Configuration
Located at: `/server/render.yaml`

This file tells Render:
- **Build Command**: `npm install && npm run build:render`
- **Start Command**: `node dist/index.js` (correct path)
- **Environment**: Node.js
- **Region**: Oregon (free tier)

### 2. Fixed TypeScript Errors

**File 1**: `src/services/candidate/candidatePortal/queries/portal-dashboard.query.ts`
- **Issue**: Trying to access `training_batches.trainers` which doesn't exist
- **Fix**: Updated to use the correct relationship path:
  ```typescript
  trainer_name: currentTraining.training_batches?.trainer_batch_assignments?.[0]?.trainers?.profiles?.first_name || null
  ```

**File 2**: `src/services/training/trainerBatchAssignment/trainerBatchAssignment.service.ts`
- **Issue**: Unused import `CreateTrainerBatchAssignmentDto`
- **Fix**: Removed the unused import

### 3. Build Verification
- ✅ TypeScript compilation successful
- ✅ `dist/index.js` created at correct location
- ✅ All 458 files processed
- ✅ Import paths fixed automatically

## Deployment Instructions

### Option 1: Using render.yaml (Recommended)

1. **Push to Git Repository**:
   ```bash
   cd /Users/aditya/Desktop/xyz/server
   git add .
   git commit -m "Add Render deployment configuration"
   git push origin main
   ```

2. **Connect Repository to Render**:
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click "New +" → "Web Service"
   - Connect your Git repository
   - Render will automatically detect `render.yaml` and use those settings

3. **Set Environment Variables** (in Render Dashboard):
   - `DATABASE_URL` - Your PostgreSQL connection string
   - `JWT_SECRET` - Your JWT secret key
   - `SUPABASE_URL` - Your Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
   - `SUPABASE_ANON_KEY` - Supabase anon key
   - `SUPABASE_STORAGE_BUCKET` - Storage bucket name
   - `AWS_REGION` - AWS region (if using AWS)
   - `AWS_ACCESS_KEY_ID` - AWS access key (if using AWS)
   - `AWS_SECRET_ACCESS_KEY` - AWS secret key (if using AWS)
   - `AWS_S3_BUCKET` - S3 bucket name (if using AWS)
   - `STORAGE_PROVIDER` - Set to "supabase" (already in yaml as default)

4. **Deploy**: Render will automatically build and deploy

### Option 2: Manual Configuration

If not using render.yaml, configure manually:

1. **Build Command**:
   ```
   npm install && npm run build:render
   ```

2. **Start Command**:
   ```
   node dist/index.js
   ```

3. **Environment**: Node
4. **Node Version**: 18.x or higher (specified in package.json)

## Build Process

The `build:render` script does the following:

1. `npm run prisma:generate` - Generates Prisma client
2. `npm run prisma:deploy` - Runs database migrations
3. `tsc` - Compiles TypeScript to JavaScript
4. `tsc-alias` - Resolves path aliases (@/* imports)
5. `npm run copy:prisma` - Copies Prisma files to dist
6. `npm run postbuild` - Fixes import statements

Output: `dist/` directory with compiled JavaScript

## Troubleshooting

### Build Fails with "Cannot find module"
- Ensure all TypeScript errors are fixed locally first
- Run `npm run build` locally to verify
- Check that `dist/index.js` exists after build

### Database Connection Issues
- Verify `DATABASE_URL` environment variable is set correctly
- Ensure database is accessible from Render's IP addresses
- Check that migrations ran successfully during build

### Missing Environment Variables
- All required env vars must be set in Render dashboard
- Use "sync: false" in render.yaml to manage them manually
- Never commit secrets to git

## Post-Deployment Verification

1. **Check Logs**: Monitor deploy logs in Render dashboard
2. **Health Check**: Visit `https://your-app.onrender.com/api/v1/health`
3. **Test Endpoints**: Try hitting your API endpoints
4. **Database**: Verify database connection and migrations

## Important Notes

- **Free Tier**: Service sleeps after 15 minutes of inactivity
- **Cold Starts**: First request after sleep may take 30-60 seconds
- **Region**: Currently set to Oregon (change in render.yaml if needed)
- **Auto-Deploy**: Pushes to main branch will trigger automatic deploys

## Build Output Structure

```
dist/
├── index.js              ← Entry point (this is what Render runs)
├── app.js
├── config/
├── controllers/
├── middlewares/
├── routes/
├── services/
├── types/
└── generated/
    └── prisma/          ← Prisma client
```

## Success Indicators

When deployment succeeds, you should see:
```
==> Build successful 🎉
==> Deploying...
==> Running 'node dist/index.js'
Server listening on port 10000
```

## Next Steps

1. Push the changes to your Git repository
2. Connect the repository to Render
3. Set environment variables in Render dashboard
4. Let Render auto-deploy from the render.yaml configuration
5. Monitor the deployment logs for success

---

**Status**: ✅ Ready for Deployment

All TypeScript errors fixed and render.yaml configuration created.
