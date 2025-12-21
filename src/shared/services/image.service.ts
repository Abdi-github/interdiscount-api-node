import sharp from 'sharp';
import logger from '../logger';

// ─── Interfaces ──────────────────────────────────────────

export interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  withThumbnail?: boolean;
}

export interface OptimizedImage {
  buffer: Buffer;
  mimetype: string;
  format: string;
  width: number;
  height: number;
  size: number;
}

export interface OptimizedImageResult {
  main: OptimizedImage;
  thumbnail?: OptimizedImage;
}

// ─── Presets ─────────────────────────────────────────────

export const IMAGE_PRESETS = {
  productMain: {
    width: 720,
    height: 720,
    quality: 85,
    format: 'webp' as const,
    fit: 'contain' as const,
    withThumbnail: true,
  },
  productCard: {
    width: 260,
    height: 260,
    quality: 80,
    format: 'webp' as const,
    fit: 'contain' as const,
    withThumbnail: false,
  },
  productThumb: {
    width: 100,
    height: 100,
    quality: 75,
    format: 'webp' as const,
    fit: 'contain' as const,
    withThumbnail: false,
  },
  avatar: {
    width: 300,
    height: 300,
    quality: 85,
    format: 'webp' as const,
    fit: 'cover' as const,
    withThumbnail: false,
  },
  storeLogo: {
    width: 400,
    height: 400,
    quality: 85,
    format: 'webp' as const,
    fit: 'cover' as const,
    withThumbnail: true,
  },
  brandLogo: {
    width: 400,
    height: 400,
    quality: 85,
    format: 'webp' as const,
    fit: 'contain' as const,
    withThumbnail: false,
  },
  generic: {
    width: 1200,
    quality: 80,
    format: 'webp' as const,
    fit: 'inside' as const,
    withThumbnail: false,
  },
} as const;

// ─── Constants ───────────────────────────────────────────

const THUMBNAIL_WIDTH = 100;
const THUMBNAIL_HEIGHT = 100;
const THUMBNAIL_MAX_QUALITY = 75;

// ─── Service ─────────────────────────────────────────────

class ImageService {
  /**
   * Optimize a single image buffer with optional thumbnail generation.
   */
  async optimize(
    inputBuffer: Buffer,
    options: ImageOptimizationOptions = {},
  ): Promise<OptimizedImageResult> {
    const {
      width,
      height,
      quality = 80,
      format = 'webp',
      fit = 'cover',
      withThumbnail = false,
    } = options;

    const main = await this.processImage(inputBuffer, { width, height, quality, format, fit });

    let thumbnail: OptimizedImage | undefined;
    if (withThumbnail) {
      thumbnail = await this.processImage(inputBuffer, {
        width: THUMBNAIL_WIDTH,
        height: THUMBNAIL_HEIGHT,
        quality: Math.min(quality, THUMBNAIL_MAX_QUALITY),
        format,
        fit: 'cover',
      });
    }

    const savings = inputBuffer.length - main.size;
    const savingsPercent = ((savings / inputBuffer.length) * 100).toFixed(1);
    logger.debug(`Image optimized: ${inputBuffer.length} → ${main.size} bytes (${savingsPercent}% reduction)`);

    return { main, thumbnail };
  }

  /**
   * Optimize multiple images in parallel.
   */
  async optimizeBatch(
    inputs: Array<{ buffer: Buffer; originalname: string }>,
    options: ImageOptimizationOptions = {},
  ): Promise<OptimizedImageResult[]> {
    return Promise.all(inputs.map((input) => this.optimize(input.buffer, options)));
  }

  /**
   * Get metadata for an image buffer.
   */
  async getMetadata(buffer: Buffer): Promise<{
    width: number;
    height: number;
    format: string;
    size: number;
    hasAlpha: boolean;
  }> {
    const metadata = await sharp(buffer).metadata();
    return {
      width: metadata.width || 0,
      height: metadata.height || 0,
      format: metadata.format || 'unknown',
      size: buffer.length,
      hasAlpha: metadata.hasAlpha || false,
    };
  }

  /**
   * Validate that a buffer is a valid image.
   */
  async isValidImage(buffer: Buffer): Promise<boolean> {
    try {
      const metadata = await sharp(buffer).metadata();
      return !!(metadata.width && metadata.height && metadata.format);
    } catch {
      return false;
    }
  }

  /**
   * Generate multiple size variants for a product image.
   * Returns { md: Buffer, sm: Buffer, xs: Buffer } matching the interdiscount image structure.
   */
  async generateProductVariants(buffer: Buffer): Promise<{
    md: OptimizedImage;
    sm: OptimizedImage;
    xs: OptimizedImage;
  }> {
    const [md, sm, xs] = await Promise.all([
      this.processImage(buffer, { ...IMAGE_PRESETS.productMain }),
      this.processImage(buffer, { ...IMAGE_PRESETS.productCard }),
      this.processImage(buffer, { ...IMAGE_PRESETS.productThumb }),
    ]);

    return { md, sm, xs };
  }

  // ─── Private ────────────────────────────────────────────

  private async processImage(
    buffer: Buffer,
    opts: {
      width?: number;
      height?: number;
      quality: number;
      format: 'webp' | 'jpeg' | 'png';
      fit: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
    },
  ): Promise<OptimizedImage> {
    let pipeline = sharp(buffer).rotate(); // auto-rotate based on EXIF

    if (opts.width || opts.height) {
      pipeline = pipeline.resize({
        width: opts.width,
        height: opts.height,
        fit: opts.fit,
        withoutEnlargement: true,
      });
    }

    switch (opts.format) {
      case 'webp':
        pipeline = pipeline.webp({ quality: opts.quality, effort: 4 });
        break;
      case 'jpeg':
        pipeline = pipeline.jpeg({ quality: opts.quality, mozjpeg: true });
        break;
      case 'png':
        pipeline = pipeline.png({ quality: opts.quality, compressionLevel: 8 });
        break;
    }

    const outputBuffer = await pipeline.toBuffer();
    const metadata = await sharp(outputBuffer).metadata();

    return {
      buffer: outputBuffer,
      mimetype: `image/${opts.format}`,
      format: opts.format,
      width: metadata.width || 0,
      height: metadata.height || 0,
      size: outputBuffer.length,
    };
  }
}

export const imageService = new ImageService();
export default imageService;
