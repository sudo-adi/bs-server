// User Activity Log model - For audit trail
export interface UserActivityLog {
  id: number;
  user_id?: number;
  action_type: string;
  module?: string;
  target_type?: string;
  target_id?: number;
  details?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: Date;
}

export interface CreateActivityLogDto {
  user_id?: number;
  action_type:
    | 'login'
    | 'logout'
    | 'create'
    | 'update'
    | 'delete'
    | 'view'
    | 'export'
    | 'approve'
    | 'verify';
  module?: string;
  target_type?: string;
  target_id?: number;
  details?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
}
