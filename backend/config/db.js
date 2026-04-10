import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Logger from '../utils/logger.js';

dotenv.config();

// Validate database collections health on startup - only warns on issues
const validateDatabaseHealth = async (conn) => {
  try {
    const db = conn.connection.db;
    const collections = await db.listCollections().toArray();
    
    for (const collectionInfo of collections) {
      const collectionName = collectionInfo.name;
      const collection = db.collection(collectionName);
      
      // Check document count vs index consistency
      const docCount = await collection.countDocuments();
      const stats = await db.command({ collStats: collectionName });
      const indexCount = stats.nindexes || 0;
      
      // Only log warnings for orphaned indexes (indexes exist but no documents)
      if (docCount === 0 && indexCount > 1) {
        Logger.warn(`⚠️  Collection ${collectionName} has orphaned indexes. Consider dropping and recreating.`);
      }
    }
  } catch (error) {
    Logger.error('Database health check failed:', error.message);
  }
};

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

    // Validate collections health on startup
    await validateDatabaseHealth(conn);

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
