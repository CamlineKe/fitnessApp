import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Logger from '../utils/logger.js';

dotenv.config();

const connectDB = async () => {
  try {
    const options = {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      // MongoDB driver 4.0+ automatically handles these settings
      // Removed deprecated options: useNewUrlParser and useUnifiedTopology
    };

    const conn = await mongoose.connect(process.env.MONGO_URI, options);
    Logger.info(`MongoDB Connected: ${conn.connection.host}`);
    
    // Handle initial connection errors
    conn.connection.on('error', (err) => {
      Logger.error('MongoDB connection error:', err);
      process.exit(1);
    });

    // Handle disconnection
    conn.connection.on('disconnected', () => {
      Logger.warn('MongoDB disconnected! Attempting to reconnect...');
      setTimeout(connectDB, 5000); // Try to reconnect after 5 seconds
    });

    return conn;
  } catch (error) {
    Logger.error('MongoDB Connection Error:', error.message);
    // Wait 5 seconds before retrying
    await new Promise(resolve => setTimeout(resolve, 5000));
    return connectDB();
  }
};

// Gracefully close MongoDB on app termination
process.on('SIGINT', async () => {
  Logger.info('Closing MongoDB connection...');
  try {
    await mongoose.connection.close();
    Logger.info('MongoDB connection closed through app termination');
    process.exit(0);
  } catch (err) {
    Logger.error('Error while closing MongoDB connection:', err);
    process.exit(1);
  }
});

export default connectDB;
