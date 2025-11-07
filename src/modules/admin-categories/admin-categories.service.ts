import Category, { ICategory } from '../categories/category.model';
import Product from '../products/product.model';
import ApiError from '../../shared/errors/ApiError';
import { parsePagination } from '../../shared/utils/formatters';
import logger from '../../shared/logger';

class AdminCategoriesService {
  /**
   * List all categories (admin view — flat or tree).
   */
  async list(query: {
    page?: string;
    limit?: string;
    level?: string;
    parent_id?: string;
    format?: string;
    is_active?: string;
    sort?: string;
    q?: string;
  }): Promise<{ categories: ICategory[]; total: number; page: number; limit: number } | { tree: unknown[] }> {
    // Tree format — return full tree
    if (query.format === 'tree') {
      const all = await Category.find().sort({ sort_order: 1, 'name.de': 1 }).lean();
      const tree = this.buildTree(all);
      return { tree };
    }

    const { page, limit, skip } = parsePagination(query);
    const filter: Record<string, unknown> = {};

    if (query.level !== undefined) {
      filter.level = parseInt(query.level, 10);
    }
    if (query.parent_id) {
      filter.parent_id = query.parent_id === 'null' ? null : query.parent_id;
    }
    if (query.is_active !== undefined) {
      filter.is_active = query.is_active === 'true';
    }
    if (query.q) {
      const regex = new RegExp(query.q, 'i');
      filter.$or = [
        { 'name.de': regex },
        { 'name.en': regex },
        { 'name.fr': regex },
        { 'name.it': regex },
        { slug: regex },
        { category_id: regex },
      ];
    }

    let sortObj: Record<string, 1 | -1> = { sort_order: 1 };
    switch (query.sort) {
      case 'name': sortObj = { 'name.de': 1 }; break;
      case 'level': sortObj = { level: 1, sort_order: 1 }; break;
    }

    const [categories, total] = await Promise.all([
      Category.find(filter).sort(sortObj).skip(skip).limit(limit).lean(),
      Category.countDocuments(filter),
    ]);

    return { categories, total, page, limit };
  }

  /**
   * Create category.
   */
  async create(input: Record<string, unknown>): Promise<ICategory> {
    // Check unique slug
    const existingSlug = await Category.findOne({ slug: input.slug as string }).lean();
    if (existingSlug) {
      throw ApiError.conflict('Category slug already exists', 'slug');
    }

    // Check unique category_id
    const existingCatId = await Category.findOne({ category_id: input.category_id as string }).lean();
    if (existingCatId) {
      throw ApiError.conflict('Category ID already exists', 'category_id');
    }

    // Validate parent if provided
    if (input.parent_id) {
      const parent = await Category.findById(input.parent_id).lean();
      if (!parent) {
        throw ApiError.badRequest('Parent category not found');
      }
    }

    const category = await Category.create(input);
    logger.info('Admin created category', { categoryId: category._id.toString() });

    return category.toObject();
  }

  /**
   * Update category.
   */
  async update(categoryId: string, input: Record<string, unknown>): Promise<ICategory> {
    const category = await Category.findById(categoryId);
    if (!category) {
      throw ApiError.notFound('Category');
    }

    // If changing slug, check uniqueness
    if (input.slug && input.slug !== category.slug) {
      const existing = await Category.findOne({ slug: input.slug as string }).lean();
      if (existing) {
        throw ApiError.conflict('Category slug already exists', 'slug');
      }
    }

    // If changing parent, validate
    if (input.parent_id !== undefined && input.parent_id !== null) {
      const parent = await Category.findById(input.parent_id).lean();
      if (!parent) {
        throw ApiError.badRequest('Parent category not found');
      }
      // Prevent circular reference
      if ((input.parent_id as string) === categoryId) {
        throw ApiError.badRequest('Category cannot be its own parent');
      }
    }

    Object.assign(category, input);
    await category.save();

    logger.info('Admin updated category', { categoryId });

    return category.toObject();
  }

  /**
   * Delete category.
   */
  async delete(categoryId: string): Promise<void> {
    const category = await Category.findById(categoryId).lean();
    if (!category) {
      throw ApiError.notFound('Category');
    }

    // Check for child categories
    const childCount = await Category.countDocuments({ parent_id: categoryId });
    if (childCount > 0) {
      throw ApiError.badRequest(
        `Cannot delete category with ${childCount} child categories. Delete or reassign children first.`,
      );
    }

    // Check for products in this category
    const productCount = await Product.countDocuments({ category_id: categoryId });
    if (productCount > 0) {
      throw ApiError.badRequest(
        `Cannot delete category with ${productCount} products. Reassign products first.`,
      );
    }

    await Category.findByIdAndDelete(categoryId);
    logger.info('Admin deleted category', { categoryId });
  }

  /**
   * Reorder categories (batch sort_order update).
   */
  async reorder(items: { id: string; sort_order: number }[]): Promise<void> {
    const bulkOps = items.map((item) => ({
      updateOne: {
        filter: { _id: item.id },
        update: { $set: { sort_order: item.sort_order } },
      },
    }));

    await Category.bulkWrite(bulkOps);
    logger.info('Admin reordered categories', { count: items.length });
  }

  /**
   * Build a tree structure from flat categories.
   */
  private buildTree(categories: ICategory[]): unknown[] {
    const map = new Map<string, unknown>();
    const roots: unknown[] = [];

    for (const cat of categories) {
      map.set(cat._id.toString(), { ...cat, children: [] });
    }

    for (const cat of categories) {
      const node = map.get(cat._id.toString()) as { children: unknown[] };
      if (cat.parent_id) {
        const parent = map.get(cat.parent_id.toString()) as { children: unknown[] } | undefined;
        if (parent) {
          parent.children.push(node);
        } else {
          roots.push(node);
        }
      } else {
        roots.push(node);
      }
    }

    return roots;
  }
}

export default new AdminCategoriesService();
