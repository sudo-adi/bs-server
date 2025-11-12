/**
 * Types for CSV import functionality
 */

// Base CSV row interface for profile imports
export interface ProfileCsvRow {
  // Personal Information (Required)
  first_name: string;
  last_name?: string;
  middle_name?: string;
  fathers_name?: string;
  phone: string;
  alt_phone?: string;
  email?: string;
  gender?: 'male' | 'female' | 'other';
  date_of_birth?: string; // Format: YYYY-MM-DD

  // Address Information
  address_type?: 'permanent' | 'current';
  house_number?: string;
  village_or_city?: string;
  district?: string;
  state?: string;
  postal_code?: string;
  landmark?: string;
  police_station?: string;
  post_office?: string;

  // Document Information
  doc_type?: string; // e.g., 'Aadhar', 'PAN', 'Voter ID'
  doc_number?: string;

  // Bank Account Information
  account_holder_name?: string;
  account_number?: string;
  ifsc_code?: string;
  bank_name?: string;
  branch_name?: string;
  account_type?: 'savings' | 'current';

  // Qualification Information
  qualification_type?: string; // e.g., '10th', '12th', 'Graduate', 'Post Graduate'
  institution_name?: string;
  field_of_study?: string;
  year_of_completion?: string;
  percentage_or_grade?: string;

  // Skill Information
  skill_category?: string;
  years_of_experience?: string;

  // Stage Information (auto-set based on import type)
  // This will be set programmatically, not from CSV
}

// Import result for individual row
export interface ImportRowResult {
  rowNumber: number;
  success: boolean;
  profileId?: string;
  candidateCode?: string;
  errors?: string[];
  warnings?: string[];
}

// Overall import result
export interface ImportResult {
  totalRows: number;
  successCount: number;
  failureCount: number;
  results: ImportRowResult[];
}

// Import options
export interface ImportOptions {
  importType: 'candidate' | 'worker';
  skipDuplicates?: boolean;
  updateExisting?: boolean;
}

// Validation error
export interface ValidationError {
  field: string;
  message: string;
}
