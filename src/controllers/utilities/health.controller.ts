import { Request, Response } from 'express';

export const healthCheck = async (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  });
};

export const readinessCheck = async (_req: Request, res: Response) => {
  // Add your readiness checks here (database, external services, etc.)
  const isReady = true;

  if (isReady) {
    res.status(200).json({
      success: true,
      message: 'Server is ready',
    });
  } else {
    res.status(503).json({
      success: false,
      message: 'Server is not ready',
    });
  }
};
