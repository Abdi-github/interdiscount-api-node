import { Request, Response } from 'express';
import adminCategoriesService from './admin-categories.service';
import ApiResponse from '../../shared/utils/ApiResponse';
import asyncHandler from '../../shared/utils/asyncHandler';

class AdminCategoriesController {
  /**
   * GET /admin/categories
   */
  list = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const query = req.query as Record<string, string>;
    const result = await adminCategoriesService.list(query);

    if ('tree' in result) {
      ApiResponse.success(res, result.tree, 'Category tree fetched');
    } else {
      ApiResponse.paginated(res, result.categories, result.total, result.page, result.limit, 'Categories fetched');
    }
  });

  /**
   * POST /admin/categories
   */
  create = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const category = await adminCategoriesService.create(req.body);
    ApiResponse.created(res, category, 'Category created');
  });

  /**
   * PUT /admin/categories/:id
   */
  update = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const category = await adminCategoriesService.update(id, req.body);
    ApiResponse.success(res, category, 'Category updated');
  });

  /**
   * DELETE /admin/categories/:id
   */
  delete = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    await adminCategoriesService.delete(id);
    ApiResponse.noContent(res);
  });

  /**
   * PUT /admin/categories/reorder
   */
  reorder = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    await adminCategoriesService.reorder(req.body.items);
    ApiResponse.success(res, null, 'Categories reordered');
  });
}

export default new AdminCategoriesController();
