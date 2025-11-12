import { NextFunction, Request, Response } from 'express';

/**
 * Request timeout middleware
 * Terminates requests that take longer than specified timeout
 */
export const requestTimeout = (timeoutMs: number = 30000) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Set timeout on the request
    req.setTimeout(timeoutMs, () => {
      if (!res.headersSent) {
        res.status(408).json({
          success: false,
          message: 'Request timeout',
          reason: `Request took longer than ${timeoutMs / 1000} seconds to complete`,
        });
      }
    });

    // Set timeout on the response
    res.setTimeout(timeoutMs, () => {
      if (!res.headersSent) {
        res.status(408).json({
          success: false,
          message: 'Response timeout',
          reason: `Response took longer than ${timeoutMs / 1000} seconds to send`,
        });
      }
    });

    next();
  };
};
