/**
 * Project Financial DTOs
 */

// ==================== REQUEST ====================

export interface CreateProjectFinancialDto {
  projectId: string;
  budget?: number;
  actualCost?: number;
  invoicedAmount?: number;
  paidAmount?: number;
  notes?: string;
}

export interface UpdateProjectFinancialDto {
  budget?: number;
  actualCost?: number;
  invoicedAmount?: number;
  paidAmount?: number;
  notes?: string;
}

// ==================== RESPONSE ====================

export interface ProjectFinancialResponse {
  id: string;
  projectId: string | null;
  budget: number | null;
  actualCost: number | null;
  invoicedAmount: number | null;
  paidAmount: number | null;
  notes: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  project?: {
    id: string;
    projectCode: string | null;
    name: string | null;
  } | null;
}

export interface ProjectFinancialSummary {
  totalBudget: number;
  totalActualCost: number;
  totalInvoiced: number;
  totalPaid: number;
  outstanding: number;
  profitMargin: number;
}
