import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import config from './config';
import { swaggerSpec } from './config/swagger';
import requestLogger from './shared/middlewares/requestLogger';
import { globalLimiter } from './shared/middlewares/rateLimiters';
import languageMiddleware from './shared/middlewares/language';
import sanitizeMiddleware from './shared/middlewares/sanitize';
import xssSanitize from './shared/middlewares/xssSanitize';
import errorHandler from './shared/errors/errorHandler';
import healthRoutes from './modules/health/health.routes';
import authRoutes from './modules/auth/auth.routes';
import customerProfileRoutes from './modules/users/user.routes';
import cantonRoutes from './modules/cantons/canton.routes';
import cityRoutes from './modules/cities/city.routes';
import storeRoutes from './modules/stores/store.routes';
import categoryRoutes from './modules/categories/category.routes';
import brandRoutes from './modules/brands/brand.routes';
import productRoutes from './modules/products/product.routes';
import searchRoutes from './modules/search/search.routes';
import addressRoutes from './modules/addresses/address.routes';
import wishlistRoutes from './modules/wishlists/wishlist.routes';
import reviewRoutes from './modules/reviews/review.routes';
import couponRoutes from './modules/coupons/coupon.routes';
import notificationRoutes from './modules/notifications/notification.routes';
import orderRoutes from './modules/orders/order.routes';
import paymentRoutes from './modules/payments/payment.routes';
import paymentController from './modules/payments/payment.controller';
import storeInventoryRoutes from './modules/store-management/inventory/store-inventory.routes';
import storeDashboardRoutes from './modules/store-management/dashboard/store-dashboard.routes';
import storePickupRoutes from './modules/store-management/pickup/store-pickup.routes';
import storeTransferRoutes from './modules/store-management/transfers/store-transfer.routes';
import storePromotionRoutes from './modules/store-management/promotions/store-promotion.routes';
import storeInfoRoutes from './modules/store-management/info/store-info.routes';
import adminDashboardRoutes from './modules/admin-dashboard/admin-dashboard.routes';
import adminUserRoutes from './modules/admin-users/admin-users.routes';
import adminProductRoutes from './modules/admin-products/admin-products.routes';
import adminCategoryRoutes from './modules/admin-categories/admin-categories.routes';
import adminBrandRoutes from './modules/admin-brands/admin-brands.routes';
import adminStoreRoutes from './modules/admin-stores/admin-stores.routes';
import adminTransferRoutes from './modules/admin-transfers/admin-transfers.routes';
import adminOrderRoutes from './modules/admin-orders/admin-orders.routes';
import adminReviewRoutes from './modules/admin-reviews/admin-reviews.routes';
import adminCouponRoutes from './modules/admin-coupons/admin-coupons.routes';
import adminLocationRoutes from './modules/admin-locations/admin-locations.routes';
import adminRbacRoutes from './modules/admin-rbac/admin-rbac.routes';
import { adminAnalyticsRoutes, storeAnalyticsRoutes } from './modules/analytics';
import auth from './shared/middlewares/auth';
import { requireRoles, requireStoreAccess } from './shared/middlewares/rbac';
import ApiResponse from './shared/utils/ApiResponse';

const app = express();

// ---------------------
// Trust Proxy (required behind reverse proxy / load balancer)
// ---------------------
if (config.isProd) {
  app.set('trust proxy', 1);
}

// ---------------------
// Security & Parsing
// ---------------------
app.use(helmet());
app.use(
  cors({
    origin: config.isDev ? '*' : config.cors.origins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept-Language', 'X-Request-Id'],
    exposedHeaders: ['X-Request-Id'],
  }),
);
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Input sanitization (NoSQL injection + HPP)
app.use(sanitizeMiddleware);
// XSS sanitization on request bodies
app.use(xssSanitize);

// ---------------------
// Request Pipeline
// ---------------------
app.use(requestLogger);
if (!config.isTest) {
  app.use(globalLimiter);
}
app.use(languageMiddleware);

// HTTP logging (dev only)
if (config.isDev) {
  app.use(morgan('dev'));
}

// ---------------------
// Routes
// ---------------------
const API_PREFIX = `/api/${config.apiVersion}`;

// Health checks
app.use(`${API_PREFIX}/health`, healthRoutes);

// Public routes
app.use(`${API_PREFIX}/public/auth`, authRoutes);
app.use(`${API_PREFIX}/public/cantons`, cantonRoutes);
app.use(`${API_PREFIX}/public/cities`, cityRoutes);
app.use(`${API_PREFIX}/public/stores`, storeRoutes);
app.use(`${API_PREFIX}/public/categories`, categoryRoutes);
app.use(`${API_PREFIX}/public/brands`, brandRoutes);
app.use(`${API_PREFIX}/public/products`, productRoutes);
app.use(`${API_PREFIX}/public/search`, searchRoutes);

// Customer routes
app.use(`${API_PREFIX}/customer`, customerProfileRoutes);
app.use(`${API_PREFIX}/customer/addresses`, addressRoutes);
app.use(`${API_PREFIX}/customer/wishlist`, wishlistRoutes);
app.use(`${API_PREFIX}/customer/reviews`, reviewRoutes);
app.use(`${API_PREFIX}/customer/coupons`, couponRoutes);
app.use(`${API_PREFIX}/customer/notifications`, notificationRoutes);
app.use(`${API_PREFIX}/customer/orders`, orderRoutes);
app.use(`${API_PREFIX}/customer/payments`, paymentRoutes);

// Webhooks (no auth — verified by signature)
app.post(`${API_PREFIX}/webhooks/stripe`, paymentController.handleWebhook);

// Store manager routes (Phase 6)
app.use(`${API_PREFIX}/store/inventory`, auth, requireRoles('store_manager', 'admin', 'super_admin'), requireStoreAccess, storeInventoryRoutes);
app.use(`${API_PREFIX}/store/dashboard`, auth, requireRoles('store_manager', 'admin', 'super_admin'), requireStoreAccess, storeDashboardRoutes);
app.use(`${API_PREFIX}/store/pickup-orders`, auth, requireRoles('store_manager', 'admin', 'super_admin'), requireStoreAccess, storePickupRoutes);
app.use(`${API_PREFIX}/store/transfers`, auth, requireRoles('store_manager', 'admin', 'super_admin'), requireStoreAccess, storeTransferRoutes);
app.use(`${API_PREFIX}/store/promotions`, auth, requireRoles('store_manager', 'admin', 'super_admin'), requireStoreAccess, storePromotionRoutes);
app.use(`${API_PREFIX}/store`, auth, requireRoles('store_manager', 'admin', 'super_admin'), requireStoreAccess, storeInfoRoutes);
app.use(`${API_PREFIX}/store/analytics`, auth, requireRoles('store_manager', 'admin', 'super_admin'), requireStoreAccess, storeAnalyticsRoutes);

// Admin routes (Phase 7)
app.use(`${API_PREFIX}/admin/dashboard`, auth, requireRoles('admin', 'super_admin'), adminDashboardRoutes);
app.use(`${API_PREFIX}/admin/users`, auth, requireRoles('admin', 'super_admin'), adminUserRoutes);
app.use(`${API_PREFIX}/admin/products`, auth, requireRoles('admin', 'super_admin'), adminProductRoutes);
app.use(`${API_PREFIX}/admin/categories`, auth, requireRoles('admin', 'super_admin'), adminCategoryRoutes);
app.use(`${API_PREFIX}/admin/brands`, auth, requireRoles('admin', 'super_admin'), adminBrandRoutes);
app.use(`${API_PREFIX}/admin/stores`, auth, requireRoles('admin', 'super_admin'), adminStoreRoutes);
app.use(`${API_PREFIX}/admin/transfers`, auth, requireRoles('admin', 'super_admin'), adminTransferRoutes);
app.use(`${API_PREFIX}/admin/orders`, auth, requireRoles('admin', 'super_admin'), adminOrderRoutes);
app.use(`${API_PREFIX}/admin/reviews`, auth, requireRoles('admin', 'super_admin'), adminReviewRoutes);
app.use(`${API_PREFIX}/admin/coupons`, auth, requireRoles('admin', 'super_admin'), adminCouponRoutes);
app.use(`${API_PREFIX}/admin/locations`, auth, requireRoles('admin', 'super_admin'), adminLocationRoutes);
app.use(`${API_PREFIX}/admin/rbac`, auth, requireRoles('admin', 'super_admin'), adminRbacRoutes);
app.use(`${API_PREFIX}/admin/analytics`, auth, requireRoles('admin', 'super_admin'), adminAnalyticsRoutes);

// ---------------------
// Root → redirect to docs
// ---------------------
app.get('/', (_req, res) => {
  res.redirect(`${API_PREFIX}/docs`);
});
app.get(API_PREFIX, (_req, res) => {
  ApiResponse.success(res, {
    name: 'Interdiscount Clone API',
    version: config.apiVersion,
    documentation: `${API_PREFIX}/docs`,
  }, 'Interdiscount Clone API is running');
});

// ---------------------
// Swagger API docs
// ---------------------
app.use(
  `${API_PREFIX}/docs`,
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Interdiscount Clone API Documentation',
  })
);

// ---------------------
// 404 Handler
// ---------------------
app.use((_req, res) => {
  ApiResponse.error(res, 404, 'NOT_FOUND', 'Route not found');
});

// ---------------------
// Global Error Handler (MUST be last)
// ---------------------
app.use(errorHandler);

export default app;
