import { Request, Response } from 'express';
import categoryService from './category.service';
import ApiResponse from '../../shared/utils/ApiResponse';
import asyncHandler from '../../shared/utils/asyncHandler';

/**
 * List categories (flat or tree format).
 * GET /api/v1/public/categories
 */
const list = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const result = await categoryService.list(
    req.query as Record<string, string>,
    req.language,
  );

  // Tree format returns all — no pagination wrapper
  if (req.query.format === 'tree') {
    ApiResponse.success(res, result.categories, 'Category tree retrieved');
    return;
  }

  ApiResponse.paginated(res, result.categories as unknown[], result.total, result.page, result.limit, 'Categories retrieved');
});

/**
 * Get category by ID.
 * GET /api/v1/public/categories/:id
 */
const getById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const category = await categoryService.getById(req.params.id as string);
  ApiResponse.success(res, category, 'Category retrieved');
});

/**
 * Get category by slug.
 * GET /api/v1/public/categories/slug/:slug
 */
const getBySlug = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const category = await categoryService.getBySlug(req.params.slug as string);
  ApiResponse.success(res, category, 'Category retrieved');
});

/**
 * Get direct children of a category.
 * GET /api/v1/public/categories/:id/children
 */
const getChildren = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const children = await categoryService.getChildren(req.params.id as string, req.language);
  ApiResponse.success(res, children, 'Category children retrieved');
});

/**
 * Get breadcrumb path from root to this category.
 * GET /api/v1/public/categories/:id/breadcrumb
 */
const getBreadcrumb = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const breadcrumb = await categoryService.getBreadcrumb(req.params.id as string);
  ApiResponse.success(res, breadcrumb, 'Breadcrumb retrieved');
});

/**
 * Get product counts per root category.
 * GET /api/v1/public/categories/product-counts
 */
const getProductCounts = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const counts = await categoryService.getRootCategoryProductCounts();
  ApiResponse.success(res, counts, 'Product counts retrieved');
});

export default { list, getById, getBySlug, getChildren, getBreadcrumb, getProductCounts };
