# Quick Start Guide - Candidate Portal

## 🚀 Quick Setup (5 minutes)

### Step 1: Start Backend
```bash
cd /Users/aditya/Desktop/xyz/server
npm run dev
```
✅ Backend running on `http://localhost:3001`

### Step 2: Start Frontend
```bash
cd /Users/aditya/Desktop/xyz/buildsewa
npm run dev
```
✅ Frontend running on `http://localhost:3000`

---

## 🧪 Quick Test (Mock Login)

### Option 1: Using Existing Profile

If you already have a profile in the database:

1. **Update Profile Stage (Using Admin Dashboard or Database)**
   ```sql
   -- Find your profile
   SELECT id, candidate_code, phone, first_name
   FROM profiles
   WHERE phone = '9876543210';

   -- Add stage transition to make it ready_to_deploy
   INSERT INTO stage_transitions (profile_id, to_stage, notes)
   VALUES ('your-profile-id', 'ready_to_deploy', 'Approved for testing');
   ```

2. **Login via Frontend**
   - Go to `http://localhost:3000/worker-login`
   - Enter mobile: `9876543210`
   - Click "Send OTP"
   - Copy the OTP from screen (dev mode shows it)
   - Enter OTP and login
   - View employee portal dashboard

### Option 2: Create Test Profile via API

```bash
# 1. Create profile via registration API
curl -X POST http://localhost:3001/api/profiles \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "9999999999",
    "first_name": "Test",
    "last_name": "User",
    "fathers_name": "Test Father"
  }'

# 2. Get profile ID from response and update stage
# Use database or admin API to change stage to "ready_to_deploy"

# 3. Test login
curl -X POST http://localhost:3001/api/candidate/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "9999999999"}'

# 4. Copy OTP from response (dev mode)
# Then verify:
curl -X POST http://localhost:3001/api/candidate/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "9999999999", "otp": "PASTE_OTP_HERE"}'

# 5. Copy token from response and test dashboard:
curl -X GET http://localhost:3001/api/candidate/portal/dashboard \
  -H "Authorization: Bearer PASTE_TOKEN_HERE"
```

---

## 📋 Test Checklist

### Authentication Flow
- [ ] Can send OTP to registered mobile number
- [ ] OTP is displayed on screen (dev mode)
- [ ] OTP verification works
- [ ] Token is saved in localStorage
- [ ] Can access protected routes with token
- [ ] Invalid OTP is rejected
- [ ] Expired OTP is rejected (wait 5 minutes)
- [ ] Non-registered number is rejected
- [ ] Non-approved profile is rejected

### Dashboard
- [ ] Shows profile summary card
- [ ] Shows correct counts (projects, training, employment)
- [ ] Shows current training (if enrolled)
- [ ] Shows current employment (if deployed)
- [ ] Logout works and redirects to home

### Protected Routes
- [ ] Without login, redirects to /worker-login
- [ ] With valid token, can access dashboard
- [ ] Token expiry redirects to login

---

## 🔍 Verification Steps

### 1. Check Profile Stage
```sql
SELECT
  p.candidate_code,
  p.first_name,
  p.phone,
  p.is_active,
  st.to_stage as current_stage
FROM profiles p
LEFT JOIN LATERAL (
  SELECT to_stage
  FROM stage_transitions
  WHERE profile_id = p.id
  ORDER BY transitioned_at DESC
  LIMIT 1
) st ON true
WHERE p.phone = 'YOUR_PHONE';
```

Expected: `current_stage = 'ready_to_deploy'` and `is_active = true`

### 2. Check Matched Projects
```sql
SELECT
  pmp.status,
  p.name as project_name,
  sc.name as skill_category
FROM project_matched_profiles pmp
JOIN projects p ON p.id = pmp.project_id
JOIN skill_categories sc ON sc.id = pmp.skill_category_id
WHERE pmp.profile_id = 'YOUR_PROFILE_ID';
```

### 3. Check Training Enrollments
```sql
SELECT
  be.status,
  tb.name as batch_name,
  tb.start_date,
  tb.end_date
FROM batch_enrollments be
JOIN training_batches tb ON tb.id = be.batch_id
WHERE be.profile_id = 'YOUR_PROFILE_ID';
```

### 4. Check Employment History
```sql
SELECT
  pa.status,
  pa.deployment_date,
  p.name as project_name,
  p.location
FROM project_assignments pa
JOIN projects p ON p.id = pa.project_id
WHERE pa.profile_id = 'YOUR_PROFILE_ID';
```

---

## 🎯 Quick Demo Data Setup

If you want to see the portal with sample data:

```sql
-- 1. Create a test profile (if not exists)
INSERT INTO profiles (candidate_code, phone, first_name, last_name, fathers_name, is_active)
VALUES ('TEST001', '9999999999', 'Demo', 'User', 'Demo Father', true)
ON CONFLICT (phone) DO NOTHING
RETURNING id;

-- Use the returned ID in subsequent queries

-- 2. Add stage transition
INSERT INTO stage_transitions (profile_id, to_stage, notes)
VALUES ('PROFILE_ID_FROM_ABOVE', 'ready_to_deploy', 'Test data')
ON CONFLICT DO NOTHING;

-- 3. Add a skill (optional)
INSERT INTO profile_skills (profile_id, skill_category_id, years_of_experience, is_primary)
SELECT 'PROFILE_ID', sc.id, 3, true
FROM skill_categories sc
WHERE sc.name = 'Electrician'
LIMIT 1;

-- 4. Match to a project (optional)
INSERT INTO project_matched_profiles (profile_id, project_id, skill_category_id, status)
SELECT 'PROFILE_ID', p.id, p.skill_category_id, 'matched'
FROM (
  SELECT p.id, prr.skill_category_id
  FROM projects p
  JOIN project_resource_requirements prr ON prr.project_id = p.id
  LIMIT 1
) p;

-- 5. Add training enrollment (optional)
INSERT INTO batch_enrollments (profile_id, batch_id, status, enrollment_date)
SELECT 'PROFILE_ID', tb.id, 'in_progress', NOW()
FROM training_batches tb
LIMIT 1;

-- 6. Add employment assignment (optional)
INSERT INTO project_assignments (profile_id, project_id, deployment_date, status)
SELECT 'PROFILE_ID', p.id, NOW(), 'deployed'
FROM projects p
LIMIT 1;
```

---

## 🐛 Common Issues & Fixes

### Issue: "Mobile number not registered"
**Fix:**
```sql
SELECT * FROM profiles WHERE phone = 'YOUR_PHONE';
```
If no result, create profile via registration.

### Issue: "Profile is under review"
**Fix:**
```sql
-- Check current stage
SELECT to_stage FROM stage_transitions
WHERE profile_id = 'YOUR_ID'
ORDER BY transitioned_at DESC LIMIT 1;

-- Change to ready_to_deploy
INSERT INTO stage_transitions (profile_id, to_stage, notes)
VALUES ('YOUR_ID', 'ready_to_deploy', 'Manual approval');
```

### Issue: "Account has been deactivated"
**Fix:**
```sql
UPDATE profiles
SET is_active = true
WHERE id = 'YOUR_ID';
```

### Issue: "OTP not working"
**Fix:**
1. Check backend console for OTP
2. OTP valid for 5 minutes only
3. Request new OTP if expired
4. Check phone number is exactly 10 digits

### Issue: "Token expired"
**Fix:**
1. Logout and login again
2. Clear localStorage
3. Token is valid for 30 days

---

## 📊 Test Accounts (After Setup)

| Phone | Name | Status | Purpose |
|-------|------|--------|---------|
| 9999999999 | Demo User | Approved | Full access testing |
| 9999999998 | Test User 2 | Pending | Test approval flow |
| 9999999997 | Test User 3 | Blacklisted | Test blacklist |

---

## 🎓 Learning Path

1. **Start Here:** Test login flow with existing profile
2. **Then:** Explore dashboard and view data
3. **Next:** Test each API endpoint with Postman
4. **Advanced:** Create test data and verify calculations
5. **Final:** Test error scenarios and edge cases

---

## 📱 Mobile Testing

1. Expose local server to network:
   ```bash
   # Backend - Update to listen on all interfaces
   # In server/src/app.ts, use:
   app.listen(PORT, '0.0.0.0', () => {...})
   ```

2. Get your local IP:
   ```bash
   ipconfig getifaddr en0  # Mac
   # or
   hostname -I  # Linux
   ```

3. Update frontend API URL:
   ```env
   # buildsewa/.env.local
   NEXT_PUBLIC_API_URL=http://YOUR_IP:3001/api
   ```

4. Access from mobile:
   - Frontend: `http://YOUR_IP:3000/worker-login`
   - Test login flow

---

## 🎉 Success Indicators

You've successfully set up the candidate portal when:

✅ Backend builds without errors
✅ Can send OTP to registered number
✅ OTP verification returns token
✅ Dashboard shows profile data
✅ All API endpoints return data
✅ Logout works correctly
✅ Unapproved profiles can't login
✅ Invalid tokens are rejected

---

## 📞 Need Help?

1. Check `CANDIDATE_API_DOCUMENTATION.md` for API details
2. Check `CANDIDATE_IMPLEMENTATION_SUMMARY.md` for architecture
3. Check backend console logs for errors
4. Check browser console for frontend errors
5. Verify database has correct data

---

## 🚀 Ready for Production?

Before going live:

- [ ] Replace mock OTP with real SMS gateway
- [ ] Move OTP storage from memory to Redis
- [ ] Add rate limiting on OTP requests
- [ ] Enable proper logging and monitoring
- [ ] Set up error tracking (Sentry)
- [ ] Configure CORS properly
- [ ] Use HTTPS in production
- [ ] Review security configurations
- [ ] Test with real user data
- [ ] Perform load testing

---

Happy Testing! 🎉
