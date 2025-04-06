import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Logger from '../utils/logger.js';

dotenv.config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);

    Logger.info(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    Logger.error('MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

// Gracefully close MongoDB on app termination
process.on('SIGINT', async () => {
  Logger.info('Closing MongoDB connection...');
  await mongoose.connection.close();
  process.exit(0);
});

// Handle disconnection
mongoose.connection.on('disconnected', () => {
  Logger.warn('MongoDB disconnected! Retrying connection...');
  connectDB();
});

export default connectDB;
