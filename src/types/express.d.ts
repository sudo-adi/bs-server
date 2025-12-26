/* eslint-disable @typescript-eslint/no-namespace */

declare global {
  namespace Express {
    interface AuthUser {
      id: string;
      phone?: string;
      email?: string;
      userType: 'profile' | 'employer';
      // Profile-specific fields
      profileId?: string;
      profileType?: 'candidate' | 'worker';
      workerType?: 'blue' | 'white' | 'trainer';
      candidateCode?: string;
      workerCode?: string;
      currentStage?: string;
      isActive?: boolean;
      isAdmin?: boolean;
      // Name fields
      firstName?: string;
      lastName?: string;
      // Employer-specific fields
      companyName?: string;
      employerCode?: string;
    }

    interface Request {
      user?: AuthUser;
    }
  }
}

export {};
