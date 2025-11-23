-- ==================== Add Payroll Fields to Profiles ====================
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS esic_number VARCHAR(17),
ADD COLUMN IF NOT EXISTS uan_number VARCHAR(12),
ADD COLUMN IF NOT EXISTS pf_account_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS pan_number VARCHAR(10),
ADD COLUMN IF NOT EXISTS health_insurance_policy_number VARCHAR(100);

-- Create indexes for quick lookups
CREATE INDEX IF NOT EXISTS idx_profiles_esic ON profiles(esic_number);
CREATE INDEX IF NOT EXISTS idx_profiles_uan ON profiles(uan_number);
CREATE INDEX IF NOT EXISTS idx_profiles_pan ON profiles(pan_number);

-- Add comments
COMMENT ON COLUMN profiles.esic_number IS 'Employee State Insurance Corporation number (Format: XX-XX-XXXXXX-XXX-XXXX)';
COMMENT ON COLUMN profiles.uan_number IS 'Universal Account Number for PF (12 digits)';
COMMENT ON COLUMN profiles.pf_account_number IS 'Provident Fund account number';
COMMENT ON COLUMN profiles.pan_number IS 'Permanent Account Number for tax purposes';
COMMENT ON COLUMN profiles.health_insurance_policy_number IS 'Health insurance policy number';


-- ==================== Create Salary Slips Table ====================
CREATE TABLE IF NOT EXISTS profile_salary_slips (
  id SERIAL PRIMARY KEY,
  profile_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Salary Period
  salary_month INTEGER NOT NULL CHECK (salary_month BETWEEN 1 AND 12),
  salary_year INTEGER NOT NULL CHECK (salary_year >= 2000),

  -- Salary Slip Document
  slip_document_url VARCHAR(1000),
  slip_file_name VARCHAR(255),

  -- Payment Tracking
  payment_date DATE,
  payment_status VARCHAR(50) DEFAULT 'pending',
  payment_reference VARCHAR(200),
  payment_mode VARCHAR(50),

  -- Additional Info
  notes TEXT,

  -- Audit (Note: No FK constraints due to type mismatch between schema and DB)
  uploaded_by_user_id UUID,
  approved_by_user_id UUID,
  created_at TIMESTAMP(6) DEFAULT NOW(),
  updated_at TIMESTAMP(6) DEFAULT NOW(),

  -- Prevent duplicate salary slips for same month
  CONSTRAINT uq_profile_salary_month UNIQUE (profile_id, salary_month, salary_year)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_salary_slips_profile ON profile_salary_slips(profile_id);
CREATE INDEX IF NOT EXISTS idx_salary_slips_period ON profile_salary_slips(salary_year, salary_month);
CREATE INDEX IF NOT EXISTS idx_salary_slips_status ON profile_salary_slips(payment_status);
CREATE INDEX IF NOT EXISTS idx_salary_slips_profile_period ON profile_salary_slips(profile_id, salary_year, salary_month);

-- Add comments
COMMENT ON TABLE profile_salary_slips IS 'Monthly salary slips for workers/candidates';
COMMENT ON COLUMN profile_salary_slips.salary_month IS 'Salary month (1-12)';
COMMENT ON COLUMN profile_salary_slips.salary_year IS 'Salary year';
COMMENT ON COLUMN profile_salary_slips.slip_document_url IS 'URL to salary slip PDF document';
COMMENT ON COLUMN profile_salary_slips.payment_status IS 'Payment status: pending, paid, on_hold, cancelled';
COMMENT ON COLUMN profile_salary_slips.payment_reference IS 'Payment transaction reference (UTR/Transaction ID)';

-- Note: For document categories, use these string values in document_category field:
-- 'ESIC Card', 'Health Insurance', 'PF Document', 'Pension Document',
-- 'Form 16', 'Form 26AS', 'Training Certificate', 'Employee ID Card'
