// Activity Log model
export interface ActivityLog {
  id: number;
  user_id: number;
  action: string;
  module: string;
  record_id?: number;
  old_value?: string;
  new_value?: string;
  ip_address?: string;
  user_agent?: string;
  created_at: Date;
}

export interface CreateActivityLogDto {
  user_id: number;
  action: string;
  module: string;
  record_id?: number;
  old_value?: string;
  new_value?: string;
  ip_address?: string;
  user_agent?: string;
}

export interface ActivityLogQueryParams {
  user_id?: number;
  module?: string;
  action?: string;
  limit?: number;
  offset?: number;
  start_date?: string;
  end_date?: string;
}
