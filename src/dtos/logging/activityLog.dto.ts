/**
 * Activity Log DTOs
 */

// ==================== REQUEST ====================

export interface CreateActivityLogDto {
  profileId: string;
  action: string;
  module: string;
  recordId?: string;
  oldValue?: string;
  newValue?: string;
  ipAddress?: string;
  userAgent?: string;
}

// ==================== RESPONSE ====================

export interface ActivityLogResponse {
  id: string;
  profileId: string | null;
  action: string | null;
  module: string | null;
  recordId: string | null;
  oldValue: string | null;
  newValue: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date | null;
  profile?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
  } | null;
}

// ==================== QUERY ====================

export interface ActivityLogListQuery {
  profileId?: string;
  action?: string;
  module?: string;
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
}
