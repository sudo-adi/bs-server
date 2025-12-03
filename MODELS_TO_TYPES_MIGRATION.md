# Models → Types Migration Checklist

## What Needs to Be Migrated from /models/ to /types/domain/

### ✅ PROFILE Domain

**Models files:**

- `stageTransition.model.ts` - Has `CreateStageTransitionDto`
- `document.model.ts` - Has `VerifyDocumentDto` (extra)
- `qualification.model.ts` - Has `VerifyQualificationDto` (extra)
- `bankAccount.model.ts` - Has `VerifyBankAccountDto` (extra)
- `skill.model.ts` - Has skill category DTOs + `VerifySkillDto`
- `profile.model.ts` - Already migrated ✓

**Missing in /types/domain/:**

1. **StageTransition DTOs** - Need to add `CreateStageTransitionDto` to existing types
2. **Verify DTOs** - Add to document, qualification, bank-account domains:
   - `VerifyDocumentDto`
   - `VerifyQualificationDto`
   - `VerifyBankAccountDto`
   - `VerifySkillDto`
3. **Skill Category DTOs** - Create skill-category subfolder with:
   - `CreateSkillCategoryDto`
   - `UpdateSkillCategoryDto`

---

### ✅ ADMIN Domain

**Models files:**

- `user.model.ts` - Has `UserResponse`, `ChangePasswordDto`
- `role.model.ts` - Has `SYSTEM_MODULES` constant + DTOs
- `activityLog.model.ts` - Has ActivityLog types
- `userActivityLog.model.ts` - Unknown (need to check)

**Missing in /types/domain/:**

1. **User domain** - Add:
   - `UserResponse` type
   - `ChangePasswordDto`
2. **Role domain** - Add:
   - `SYSTEM_MODULES` constant
   - Move to `/types/domain/role/role.constants.ts`
3. **Activity Log** - CREATE NEW DOMAIN:
   - `/types/domain/activity-log/`
   - `ActivityLog` interface
   - `CreateActivityLogDto`
   - `ActivityLogQueryParams`

---

### ✅ PROJECT Domain

**Models files:**

- `projectRequest.model.ts` - Already exists in /types ✓
- `projectAssignment.model.ts` - Legacy, now projectWorkerAssignment
- `projectWorkerAssignment.model.ts` - Already exists in /types ✓
- `projectResourceRequirement.model.ts` - Has unique types
- `projectStatus.model.ts` - Need to check

**Missing in /types/domain/:**

1. **Project Resource Requirement** - CREATE NEW:
   - `/types/domain/project-resource-requirement/`
   - `CreateProjectResourceRequirementDto`
   - `UpdateProjectResourceRequirementDto`
   - `ProjectResourceRequirementWithDetails`
   - `SkillAllocationStatus` type

---

### ✅ TRAINING Domain

**Models files:**

- `trainingBatch.model.ts` - Has DTOs
- `batchEnrollment.model.ts` - Has DTOs
- `trainer.model.ts` - Has trainer types

**Missing in /types/domain/:**

- Already mostly covered in `/types/domain/training/`
- Trainer CSV types are in `/types/domain/training/batch.dto.ts` (should move)

---

### ✅ UTILITIES Domain (NEW DOMAINS NEEDED)

**Models files:**

- `newsUpdate.model.ts` - Complete types system
- `socialMediaPost.model.ts` - Complete types system
- `scraperWebsite.model.ts` - Complete types system
- `note.model.ts` - Note types

**Missing - CREATE NEW DOMAINS:**

1. **`/types/domain/news-update/`**
   - `news-update.dto.ts` - DTOs
   - `news-update.filters.ts` - Filters, stats, pagination
   - `news-update.scraper.ts` - Scraper types

2. **`/types/domain/social-media/`**
   - `social-media.dto.ts` - DTOs
   - `social-media.types.ts` - Platform types, enums
   - `social-media.filters.ts` - Filters, stats

3. **`/types/domain/scraper/`**
   - `scraper-website.dto.ts` - DTOs
   - `scraper-website.stats.ts` - Stats types

4. **`/types/domain/note/`**
   - `note.dto.ts` - DTOs

---

### ✅ BLOG Domain

**Models file:**

- `post.model.ts` - EMPTY FILE (0 lines)

**Action:** Delete empty file

---

## Summary of Actions

### Phase 1: Add Missing Types to Existing Domains

- [ ] Add Verify DTOs to document, qualification, bank-account, skill
- [ ] Add StageTransition DTOs
- [ ] Add User response types and ChangePasswordDto
- [ ] Add SYSTEM_MODULES to role domain

### Phase 2: Create New Domains

- [ ] `/types/domain/activity-log/`
- [ ] `/types/domain/news-update/`
- [ ] `/types/domain/social-media/`
- [ ] `/types/domain/scraper/`
- [ ] `/types/domain/note/`
- [ ] `/types/domain/project-resource-requirement/`

### Phase 3: Delete Models

- [ ] Delete `/src/models/` directory
- [ ] Update all imports (95 files)

---

## Total Files to Migrate: ~15 unique type definitions

## Total New Domains to Create: 6

## Total Import Statements to Update: 95
