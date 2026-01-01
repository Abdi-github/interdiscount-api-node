import { Request, Response } from 'express';
import cityService from './city.service';
import ApiResponse from '../../shared/utils/ApiResponse';
import asyncHandler from '../../shared/utils/asyncHandler';

/**
 * List cities.
 * GET /api/v1/public/cities
 */
const list = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { cities, total, page, limit } = await cityService.list(
    req.query as Record<string, string>,
    req.language,
  );
  ApiResponse.paginated(res, cities, total, page, limit, 'Cities retrieved');
});

/**
 * Get city by ID.
 * GET /api/v1/public/cities/:id
 */
const getById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const city = await cityService.getById(req.params.id as string);
  ApiResponse.success(res, city, 'City retrieved');
});

/**
 * Get city by slug.
 * GET /api/v1/public/cities/slug/:slug
 */
const getBySlug = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const city = await cityService.getBySlug(req.params.slug as string);
  ApiResponse.success(res, city, 'City retrieved');
});

/**
 * Find city by postal code.
 * GET /api/v1/public/cities/postal-code/:code
 */
const getByPostalCode = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const city = await cityService.getByPostalCode(req.params.code as string);
  ApiResponse.success(res, city, 'City retrieved');
});

export default { list, getById, getBySlug, getByPostalCode };
