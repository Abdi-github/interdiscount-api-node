import { Request, Response } from 'express';
import authService from './auth.service';
import ApiResponse from '../../shared/utils/ApiResponse';
import asyncHandler from '../../shared/utils/asyncHandler';

/**
 * POST /api/v1/public/auth/register
 */
const register = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.register(req.body);
  ApiResponse.created(res, result, 'Registration successful');
});

/**
 * POST /api/v1/public/auth/login
 */
const login = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.login(req.body);
  ApiResponse.success(res, result, 'Login successful');
});

/**
 * POST /api/v1/public/auth/refresh
 */
const refresh = asyncHandler(async (req: Request, res: Response) => {
  const { refresh_token } = req.body;
  const tokens = await authService.refresh(refresh_token);
  ApiResponse.success(res, tokens, 'Token refreshed');
});

/**
 * GET /api/v1/public/auth/verify-email/:token
 */
const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  const token = req.params.token as string;
  await authService.verifyEmail(token);
  ApiResponse.success(res, null, 'Email verified successfully');
});

/**
 * POST /api/v1/public/auth/forgot-password
 */
const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  await authService.forgotPassword(req.body);
  ApiResponse.success(res, null, 'If an account exists, a reset email has been sent');
});

/**
 * POST /api/v1/public/auth/reset-password
 */
const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  await authService.resetPassword(req.body);
  ApiResponse.success(res, null, 'Password reset successful');
});

/**
 * POST /api/v1/public/auth/resend-verification
 */
const resendVerification = asyncHandler(async (req: Request, res: Response) => {
  await authService.resendVerification(req.body.email);
  ApiResponse.success(res, null, 'If an account exists, a verification email has been sent');
});

export { register, login, refresh, verifyEmail, forgotPassword, resetPassword, resendVerification };
