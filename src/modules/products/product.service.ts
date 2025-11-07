import Product, { IProduct } from './product.model';
import Category from '../categories/category.model';
import Brand from '../brands/brand.model';
import ApiError from '../../shared/errors/ApiError';
import { parsePagination } from '../../shared/utils/formatters';
import categoryService from '../categories/category.service';
import mongoose from 'mongoose';

class ProductService {
  /**
   * List products with rich filtering, sorting, and pagination.
   */
  async list(query: {
    page?: string;
    limit?: string;
    category?: string;
    brand?: string;
    min_price?: string;
    max_price?: string;
    availability?: string;
    in_store?: string;
    speed?: string;
    sustainable?: string;
    on_sale?: string;
    min_rating?: string;
    q?: string;
    sort?: string;
  }): Promise<{ products: IProduct[]; total: number; page: number; limit: number }> {
    /* console.log('list() called with filters:', { 
      category: query.category, 
      brand: query.brand, 
      priceRange: query.min_price && query.max_price ? `${query.min_price}-${query.max_price}` : 'none',
      sort: query.sort
    }); */
    
    const { page, limit, skip } = parsePagination(query);
    
    const filter: Record<string, unknown> = {
      is_active: true,
      status: 'PUBLISHED',
    };

    // Category filter (supports slug or ObjectId, with recursive children)
    if (query.category) {
      const categoryIds = await this.resolveCategoryIds(query.category);
      if (categoryIds.length > 0) {
        filter.category_id = { $in: categoryIds.map((id) => new mongoose.Types.ObjectId(id)) };
      }
    }

    // Brand filter (supports slug or ObjectId)
    if (query.brand) {
      const brandId = await this.resolveBrandId(query.brand);
      if (brandId) {
        filter.brand_id = new mongoose.Types.ObjectId(brandId);
      }
    }

    // Price range
    if (query.min_price || query.max_price) {
      const priceFilter: Record<string, number> = {};
      if (query.min_price) priceFilter.$gte = parseFloat(query.min_price);
      if (query.max_price) priceFilter.$lte = parseFloat(query.max_price);
      filter.price = priceFilter;
    }

    // Availability
    if (query.availability) {
      filter.availability_state = query.availability.toUpperCase();
    }

    // In-store pickup
    if (query.in_store !== undefined) {
      filter.in_store_possible = query.in_store === 'true';
    }

    // Speed delivery
    if (query.speed !== undefined) {
      filter.is_speed_product = query.speed === 'true';
    }

    // Sustainable
    if (query.sustainable !== undefined) {
      filter.is_sustainable = query.sustainable === 'true';
    }

    // On sale (has original_price and it's higher than current price)
    if (query.on_sale === 'true') {
      filter.original_price = { $ne: null };
      filter.$expr = { $gt: ['$original_price', '$price'] };
    }

    // Minimum rating
    if (query.min_rating) {
      filter.rating = { $gte: parseFloat(query.min_rating) };
    }

    // Text search
    if (query.q) {
      filter.$text = { $search: query.q };
    }

    // TODO: Implement result caching for complex filter combinations

    // Sorting
    let sortOption: Record<string, 1 | -1> = {};
    let useAggregate = false;
    switch (query.sort) {
      case 'price_asc':
        sortOption = { price: 1 };
        break;
      case 'price_desc':
        sortOption = { price: -1 };
        break;
      case 'rating':
        sortOption = { rating: -1 };
        break;
      case 'newest':
        sortOption = { created_at: -1 };
        break;
      case 'name':
        sortOption = { name: 1 };
        break;
      case 'discount':
        // Sort by discount percentage (highest first) — requires aggregate
        useAggregate = true;
        break;
      default:
        // Default: text score if searching, else by name
        if (query.q) {
          sortOption = { score: { $meta: 'textScore' } } as unknown as Record<string, 1 | -1>;
        } else {
          sortOption = { name: 1 };
        }
        break;
    }

    // Discount sort uses aggregation pipeline
    if (useAggregate) {
      const pipeline: mongoose.PipelineStage[] = [
        { $match: { ...filter, original_price: { $ne: null, $gt: 0 } } },
        {
          $addFields: {
            discount_pct: {
              $multiply: [
                { $divide: [{ $subtract: ['$original_price', '$price'] }, '$original_price'] },
                100,
              ],
            },
          },
        },
        { $match: { discount_pct: { $gt: 0 } } },
        { $sort: { discount_pct: -1 } },
        {
          $facet: {
            data: [{ $skip: skip }, { $limit: limit }],
            count: [{ $count: 'total' }],
          },
        },
      ];
      const [result] = await Product.aggregate(pipeline);
      const products = (result?.data ?? []) as IProduct[];
      const total = result?.count?.[0]?.total ?? 0;
      return { products, total, page, limit };
    }

    const [products, total] = await Promise.all([
      query.q && !query.sort
        ? Product.find(filter, { score: { $meta: 'textScore' } })
            .sort(sortOption)
            .skip(skip)
            .limit(limit)
            .lean()
        : Product.find(filter).sort(sortOption).skip(skip).limit(limit).lean(),
      Product.countDocuments(filter),
    ]);

    /* console.log('Results - found:', products.length, 'matching:', total, 'page:', page); */
    return { products, total, page, limit };
  }

  /**
   * Get product by ID with full details.
   */
  async getById(id: string): Promise<IProduct> {
    const product = await Product.findById(id).lean();
    if (!product) {
      throw ApiError.notFound('Product not found');
    }
    return product;
  }

  /**
   * Get product by slug.
   */
  async getBySlug(slug: string): Promise<IProduct> {
    const product = await Product.findOne({ slug, is_active: true, status: 'PUBLISHED' }).lean();
    if (!product) {
      throw ApiError.notFound('Product not found');
    }
    return product;
  }

  /**
   * Get related products (same category or brand).
   */
  async getRelated(productId: string, limitNum = 12): Promise<IProduct[]> {
    /* console.log('getRelated() - product:', productId, 'limit:', limitNum); */
    
    const product = await Product.findById(productId).lean();
    if (!product) {
      throw ApiError.notFound('Product not found');
    }

    // Find products in same category or same brand, excluding itself
    const filter: Record<string, unknown> = {
      _id: { $ne: product._id },
      is_active: true,
      status: 'PUBLISHED',
      $or: [{ category_id: product.category_id }],
    };

    if (product.brand_id) {
      (filter.$or as Record<string, unknown>[]).push({ brand_id: product.brand_id });
    }


    const related = await Product.find(filter)
      .sort({ rating: -1 })
      .limit(limitNum)
      .lean();

    return related;
  }

  /**
   * Resolve category filter to array of category IDs (including descendants).
   */
  private async resolveCategoryIds(categoryInput: string): Promise<string[]> {
    // Check if it's an ObjectId
    if (mongoose.Types.ObjectId.isValid(categoryInput)) {
      return categoryService.getDescendantIds(categoryInput);
    }

    // Try as slug
    const category = await Category.findOne({ slug: categoryInput, is_active: true })
      .select('_id')
      .lean();
    if (category) {
      return categoryService.getDescendantIds(category._id.toString());
    }

    // Try as category_id (business ID)
    const catById = await Category.findOne({ category_id: categoryInput, is_active: true })
      .select('_id')
      .lean();
    if (catById) {
      return categoryService.getDescendantIds(catById._id.toString());
    }

    return [];
  }

  /**
   * Resolve brand filter to brand ObjectId.
   */
  private async resolveBrandId(brandInput: string): Promise<string | null> {
    if (mongoose.Types.ObjectId.isValid(brandInput)) {
      return brandInput;
    }

    // Try as slug
    const brand = await Brand.findOne({ slug: brandInput, is_active: true })
      .select('_id')
      .lean();
    return brand ? brand._id.toString() : null;
  }
}

export default new ProductService();
