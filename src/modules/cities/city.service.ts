import City, { ICity } from './city.model';
import ApiError from '../../shared/errors/ApiError';
import { parsePagination } from '../../shared/utils/formatters';

class CityService {
  /**
   * List cities with optional filtering by canton.
   */
  async list(query: {
    page?: string;
    limit?: string;
    canton_id?: string;
    is_active?: string;
    sort?: string;
  }, language: string): Promise<{ cities: ICity[]; total: number; page: number; limit: number }> {
    const { page, limit, skip } = parsePagination(query);
    const filter: Record<string, unknown> = {};

    if (query.canton_id) {
      filter.canton_id = query.canton_id;
    }
    if (query.is_active !== undefined) {
      filter.is_active = query.is_active === 'true';
    } else {
      filter.is_active = true;
    }

    let sortOption: Record<string, 1 | -1> = {};
    switch (query.sort) {
      case 'slug':
        sortOption = { slug: 1 };
        break;
      case 'name':
      default:
        sortOption = { [`name.${language}`]: 1 };
        break;
    }
    // TODO: Implement city search indexing for postal codes

    const [cities, total] = await Promise.all([
      City.find(filter).sort(sortOption).skip(skip).limit(limit).lean(),
      City.countDocuments(filter),
    ]);

    return { cities, total, page, limit };
  }

  /**
   * Get city by ID.
   */
  async getById(id: string): Promise<ICity> {
    const city = await City.findById(id).lean();
    if (!city) {
      throw ApiError.notFound('City not found');
    }
    return city;
  }

  /**
   * Get city by slug.
   */
  async getBySlug(slug: string): Promise<ICity> {
    const city = await City.findOne({ slug, is_active: true }).lean();
    if (!city) {
      throw ApiError.notFound('City not found');
    }
    return city;
  }

  /**
   * Find city by postal code.
   */
  async getByPostalCode(postalCode: string): Promise<ICity> {
    const city = await City.findOne({
      postal_codes: postalCode,
      is_active: true,
    }).lean();
    if (!city) {
      throw ApiError.notFound('No city found for this postal code');
    }
    return city;
  }
}

export default new CityService();
