import { ExportEmployerDto } from '@/dtos/employer/employer.dto';

/**
 * Convert employer to response DTO (removes passwordHash)
 */
export function toEmployerResponse<T extends { passwordHash?: string | null }>(
  employer: T
): Omit<T, 'passwordHash'> {
  const { passwordHash, ...employerWithoutPassword } = employer;
  return employerWithoutPassword;
}

/**
 * Map employer to export DTO format
 */
export function mapEmployerToExport(
  employer: any
): Omit<
  ExportEmployerDto,
  | 'projectTitle'
  | 'projectDescription'
  | 'location'
  | 'estimatedStartDate'
  | 'estimatedDurationDays'
  | 'estimatedBudget'
  | 'additionalNotes'
  | 'projectRequestStatus'
  | 'projectRequestCreatedAt'
> {
  return {
    employerCode: employer.employerCode || '',
    companyName: employer.companyName || '',
    clientName: employer.clientName || '',
    email: employer.email || '',
    phone: employer.phone || '',
    altPhone: employer.altPhone || '',
    registeredAddress: employer.registeredAddress || '',
    companyRegistrationNumber: employer.companyRegistrationNumber || '',
    gstNumber: employer.gstNumber || '',
    city: employer.city || '',
    district: employer.district || '',
    state: employer.state || '',
    landmark: employer.landmark || '',
    postalCode: employer.postalCode || '',
    logoUrl: employer.logoUrl || '',
    isActive: employer.isActive ? 'Yes' : 'No',
    isVerified: employer.isVerified ? 'Yes' : 'No',
    verifiedAt: employer.verifiedAt?.toISOString().split('T')[0] || '',
    createdAt: employer.createdAt?.toISOString().split('T')[0] || '',
  };
}
