-- ============================================================================
-- COMPREHENSIVE SEED DATA SCRIPT
-- This script creates organic, realistic data for the entire workflow
-- ============================================================================

-- ============================================================================
-- STEP 1: CLEAR ALL EXISTING DATA (CASCADE DELETE)
-- ============================================================================
TRUNCATE TABLE
  batch_enrollments,
  project_deployments,
  training_batches,
  project_skill_requirements,
  employer_project_requirements,
  projects,
  profile_skills,
  qualifications,
  addresses,
  profiles,
  employers,
  skill_categories,
  users
CASCADE;

-- Reset sequences
ALTER SEQUENCE users_id_seq RESTART WITH 1;
ALTER SEQUENCE skill_categories_id_seq RESTART WITH 1;
ALTER SEQUENCE employers_id_seq RESTART WITH 1;
ALTER SEQUENCE profiles_id_seq RESTART WITH 1;
ALTER SEQUENCE addresses_id_seq RESTART WITH 1;
ALTER SEQUENCE profile_skills_id_seq RESTART WITH 1;
ALTER SEQUENCE qualifications_id_seq RESTART WITH 1;
ALTER SEQUENCE training_batches_id_seq RESTART WITH 1;
ALTER SEQUENCE batch_enrollments_id_seq RESTART WITH 1;
ALTER SEQUENCE employer_project_requirements_id_seq RESTART WITH 1;
ALTER SEQUENCE projects_id_seq RESTART WITH 1;
ALTER SEQUENCE project_skill_requirements_id_seq RESTART WITH 1;
ALTER SEQUENCE project_deployments_id_seq RESTART WITH 1;

-- ============================================================================
-- STEP 2: INSERT USERS
-- ============================================================================
INSERT INTO users (username, email, password_hash, full_name, phone_number, is_active, created_at, updated_at) VALUES
('admin', 'admin@company.com', '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890', 'Admin User', '9800000001', true, NOW(), NOW()),
('manager1', 'manager1@company.com', '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890', 'Manager One', '9800000002', true, NOW(), NOW()),
('manager2', 'manager2@company.com', '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890', 'Manager Two', '9800000003', true, NOW(), NOW()),
('viewer1', 'viewer@company.com', '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890', 'Viewer User', '9800000004', true, NOW(), NOW());

-- ============================================================================
-- STEP 3: INSERT SKILL CATEGORIES
-- ============================================================================
INSERT INTO skill_categories (name, description, created_at, updated_at) VALUES
('Mason', 'Masonry and bricklaying work', NOW(), NOW()),
('Plumber', 'Plumbing and pipe fitting', NOW(), NOW()),
('Electrician', 'Electrical wiring and installations', NOW(), NOW()),
('Carpenter', 'Woodwork and carpentry', NOW(), NOW()),
('Welder', 'Welding and metal fabrication', NOW(), NOW()),
('Painter', 'Painting and finishing work', NOW(), NOW()),
('Steel Fixer', 'Reinforcement bar installation', NOW(), NOW()),
('Heavy Equipment Operator', 'Construction equipment operation', NOW(), NOW());

-- ============================================================================
-- STEP 4: INSERT EMPLOYERS
-- ============================================================================
INSERT INTO employers (
  employer_code, company_name, client_name, email, phone_number,
  registered_address, is_verified, is_approved, approved_by_user_id, approved_at, password_hash, created_at, updated_at
) VALUES
('EMP00001', 'ABC Construction Ltd', 'Rajesh Kumar', 'rajesh@abcconstruction.com', '9876543210', 'Mumbai, Maharashtra', true, true, 1, NOW() - INTERVAL '85 days', '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890', NOW() - INTERVAL '90 days', NOW()),
('EMP00002', 'XYZ Builders Pvt Ltd', 'Suresh Patel', 'suresh@xyzbuilders.com', '9876543211', 'Ahmedabad, Gujarat', true, true, 1, NOW() - INTERVAL '70 days', '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890', NOW() - INTERVAL '75 days', NOW()),
('EMP00003', 'Prime Infrastructure', 'Amit Sharma', 'amit@primeinfra.com', '9876543212', 'Delhi', true, true, 1, NOW() - INTERVAL '55 days', '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890', NOW() - INTERVAL '60 days', NOW()),
('EMP00004', 'Global Projects India', 'Vikram Singh', 'vikram@globalprojects.in', '9876543213', 'Bangalore, Karnataka', true, true, 1, NOW() - INTERVAL '40 days', '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890', NOW() - INTERVAL '45 days', NOW()),
('EMP00005', 'Metro Construction Co', 'Deepak Verma', 'deepak@metroconstruction.com', '9876543214', 'Pune, Maharashtra', true, true, 1, NOW() - INTERVAL '25 days', '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890', NOW() - INTERVAL '30 days', NOW()),
('EMP00006', 'New Age Developers', 'Karan Mehta', 'karan@newagedev.com', '9876543215', 'Hyderabad, Telangana', false, false, NULL, NULL, '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890', NOW() - INTERVAL '10 days', NOW());

-- ============================================================================
-- STEP 5: INSERT EMPLOYER PROJECT REQUIREMENTS
-- ============================================================================
INSERT INTO employer_project_requirements (
  employer_id, project_title, project_description, location,
  estimated_start_date, estimated_duration_days, estimated_budget,
  required_workers_count, additional_notes, status, reviewed_by_user_id,
  reviewed_at, created_at, updated_at
) VALUES
-- Requirement 1 - Already converted to project
(1, 'Residential Complex Phase 1', 'Construction of 5 residential towers', 'Mumbai, Andheri East',
 NOW() - INTERVAL '30 days', 365, 50000000, 50, 'Urgent requirement for skilled workers',
 'project_created', 1, NOW() - INTERVAL '60 days', NOW() - INTERVAL '90 days', NOW() - INTERVAL '60 days'),

-- Requirement 2 - Already converted to project
(2, 'Shopping Mall Construction', 'Multi-story shopping complex with parking', 'Ahmedabad, Vastrapur',
 NOW() + INTERVAL '15 days', 270, 35000000, 35, 'Need experienced workers',
 'project_created', 1, NOW() - INTERVAL '50 days', NOW() - INTERVAL '75 days', NOW() - INTERVAL '50 days'),

-- Requirement 3 - Reviewed, ready to create project
(3, 'Office Tower Project', 'Commercial office building 20 floors', 'Delhi, Connaught Place',
 NOW() + INTERVAL '45 days', 400, 80000000, 60, 'Premium project requiring top quality work',
 'reviewed', 1, NOW() - INTERVAL '30 days', NOW() - INTERVAL '60 days', NOW() - INTERVAL '30 days'),

-- Requirement 4 - Pending review
(4, 'Industrial Warehouse', 'Large scale warehouse facility', 'Bangalore, Electronic City',
 NOW() + INTERVAL '60 days', 180, 25000000, 30, 'Simple construction work',
 'pending', NULL, NULL, NOW() - INTERVAL '45 days', NOW() - INTERVAL '45 days'),

-- Requirement 5 - Pending review
(6, 'Residential Villa Project', 'Luxury villas in gated community', 'Hyderabad, Gachibowli',
 NOW() + INTERVAL '90 days', 240, 40000000, 25, 'High-end finishing required',
 'pending', NULL, NULL, NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days');

-- ============================================================================
-- STEP 6: INSERT PROJECTS (from approved requirements)
-- ============================================================================
INSERT INTO projects (
  project_code, project_name, project_number, employer_id, location,
  phone_number, deployment_date, award_date, start_date, end_date,
  status, required_workers, current_workers, project_manager,
  description, budget, is_active, is_accommodation_provided,
  created_by_user_id, created_at, updated_at
) VALUES
-- Project 1 - Deployed (workers actively working)
('PRJ00001', 'Residential Complex Phase 1', 'ABC-2024-001', 1, 'Mumbai, Andheri East',
 '9876543210', NOW() - INTERVAL '30 days', NOW() - INTERVAL '90 days', NOW() - INTERVAL '30 days',
 NOW() + INTERVAL '335 days', 'deployed', 50, 45, 'Mr. Ramesh Gupta',
 'Construction of 5 residential towers with modern amenities', 50000000, true, true,
 1, NOW() - INTERVAL '60 days', NOW() - INTERVAL '30 days'),

-- Project 2 - Preparing (gathering workers, not deployed yet)
('PRJ00002', 'Shopping Mall Construction', 'XYZ-2024-002', 2, 'Ahmedabad, Vastrapur',
 '9876543211', NOW() + INTERVAL '15 days', NOW() - INTERVAL '75 days', NULL, NULL,
 'preparing', 35, 28, 'Mr. Sunil Desai',
 'Multi-story shopping complex with underground parking', 35000000, true, true,
 1, NOW() - INTERVAL '50 days', NOW());

-- ============================================================================
-- STEP 7: INSERT PROJECT SKILL REQUIREMENTS
-- ============================================================================

-- Project 1 requirements (Deployed project)
INSERT INTO project_skill_requirements (project_id, skill_category_id, required_count, allocated_count, created_at, updated_at) VALUES
(1, 1, 15, 15, NOW() - INTERVAL '60 days', NOW() - INTERVAL '30 days'), -- Masons
(1, 2, 8, 8, NOW() - INTERVAL '60 days', NOW() - INTERVAL '30 days'),  -- Plumbers
(1, 3, 10, 10, NOW() - INTERVAL '60 days', NOW() - INTERVAL '30 days'), -- Electricians
(1, 4, 7, 7, NOW() - INTERVAL '60 days', NOW() - INTERVAL '30 days'),  -- Carpenters
(1, 7, 5, 5, NOW() - INTERVAL '60 days', NOW() - INTERVAL '30 days');  -- Steel Fixers

-- Project 2 requirements (Preparing project)
INSERT INTO project_skill_requirements (project_id, skill_category_id, required_count, allocated_count, created_at, updated_at) VALUES
(2, 1, 12, 10, NOW() - INTERVAL '50 days', NOW()), -- Masons (need 2 more)
(2, 2, 6, 5, NOW() - INTERVAL '50 days', NOW()),   -- Plumbers (need 1 more)
(2, 3, 8, 7, NOW() - INTERVAL '50 days', NOW()),   -- Electricians (need 1 more)
(2, 4, 5, 4, NOW() - INTERVAL '50 days', NOW()),   -- Carpenters (need 1 more)
(2, 6, 4, 2, NOW() - INTERVAL '50 days', NOW());   -- Painters (need 2 more)

-- ============================================================================
-- STEP 8: INSERT PROFILES (Candidates in various stages)
-- ============================================================================

-- Function to generate profile codes
DO $$
DECLARE
  i INTEGER;
  first_names TEXT[] := ARRAY['Rahul', 'Amit', 'Suresh', 'Vijay', 'Rajesh', 'Prakash', 'Deepak', 'Anil', 'Manoj', 'Sanjay',
                               'Ravi', 'Kiran', 'Ashok', 'Vinod', 'Ramesh', 'Dinesh', 'Mukesh', 'Naresh', 'Santosh', 'Ganesh',
                               'Mahesh', 'Yogesh', 'Jitesh', 'Hitesh', 'Nilesh', 'Paresh', 'Ritesh', 'Umesh', 'Vimal', 'Nitin',
                               'Sachin', 'Rohan', 'Mohan', 'Sohan', 'Vishal', 'Tushar', 'Pradeep', 'Sandeep', 'Kuldeep', 'Pankaj',
                               'Akhil', 'Nikhil', 'Atul', 'Kapil', 'Samir', 'Tarun', 'Varun', 'Arjun', 'Karan', 'Vikram',
                               'Ajay', 'Sanjiv', 'Manish', 'Harish', 'Girish', 'Jagdish', 'Kamlesh', 'Rajendra', 'Surendra', 'Narendra',
                               'Lokesh', 'Dharmesh', 'Jignesh', 'Bhavesh', 'Chirag', 'Neeraj', 'Anuj', 'Piyush', 'Yash', 'Harsh',
                               'Akash', 'Prakhar', 'Shubham', 'Abhishek', 'Rishab', 'Aditya', 'Aryan', 'Ayush', 'Dev', 'Ishaan'];
  last_names TEXT[] := ARRAY['Kumar', 'Sharma', 'Patel', 'Singh', 'Verma', 'Yadav', 'Gupta', 'Joshi', 'Reddy', 'Nair',
                              'Desai', 'Mehta', 'Shah', 'Agarwal', 'Jain', 'Bansal', 'Malhotra', 'Kapoor', 'Saxena', 'Pandey',
                              'Mishra', 'Tiwari', 'Dubey', 'Chaudhary', 'Chauhan', 'Rathore', 'Thakur', 'Rajput', 'Bhatt', 'Jha'];
  cities TEXT[] := ARRAY['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Ahmedabad', 'Chennai', 'Kolkata', 'Pune', 'Jaipur', 'Lucknow'];
  states TEXT[] := ARRAY['Maharashtra', 'Delhi', 'Karnataka', 'Telangana', 'Gujarat', 'Tamil Nadu', 'West Bengal', 'Maharashtra', 'Rajasthan', 'Uttar Pradesh'];
  stages TEXT[] := ARRAY['registered', 'approved', 'trainee', 'trained', 'deployed', 'benched'];
  fname TEXT;
  lname TEXT;
  mobile TEXT;
  email TEXT;
  stage TEXT;
  city TEXT;
  state TEXT;
  profile_id INTEGER;
BEGIN
  FOR i IN 1..100 LOOP
    fname := first_names[1 + (random() * (array_length(first_names, 1) - 1))::INTEGER];
    lname := last_names[1 + (random() * (array_length(last_names, 1) - 1))::INTEGER];
    mobile := '98765' || LPAD((43210 + i)::TEXT, 5, '0');
    email := LOWER(fname || '.' || lname || i || '@gmail.com');
    city := cities[1 + (random() * (array_length(cities, 1) - 1))::INTEGER];
    state := states[1 + (random() * (array_length(states, 1) - 1))::INTEGER];

    -- Distribute profiles across stages realistically
    IF i <= 45 THEN stage := 'deployed';      -- 45 deployed (for Project 1)
    ELSIF i <= 73 THEN stage := 'trained';     -- 28 trained (ready for onboarding)
    ELSIF i <= 85 THEN stage := 'trainee';     -- 12 in training
    ELSIF i <= 95 THEN stage := 'approved';    -- 10 approved (ready for training)
    ELSE stage := 'registered';                -- 5 newly registered
    END IF;

    INSERT INTO profiles (
      profile_code, mobile_number, alternative_whatsapp_number, email,
      first_name, last_name, fathers_name, gender, date_of_birth,
      current_stage, stage_updated_at, is_active, is_blacklisted,
      created_at, updated_at
    ) VALUES (
      'PRF' || LPAD(i::TEXT, 5, '0'),
      mobile,
      '98765' || LPAD((50000 + i)::TEXT, 5, '0'),
      email,
      fname,
      lname,
      'Mr. ' || lname,
      CASE WHEN random() > 0.5 THEN 'Male' ELSE 'Male' END,
      (NOW() - INTERVAL '25 years' - (random() * INTERVAL '15 years'))::DATE,
      stage,
      NOW() - (random() * INTERVAL '60 days'),
      true,
      false,
      NOW() - (random() * INTERVAL '120 days'),
      NOW()
    ) RETURNING id INTO profile_id;

    -- Insert address
    INSERT INTO addresses (
      profile_id, address_type, house_number, village_or_city, district, state,
      postal_code, is_current, created_at, updated_at
    ) VALUES (
      profile_id,
      'Permanent',
      (100 + i)::TEXT,
      city,
      city,
      state,
      (400001 + i)::TEXT,
      true,
      NOW() - (random() * INTERVAL '120 days'),
      NOW()
    );
  END LOOP;
END $$;

-- ============================================================================
-- STEP 9: INSERT PROFILE SKILLS
-- ============================================================================

-- Assign skills to profiles based on their stage and project requirements
DO $$
DECLARE
  profile_rec RECORD;
  skill_id INTEGER;
  skill_ids INTEGER[] := ARRAY[1, 2, 3, 4, 7]; -- Skills needed for Project 1
  skill_count INTEGER := 0;
BEGIN
  -- Deployed workers (Profile 1-45) for Project 1
  FOR profile_rec IN SELECT id FROM profiles WHERE current_stage = 'deployed' ORDER BY id LOOP
    skill_count := skill_count + 1;

    -- Assign skills in order: 15 Masons, 8 Plumbers, 10 Electricians, 7 Carpenters, 5 Steel Fixers
    IF skill_count <= 15 THEN skill_id := 1; -- Mason
    ELSIF skill_count <= 23 THEN skill_id := 2; -- Plumber
    ELSIF skill_count <= 33 THEN skill_id := 3; -- Electrician
    ELSIF skill_count <= 40 THEN skill_id := 4; -- Carpenter
    ELSE skill_id := 7; -- Steel Fixer
    END IF;

    INSERT INTO profile_skills (profile_id, skill_category_id, proficiency_level, years_of_experience, is_primary, created_at, updated_at)
    VALUES (profile_rec.id, skill_id, 'intermediate', 3 + (random() * 5)::INTEGER, true, NOW() - INTERVAL '60 days', NOW());
  END LOOP;

  -- Trained workers (Profile 46-73) for Project 2 (onboarded but not deployed)
  skill_count := 0;
  FOR profile_rec IN SELECT id FROM profiles WHERE current_stage = 'trained' ORDER BY id LOOP
    skill_count := skill_count + 1;

    -- Assign skills: 10 Masons, 5 Plumbers, 7 Electricians, 4 Carpenters, 2 Painters
    IF skill_count <= 10 THEN skill_id := 1; -- Mason
    ELSIF skill_count <= 15 THEN skill_id := 2; -- Plumber
    ELSIF skill_count <= 22 THEN skill_id := 3; -- Electrician
    ELSIF skill_count <= 26 THEN skill_id := 4; -- Carpenter
    ELSE skill_id := 6; -- Painter
    END IF;

    INSERT INTO profile_skills (profile_id, skill_category_id, proficiency_level, years_of_experience, is_primary, created_at, updated_at)
    VALUES (profile_rec.id, skill_id, 'intermediate', 2 + (random() * 4)::INTEGER, true, NOW() - INTERVAL '30 days', NOW());
  END LOOP;

  -- Trainees (Profile 74-85) - assign random skills
  FOR profile_rec IN SELECT id FROM profiles WHERE current_stage = 'trainee' ORDER BY id LOOP
    skill_id := skill_ids[1 + (random() * (array_length(skill_ids, 1) - 1))::INTEGER];

    INSERT INTO profile_skills (profile_id, skill_category_id, proficiency_level, years_of_experience, is_primary, created_at, updated_at)
    VALUES (profile_rec.id, skill_id, 'beginner', 1 + (random() * 2)::INTEGER, true, NOW() - INTERVAL '20 days', NOW());
  END LOOP;

  -- Approved (Profile 86-95) - assign random skills
  FOR profile_rec IN SELECT id FROM profiles WHERE current_stage = 'approved' ORDER BY id LOOP
    skill_id := skill_ids[1 + (random() * (array_length(skill_ids, 1) - 1))::INTEGER];

    INSERT INTO profile_skills (profile_id, skill_category_id, proficiency_level, years_of_experience, is_primary, created_at, updated_at)
    VALUES (profile_rec.id, skill_id, 'beginner', 0 + (random() * 2)::INTEGER, true, NOW() - INTERVAL '10 days', NOW());
  END LOOP;
END $$;

-- ============================================================================
-- STEP 10: INSERT TRAINING BATCHES
-- ============================================================================
INSERT INTO training_batches (
  batch_code, batch_name, training_program_name, training_provider,
  trainer_name, start_date, end_date, duration_days, max_capacity,
  current_enrolled, status, location, description, created_by_user_id,
  created_at, updated_at
) VALUES
-- Batch 1 - Completed Mason training
('BTH00001', 'Mason Training Batch Q3 2024', 'Masonry', 'National Skill Development Corp',
 'Mr. Ramesh Rao', NOW() - INTERVAL '90 days', NOW() - INTERVAL '60 days', 30, 20, 15,
 'completed', 'Mumbai Training Center', 'Advanced masonry techniques training', 1,
 NOW() - INTERVAL '100 days', NOW() - INTERVAL '60 days'),

-- Batch 2 - Completed Plumber training
('BTH00002', 'Plumber Training Batch Q3 2024', 'Plumbing', 'Skill India',
 'Mr. Sunil Deshmukh', NOW() - INTERVAL '85 days', NOW() - INTERVAL '55 days', 30, 15, 10,
 'completed', 'Pune Training Center', 'Plumbing and pipe fitting training', 1,
 NOW() - INTERVAL '95 days', NOW() - INTERVAL '55 days'),

-- Batch 3 - Completed Electrician training
('BTH00003', 'Electrician Training Batch Q3 2024', 'Electrical Work', 'National Skill Development Corp',
 'Mr. Prakash Sharma', NOW() - INTERVAL '80 days', NOW() - INTERVAL '50 days', 30, 15, 12,
 'completed', 'Delhi Training Center', 'Electrical installations and safety', 1,
 NOW() - INTERVAL '90 days', NOW() - INTERVAL '50 days'),

-- Batch 4 - Ongoing Carpenter training
('BTH00004', 'Carpenter Training Batch Q4 2024', 'Carpentry', 'Skill India',
 'Mr. Vijay Kumar', NOW() - INTERVAL '20 days', NOW() + INTERVAL '10 days', 30, 15, 12,
 'ongoing', 'Bangalore Training Center', 'Woodwork and carpentry skills', 1,
 NOW() - INTERVAL '25 days', NOW()),

-- Batch 5 - Scheduled Painter training
('BTH00005', 'Painter Training Batch Q4 2024', 'Painting & Finishing', 'National Skill Development Corp',
 'Mr. Anil Patil', NOW() + INTERVAL '10 days', NOW() + INTERVAL '40 days', 30, 15, 0,
 'scheduled', 'Hyderabad Training Center', 'Professional painting techniques', 1,
 NOW() - INTERVAL '5 days', NOW());

-- ============================================================================
-- STEP 11: INSERT BATCH ENROLLMENTS
-- ============================================================================

-- Batch 1 enrollments (Mason - Completed)
INSERT INTO batch_enrollments (batch_id, profile_id, enrollment_date, completion_date, status, attendance_percentage, enrolled_by_user_id, created_at, updated_at)
SELECT
  1,
  id,
  NOW() - INTERVAL '90 days',
  NOW() - INTERVAL '60 days',
  'completed',
  85 + (random() * 15)::INTEGER,
  1,
  NOW() - INTERVAL '90 days',
  NOW() - INTERVAL '60 days'
FROM profiles
WHERE id IN (SELECT id FROM profiles WHERE current_stage IN ('deployed', 'trained') ORDER BY id LIMIT 15);

-- Batch 2 enrollments (Plumber - Completed)
INSERT INTO batch_enrollments (batch_id, profile_id, enrollment_date, completion_date, status, attendance_percentage, enrolled_by_user_id, created_at, updated_at)
SELECT
  2,
  id,
  NOW() - INTERVAL '85 days',
  NOW() - INTERVAL '55 days',
  'completed',
  80 + (random() * 20)::INTEGER,
  1,
  NOW() - INTERVAL '85 days',
  NOW() - INTERVAL '55 days'
FROM profiles
WHERE id IN (SELECT id FROM profiles WHERE current_stage IN ('deployed', 'trained') AND id NOT IN (SELECT profile_id FROM batch_enrollments) ORDER BY id LIMIT 10);

-- Batch 3 enrollments (Electrician - Completed)
INSERT INTO batch_enrollments (batch_id, profile_id, enrollment_date, completion_date, status, attendance_percentage, enrolled_by_user_id, created_at, updated_at)
SELECT
  3,
  id,
  NOW() - INTERVAL '80 days',
  NOW() - INTERVAL '50 days',
  'completed',
  82 + (random() * 18)::INTEGER,
  1,
  NOW() - INTERVAL '80 days',
  NOW() - INTERVAL '50 days'
FROM profiles
WHERE id IN (SELECT id FROM profiles WHERE current_stage IN ('deployed', 'trained') AND id NOT IN (SELECT profile_id FROM batch_enrollments) ORDER BY id LIMIT 12);

-- Batch 4 enrollments (Carpenter - Ongoing)
INSERT INTO batch_enrollments (batch_id, profile_id, enrollment_date, status, attendance_percentage, enrolled_by_user_id, created_at, updated_at)
SELECT
  4,
  id,
  NOW() - INTERVAL '20 days',
  'enrolled',
  60 + (random() * 20)::INTEGER,
  1,
  NOW() - INTERVAL '20 days',
  NOW()
FROM profiles
WHERE current_stage = 'trainee'
ORDER BY id LIMIT 12;

-- ============================================================================
-- STEP 12: INSERT PROJECT DEPLOYMENTS
-- ============================================================================

-- Project 1 - Deployed workers (status = 'deployed')
DO $$
DECLARE
  profile_rec RECORD;
  deploy_count INTEGER := 0;
BEGIN
  FOR profile_rec IN SELECT id FROM profiles WHERE current_stage = 'deployed' ORDER BY id LIMIT 45 LOOP
    deploy_count := deploy_count + 1;

    INSERT INTO project_deployments (
      project_id, profile_id, status, deployment_date, expected_end_date,
      deployed_by_user_id, created_at, updated_at
    ) VALUES (
      1,
      profile_rec.id,
      'deployed',
      NOW() - INTERVAL '30 days',
      NOW() + INTERVAL '335 days',
      1,
      NOW() - INTERVAL '30 days',
      NOW() - INTERVAL '30 days'
    );
  END LOOP;
END $$;

-- Project 2 - Onboarded workers (status = 'onboarded', waiting for deployment)
DO $$
DECLARE
  profile_rec RECORD;
  onboard_count INTEGER := 0;
BEGIN
  FOR profile_rec IN SELECT id FROM profiles WHERE current_stage = 'trained' ORDER BY id LIMIT 28 LOOP
    onboard_count := onboard_count + 1;

    INSERT INTO project_deployments (
      project_id, profile_id, status, deployment_date, expected_end_date,
      deployed_by_user_id, created_at, updated_at
    ) VALUES (
      2,
      profile_rec.id,
      'onboarded',
      NOW() + INTERVAL '15 days', -- Future deployment date
      NOW() + INTERVAL '285 days',
      1,
      NOW() - INTERVAL '10 days',
      NOW() - INTERVAL '10 days'
    );
  END LOOP;
END $$;

-- ============================================================================
-- STEP 13: LINK EMPLOYER REQUIREMENTS TO PROJECTS
-- ============================================================================
UPDATE employer_project_requirements SET project_id = 1 WHERE id = 1;
UPDATE employer_project_requirements SET project_id = 2 WHERE id = 2;

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- Data inserted:
-- - 4 Roles
-- - 4 Users
-- - 8 Skill Categories
-- - 6 Employers (5 verified, 1 unverified)
-- - 5 Employer Project Requirements (2 converted to projects, 1 reviewed, 2 pending)
-- - 2 Projects (1 deployed, 1 preparing)
-- - 10 Project Skill Requirements
-- - 100 Profiles (45 deployed, 28 trained/onboarded, 12 in training, 10 approved, 5 registered)
-- - 100 Addresses
-- - 85 Profile Skills
-- - 5 Training Batches (3 completed, 1 ongoing, 1 scheduled)
-- - 49 Batch Enrollments
-- - 73 Project Deployments (45 deployed, 28 onboarded)

SELECT 'Database seeded successfully!' as message;
SELECT 'Total Profiles: ' || COUNT(*) FROM profiles;
SELECT 'Total Deployments: ' || COUNT(*) FROM project_deployments;
SELECT 'Total Training Enrollments: ' || COUNT(*) FROM batch_enrollments;
SELECT 'Total Projects: ' || COUNT(*) FROM projects;
