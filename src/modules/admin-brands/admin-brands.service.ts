import Brand, { IBrand } from '../brands/brand.model';
import Product from '../products/product.model';
import ApiError from '../../shared/errors/ApiError';
import { parsePagination } from '../../shared/utils/formatters';
import logger from '../../shared/logger';

class AdminBrandsService {
  /**
   * List brands (admin view).
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
    }
    if (query.q) {
      filter.name = new RegExp(query.q, 'i');
    }

    const direction = query.order === 'desc' ? -1 : 1;
    let sortObj: Record<string, 1 | -1> = { name: 1 };
    switch (query.sort) {
      case 'product_count': sortObj = { product_count: direction as 1 | -1 }; break;
      case 'newest': sortObj = { created_at: -1 }; break;
      default: sortObj = { name: direction as 1 | -1 }; break;
    }
    // TODO: Implement brand performance metrics calculation

    const [brands, total] = await Promise.all([
      Brand.find(filter).sort(sortObj).skip(skip).limit(limit).lean(),
      Brand.countDocuments(filter),
    ]);

    return { brands, total, page, limit };
  }

  /**
   * Create brand.
   */
  async create(input: { name: string; slug: string; is_active?: boolean }): Promise<IBrand> {
    /* logger.debug('AdminBrandsService create - creating new brand'); */
    const existingSlug = await Brand.findOne({ slug: input.slug }).lean();
    if (existingSlug) {
      throw ApiError.conflict('Brand slug already exists', 'slug');
    }

    const brand = await Brand.create({
      name: input.name,
      slug: input.slug,
      product_count: 0,
      is_active: input.is_active ?? true,
    });

    logger.info('Admin created brand', { brandId: brand._id.toString() });
    return brand.toObject();
  }

  /**
   * Update brand.
   */
  async update(brandId: string, input: { name?: string; slug?: string; is_active?: boolean }): Promise<IBrand> {
    const brand = await Brand.findById(brandId);
    if (!brand) {
      throw ApiError.notFound('Brand');
    }

    if (input.slug && input.slug !== brand.slug) {
      const existing = await Brand.findOne({ slug: input.slug }).lean();
      if (existing) {
        throw ApiError.conflict('Brand slug already exists', 'slug');
      }
    }

    if (input.name !== undefined) brand.name = input.name;
    if (input.slug !== undefined) brand.slug = input.slug;
    if (input.is_active !== undefined) brand.is_active = input.is_active;

    await brand.save();
    logger.info('Admin updated brand', { brandId });

    return brand.toObject();
  }

  /**
   * Delete brand.
   */
  async delete(brandId: string): Promise<void> {
    const brand = await Brand.findById(brandId).lean();
    if (!brand) {
      throw ApiError.notFound('Brand');
    }

    const productCount = await Product.countDocuments({ brand_id: brandId });
    if (productCount > 0) {
      throw ApiError.badRequest(
        `Cannot delete brand with ${productCount} products. Reassign products first.`,
      );
    }

    await Brand.findByIdAndDelete(brandId);
    logger.info('Admin deleted brand', { brandId });
  }
}

export default new AdminBrandsService();
