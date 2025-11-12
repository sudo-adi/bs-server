import * as bankAccountController from '@/controllers/profiles/bankAccount.controller';
import { accountIdParamSchema, validate } from '@/middlewares';
import { Router } from 'express';

const router = Router({ mergeParams: true });

// Bank Account routes - all under /:id/bank-accounts
router.get('/', bankAccountController.getProfileBankAccounts);
router.post('/', bankAccountController.addBankAccount);
router.patch(
  '/:accountId',
  validate(accountIdParamSchema, 'params'),
  bankAccountController.updateBankAccount
);
router.post(
  '/:accountId/verify',
  validate(accountIdParamSchema, 'params'),
  bankAccountController.verifyBankAccount
);
router.delete(
  '/:accountId',
  validate(accountIdParamSchema, 'params'),
  bankAccountController.deleteBankAccount
);

export default router;
