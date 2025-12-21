import multer, { type FileFilterCallback } from 'multer';
import { Request } from 'express';
import ApiError from '../errors/ApiError';

// ─── Constants ───────────────────────────────────────────

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_IMAGES_PER_BATCH = 10;
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
];

// ─── Multer Config ───────────────────────────────────────

const storage = multer.memoryStorage();

const fileFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback): void => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      ApiError.badRequest(
        `Invalid file type: ${file.mimetype}. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`,
      ),
    );
  }
};

const baseMulter = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: MAX_IMAGES_PER_BATCH,
  },
});

// ─── Named Upload Helpers ────────────────────────────────

/** Upload a single image with a custom field name (default: 'image') */
export const uploadSingle = (fieldName = 'image') => baseMulter.single(fieldName);

/** Upload multiple images with a custom field name (default: 'images') */
export const uploadMultiple = (fieldName = 'images', maxCount = MAX_IMAGES_PER_BATCH) =>
  baseMulter.array(fieldName, maxCount);

/** Upload multiple fields (e.g., logo + cover in one request) */
export const uploadFields = (fields: Array<{ name: string; maxCount: number }>) =>
  baseMulter.fields(fields);

// ─── Preset Upload Helpers ───────────────────────────────

/** Single product image upload */
export const uploadProductImage = baseMulter.single('image');

/** Multiple product images upload */
export const uploadProductImages = baseMulter.array('images', MAX_IMAGES_PER_BATCH);

/** Avatar upload */
export const uploadAvatar = baseMulter.single('avatar');

/** Brand logo upload */
export const uploadBrandLogo = baseMulter.single('logo');

/** Store logo upload */
export const uploadStoreLogo = baseMulter.single('logo');

// ─── Validation Guards ───────────────────────────────────

/** Middleware that ensures req.file exists */
export const requireFile = (fieldName = 'image') => {
  return (req: Request, _res: unknown, next: (err?: Error) => void): void => {
    if (!req.file) {
      return next(ApiError.badRequest(`Image file is required (field: ${fieldName})`));
    }
    next();
  };
};

/** Middleware that ensures req.files exists and is non-empty */
export const requireFiles = (fieldName = 'images') => {
  return (req: Request, _res: unknown, next: (err?: Error) => void): void => {
    const files = req.files;
    if (!files || (Array.isArray(files) && files.length === 0)) {
      return next(ApiError.badRequest(`At least one image file is required (field: ${fieldName})`));
    }
    next();
  };
};

// ─── Default Export (backward compat) ────────────────────

export default baseMulter;
