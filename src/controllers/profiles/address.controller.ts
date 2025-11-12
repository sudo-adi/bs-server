import addressService from '@/services/profiles/address.service';
import catchAsync from '@/utils/catchAsync';
import { Request, Response } from 'express';

export const getProfileAddresses = catchAsync(async (req: Request, res: Response) => {
  const profileId = req.params.id;
  const addresses = await addressService.getProfileAddresses(profileId);

  res.status(200).json({
    success: true,
    data: addresses,
  });
});

export const addAddress = catchAsync(async (req: Request, res: Response) => {
  const profileId = req.params.id;
  const addressData = {
    ...req.body,
    profile_id: profileId,
  };
  const address = await addressService.createAddress(addressData);

  res.status(201).json({
    success: true,
    message: 'Address added successfully',
    data: address,
  });
});

export const updateAddress = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.addressId;
  const address = await addressService.updateAddress(id, req.body);

  res.status(200).json({
    success: true,
    message: 'Address updated successfully',
    data: address,
  });
});

export const deleteAddress = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.addressId;
  await addressService.deleteAddress(id);

  res.status(200).json({
    success: true,
    message: 'Address deleted successfully',
  });
});
