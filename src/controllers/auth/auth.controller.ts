import { authService } from '@/services/auth';
import { Request, Response } from 'express';

export const login = async (req: Request, res: Response) => {
  const { username, password } = req.body;

  const result = await authService.login(username, password);

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: result,
  });
};

export const getCurrentUser = async (req: Request, res: Response) => {
  // This would typically use the user ID from the JWT token in the auth middleware
  // For now, we'll get it from query params for testing
  const userId = req.query.userId as string;

  if (!userId) {
    res.status(400).json({
      success: false,
      message: 'User ID is required',
    });
    return;
  }

  const user = await authService.getCurrentUser(userId);

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
