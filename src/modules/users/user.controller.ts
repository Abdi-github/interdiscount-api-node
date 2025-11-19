import { Request, Response } from 'express';
import userService from './user.service';
import ApiResponse from '../../shared/utils/ApiResponse';
import asyncHandler from '../../shared/utils/asyncHandler';

/**
 * GET /api/v1/customer/me
 */
const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const profile = await userService.getProfile(req.user!._id);
  ApiResponse.success(res, profile, 'Profile retrieved');
});

/**
 * PUT /api/v1/customer/me
 */
const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const profile = await userService.updateProfile(req.user!._id, req.body);
  ApiResponse.success(res, profile, 'Profile updated');
});

/**
 * PUT /api/v1/customer/me/password
 */
const changePassword = asyncHandler(async (req: Request, res: Response) => {
  await userService.changePassword(req.user!._id, req.body);
  ApiResponse.success(res, null, 'Password changed successfully');
});

/**
 * PUT /api/v1/customer/me/avatar
 */
const uploadAvatar = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    ApiResponse.error(res, 400, 'VALIDATION_ERROR', 'Image file is required');
    return;
  }

  const avatarUrl = await userService.uploadAvatar(req.user!._id, req.file.buffer);
  ApiResponse.success(res, { avatar_url: avatarUrl }, 'Avatar uploaded');
});

/**
 * DELETE /api/v1/customer/me/avatar
 */
const removeAvatar = asyncHandler(async (req: Request, res: Response) => {
  await userService.removeAvatar(req.user!._id);
  ApiResponse.success(res, null, 'Avatar removed');
});

export { getProfile, updateProfile, changePassword, uploadAvatar, removeAvatar };
