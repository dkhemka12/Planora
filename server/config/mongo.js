import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Connect to MongoDB database
 * @param {string} [customUri] - Optional custom URI (useful for testing)
 * @returns {Promise<typeof mongoose>}
 */
export const connectMongo = async (customUri) => {
  const uri = customUri || process.env.MONGO_URI || 'mongodb://localhost:27017/planora';
  
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  try {
    const conn = await mongoose.connect(uri);
    console.log(`🍃 MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    throw error;
  }
};

/**
 * Gracefully disconnect from MongoDB
 */
export const disconnectMongo = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    console.log('🍃 MongoDB Disconnected successfully.');
  }
};
