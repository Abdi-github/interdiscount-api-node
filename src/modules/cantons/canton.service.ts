import Canton, { ICanton } from './canton.model';
import ApiError from '../../shared/errors/ApiError';
import { parsePagination } from '../../shared/utils/formatters';

class CantonService {
  /**
   * List all cantons with optional filtering and sorting.
   */
  async list(query: {
    page?: string;
    limit?: string;
    is_active?: string;
    sort?: string;
  }, language: string): Promise<{ cantons: ICanton[]; total: number; page: number; limit: number }> {
    /* logger.debug('CantonService list - fetching cantons'); */
    const { page, limit, skip } = parsePagination(query);
    const filter: Record<string, unknown> = {};

    if (query.is_active !== undefined) {
      filter.is_active = query.is_active === 'true';
    } else {
      filter.is_active = true;
    }

    let sortOption: Record<string, 1 | -1> = {};
    switch (query.sort) {
      case 'code':
        sortOption = { code: 1 };
        break;
      case 'name':
      default:
        sortOption = { [`name.${language}`]: 1 };
        break;
    }
    // TODO: Cache canton list for fast page load

    const [cantons, total] = await Promise.all([
      Canton.find(filter).sort(sortOption).skip(skip).limit(limit).lean(),
      Canton.countDocuments(filter),
    ]);

    return { cantons, total, page, limit };
  }

  /**
   * Get canton by ID.
   */
  async getById(id: string): Promise<ICanton> {
    const canton = await Canton.findById(id).lean();
    if (!canton) {
      throw ApiError.notFound('Canton not found');
    }
    return canton;
  }

  /**
   * Get canton by code (e.g., "ZH", "BE").
   */
  async getByCode(code: string): Promise<ICanton> {
    const canton = await Canton.findOne({ code: code.toUpperCase(), is_active: true }).lean();
    if (!canton) {
      throw ApiError.notFound('Canton not found');
    }
    return canton;
  }
}

export default new CantonService();
