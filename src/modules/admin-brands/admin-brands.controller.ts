import { Request, Response } from 'express';
import adminBrandsService from './admin-brands.service';
import ApiResponse from '../../shared/utils/ApiResponse';
import asyncHandler from '../../shared/utils/asyncHandler';

class AdminBrandsController {
  list = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const query = req.query as Record<string, string>;
    const { brands, total, page, limit } = await adminBrandsService.list(query);
    ApiResponse.paginated(res, brands, total, page, limit, 'Brands fetched');
  });

  create = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const brand = await adminBrandsService.create(req.body);
    ApiResponse.created(res, brand, 'Brand created');
  });

  update = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const brand = await adminBrandsService.update(id, req.body);
    ApiResponse.success(res, brand, 'Brand updated');
  });

  delete = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    await adminBrandsService.delete(id);
    ApiResponse.noContent(res);
  });
}

export default new AdminBrandsController();
