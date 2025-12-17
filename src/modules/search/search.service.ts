import Product from '../products/product.model';
import Brand from '../brands/brand.model';
import Category from '../categories/category.model';
import { parsePagination } from '../../shared/utils/formatters';
import mongoose from 'mongoose';
import categoryService from '../categories/category.service';

interface IFilterOptions {
  categories: { _id: string; name: Record<string, string>; slug: string; count: number }[];
  brands: { _id: string; name: string; slug: string; count: number }[];
  price_range: { min: number; max: number };
  availability: { state: string; count: number }[];
}

class SearchService {
  /**
   * Full-text product search with filters.
   */
  async search(query: {
    q: string;
    page?: string;
    limit?: string;
    category?: string;
    brand?: string;
    min_price?: string;
    max_price?: string;
    availability?: string;
    sort?: string;
  }): Promise<{
    products: Record<string, unknown>[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { page, limit, skip } = parsePagination(query);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: any = {
      $text: { $search: query.q },
      is_active: true,
      status: 'PUBLISHED',
    };

    // Category filter
    if (query.category) {
      const categoryIds = await this.resolveCategoryIds(query.category);
      if (categoryIds.length > 0) {
        filter.category_id = { $in: categoryIds.map((id) => new mongoose.Types.ObjectId(id)) };
      }
    }
    // TODO: Implement Redis caching for popular search queries

    // Brand filter
    if (query.brand) {
      const brand = await Brand.findOne({ slug: query.brand }).select('_id').lean();
      if (brand) filter.brand_id = brand._id;
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

    // Sorting
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let sortOption: any = {};
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
      case 'relevance':
      default:
        sortOption = { score: { $meta: 'textScore' } };
        break;
    }

    const [products, total] = await Promise.all([
      Product.find(filter, { score: { $meta: 'textScore' } })
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(filter),
    ]);

    return { products: products as unknown as Record<string, unknown>[], total, page, limit };
  }

  /**
   * Autocomplete search suggestions.
   * Returns product names that match the query prefix.
   */
  async suggestions(q: string, limitNum = 10): Promise<{ suggestions: string[] }> {
    const products = await Product.find(
      {
        name: { $regex: q, $options: 'i' },
        is_active: true,
        status: 'PUBLISHED',
      },
    )
      .select('name')
      .limit(limitNum)
      .lean();

    const suggestions = products.map((p) => p.name);
    return { suggestions };
  }

  /**
   * Get available filter options for a search query.
   * Returns categories, brands, price range, and availability states with counts.
   */
  async getFilterOptions(q: string, category?: string): Promise<IFilterOptions> {
    const matchStage: Record<string, unknown> = {
      $text: { $search: q },
      is_active: true,
      status: 'PUBLISHED',
    };

    if (category) {
      const categoryIds = await this.resolveCategoryIds(category);
      if (categoryIds.length > 0) {
        matchStage.category_id = {
          $in: categoryIds.map((id) => new mongoose.Types.ObjectId(id)),
        };
      }
    }

    const [categoryFacets, brandFacets, priceFacets, availabilityFacets] = await Promise.all([
      // Category counts
      Product.aggregate([
        { $match: matchStage },
        { $group: { _id: '$category_id', count: { $sum: 1 } } },
        {
          $lookup: {
            from: 'categories',
            localField: '_id',
            foreignField: '_id',
            as: 'category',
          },
        },
        { $unwind: '$category' },
        {
          $project: {
            _id: '$category._id',
            name: '$category.name',
            slug: '$category.slug',
            count: 1,
          },
        },
        { $sort: { count: -1 } },
        { $limit: 20 },
      ]),

      // Brand counts
      Product.aggregate([
        { $match: matchStage },
        { $match: { brand_id: { $ne: null } } },
        { $group: { _id: '$brand_id', count: { $sum: 1 } } },
        {
          $lookup: {
            from: 'brands',
            localField: '_id',
            foreignField: '_id',
            as: 'brand',
          },
        },
        { $unwind: '$brand' },
        {
          $project: {
            _id: '$brand._id',
            name: '$brand.name',
            slug: '$brand.slug',
            count: 1,
          },
        },
        { $sort: { count: -1 } },
        { $limit: 20 },
      ]),

      // Price range
      Product.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            min: { $min: '$price' },
            max: { $max: '$price' },
          },
        },
      ]),

      // Availability counts
      Product.aggregate([
        { $match: matchStage },
        { $group: { _id: '$availability_state', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    return {
      categories: categoryFacets,
      brands: brandFacets,
      price_range: priceFacets[0] || { min: 0, max: 0 },
      availability: availabilityFacets.map((a) => ({ state: a._id, count: a.count })),
    };
  }

  /**
   * Resolve category input to array of category IDs.
   */
  private async resolveCategoryIds(categoryInput: string): Promise<string[]> {
    if (mongoose.Types.ObjectId.isValid(categoryInput)) {
      return categoryService.getDescendantIds(categoryInput);
    }

    const category = await Category.findOne({ slug: categoryInput, is_active: true })
      .select('_id')
      .lean();
    if (category) {
      return categoryService.getDescendantIds(category._id.toString());
    }

    return [];
  }
}

export default new SearchService();
