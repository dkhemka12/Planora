import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

export const connectMongo = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/planora';
  try {
    const conn = await mongoose.connect(uri);
    console.log(`🍃 MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    // Non-fatal during early setup
  }
};
