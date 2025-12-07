import { Request, Response } from 'express';
import orderService from './order.service';
import asyncHandler from '../../shared/utils/asyncHandler';
import ApiResponse from '../../shared/utils/ApiResponse';

class OrderController {
  /**
   * POST /customer/orders — Place a new order.
   */
  create = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!._id.toString();
    const order = await orderService.create(userId, req.body);
    ApiResponse.created(res, order, 'Order placed successfully');
  });

  /**
   * GET /customer/orders — List my orders.
   */
  list = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!._id.toString();
    const { orders, total, page, limit } = await orderService.listByUser(
      userId,
      req.query as Record<string, string>,
    );
    ApiResponse.paginated(res, orders, total, page, limit, 'Orders retrieved');
  });

  /**
   * GET /customer/orders/:id — Get order detail with items.
   */
  getById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!._id.toString();
    const order = await orderService.getByIdForUser(userId, req.params.id as string);
    ApiResponse.success(res, order, 'Order retrieved');
  });

  /**
   * POST /customer/orders/:id/cancel — Cancel order.
   */
  cancel = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!._id.toString();
    const order = await orderService.cancel(userId, req.params.id as string, req.body.reason);
    ApiResponse.success(res, order, 'Order cancelled');
  });

  /**
   * POST /customer/orders/:id/return — Request return.
   */
  requestReturn = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!._id.toString();
    const order = await orderService.requestReturn(userId, req.params.id as string, req.body.reason);
    ApiResponse.success(res, order, 'Return requested');
  });
}

export default new OrderController();
