/**
 * Wrapper for async controllers to forward errors to Express error handler.
 * Keeps a simple JS implementation but mirrors the TypeScript shape.
 *
 * Example TypeScript signature:
 * // import { Request, Response, NextFunction } from 'express';
 * // export const tryCatch = (controller: (req: Request, res: Response, next: NextFunction) => Promise<any>) => { ... }
 */
export const tryCatch = (controller) => {
  return async (req, res, next) => {
    try {
      await controller(req, res, next);
    } catch (err) {
      next(err);
    }
  };
};

// Keep backward-compatible export name
export const asyncHandler = tryCatch;