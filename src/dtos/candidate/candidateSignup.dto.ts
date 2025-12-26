/**
 * Request body type for creating candidate signup
 * Note: Signups now go directly into profiles table
 */
export interface CandidateSignupRequest {
  firstName: string;
  lastName: string;
  fathersName: string;
  state: string;
  villageOrCity: string;
  pincode: number;
}

/**
 * DTO for candidate signup response data
 */
export interface CandidateSignupResponseDto {
  id: string;
  countId?: number | null;
  firstName?: string | null;
  lastName?: string | null;
  fathersName?: string | null;
  state?: string | null;
  villageOrCity?: string | null;
  pincode?: number | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
  candidateCode?: string | null;
  currentStage?: string | null;
}

/**
 * Response type for candidate signup
 */
export interface CandidateSignupResponse {
  success: boolean;
  message: string;
  data?: CandidateSignupResponseDto;
}
