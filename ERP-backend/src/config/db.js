import mongoose from "mongoose";

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    console.error("MONGO_URI is not defined in environment variables. Please set it in Vercel dashboard.");
    return;
  }
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    // Don't call process.exit(1) on Vercel — it crashes the serverless function
  }
};

export default connectDB;
