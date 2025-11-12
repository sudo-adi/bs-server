import { NextFunction, Request, Response } from 'express';

/**
 * Wrapper for async route handlers to catch errors and pass them to Express error handler
 */
export const catchAsync = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default catchAsync;
