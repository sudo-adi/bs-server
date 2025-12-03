import type { TrainerCsvRow, ValidationError } from '@/types';

export class TrainerCsvRowValidator {
  static validate(row: TrainerCsvRow, rowNumber: number): ValidationError[] {
    const errors: ValidationError[] = [];

    // Required fields
    if (!row.name || row.name.trim() === '') {
      errors.push({ field: 'name', message: 'Name is required' });
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

    if (!row.password || row.password.trim() === '') {
      errors.push({ field: 'password', message: 'Password is required' });
    } else if (row.password.length < 6) {
      errors.push({ field: 'password', message: 'Password must be at least 6 characters' });
    }

    // Validate email if provided
    if (row.email && row.email.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(row.email)) {
        errors.push({ field: 'email', message: 'Invalid email format' });
      }
    }

    return errors;
  }
}
