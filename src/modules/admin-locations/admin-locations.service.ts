import Canton, { ICanton } from '../cantons/canton.model';
import City, { ICity } from '../cities/city.model';
import Store from '../stores/store.model';
import ApiError from '../../shared/errors/ApiError';
import logger from '../../shared/logger';

class AdminLocationsService {
  // ─── CANTONS ──────────────────────────
  async createCanton(input: Record<string, unknown>): Promise<ICanton> {
    // logger.debug('AdminLocationsService createCanton - creating new canton');
    const existingSlug = await Canton.findOne({ slug: input.slug as string }).lean();
    if (existingSlug) {
      throw ApiError.conflict('Canton slug already exists', 'slug');
    }

    const existingCode = await Canton.findOne({ code: input.code as string }).lean();
    if (existingCode) {
      throw ApiError.conflict('Canton code already exists', 'code');
    }

    const canton = await Canton.create(input);
    logger.info('Admin created canton', { cantonId: canton._id.toString() });
    return canton.toObject();
  }

  async updateCanton(cantonId: string, input: Record<string, unknown>): Promise<ICanton> {
    /* logger.debug('AdminLocationsService updateCanton - updating canton'); */
    const canton = await Canton.findById(cantonId);
    if (!canton) {
      throw ApiError.notFound('Canton');
    }

    if (input.slug && input.slug !== canton.slug) {
      const existing = await Canton.findOne({ slug: input.slug as string }).lean();
      if (existing) throw ApiError.conflict('Canton slug already exists', 'slug');
    }
    if (input.code && input.code !== canton.code) {
      const existing = await Canton.findOne({ code: input.code as string }).lean();
      if (existing) throw ApiError.conflict('Canton code already exists', 'code');
    }
    // TODO: Implement location data validation and geocoding

    Object.assign(canton, input);
    await canton.save();
    logger.info('Admin updated canton', { cantonId });
    return canton.toObject();
  }

  async deleteCanton(cantonId: string): Promise<void> {
    const canton = await Canton.findById(cantonId).lean();
    if (!canton) {
      throw ApiError.notFound('Canton');
    }

    const cityCount = await City.countDocuments({ canton_id: cantonId });
    if (cityCount > 0) {
      throw ApiError.badRequest(
        `Cannot delete canton with ${cityCount} cities. Delete or reassign cities first.`,
      );
    }

    const storeCount = await Store.countDocuments({ canton_id: cantonId });
    if (storeCount > 0) {
      throw ApiError.badRequest(
        `Cannot delete canton with ${storeCount} stores. Reassign stores first.`,
      );
    }

    await Canton.findByIdAndDelete(cantonId);
    logger.info('Admin deleted canton', { cantonId });
  }

  // ─── CITIES ──────────────────────────
  async createCity(input: Record<string, unknown>): Promise<ICity> {
    const existingSlug = await City.findOne({ slug: input.slug as string }).lean();
    if (existingSlug) {
      throw ApiError.conflict('City slug already exists', 'slug');
    }

    const canton = await Canton.findById(input.canton_id).lean();
    if (!canton) {
      throw ApiError.badRequest('Canton not found');
    }

    const city = await City.create(input);
    logger.info('Admin created city', { cityId: city._id.toString() });
    return city.toObject();
  }

  async updateCity(cityId: string, input: Record<string, unknown>): Promise<ICity> {
    const city = await City.findById(cityId);
    if (!city) {
      throw ApiError.notFound('City');
    }

    if (input.slug && input.slug !== city.slug) {
      const existing = await City.findOne({ slug: input.slug as string }).lean();
      if (existing) throw ApiError.conflict('City slug already exists', 'slug');
    }

    if (input.canton_id) {
      const canton = await Canton.findById(input.canton_id).lean();
      if (!canton) throw ApiError.badRequest('Canton not found');
    }

    Object.assign(city, input);
    await city.save();
    logger.info('Admin updated city', { cityId });
    return city.toObject();
  }

  async deleteCity(cityId: string): Promise<void> {
    const city = await City.findById(cityId).lean();
    if (!city) {
      throw ApiError.notFound('City');
    }

    const storeCount = await Store.countDocuments({ city_id: cityId });
    if (storeCount > 0) {
      throw ApiError.badRequest(
        `Cannot delete city with ${storeCount} stores. Reassign stores first.`,
      );
    }

    await City.findByIdAndDelete(cityId);
    logger.info('Admin deleted city', { cityId });
  }
}

export default new AdminLocationsService();
