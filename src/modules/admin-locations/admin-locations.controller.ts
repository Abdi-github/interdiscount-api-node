import { Request, Response } from 'express';
import adminLocationsService from './admin-locations.service';
import ApiResponse from '../../shared/utils/ApiResponse';
import asyncHandler from '../../shared/utils/asyncHandler';

class AdminLocationsController {
  createCanton = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const canton = await adminLocationsService.createCanton(req.body);
    ApiResponse.created(res, canton, 'Canton created');
  });

  updateCanton = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const canton = await adminLocationsService.updateCanton(id, req.body);
    ApiResponse.success(res, canton, 'Canton updated');
  });

  deleteCanton = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    await adminLocationsService.deleteCanton(id);
    ApiResponse.noContent(res);
  });

  createCity = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const city = await adminLocationsService.createCity(req.body);
    ApiResponse.created(res, city, 'City created');
  });

  updateCity = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const city = await adminLocationsService.updateCity(id, req.body);
    ApiResponse.success(res, city, 'City updated');
  });

  deleteCity = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    await adminLocationsService.deleteCity(id);
    ApiResponse.noContent(res);
  });
}

export default new AdminLocationsController();
