import type { ProfileCsvRow, ValidationError } from '@/types';

export class CsvRowValidator {
  static validate(row: ProfileCsvRow): ValidationError[] {
    const errors: ValidationError[] = [];

    // Required fields
    if (!row.first_name || row.first_name.trim() === '') {
      errors.push({ field: 'first_name', message: 'First name is required' });
    }

    if (!row.phone || row.phone.trim() === '') {
      errors.push({ field: 'phone', message: 'Phone number is required' });
    } else {
      // Validate phone format (basic validation)
      const phoneRegex = /^[0-9]{10}$/;
      if (!phoneRegex.test(row.phone.replace(/[\s\-\(\)]/g, ''))) {
        errors.push({
          field: 'phone',
          message: 'Phone number must be 10 digits',
        });
      }
    }

    // Validate email if provided
    if (row.email && row.email.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(row.email)) {
        errors.push({ field: 'email', message: 'Invalid email format' });
      }
    }

    // Validate gender if provided
    if (row.gender && !['male', 'female', 'other'].includes(row.gender.toLowerCase())) {
      errors.push({
        field: 'gender',
        message: 'Gender must be male, female, or other',
      });
    }

    // Validate date of birth if provided
    if (row.date_of_birth && row.date_of_birth.trim() !== '') {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(row.date_of_birth)) {
        errors.push({
          field: 'date_of_birth',
          message: 'Date of birth must be in YYYY-MM-DD format',
        });
      }
    }

    // Validate bank account if provided
    if (row.account_number && (!row.ifsc_code || !row.account_holder_name)) {
      errors.push({
        field: 'bank_account',
        message: 'IFSC code and account holder name are required when account number is provided',
      });
    }

    // Validate ESIC number format if provided
    if (row.esic_number && row.esic_number.trim() !== '') {
      const esicRegex = /^[0-9]{17}$/;
      if (!esicRegex.test(row.esic_number.replace(/[\s\-]/g, ''))) {
        errors.push({
          field: 'esic_number',
          message: 'ESIC number must be 17 digits',
        });
      }
    }

    // Validate UAN number format if provided
    if (row.uan_number && row.uan_number.trim() !== '') {
      const uanRegex = /^[0-9]{12}$/;
      if (!uanRegex.test(row.uan_number.replace(/[\s\-]/g, ''))) {
        errors.push({
          field: 'uan_number',
          message: 'UAN number must be 12 digits',
        });
      }
    }

    // Validate PAN number format if provided
    if (row.pan_number && row.pan_number.trim() !== '') {
      const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
      if (!panRegex.test(row.pan_number.toUpperCase())) {
        errors.push({
          field: 'pan_number',
          message: 'PAN number must be in format: ABCDE1234F',
        });
      }
    }

    return errors;
  }
}
