import userService from '@/services/admin/user.service';
import { Request, Response } from 'express';

export const createUser = async (req: Request, res: Response) => {
  const user = await userService.createUser(req.body);

  res.status(201).json({
    success: true,
    message: 'User created successfully',
    data: user,
  });
};

export const getUser = async (req: Request, res: Response) => {
  const id = req.params.id;
  const user = await userService.getUserById(id);

  if (!user) {
    res.status(404).json({
      success: false,
      message: 'User not found',
    });
    return;
  }

  res.status(200).json({
    success: true,
    data: user,
  });
};

export const getAllUsers = async (req: Request, res: Response) => {
  const { is_active, search } = req.query;

  const users = await userService.getAllUsers({
    is_active: is_active === 'true' ? true : is_active === 'false' ? false : undefined,
    search: search as string,
  });

  res.status(200).json({
    success: true,
    count: users.length,
    data: users,
  });
};

export const updateUser = async (req: Request, res: Response) => {
  const id = req.params.id;
  const user = await userService.updateUser(id, req.body);

  res.status(200).json({
    success: true,
    message: 'User updated successfully',
    data: user,
  });
};

export const changePassword = async (req: Request, res: Response) => {
  const id = req.params.id;
  const { oldPassword, newPassword } = req.body;

  await userService.changePassword(id, oldPassword, newPassword);

  res.status(200).json({
    success: true,
    message: 'Password changed successfully',
  });
};

export const deleteUser = async (req: Request, res: Response) => {
  const id = req.params.id;
  await userService.deleteUser(id);

  res.status(200).json({
    success: true,
    message: 'User deleted successfully',
  });
};

// Activate user
export const activateUser = async (req: Request, res: Response) => {
  const id = req.params.id;
  const user = await userService.updateUser(id, { is_active: true });

  res.status(200).json({
    success: true,
    message: 'User activated successfully',
    data: user,
  });
};

// Deactivate user
export const deactivateUser = async (req: Request, res: Response) => {
  const id = req.params.id;
  const user = await userService.updateUser(id, { is_active: false });

  res.status(200).json({
    success: true,
    message: 'User deactivated successfully',
    data: user,
  });
};
