import bankAccountService from '@/services/profiles/bankAccount/bankAccount.service';
import catchAsync from '@/utils/catchAsync';
import { Request, Response } from 'express';

export const getProfileBankAccounts = catchAsync(async (req: Request, res: Response) => {
  const profileId = req.params.id;
  const bankAccounts = await bankAccountService.getProfileBankAccounts(profileId);

  res.status(200).json({
    success: true,
    data: bankAccounts,
  });
});

export const addBankAccount = catchAsync(async (req: Request, res: Response) => {
  const bankAccount = await bankAccountService.createBankAccount(req.body);

  res.status(201).json({
    success: true,
    message: 'Bank account added successfully',
    data: bankAccount,
  });
});

export const updateBankAccount = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.accountId;
  const bankAccount = await bankAccountService.updateBankAccount(id, req.body);

  res.status(200).json({
    success: true,
    message: 'Bank account updated successfully',
    data: bankAccount,
  });
});

export const verifyBankAccount = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.accountId;
  const bankAccount = await bankAccountService.verifyBankAccount(id, req.body);

  res.status(200).json({
    success: true,
    message: 'Bank account verified successfully',
    data: bankAccount,
  });
});

export const deleteBankAccount = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.accountId;
  await bankAccountService.deleteBankAccount(id);

  res.status(200).json({
    success: true,
    message: 'Bank account deleted successfully',
  });
});
