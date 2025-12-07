import { Request, Response } from 'express';
import adminOrdersService from './admin-orders.service';
import ApiResponse from '../../shared/utils/ApiResponse';
import asyncHandler from '../../shared/utils/asyncHandler';

class AdminOrdersController {
  list = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const query = req.query as Record<string, string>;
    const { orders, total, page, limit } = await adminOrdersService.list(query);
    ApiResponse.paginated(res, orders, total, page, limit, 'Orders fetched');
  });

  getById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const order = await adminOrdersService.getById(id);
    ApiResponse.success(res, order, 'Order fetched');
  });

  updateStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const order = await adminOrdersService.updateStatus(id, req.body.status, req.body.notes);
    ApiResponse.success(res, order, 'Order status updated');
  });

  export = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const query = req.query as Record<string, string>;
    const { data, contentType, filename } = await adminOrdersService.export(query);

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(data);
  });
}

export default new AdminOrdersController();
