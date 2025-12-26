/**
 * Worker Self-Service DTOs
 * These DTOs are used for blue-collar worker self-service APIs
 */

// ============================================================================
// WORKER PROFILE DTOs
// ============================================================================

/**
 * Worker's own profile response (full data, no masking)
 */
export interface WorkerProfileResponseDto {
  id: string;
  workerCode: string | null;
  candidateCode: string | null;
  firstName: string | null;
  middleName: string | null;
  lastName: string | null;
  phone: string | null;
  altPhone: string | null;
  email: string | null;
  profilePhotoURL: string | null;
  dateOfBirth: Date | null;
  gender: string | null;
  fathersName: string | null;
  currentStage: string | null;
  isActive: boolean | null;
  workerType: string | null;
  profileType: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;

  // Nested relations
  identity: WorkerIdentityDto | null;
  addresses: WorkerAddressDto[];
  bankAccounts: WorkerBankAccountDto[];
  skills: WorkerSkillDto[];
  languages: WorkerLanguageDto[];
  documents: WorkerDocumentDto[];
}

/**
 * Worker identity information
 */
export interface WorkerIdentityDto {
  id: string;
  aadhaarNumber: string | null;
  aadhaarDocument: { id: string; documentUrl: string | null } | null;
  panNumber: string | null;
  panDocument: { id: string; documentUrl: string | null } | null;
  esicNumber: string | null;
  esicDocument: { id: string; documentUrl: string | null } | null;
  uanNumber: string | null;
  uanDocument: { id: string; documentUrl: string | null } | null;
  pfAccountNumber: string | null;
  pfDocument: { id: string; documentUrl: string | null } | null;
  healthInsurancePolicy: string | null;
  healthInsuranceProvider: string | null;
  healthInsuranceExpiry: Date | null;
  healthInsuranceDocument: { id: string; documentUrl: string | null } | null;
}

/**
 * Worker address
 */
export interface WorkerAddressDto {
  id: string;
  addressType: string | null;
  houseNumber: string | null;
  villageOrCity: string | null;
  district: string | null;
  state: string | null;
  postalCode: string | null;
  landmark: string | null;
  policeStation: string | null;
}

/**
 * Worker bank account
 */
export interface WorkerBankAccountDto {
  id: string;
  accountHolderName: string | null;
  accountNumber: string | null;
  bankName: string | null;
  ifscCode: string | null;
  branchName: string | null;
  isPrimary: boolean | null;
}

/**
 * Worker skill
 */
export interface WorkerSkillDto {
  id: string;
  skillCategory: {
    id: string;
    name: string | null;
  } | null;
  yearsOfExperience: number | null;
  isPrimary: boolean | null;
}

/**
 * Worker language
 */
export interface WorkerLanguageDto {
  id: string;
  language: {
    id: string;
    name: string | null;
  } | null;
}

/**
 * Worker document
 */
export interface WorkerDocumentDto {
  id: string;
  documentUrl: string | null;
  documentNumber: string | null;
  documentType: {
    id: string;
    name: string | null;
    documentCategory: {
      id: string;
      name: string | null;
    } | null;
  } | null;
  createdAt: Date | null;
}

// ============================================================================
// WORKER PROFILE UPDATE DTOs
// ============================================================================

/**
 * Fields worker can edit on their own profile
 */
export interface WorkerProfileUpdateDto {
  altPhone?: string;
  email?: string;
  // Nested updates
  addresses?: WorkerAddressUpdateDto[];
  bankAccounts?: WorkerBankAccountUpdateDto[];
  languages?: WorkerLanguageUpdateDto[];
}

export interface WorkerAddressUpdateDto {
  id?: string; // If provided, update existing; otherwise create new
  _delete?: boolean; // If true, delete this address
  addressType?: string;
  houseNumber?: string;
  villageOrCity?: string;
  district?: string;
  state?: string;
  postalCode?: string;
  landmark?: string;
  policeStation?: string;
}

export interface WorkerBankAccountUpdateDto {
  id?: string;
  _delete?: boolean;
  accountHolderName?: string;
  accountNumber?: string;
  bankName?: string;
  ifscCode?: string;
  branchName?: string;
  isPrimary?: boolean;
}

export interface WorkerLanguageUpdateDto {
  id?: string;
  _delete?: boolean;
  languageId?: string;
}

// ============================================================================
// WORKER IDENTITY UPDATE DTOs
// ============================================================================

/**
 * Identity update request (numbers + document files)
 */
export interface WorkerIdentityUpdateDto {
  aadhaarNumber?: string;
  panNumber?: string;
  esicNumber?: string;
  uanNumber?: string;
  pfAccountNumber?: string;
  healthInsurancePolicy?: string;
  healthInsuranceProvider?: string;
  healthInsuranceExpiry?: string | Date;
}

// ============================================================================
// WORKER PROJECT DTOs
// ============================================================================

/**
 * Worker's assigned project (minimal info)
 */
export interface WorkerProjectDto {
  assignmentId: string;
  project: {
    id: string;
    projectCode: string | null;
    name: string | null;
    location: string | null;
    stage: string | null;
    startDate: Date | null;
    endDate: Date | null;
  };
  employer: {
    id: string;
    companyName: string | null;
  } | null;
  assignment: {
    stage: string | null;
    assignedAt: Date | null;
    deployedAt: Date | null;
  };
  projectManager: {
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
  } | null;
}

export interface WorkerProjectsResponseDto {
  projects: WorkerProjectDto[];
  total: number;
}

// ============================================================================
// WORKER TRAINING DTOs
// ============================================================================

/**
 * Worker's training enrollment (minimal info)
 */
export interface WorkerTrainingDto {
  enrollmentId: string;
  batch: {
    id: string;
    code: string | null;
    name: string | null;
    programName: string | null;
    provider: string | null;
    location: string | null;
    startDate: Date | null;
    endDate: Date | null;
    shift: string | null;
    status: string | null;
  };
  enrollment: {
    status: string | null;
    enrollmentDate: Date | null;
    actualStartDate: Date | null;
    completionDate: Date | null;
  };
  trainer: {
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
  } | null;
  certificate: {
    id: string;
    certificateNumber: string | null;
    certificateFileUrl: string | null;
    issuedDate: Date | null;
  } | null;
}

export interface WorkerTrainingsResponseDto {
  trainings: WorkerTrainingDto[];
  total: number;
}

// ============================================================================
// QUERY PARAMS
// ============================================================================

export interface WorkerProjectsQueryDto {
  status?: 'active' | 'completed' | 'all';
}

export interface WorkerTrainingsQueryDto {
  status?: 'enrolled' | 'completed' | 'dropped' | 'all';
}
