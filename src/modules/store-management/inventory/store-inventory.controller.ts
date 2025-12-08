import { Request, Response } from 'express';
import storeInventoryService from './store-inventory.service';
import ApiResponse from '../../../shared/utils/ApiResponse';
import ApiError from '../../../shared/errors/ApiError';

/**
 * Store Inventory Controller — route handlers for store inventory management.
 * All operations scoped to the authenticated user's store_id.
 */
class StoreInventoryController {
  /**
   * GET /store/inventory — List inventory for the manager's store.
   */
  async list(req: Request, res: Response): Promise<void> {
    const storeId = req.user!.store_id;
    if (!storeId) throw ApiError.forbidden('No store assigned');

    const result = await storeInventoryService.list(storeId, req.query as Record<string, string>);

    ApiResponse.paginated(
      res,
      result.items,
      result.total,
      result.page,
      result.limit,
      'Store inventory retrieved',
    );
  }

  /**
   * GET /store/inventory/:productId — Get inventory detail for a product.
   */
  async getByProductId(req: Request, res: Response): Promise<void> {
    const storeId = req.user!.store_id;
    if (!storeId) throw ApiError.forbidden('No store assigned');

    const productId = req.params.productId as string;
    const inventory = await storeInventoryService.getByProductId(storeId, productId);

    ApiResponse.success(res, inventory, 'Inventory detail retrieved');
  }

  /**
   * PUT /store/inventory/:productId — Update stock for a product.
   */
  async update(req: Request, res: Response): Promise<void> {
    const storeId = req.user!.store_id;
    if (!storeId) throw ApiError.forbidden('No store assigned');

    const productId = req.params.productId as string;
    const inventory = await storeInventoryService.update(storeId, productId, req.body);

    ApiResponse.success(res, inventory, 'Inventory updated');
  }

  /**
   * POST /store/inventory/bulk-update — Bulk update stock levels.
   */
  async bulkUpdate(req: Request, res: Response): Promise<void> {
    const storeId = req.user!.store_id;
    if (!storeId) throw ApiError.forbidden('No store assigned');

    const result = await storeInventoryService.bulkUpdate(storeId, req.body.items);

    ApiResponse.success(res, result, `Bulk update complete: ${result.updated} updated`);
  }

  /**
   * GET /store/inventory/low-stock — List low-stock products.
   */
  async getLowStock(req: Request, res: Response): Promise<void> {
    const storeId = req.user!.store_id;
    if (!storeId) throw ApiError.forbidden('No store assigned');

    const result = await storeInventoryService.getLowStock(storeId, req.query as Record<string, string>);

    ApiResponse.paginated(
      res,
      result.items,
      result.total,
      result.page,
      result.limit,
      'Low stock items retrieved',
    );
  }

  /**
   * GET /store/inventory/out-of-stock — List out-of-stock products.
   */
  async getOutOfStock(req: Request, res: Response): Promise<void> {
    const storeId = req.user!.store_id;
    if (!storeId) throw ApiError.forbidden('No store assigned');

    const result = await storeInventoryService.getOutOfStock(storeId, req.query as Record<string, string>);

    ApiResponse.paginated(
      res,
      result.items,
      result.total,
      result.page,
      result.limit,
      'Out of stock items retrieved',
    );
  }

  /**
   * POST /store/inventory/scan — Update stock via barcode scan.
   */
  async scanUpdate(req: Request, res: Response): Promise<void> {
    const storeId = req.user!.store_id;
    if (!storeId) throw ApiError.forbidden('No store assigned');

    const { product_code, quantity_change, operation } = req.body;
    const inventory = await storeInventoryService.scanUpdate(
      storeId,
      product_code,
      quantity_change,
      operation,
    );

    ApiResponse.success(res, inventory, 'Stock updated via scan');
  }

  /**
   * GET /store/inventory/export — Export inventory as CSV.
   */
  async exportInventory(req: Request, res: Response): Promise<void> {
    const storeId = req.user!.store_id;
    if (!storeId) throw ApiError.forbidden('No store assigned');

    const items = await storeInventoryService.exportInventory(storeId);

    // Generate CSV
    const headers = 'Product Code,Product Name,Quantity,Reserved,Available,Min Stock,Max Stock,Location,Display Unit';
    const rows = (items as unknown as Record<string, unknown>[]).map((item) => {
      const product = item.product_id as Record<string, unknown> || {};
      const available = Math.max(0, (item.quantity as number) - (item.reserved as number));
      return [
        product.displayed_code || product.code || '',
        `"${(product.name as string || '').replace(/"/g, '""')}"`,
        item.quantity,
        item.reserved,
        available,
        item.min_stock,
        item.max_stock,
        `"${((item.location_in_store as string) || '').replace(/"/g, '""')}"`,
        item.is_display_unit ? 'Yes' : 'No',
      ].join(',');
    });

    const csv = [headers, ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=inventory-${storeId}-${Date.now()}.csv`);
    res.send(csv);
  }
}

export default new StoreInventoryController();
