import prisma from '@/config/prisma';
import { authService, UserType } from '@/services/auth';
import { Request, Response } from 'express';

export class AuthController {
  // ==================== Check Phone Exists (Public) ====================

  async checkPhoneExists(req: Request, res: Response): Promise<void> {
    try {
      const phone = req.query.phone as string;

      if (!phone) {
        res.status(400).json({
          success: false,
          exists: false,
          valid: false,
          message: 'Phone number is required',
        });
        return;
      }

      // Validate phone format (10-digit Indian mobile number)
      const phoneRegex = /^[6-9]\d{9}$/;
      if (!phoneRegex.test(phone)) {
        res.status(200).json({
          success: true,
          exists: false,
          valid: false,
          message: 'Invalid phone number format. Must be 10 digits starting with 6-9.',
        });
        return;
      }

      // Check if phone exists in both Profile and Employer tables (parallel)
      const [existingProfile, existingEmployer] = await Promise.all([
        prisma.profile.findFirst({
          where: {
            phone: phone,
            deletedAt: null,
          },
          select: { id: true },
        }),
        prisma.employer.findFirst({
          where: {
            phone: phone,
            deletedAt: null,
          },
          select: { id: true },
        }),
      ]);

      if (existingProfile) {
        res.status(200).json({
          success: true,
          exists: true,
          valid: true,
          userType: 'worker',
          message: 'This phone number is already registered as a worker',
        });
        return;
      }

      if (existingEmployer) {
        res.status(200).json({
          success: true,
          exists: true,
          valid: true,
          userType: 'employer',
          message: 'This phone number is already registered as an employer',
        });
        return;
      }

      res.status(200).json({
        success: true,
        exists: false,
        valid: true,
        message: 'Phone number is available',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        exists: false,
        valid: false,
        message: error.message || 'Failed to check phone number',
      });
    }
  }
  // ==================== Send OTP ====================

  async sendOtp(req: Request, res: Response): Promise<void> {
    try {
      const { phone, userType, purpose } = req.body;

      if (!phone) {
        res.status(400).json({ success: false, message: 'Phone is required' });
        return;
      }

      const result = await authService.sendLoginOtp({
        phone,
        userType: userType || 'profile',
        purpose: purpose || 'login',
      });

      res.status(200).json({ success: true, message: 'OTP sent', data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // ==================== Login ====================

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { phone, email, password, otp, userType, username } = req.body;

      // Admin login (username/password for white collar staff)
      // Check this FIRST before phone/email validation
      if (username && password && !userType) {
        const result = await authService.loginAdmin({
          email: username, // username can be email, phone, or name
          password,
        });
        res.status(200).json({ success: true, message: 'Login successful', data: result });
        return;
      }

      if (!phone && !email) {
        res.status(400).json({ success: false, message: 'Phone or email required' });
        return;
      }

      const result = await authService.login({
        phone,
        email,
        password,
        otp,
        userType: userType || 'profile',
      });

      if (result.requiresOtp) {
        res.status(200).json({ success: true, message: 'OTP sent', data: { requiresOtp: true } });
        return;
      }

      res.status(200).json({ success: true, message: 'Login successful', data: result });
    } catch (error: any) {
      res.status(401).json({ success: false, message: error.message });
    }
  }

  // ==================== Signup ====================

  async signup(req: Request, res: Response): Promise<void> {
    try {
      const { userType, ...data } = req.body;

      if (userType === 'employer') {
        // Employer signup
        if (!data.companyName || !data.email || !data.phone) {
          res
            .status(400)
            .json({ success: false, message: 'Company name, email, and phone required' });
          return;
        }
        const result = await authService.signupEmployer(data);
        res.status(201).json({
          success: true,
          message: 'Employer registered. Pending verification.',
          data: result,
        });
      } else {
        // Worker signup (blue, white, trainer)
        if (!data.firstName || !data.lastName || !data.phone) {
          res
            .status(400)
            .json({ success: false, message: 'First name, last name, and phone required' });
          return;
        }
        const result = await authService.signupWorker(data);
        res.status(201).json({ success: true, message: 'Signup successful', data: result });
      }
    } catch (error: any) {
      const status = error.message.includes('already registered') ? 409 : 400;
      res.status(status).json({ success: false, message: error.message });
    }
  }

  // ==================== Password Reset ====================

  async initiateReset(req: Request, res: Response): Promise<void> {
    try {
      const { phone, email, userType } = req.body;

      if (!phone && !email) {
        res.status(400).json({ success: false, message: 'Phone or email required' });
        return;
      }

      const result = await authService.initiatePasswordReset({
        phone,
        email,
        userType: userType || 'profile',
      });

      res.status(200).json({ success: true, message: 'OTP sent', data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { phone, email, otp, newPassword, userType } = req.body;

      if (!otp || !newPassword) {
        res.status(400).json({ success: false, message: 'OTP and new password required' });
        return;
      }

      await authService.resetPassword({
        phone,
        email,
        otp,
        newPassword,
        userType: userType || 'profile',
      });

      res.status(200).json({ success: true, message: 'Password reset successful' });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async changePassword(req: Request, res: Response): Promise<void> {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      if (!currentPassword || !newPassword) {
        res.status(400).json({ success: false, message: 'Current and new password required' });
        return;
      }

      await authService.changePassword(req.user.id, req.user.userType as UserType, {
        currentPassword,
        newPassword,
      });

      res.status(200).json({ success: true, message: 'Password changed' });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // ==================== Session ====================

  async logout(req: Request, res: Response): Promise<void> {
    // Client removes token; server can implement blacklist if needed
    res.status(200).json({ success: true, message: 'Logged out' });
  }

  async me(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }
    res.status(200).json({ success: true, data: req.user });
  }
}

export default new AuthController();
