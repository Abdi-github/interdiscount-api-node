import { Router } from 'express';
import {
  register,
  login,
  refresh,
  verifyEmail,
  forgotPassword,
  resetPassword,
  resendVerification,
} from './auth.controller';
import validate from '../../shared/middlewares/validate';
import { authLimiter, passwordResetLimiter } from '../../shared/middlewares/rateLimiters';
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  resendVerificationSchema,
} from './auth.validation';

const router = Router();

router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/refresh', authLimiter, validate(refreshSchema), refresh);
router.get('/verify-email/:token', verifyEmail);
router.post('/forgot-password', passwordResetLimiter, validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', passwordResetLimiter, validate(resetPasswordSchema), resetPassword);
router.post('/resend-verification', passwordResetLimiter, validate(resendVerificationSchema), resendVerification);

export default router;
