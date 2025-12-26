// @ts-nocheck
import { workerDetailsService } from '@/services/workerDetails/workerDetails.service';
import catchAsync from '@/utils/catchAsync';
import { Request, Response } from 'express';

// Get worker info by profileId (role-based access)
export const getWorkerInfoByUUID = catchAsync(async (req: Request, res: Response) => {
  const { uuid: profileId } = req.params;
  const userType = req.userType;

  if (!profileId) {
    res.status(400).json({
      success: false,
      message: 'Worker profile ID is required',
    });
    return;
  }

  // Get worker info based on user type
  if (userType === 'user') {
    // BuildSewa Team - Full access
    const workerInfo = await workerDetailsService.getFullWorkerInfo(profileId);

    if (!workerInfo) {
      res.status(404).json({
        success: false,
        message: 'Worker not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: workerInfo,
    });
  } else if (userType === 'employer') {
    // Employer - Limited access (only if worker is assigned to their project)
    const employerId = req.employerId;

    if (!employerId) {
      res.status(401).json({
        success: false,
        message: 'Employer ID not found',
      });
      return;
    }

    const workerInfo = await workerDetailsService.getWorkerInfoForEmployer(
      profileId,
      String(employerId)
    );

    if (!workerInfo) {
      res.status(404).json({
        success: false,
        message: 'Worker not found or not assigned to your projects',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: workerInfo,
    });
  } else if (userType === 'candidate') {
    // Worker viewing their own info
    const authenticatedProfileId = req.profileId;

    if (!authenticatedProfileId) {
      res.status(401).json({
        success: false,
        message: 'Profile ID not found',
      });
      return;
    }

    const workerInfo = await workerDetailsService.getWorkerOwnInfo(
      profileId,
      String(authenticatedProfileId)
    );

    if (!workerInfo) {
      res.status(404).json({
        success: false,
        message: 'Worker information not found or access denied',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: workerInfo,
    });
  } else {
    res.status(403).json({
      success: false,
      message: 'Access denied',
    });
  }
});

// Get current user's worker info
export const getMyWorkerInfo = catchAsync(async (req: Request, res: Response) => {
  const userType = req.userType;

  if (userType === 'candidate') {
    const profileId = req.profileId;

    if (!profileId) {
      res.status(401).json({
        success: false,
        message: 'Profile ID not found',
      });
      return;
    }

    const workerInfo = await workerDetailsService.getWorkerInfoByProfileId(String(profileId));

    if (!workerInfo) {
      res.status(404).json({
        success: false,
        message: 'Worker information not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: workerInfo,
    });
  } else {
    res.status(403).json({
      success: false,
      message: 'Only workers can access this endpoint',
    });
  }
});
