import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Logger from '../utils/logger.js';

dotenv.config();

// Enable query profiling for slow queries (>100ms)
const SLOW_QUERY_THRESHOLD_MS = 100;

const connectDB = async () => {
  try {
    const options = {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxPoolSize: 5, // Limit connections for free tier (default is 100)
      minPoolSize: 1,  // Keep at least 1 connection ready
      maxIdleTimeMS: 30000, // Close idle connections after 30s
      waitQueueTimeoutMS: 3000, // Fail fast if pool exhausted
      // MongoDB driver 4.0+ automatically handles these settings
      // Removed deprecated options: useNewUrlParser and useUnifiedTopology
    };

    const conn = await mongoose.connect(process.env.MONGO_URI, options);
    Logger.info(`MongoDB Connected: ${conn.connection.host}`);

    // Enable slow query logging
    mongoose.set('debug', (collectionName, method, query, doc, options) => {
      const startTime = Date.now();
      // Store start time on the query object for later use
      query._startTime = startTime;
    });

    // Add post-query hook to log slow queries
    mongoose.plugin((schema) => {
      schema.post(['find', 'findOne', 'findOneAndUpdate', 'findOneAndDelete', 'countDocuments'], function() {
        const duration = Date.now() - (this.options._startTime || Date.now());
        if (duration > SLOW_QUERY_THRESHOLD_MS) {
          Logger.warn(`Slow query detected (${duration}ms): ${this.model.modelName}.${this.op}`, {
            collection: this.model.collection.name,
            operation: this.op,
            duration,
            filter: this.getFilter ? this.getFilter() : null
          });
        }
      });
    });

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
