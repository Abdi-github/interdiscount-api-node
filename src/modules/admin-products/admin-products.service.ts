import mongoose from 'mongoose';
import Product, { IProduct } from '../products/product.model';
import Category from '../categories/category.model';
import Brand from '../brands/brand.model';
import ApiError from '../../shared/errors/ApiError';
import { parsePagination } from '../../shared/utils/formatters';
import { cloudinary } from '../../config/cloudinary';
import logger from '../../shared/logger';

class AdminProductsService {
  /**
   * List products (admin view — includes all statuses).
   */
  async list(query: {
    page?: string;
    limit?: string;
    category?: string;
    brand?: string;
    min_price?: string;
    max_price?: string;
    availability?: string;
    status?: string;
    is_active?: string;
    q?: string;
    sort?: string;
  }): Promise<{ products: IProduct[]; total: number; page: number; limit: number }> {
    // logger.debug('AdminProductsService list - loading admin products');
    const { page, limit, skip } = parsePagination(query);
    const filter: Record<string, unknown> = {};

    if (query.status) {
      filter.status = query.status;
    }
    if (query.is_active !== undefined) {
      filter.is_active = query.is_active === 'true';
    }
    if (query.category) {
      if (mongoose.Types.ObjectId.isValid(query.category)) {
        filter.category_id = new mongoose.Types.ObjectId(query.category);
      }
    }
    if (query.brand) {
      if (mongoose.Types.ObjectId.isValid(query.brand)) {
        filter.brand_id = new mongoose.Types.ObjectId(query.brand);
      } else {
        const brand = await Brand.findOne({ slug: query.brand }).lean();
        if (brand) filter.brand_id = brand._id;
      }
    }
    // TODO: Implement full-text search indexing for product queries
    if (query.min_price || query.max_price) {
      const priceFilter: Record<string, number> = {};
      if (query.min_price) priceFilter.$gte = parseFloat(query.min_price);
      if (query.max_price) priceFilter.$lte = parseFloat(query.max_price);
      filter.price = priceFilter;
    }
    if (query.availability) {
      filter.availability_state = query.availability.toUpperCase();
    }
    if (query.q) {
      filter.$or = [
        { name: new RegExp(query.q, 'i') },
        { name_short: new RegExp(query.q, 'i') },
        { code: new RegExp(query.q, 'i') },
        { displayed_code: new RegExp(query.q, 'i') },
      ];
    }

    let sortObj: Record<string, 1 | -1> = { created_at: -1 };
    switch (query.sort) {
      case 'price_asc': sortObj = { price: 1 }; break;
      case 'price_desc': sortObj = { price: -1 }; break;
      case 'rating': sortObj = { rating: -1 }; break;
      case 'name': sortObj = { name: 1 }; break;
      case 'oldest': sortObj = { created_at: 1 }; break;
    }

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('brand_id', 'name slug')
        .populate('category_id', 'name slug')
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(filter),
    ]);

    return { products, total, page, limit };
  }

  /**
   * Get product detail (admin).
   */
  async getById(productId: string): Promise<IProduct> {
    const product = await Product.findById(productId)
      .populate('brand_id', 'name slug')
      .populate('category_id', 'name slug')
      .lean();

    if (!product) {
      throw ApiError.notFound('Product');
    }

    return product;
  }

  /**
   * Create product.
   */
  async create(input: Record<string, unknown>): Promise<IProduct> {
    // Validate category exists
    const category = await Category.findById(input.category_id).lean();
    if (!category) {
      throw ApiError.badRequest('Category not found');
    }

    // Validate brand if provided
    if (input.brand_id) {
      const brand = await Brand.findById(input.brand_id).lean();
      if (!brand) {
        throw ApiError.badRequest('Brand not found');
      }
    }

    // Check unique slug
    const existingSlug = await Product.findOne({ slug: input.slug as string }).lean();
    if (existingSlug) {
      throw ApiError.conflict('Product slug already exists', 'slug');
    }

    // Check unique code
    const existingCode = await Product.findOne({ code: input.code as string }).lean();
    if (existingCode) {
      throw ApiError.conflict('Product code already exists', 'code');
    }

    const product = await Product.create(input);

    // Update brand product count if brand is assigned
    if (input.brand_id) {
      await Brand.findByIdAndUpdate(input.brand_id, { $inc: { product_count: 1 } });
    }

    logger.info('Admin created product', { productId: product._id.toString() });

    return product.toObject();
  }

  /**
   * Update product.
   */
  async update(productId: string, input: Record<string, unknown>): Promise<IProduct> {
    const product = await Product.findById(productId);
    if (!product) {
      throw ApiError.notFound('Product');
    }

    // If changing slug, check uniqueness
    if (input.slug && input.slug !== product.slug) {
      const existingSlug = await Product.findOne({ slug: input.slug as string }).lean();
      if (existingSlug) {
        throw ApiError.conflict('Product slug already exists', 'slug');
      }
    }

    // If changing category, validate
    if (input.category_id) {
      const category = await Category.findById(input.category_id).lean();
      if (!category) {
        throw ApiError.badRequest('Category not found');
      }
    }

    // If changing brand, validate and update counts
    if (input.brand_id !== undefined) {
      if (input.brand_id) {
        const brand = await Brand.findById(input.brand_id).lean();
        if (!brand) {
          throw ApiError.badRequest('Brand not found');
        }
      }
      // Decrement old brand count
      if (product.brand_id) {
        await Brand.findByIdAndUpdate(product.brand_id, { $inc: { product_count: -1 } });
      }
      // Increment new brand count
      if (input.brand_id) {
        await Brand.findByIdAndUpdate(input.brand_id, { $inc: { product_count: 1 } });
      }
    }

    Object.assign(product, input);
    await product.save();

    logger.info('Admin updated product', { productId });

    return product.toObject();
  }

  /**
   * Change product status.
   */
  async updateStatus(productId: string, status: string): Promise<IProduct> {
    const product = await Product.findById(productId);
    if (!product) {
      throw ApiError.notFound('Product');
    }

    product.status = status as 'PUBLISHED' | 'DRAFT' | 'ARCHIVED';
    if (status === 'ARCHIVED') {
      product.is_active = false;
    } else if (status === 'PUBLISHED') {
      product.is_active = true;
    }
    await product.save();

    logger.info('Admin updated product status', { productId, status });

    return product.toObject();
  }

  /**
   * Upload product images.
   */
  async uploadImages(
    productId: string,
    files: Express.Multer.File[],
  ): Promise<IProduct> {
    const product = await Product.findById(productId);
    if (!product) {
      throw ApiError.notFound('Product');
    }

    for (const file of files) {
      const result = await new Promise<{ secure_url: string; public_id: string }>(
        (resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: 'interdiscount/products',
              transformation: { width: 720, crop: 'limit' },
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result as { secure_url: string; public_id: string });
            },
          );
          stream.end(file.buffer);
        },
      );

      const baseUrl = result.secure_url;
      product.images.push({
        alt: product.name_short || product.name,
        src: {
          xs: baseUrl.replace('/upload/', '/upload/w_100/'),
          sm: baseUrl.replace('/upload/', '/upload/w_260/'),
          md: baseUrl,
        },
      } as unknown as typeof product.images[0]);
    }

    await product.save();
    logger.info('Admin uploaded product images', { productId, count: files.length });

    return product.toObject();
  }

  /**
   * Delete product image.
   */
  async deleteImage(productId: string, imageId: string): Promise<IProduct> {
    const product = await Product.findById(productId);
    if (!product) {
      throw ApiError.notFound('Product');
    }

    const imageIndex = product.images.findIndex(
      (img) => (img as unknown as { _id: { toString: () => string } })._id?.toString() === imageId,
    );
    if (imageIndex === -1) {
      throw ApiError.notFound('Image');
    }

    product.images.splice(imageIndex, 1);
    await product.save();

    logger.info('Admin deleted product image', { productId, imageId });

    return product.toObject();
  }
}

export default new AdminProductsService();
