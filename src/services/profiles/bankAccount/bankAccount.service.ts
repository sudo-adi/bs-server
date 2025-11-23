import type {
  BankAccount,
  CreateBankAccountDto,
  UpdateBankAccountDto,
  VerifyBankAccountDto,
} from '@/models/profiles/bankAccount.model';
import { BankAccountCreateOperation } from './operations/bankAccount-create.operation';
import { BankAccountDeleteOperation } from './operations/bankAccount-delete.operation';
import { BankAccountUpdateOperation } from './operations/bankAccount-update.operation';
import { BankAccountVerifyOperation } from './operations/bankAccount-verify.operation';
import { BankAccountQuery } from './queries/bankAccount.query';

export class BankAccountService {
  async getProfileBankAccounts(profileId: string): Promise<BankAccount[]> {
    return BankAccountQuery.getProfileBankAccounts(profileId);
  }

  async createBankAccount(data: CreateBankAccountDto): Promise<BankAccount> {
    return BankAccountCreateOperation.create(data);
  }

  async updateBankAccount(id: string, data: UpdateBankAccountDto): Promise<BankAccount> {
    return BankAccountUpdateOperation.update(id, data);
  }

  async verifyBankAccount(id: string, data: VerifyBankAccountDto): Promise<BankAccount> {
    return BankAccountVerifyOperation.verify(id, data);
  }

  async deleteBankAccount(id: string): Promise<void> {
    return BankAccountDeleteOperation.delete(id);
  }
}

export default new BankAccountService();
