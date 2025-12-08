import Store, { IStore } from './store.model';
import ApiError from '../../shared/errors/ApiError';
import { parsePagination } from '../../shared/utils/formatters';

class StoreService {
  /**
   * List stores with filtering by canton, city, postal code, format, and geo-proximity.
   */
  async list(query: {
    page?: string;
    limit?: string;
    canton_id?: string;
    city_id?: string;
    postal_code?: string;
    format?: string;
    is_xxl?: string;
    lat?: string;
    lng?: string;
    radius?: string;
    sort?: string;
  }, _language: string): Promise<{ stores: IStore[]; total: number; page: number; limit: number }> {
    const { page, limit, skip } = parsePagination(query);
    const filter: Record<string, unknown> = { is_active: true };

    if (query.canton_id) filter.canton_id = query.canton_id;
    if (query.city_id) filter.city_id = query.city_id;
    if (query.postal_code) filter.postal_code = query.postal_code;
    if (query.format) filter.format = query.format;
    if (query.is_xxl !== undefined) filter.is_xxl = query.is_xxl === 'true';

    // Geo-proximity search using manual distance calculation
    if (query.lat && query.lng) {
      // TODO: Implement Redis caching for geolocation queries
      const lat = parseFloat(query.lat);
      const lng = parseFloat(query.lng);
      const radiusKm = parseFloat(query.radius || '50');

      if (isNaN(lat) || isNaN(lng) || isNaN(radiusKm)) {
        throw ApiError.badRequest('Invalid latitude, longitude, or radius values');
      }

      // Use aggregation for distance-based sorting and filtering
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pipeline: any[] = [
        { $match: filter },
        {
          $addFields: {
            distance: {
              $multiply: [
                6371, // Earth's radius in km
                {
                  $acos: {
                    $add: [
                      {
                        $multiply: [
                          { $sin: { $degreesToRadians: '$latitude' } },
                          { $sin: { $degreesToRadians: lat } },
                        ],
                      },
                      {
                        $multiply: [
                          { $cos: { $degreesToRadians: '$latitude' } },
                          { $cos: { $degreesToRadians: lat } },
                          {
                            $cos: {
                              $subtract: [
                                { $degreesToRadians: '$longitude' },
                                { $degreesToRadians: lng },
                              ],
                            },
                          },
                        ],
                      },
                    ],
                  },
                },
              ],
            },
          },
        },
        { $match: { distance: { $lte: radiusKm } } },
        { $sort: { distance: 1 } },
      ];

      const countPipeline = [...pipeline, { $count: 'total' }];
      const dataPipeline = [...pipeline, { $skip: skip }, { $limit: limit }];

      const [countResult, stores] = await Promise.all([
        Store.aggregate(countPipeline),
        Store.aggregate(dataPipeline),
      ]);

      const total = countResult[0]?.total || 0;
      return { stores: stores as IStore[], total, page, limit };
    }

    // Standard query without geo
    const sortOption: Record<string, 1 | -1> = { name: 1 };

    const [stores, total] = await Promise.all([
      Store.find(filter).sort(sortOption).skip(skip).limit(limit).lean(),
      Store.countDocuments(filter),
    ]);

    return { stores, total, page, limit };
  }

  /**
   * Get store by ID.
   */
  async getById(id: string): Promise<IStore> {
    const store = await Store.findById(id).lean();
    if (!store) {
      throw ApiError.notFound('Store not found');
    }
    return store;
  }

  /**
   * Get store by slug.
   */
  async getBySlug(slug: string): Promise<IStore> {
    const store = await Store.findOne({ slug, is_active: true }).lean();
    if (!store) {
      throw ApiError.notFound('Store not found');
    }
    return store;
  }
}

export default new StoreService();
