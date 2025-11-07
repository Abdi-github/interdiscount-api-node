import { v2 as cloudinary } from 'cloudinary';
import config from './index';
import logger from '../shared/logger';

const configureCloudinary = (): void => {
  cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
  });
  logger.info(`Cloudinary configured: cloud=${config.cloudinary.cloudName}`);
};

export { cloudinary, configureCloudinary };
