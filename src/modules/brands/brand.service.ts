import Brand, { IBrand } from './brand.model';
import ApiError from '../../shared/errors/ApiError';
import { parsePagination } from '../../shared/utils/formatters';

class BrandService {
  /**
   * List brands with optional filtering and sorting.
   */
  async list(query: {
    page?: string;
    limit?: string;
    q?: string;
    is_active?: string;
    sort?: string;
    order?: string;
  }): Promise<{ brands: IBrand[]; total: number; page: number; limit: number }> {
    const { page, limit, skip } = parsePagination(query);
    const filter: Record<string, unknown> = {};

    if (query.is_active !== undefined) {
      filter.is_active = query.is_active === 'true';
    } else {
      filter.is_active = true;
    }

    // Search by name (case-insensitive)
    if (query.q) {
      filter.name = { $regex: query.q, $options: 'i' };
    }

    const orderDir = query.order === 'desc' ? -1 : 1;
    let sortOption: Record<string, 1 | -1> = {};
    switch (query.sort) {
      case 'product_count':
        sortOption = { product_count: orderDir as 1 | -1 };
        break;
      case 'name':
      default:
        sortOption = { name: orderDir as 1 | -1 };
        break;
    }

    const [brands, total] = await Promise.all([
      Brand.find(filter).sort(sortOption).skip(skip).limit(limit).lean(),
      Brand.countDocuments(filter),
    ]);

    return { brands, total, page, limit };
  }

  /**
   * Get brand by ID.
   */
  async getById(id: string): Promise<IBrand> {
    const brand = await Brand.findById(id).lean();
    if (!brand) {
      throw ApiError.notFound('Brand not found');
    }
    return brand;
  }

  /**
   * Get brand by slug.
   */
  async getBySlug(slug: string): Promise<IBrand> {
    const brand = await Brand.findOne({ slug, is_active: true }).lean();
    if (!brand) {
      throw ApiError.notFound('Brand not found');
    }
    return brand;
  }
}

export default new BrandService();
