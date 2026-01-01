import { Request, Response } from 'express';
import cantonService from './canton.service';
import ApiResponse from '../../shared/utils/ApiResponse';
import asyncHandler from '../../shared/utils/asyncHandler';

/**
 * List all cantons.
 * GET /api/v1/public/cantons
 */
const list = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { cantons, total, page, limit } = await cantonService.list(
    req.query as Record<string, string>,
    req.language,
  );
  ApiResponse.paginated(res, cantons, total, page, limit, 'Cantons retrieved');
});

/**
 * Get canton by ID.
 * GET /api/v1/public/cantons/:id
 */
const getById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const canton = await cantonService.getById(req.params.id as string);
  ApiResponse.success(res, canton, 'Canton retrieved');
});

/**
 * Get canton by code.
 * GET /api/v1/public/cantons/code/:code
 */
const getByCode = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const canton = await cantonService.getByCode(req.params.code as string);
  ApiResponse.success(res, canton, 'Canton retrieved');
});

export default { list, getById, getByCode };
