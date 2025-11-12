import * as addressController from '@/controllers/profiles/address.controller';
import { addressIdParamSchema, validate } from '@/middlewares';
import { Router } from 'express';

const router = Router({ mergeParams: true });

// Address routes - all under /:id/addresses
router.get('/', addressController.getProfileAddresses);
router.post('/', addressController.addAddress);
router.patch(
  '/:addressId',
  validate(addressIdParamSchema, 'params'),
  addressController.updateAddress
);
router.delete(
  '/:addressId',
  validate(addressIdParamSchema, 'params'),
  addressController.deleteAddress
);

export default router;
