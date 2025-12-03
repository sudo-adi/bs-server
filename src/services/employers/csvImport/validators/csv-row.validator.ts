import type { EmployerCsvRow, ValidationError } from '@/types';

export class EmployerCsvRowValidator {
  static validate(row: EmployerCsvRow, rowNumber: number): ValidationError[] {
    const errors: ValidationError[] = [];

    // Required fields
    if (!row.company_name || row.company_name.trim() === '') {
      errors.push({ field: 'company_name', message: 'Company name is required' });
    }

    if (!row.client_name || row.client_name.trim() === '') {
      errors.push({ field: 'client_name', message: 'Client name is required' });
    }

    if (!row.email || row.email.trim() === '') {
      errors.push({ field: 'email', message: 'Email is required' });
    } else {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(row.email)) {
        errors.push({ field: 'email', message: 'Invalid email format' });
      }
    }

    if (!row.password || row.password.trim() === '') {
      errors.push({ field: 'password', message: 'Password is required' });
    } else if (row.password.length < 6) {
      errors.push({ field: 'password', message: 'Password must be at least 6 characters' });
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

    // Validate GST number format if provided
    if (row.gst_number && row.gst_number.trim() !== '') {
      const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
      if (!gstRegex.test(row.gst_number.toUpperCase())) {
        errors.push({
          field: 'gst_number',
          message: 'Invalid GST number format',
        });
      }
    }

    // Validate authorized person email if provided
    if (row.authorized_person_email && row.authorized_person_email.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(row.authorized_person_email)) {
        errors.push({
          field: 'authorized_person_email',
          message: 'Invalid authorized person email format',
        });
      }
    }

    return errors;
  }
}
