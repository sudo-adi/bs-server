import type { ValidationError, ProjectCsvRow } from '@/types';

export class ProjectCsvRowValidator {
  static validate(row: ProjectCsvRow, rowNumber: number): ValidationError[] {
    const errors: ValidationError[] = [];

    // Required: name
    if (!row.name?.trim()) {
      errors.push({ field: 'name', message: 'Project name is required' });
    }

    // Required: employer_code
    if (!row.employer_code?.trim()) {
      errors.push({ field: 'employer_code', message: 'Employer code is required' });
    }

    return errors;
  }
}
