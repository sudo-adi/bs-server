import prisma from '@/config/prisma';
import type { CreateSalarySlipDto, UpdateSalarySlipDto, MarkPaidDto } from '@/dtos/salary-slip.dto';
import type { profile_salary_slips } from '@/generated/prisma';

export class SalarySlipService {
  async create(data: CreateSalarySlipDto): Promise<profile_salary_slips> {
    return await prisma.profile_salary_slips.create({ data });
  }

  async findAll(profileId: string, filters?: { salary_year?: number; payment_status?: string }) {
    return await prisma.profile_salary_slips.findMany({
      where: {
        profile_id: profileId,
        ...(filters?.salary_year && { salary_year: filters.salary_year }),
        ...(filters?.payment_status && { payment_status: filters.payment_status }),
      },
      orderBy: [{ salary_year: 'desc' }, { salary_month: 'desc' }],
    });
  }

  async findById(id: number): Promise<profile_salary_slips | null> {
    return await prisma.profile_salary_slips.findUnique({ where: { id } });
  }

  async findByPeriod(profileId: string, year: number, month: number) {
    return await prisma.profile_salary_slips.findFirst({
      where: { profile_id: profileId, salary_year: year, salary_month: month },
    });
  }

  async update(id: number, data: UpdateSalarySlipDto): Promise<profile_salary_slips> {
    return await prisma.profile_salary_slips.update({ where: { id }, data });
  }

  async delete(id: number): Promise<void> {
    await prisma.profile_salary_slips.delete({ where: { id } });
  }

  async markPaid(id: number, data: MarkPaidDto): Promise<profile_salary_slips> {
    return await prisma.profile_salary_slips.update({
      where: { id },
      data: {
        payment_status: 'paid',
        payment_date: data.payment_date,
        payment_reference: data.payment_reference,
        payment_mode: data.payment_mode || 'bank_transfer',
      },
    });
  }
}

export default new SalarySlipService();
