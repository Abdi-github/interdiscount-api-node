import { Request, Response } from 'express';
import searchService from './search.service';
import ApiResponse from '../../shared/utils/ApiResponse';
import asyncHandler from '../../shared/utils/asyncHandler';

/**
 * Full-text product search.
 * GET /api/v1/public/search
 */
const search = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { products, total, page, limit } = await searchService.search(
    req.query as { q: string } & Record<string, string>,
  );
  ApiResponse.paginated(res, products, total, page, limit, 'Search results');
});

/**
 * Autocomplete search suggestions.
 * GET /api/v1/public/search/suggestions
 */
const suggestions = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const q = req.query.q as string;
  const limit = parseInt(req.query.limit as string || '10', 10);
  const result = await searchService.suggestions(q, limit);
  ApiResponse.success(res, result, 'Suggestions retrieved');
});

/**
 * Get available filter options for a search query.
 * GET /api/v1/public/search/filters
 */
const filters = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const q = req.query.q as string;
  const category = req.query.category as string | undefined;
  const result = await searchService.getFilterOptions(q, category);
  ApiResponse.success(res, result, 'Filter options retrieved');
});

export default { search, suggestions, filters };
