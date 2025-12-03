// Note: This is a legacy model that doesn't exist in Prisma schema
// Keeping for backwards compatibility but should be migrated to interactions
export interface Note {
  id: number;
  profile_id: number;
  note_category?: string;
  content: string;
  created_by_user_id?: number;
  created_at: Date;
  updated_at: Date;
}

export interface CreateNoteDto {
  profile_id: number;
  note_category?: string;
  content: string;
  created_by_user_id?: number;
}

export interface UpdateNoteDto {
  note_category?: string;
  content?: string;
}
