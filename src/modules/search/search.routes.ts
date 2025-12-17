import { Router } from 'express';
import searchController from './search.controller';
import validate from '../../shared/middlewares/validate';
import { searchLimiter } from '../../shared/middlewares/rateLimiters';
import { searchSchema, suggestionsSchema, filtersSchema } from './search.validation';

const router = Router();

router.get('/', searchLimiter, validate(searchSchema), searchController.search);
router.get('/suggestions', searchLimiter, validate(suggestionsSchema), searchController.suggestions);
router.get('/filters', searchLimiter, validate(filtersSchema), searchController.filters);

export default router;
