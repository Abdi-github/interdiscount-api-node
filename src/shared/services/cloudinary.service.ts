import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
import config from '../../config';
import logger from '../logger';
import ApiError from '../errors/ApiError';
import { imageService, IMAGE_PRESETS, type ImageOptimizationOptions } from './image.service';

// ─── Folder Constants ────────────────────────────────────

export const CLOUDINARY_FOLDERS = {
  products: 'interdiscount/products',
  avatars: 'interdiscount/avatars',
  stores: 'interdiscount/stores',
  brands: 'interdiscount/brands',
  categories: 'interdiscount/categories',
} as const;

// ─── Interfaces ──────────────────────────────────────────

export interface CloudinaryUploadResult {
  public_id: string;
  url: string;
  thumbnail_url?: string;
  width: number;
  height: number;
  bytes: number;
  format: string;
  resource_type: string;
}

export interface CloudinaryUploadOptions {
  folder: string;
  publicId?: string;
  preset?: keyof typeof IMAGE_PRESETS;
  optimization?: ImageOptimizationOptions;
  tags?: string[];
  overwrite?: boolean;
}

// ─── Service ─────────────────────────────────────────────

class CloudinaryService {
  private isConfigured = false;

  constructor() {
    this.configure();
  }

  private configure(): void {
    const { cloudName, apiKey, apiSecret } = config.cloudinary;
    if (!cloudName || !apiKey || !apiSecret) {
      logger.warn('Cloudinary credentials not configured — uploads will fail');
      return;
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });

    this.isConfigured = true;
    logger.info('Cloudinary configured successfully');
  }

  private ensureConfigured(): void {
    if (!this.isConfigured) {
      throw ApiError.internal('Cloudinary is not configured. Check environment variables.');
    }
  }

  // ─── Upload ──────────────────────────────────────────

  /**
   * Upload a single image buffer to Cloudinary with optional optimization.
   */
  async uploadSingle(
    buffer: Buffer,
    originalname: string,
    options: CloudinaryUploadOptions,
  ): Promise<CloudinaryUploadResult> {
    this.ensureConfigured();

    const { folder, publicId, preset, optimization, tags, overwrite = true } = options;
    const optimizationOpts = optimization || (preset ? IMAGE_PRESETS[preset] : IMAGE_PRESETS.generic);

    let mainBuffer = buffer;
    let thumbnailResult: CloudinaryUploadResult | undefined;

    // Optimize image before upload
    const optimized = await imageService.optimize(buffer, optimizationOpts);
    mainBuffer = optimized.main.buffer;

    // Upload thumbnail if generated
    if (optimized.thumbnail) {
      thumbnailResult = await this.uploadBuffer(optimized.thumbnail.buffer, {
        folder: `${folder}/thumbnails`,
        publicId: publicId ? `${publicId}_thumb` : undefined,
        format: optimized.thumbnail.format,
        tags: [...(tags || []), 'thumbnail'],
        overwrite,
      });
    }

    // Upload main image
    const result = await this.uploadBuffer(mainBuffer, {
      folder,
      publicId,
      format: 'webp',
      tags,
      overwrite,
    });

    logger.info(`Image uploaded to Cloudinary: ${result.public_id}`, {
      folder,
      originalname,
      size: result.bytes,
    });

    return {
      ...result,
      thumbnail_url: thumbnailResult?.url,
    };
  }

  /**
   * Upload multiple image buffers to Cloudinary in parallel.
   */
  async uploadMultiple(
    files: Array<{ buffer: Buffer; originalname: string }>,
    options: CloudinaryUploadOptions,
  ): Promise<CloudinaryUploadResult[]> {
    this.ensureConfigured();

    const results = await Promise.all(
      files.map((file, index) =>
        this.uploadSingle(file.buffer, file.originalname, {
          ...options,
          publicId: options.publicId ? `${options.publicId}_${index + 1}` : undefined,
        }),
      ),
    );

    logger.info(`Batch upload complete: ${results.length} images uploaded`, {
      folder: options.folder,
    });

    return results;
  }

  /**
   * Upload product images and return URLs for all 3 sizes (md, sm, xs).
   */
  async uploadProductImage(
    buffer: Buffer,
    _originalname: string,
    productCode: string,
  ): Promise<{
    md: string;
    sm: string;
    xs: string;
    public_id: string;
  }> {
    this.ensureConfigured();

    const variants = await imageService.generateProductVariants(buffer);

    const [mdResult, smResult, xsResult] = await Promise.all([
      this.uploadBuffer(variants.md.buffer, {
        folder: `${CLOUDINARY_FOLDERS.products}/${productCode}`,
        publicId: `${productCode}_md_${Date.now()}`,
        format: 'webp',
        tags: ['product', 'md'],
        overwrite: true,
      }),
      this.uploadBuffer(variants.sm.buffer, {
        folder: `${CLOUDINARY_FOLDERS.products}/${productCode}`,
        publicId: `${productCode}_sm_${Date.now()}`,
        format: 'webp',
        tags: ['product', 'sm'],
        overwrite: true,
      }),
      this.uploadBuffer(variants.xs.buffer, {
        folder: `${CLOUDINARY_FOLDERS.products}/${productCode}`,
        publicId: `${productCode}_xs_${Date.now()}`,
        format: 'webp',
        tags: ['product', 'xs'],
        overwrite: true,
      }),
    ]);

    logger.info(`Product image uploaded: ${productCode}`, {
      md: mdResult.public_id,
      sm: smResult.public_id,
      xs: xsResult.public_id,
    });

    return {
      md: mdResult.url,
      sm: smResult.url,
      xs: xsResult.url,
      public_id: mdResult.public_id,
    };
  }

  // ─── Delete ──────────────────────────────────────────

  /**
   * Delete a single image from Cloudinary by public_id.
   */
  async deleteSingle(publicId: string): Promise<boolean> {
    this.ensureConfigured();

    try {
      const result = await cloudinary.uploader.destroy(publicId, { invalidate: true });
      const success = result.result === 'ok';

      if (success) {
        logger.info(`Image deleted from Cloudinary: ${publicId}`);
      } else {
        logger.warn(`Failed to delete image from Cloudinary: ${publicId}`, { result });
      }

      return success;
    } catch (error) {
      logger.error(`Cloudinary delete error for ${publicId}:`, error);
      return false;
    }
  }

  /**
   * Delete multiple images from Cloudinary by public_ids.
   */
  async deleteMultiple(publicIds: string[]): Promise<{ deleted: string[]; failed: string[] }> {
    this.ensureConfigured();

    if (publicIds.length === 0) {
      return { deleted: [], failed: [] };
    }

    try {
      const result = await cloudinary.api.delete_resources(publicIds, { invalidate: true });
      const deleted: string[] = [];
      const failed: string[] = [];

      for (const [id, status] of Object.entries(result.deleted)) {
        if (status === 'deleted') {
          deleted.push(id);
        } else {
          failed.push(id);
        }
      }

      logger.info(`Batch delete: ${deleted.length} deleted, ${failed.length} failed`);
      return { deleted, failed };
    } catch (error) {
      logger.error('Cloudinary batch delete error:', error);
      return { deleted: [], failed: publicIds };
    }
  }

  /**
   * Delete all resources in a Cloudinary folder.
   */
  async deleteFolder(folderPath: string): Promise<boolean> {
    this.ensureConfigured();

    try {
      await cloudinary.api.delete_resources_by_prefix(folderPath);
      await cloudinary.api.delete_folder(folderPath);
      logger.info(`Cloudinary folder deleted: ${folderPath}`);
      return true;
    } catch (error) {
      logger.error(`Cloudinary folder delete error for ${folderPath}:`, error);
      return false;
    }
  }

  // ─── URL Generation ──────────────────────────────────

  /**
   * Generate a Cloudinary URL with transformations.
   */
  generateUrl(
    publicId: string,
    options: {
      width?: number;
      height?: number;
      crop?: string;
      quality?: string;
      format?: string;
    } = {},
  ): string {
    return cloudinary.url(publicId, {
      secure: true,
      width: options.width,
      height: options.height,
      crop: options.crop || 'fill',
      quality: options.quality || 'auto',
      format: options.format || 'webp',
      fetch_format: 'auto',
    });
  }

  /**
   * Generate a thumbnail URL.
   */
  generateThumbnailUrl(publicId: string, width = 100, height = 100): string {
    return cloudinary.url(publicId, {
      secure: true,
      width,
      height,
      crop: 'fill',
      quality: 'auto:low',
      format: 'webp',
    });
  }

  // ─── Utilities ───────────────────────────────────────

  /**
   * Extract the public_id from a Cloudinary URL.
   */
  extractPublicId(url: string): string | null {
    if (!url) return null;

    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      const uploadIndex = pathParts.indexOf('upload');
      if (uploadIndex === -1) return null;

      const relevantParts = pathParts.slice(uploadIndex + 1);
      const startIndex = relevantParts[0]?.startsWith('v') ? 1 : 0;
      const publicIdWithExt = relevantParts.slice(startIndex).join('/');
      return publicIdWithExt.replace(/\.[^.]+$/, '');
    } catch {
      return null;
    }
  }

  /**
   * Get resource metadata from Cloudinary.
   */
  async getResource(
    publicId: string,
  ): Promise<{ public_id: string; url: string; bytes: number; format: string } | null> {
    this.ensureConfigured();

    try {
      const result = await cloudinary.api.resource(publicId);
      return {
        public_id: result.public_id,
        url: result.secure_url,
        bytes: result.bytes,
        format: result.format,
      };
    } catch {
      return null;
    }
  }

  // ─── Private Upload Helper ───────────────────────────

  private async uploadBuffer(
    buffer: Buffer,
    options: {
      folder: string;
      publicId?: string;
      format?: string;
      tags?: string[];
      overwrite?: boolean;
    },
  ): Promise<CloudinaryUploadResult> {
    return new Promise((resolve, reject) => {
      const uploadOptions: Record<string, unknown> = {
        folder: options.folder,
        overwrite: options.overwrite ?? true,
        resource_type: 'image' as const,
        format: options.format || 'webp',
        tags: options.tags,
        unique_filename: !options.publicId,
      };

      if (options.publicId) {
        uploadOptions.public_id = options.publicId;
      }

      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
          if (error || !result) {
            logger.error('Cloudinary upload error:', error);
            reject(ApiError.internal(error?.message || 'Failed to upload image to Cloudinary'));
            return;
          }

          resolve({
            public_id: result.public_id,
            url: result.secure_url,
            width: result.width,
            height: result.height,
            bytes: result.bytes,
            format: result.format,
            resource_type: result.resource_type,
          });
        },
      );

      uploadStream.end(buffer);
    });
  }
}

export const cloudinaryService = new CloudinaryService();
export default cloudinaryService;
