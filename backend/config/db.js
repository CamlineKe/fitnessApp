import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds if MongoDB is unavailable
      connectTimeoutMS: 10000, // Give up if not connected in 10 seconds
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

// Handle unexpected disconnections
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB disconnected! Retrying connection...');
  connectDB();
});

// Gracefully close MongoDB on app termination
process.on('SIGINT', async () => {
  console.log('🔴 Closing MongoDB connection...');
  await mongoose.connection.close();
  process.exit(0);
});

export default connectDB;
