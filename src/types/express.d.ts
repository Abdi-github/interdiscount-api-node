import { Request, Response, NextFunction } from 'express';

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      language: string;
      user?: {
        _id: string;
        email: string;
        first_name: string;
        last_name: string;
        user_type: string;
        store_id?: string;
        roles: string[];
        permissions: string[];
      };
    }
  }
}

export type AsyncRouteHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<void>;
