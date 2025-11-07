import { Request, Response } from 'express';
import adminProductsService from './admin-products.service';
import ApiResponse from '../../shared/utils/ApiResponse';
import asyncHandler from '../../shared/utils/asyncHandler';

class AdminProductsController {
  /**
   * GET /admin/products
   */
  list = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const query = req.query as Record<string, string>;
    const { products, total, page, limit } = await adminProductsService.list(query);
    ApiResponse.paginated(res, products, total, page, limit, 'Products fetched');
  });

  /**
   * POST /admin/products
   */
  create = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const product = await adminProductsService.create(req.body);
    ApiResponse.created(res, product, 'Product created');
  });

  /**
   * GET /admin/products/:id
   */
  getById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const product = await adminProductsService.getById(id);
    ApiResponse.success(res, product, 'Product fetched');
  });

  /**
   * PUT /admin/products/:id
   */
  update = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const product = await adminProductsService.update(id, req.body);
    ApiResponse.success(res, product, 'Product updated');
  });

  /**
   * PUT /admin/products/:id/status
   */
  updateStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const product = await adminProductsService.updateStatus(id, req.body.status);
    ApiResponse.success(res, product, 'Product status updated');
  });

  /**
   * POST /admin/products/:id/images
   */
  uploadImages = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const files = (req.files as Express.Multer.File[]) || [];
    if (files.length === 0) {
      ApiResponse.error(res, 400, 'VALIDATION_ERROR', 'No images provided');
      return;
    }
    const product = await adminProductsService.uploadImages(id, files);
    ApiResponse.success(res, product, 'Images uploaded');
  });

  /**
   * DELETE /admin/products/:id/images/:imageId
   */
  deleteImage = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const imageId = req.params.imageId as string;
    const product = await adminProductsService.deleteImage(id, imageId);
    ApiResponse.success(res, product, 'Image deleted');
  });
}

export default new AdminProductsController();
