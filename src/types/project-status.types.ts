/**
 * Project status change types
 */

export interface ChangeProjectStatusDto {
  projectId?: string;
  toStatus?: string;
  to_status?: string;
  userId?: string;
  change_reason?: string;
  status_date?: Date;
  changed_by_user_id?: string;
  attributable_to?: string;
  documents?: any[];
  notes?: string;
  [key: string]: any;
}

export interface ProjectStatusChangeResponse {
  success: boolean;
  project: any;
  workersAffected?: number;
  affected_workers?: number;
  message?: string;
  status_history?: any;
  documents?: any[];
}
