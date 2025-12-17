import { Router } from 'express';
import controller from './admin-dashboard.controller';

const router = Router();

router.get('/stats', controller.getStats);
router.get('/revenue', controller.getRevenue);
router.get('/recent-orders', controller.getRecentOrders);

export default router;
