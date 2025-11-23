export interface CreateSalarySlipDto {
  profile_id: string;
  salary_month: number;
  salary_year: number;
  slip_document_url?: string;
  slip_file_name?: string;
  payment_date?: Date;
  payment_status?: string;
  payment_reference?: string;
  payment_mode?: string;
  notes?: string;
  uploaded_by_user_id?: string;
}

export interface UpdateSalarySlipDto {
  slip_document_url?: string;
  slip_file_name?: string;
  payment_date?: Date;
  payment_status?: string;
  payment_reference?: string;
  payment_mode?: string;
  notes?: string;
  approved_by_user_id?: string;
}

export interface MarkPaidDto {
  payment_date: Date;
  payment_reference: string;
  payment_mode?: string;
}
