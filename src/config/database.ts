import mongoose from 'mongoose';
import config from './index';
import logger from '../shared/logger';

const connectDatabase = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(config.mongodb.uri);
    logger.info(`MongoDB connected: ${conn.connection.host}:${conn.connection.port}/${conn.connection.name}`);
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    process.exit(1);
  }

  mongoose.connection.on('error', (err) => {
    logger.error('MongoDB connection error:', err);
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected');
  });
};

export default connectDatabase;
