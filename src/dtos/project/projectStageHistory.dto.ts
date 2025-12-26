/**
 * Project Stage History DTOs
 */

export interface ProjectStageHistoryResponse {
  id: string;
  projectId: string | null;
  fromStage: string | null;
  toStage: string | null;
  changedAt: Date | null;
  changedByProfileId: string | null;
  reason: string | null;
  metadata: Record<string, unknown> | null;
  changedByProfile?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
  } | null;
}

export interface ProjectStageHistoryListQuery {
  projectId: string;
  page?: number;
  limit?: number;
}
