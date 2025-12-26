import { Prisma } from '@/generated/prisma';

/**
 * Financial data input interface
 */
export interface FinancialDataInput {
  contractValue?: string | number | null;
  revisedContractValue?: string | number | null;
  variationOrderValue?: string | number | null;
  actualCostIncurred?: string | number | null;
  miscCost?: string | number | null;
  budget?: string | number | null;
  // Snake case alternatives
  contract_value?: string | number | null;
  revised_contract_value?: string | number | null;
  variation_order_value?: string | number | null;
  actual_cost_incurred?: string | number | null;
  misc_cost?: string | number | null;
}

/**
 * Normalize financial data from mixed camelCase/snake_case input
 */
export function normalizeFinancialData(data: FinancialDataInput): {
  contractValue: string | null;
  revisedContractValue: string | null;
  variationOrderValue: string | null;
  actualCostIncurred: string | null;
  miscCost: string | null;
  budget: string | null;
} {
  const contractValue = data.contractValue ?? data.contract_value;
  const revisedContractValue = data.revisedContractValue ?? data.revised_contract_value;
  const variationOrderValue = data.variationOrderValue ?? data.variation_order_value;
  const actualCostIncurred = data.actualCostIncurred ?? data.actual_cost_incurred;
  const miscCost = data.miscCost ?? data.misc_cost;
  const budget = data.budget;

  return {
    contractValue: contractValue?.toString() || null,
    revisedContractValue: revisedContractValue?.toString() || null,
    variationOrderValue: variationOrderValue?.toString() || null,
    actualCostIncurred: actualCostIncurred?.toString() || null,
    miscCost: miscCost?.toString() || null,
    budget: budget?.toString() || null,
  };
}

/**
 * Check if any financial data is provided
 */
export function hasFinancialData(data: FinancialDataInput): boolean {
  return !!(
    data.contractValue ??
    data.contract_value ??
    data.revisedContractValue ??
    data.revised_contract_value ??
    data.variationOrderValue ??
    data.variation_order_value ??
    data.actualCostIncurred ??
    data.actual_cost_incurred ??
    data.miscCost ??
    data.misc_cost ??
    data.budget
  );
}

/**
 * Upsert project financials (create or update)
 */
export async function upsertProjectFinancials(
  tx: Prisma.TransactionClient,
  projectId: string,
  data: FinancialDataInput
): Promise<void> {
  if (!hasFinancialData(data)) {
    return;
  }

  const financialData = normalizeFinancialData(data);
  const now = new Date();

  const existingFinancial = await tx.projectFinancial.findFirst({
    where: { projectId },
  });

  if (existingFinancial) {
    await tx.projectFinancial.update({
      where: { id: existingFinancial.id },
      data: {
        ...financialData,
        updatedAt: now,
      },
    });
  } else {
    await tx.projectFinancial.create({
      data: {
        projectId,
        ...financialData,
        createdAt: now,
        updatedAt: now,
      },
    });
  }
}

/**
 * Create project financials (for new projects)
 */
export async function createProjectFinancials(
  tx: Prisma.TransactionClient,
  projectId: string,
  data: FinancialDataInput
): Promise<void> {
  if (!hasFinancialData(data)) {
    return;
  }

  const financialData = normalizeFinancialData(data);
  const now = new Date();

  await tx.projectFinancial.create({
    data: {
      projectId,
      ...financialData,
      createdAt: now,
      updatedAt: now,
    },
  });
}
