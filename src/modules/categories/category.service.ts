import Category, { ICategory } from './category.model';
import Product from '../products/product.model';
import ApiError from '../../shared/errors/ApiError';
import { parsePagination } from '../../shared/utils/formatters';

interface ICategoryTreeNode {
  _id: string;
  name: Record<string, string>;
  slug: string;
  category_id: string;
  level: number;
  parent_id: string | null;
  sort_order: number;
  is_active: boolean;
  children: ICategoryTreeNode[];
}

class CategoryService {
  /**
   * List categories — flat or tree format.
   */
  async list(query: {
    page?: string;
    limit?: string;
    level?: string;
    parent_id?: string;
    format?: string;
    is_active?: string;
    sort?: string;
  }, language: string): Promise<{
    categories: ICategory[] | ICategoryTreeNode[];
    total: number;
    page: number;
    limit: number;
  }> {
    /* console.log('CategoryService.list() called - format:', query.format, 'sort:', query.sort); */
    
    // Tree format returns all categories, no pagination
    if (query.format === 'tree') {
      const filter: Record<string, unknown> = {};
      if (query.is_active !== undefined) {
        filter.is_active = query.is_active === 'true';
      } else {
        filter.is_active = true;
      }

      const allCategories = await Category.find(filter)
        .sort({ level: 1, sort_order: 1 })
        .lean();

      const tree = this.buildTree(allCategories);
      // TODO: Consider caching tree structure for frequently accessed patterns
      return { categories: tree, total: allCategories.length, page: 1, limit: allCategories.length };
    }

    // Flat format with pagination
    const { page, limit, skip } = parsePagination(query);
    
    const filter: Record<string, unknown> = {};

    if (query.level !== undefined) filter.level = parseInt(query.level, 10);
    if (query.parent_id !== undefined) {
      filter.parent_id = query.parent_id === 'null' ? null : query.parent_id;
    }
    if (query.is_active !== undefined) {
      filter.is_active = query.is_active === 'true';
    } else {
      filter.is_active = true;
    }


    let sortOption: Record<string, 1 | -1> = {};
    switch (query.sort) {
      case 'name':
        sortOption = { [`name.${language}`]: 1 };
        break;
      case 'level':
        sortOption = { level: 1, sort_order: 1 };
        break;
      case 'sort_order':
      default:
        sortOption = { sort_order: 1, [`name.${language}`]: 1 };
        break;
    }

    const [categories, total] = await Promise.all([
      Category.find(filter).sort(sortOption).skip(skip).limit(limit).lean(),
      Category.countDocuments(filter),
    ]);

    /* console.log('Result - items:', categories.length, 'total:', total); */
    return { categories, total, page, limit };
  }

  /**
   * Get category by ID.
   */
  async getById(id: string): Promise<ICategory> {
    const category = await Category.findById(id).lean();
    if (!category) {
      throw ApiError.notFound('Category not found');
    }
    return category;
  }

  /**
   * Get category by slug.
   */
  async getBySlug(slug: string): Promise<ICategory> {
    const category = await Category.findOne({ slug, is_active: true }).lean();
    if (!category) {
      throw ApiError.notFound('Category not found');
    }
    return category;
  }

  /**
   * Get direct children of a category.
   */
  async getChildren(parentId: string, language: string): Promise<ICategory[]> {
    
    // Verify parent exists
    const parent = await Category.findById(parentId).lean();
    if (!parent) {
      throw ApiError.notFound('Category not found');
    }

    const children = await Category.find({
      parent_id: parentId,
      is_active: true,
    })
      .sort({ sort_order: 1, [`name.${language}`]: 1 })
      .lean();

    /* console.log('Children returned:', children.length); */
    return children;
  }

  /**
   * Get breadcrumb path from root to this category.
   */
  async getBreadcrumb(id: string): Promise<ICategory[]> {
    const breadcrumb: ICategory[] = [];
    let currentId: string | null = id;

    while (currentId) {
      const category: ICategory | null = await Category.findById(currentId).lean();
      if (!category) break;
      breadcrumb.unshift(category);
      currentId = category.parent_id ? category.parent_id.toString() : null;
    }

    if (breadcrumb.length === 0) {
      throw ApiError.notFound('Category not found');
    }

    return breadcrumb;
  }

  /**
   * Get all descendant category IDs (recursive).
   * Useful for product filtering — show products in this category AND all sub-categories.
   */
  async getDescendantIds(categoryId: string): Promise<string[]> {
    const ids: string[] = [categoryId];
    const children = await Category.find({ parent_id: categoryId, is_active: true })
      .select('_id')
      .lean();

    for (const child of children) {
      const childDescendants = await this.getDescendantIds(child._id.toString());
      ids.push(...childDescendants);
    }

    // TODO: Implement memoization for recursive descendant resolution
    /* console.log('Total descendants (including self):', ids.length); */
    return ids;
  }

  /**
   * Get product counts grouped by root category (including all descendants).
   * Returns a map of root category _id -> total product count.
   */
  async getRootCategoryProductCounts(): Promise<Record<string, number>> {
    
    // Get all active categories
    const allCategories = await Category.find({ is_active: true })
      .select('_id parent_id')
      .lean();


    // Build parent->children map
    const childrenMap = new Map<string, string[]>();
    const rootIds: string[] = [];
    for (const cat of allCategories) {
      const catId = cat._id.toString();
      if (!cat.parent_id) {
        rootIds.push(catId);
      } else {
        const parentId = cat.parent_id.toString();
        if (!childrenMap.has(parentId)) childrenMap.set(parentId, []);
        childrenMap.get(parentId)!.push(catId);
      }
    }


    // Recursively collect all descendant IDs for each root
    const getDescendants = (id: string): string[] => {
      const result = [id];
      const children = childrenMap.get(id) || [];
      for (const child of children) {
        result.push(...getDescendants(child));
      }
      return result;
    };

    // Aggregate product counts for all categories at once
    const counts = await Product.aggregate([
      { $match: { is_active: true, status: 'PUBLISHED' } },
      { $group: { _id: '$category_id', count: { $sum: 1 } } },
    ]);


    const countMap = new Map<string, number>();
    for (const c of counts) {
      countMap.set(c._id.toString(), c.count);
    }

    // Sum up for each root
    const result: Record<string, number> = {};
    for (const rootId of rootIds) {
      const descendants = getDescendants(rootId);
      let total = 0;
      for (const d of descendants) {
        total += countMap.get(d) || 0;
      }
      result[rootId] = total;
    }

    /* console.log('Counts computed for', Object.keys(result).length, 'roots'); */
    return result;
  }

  /**
   * Build a nested tree structure from flat category list.
   */
  private buildTree(categories: ICategory[]): ICategoryTreeNode[] {
    const map = new Map<string, ICategoryTreeNode>();
    const roots: ICategoryTreeNode[] = [];

    // Create map entries
    for (const cat of categories) {
      map.set(cat._id.toString(), {
        _id: cat._id.toString(),
        name: cat.name as unknown as Record<string, string>,
        slug: cat.slug,
        category_id: cat.category_id,
        level: cat.level,
        parent_id: cat.parent_id ? cat.parent_id.toString() : null,
        sort_order: cat.sort_order,
        is_active: cat.is_active,
        children: [],
      });
    }


    // Link children to parents
    for (const node of map.values()) {
      if (node.parent_id && map.has(node.parent_id)) {
        map.get(node.parent_id)!.children.push(node);
      } else {
        roots.push(node);
      }
    }

    /* console.log('Tree hierarchy built - roots:', roots.length); */
    return roots;
  }
}

export default new CategoryService();
