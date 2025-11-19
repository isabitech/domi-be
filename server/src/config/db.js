import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || process.env.MONGO_URI;

    if (!uri) {
      console.error('❌ Missing MONGODB_URI (or MONGO_URI) in environment');
      process.exit(1);
    }

    const conn = await mongoose.connect(uri); // no options needed in Mongoose 7+

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    process.exit(1);
  }
};

export default connectDB;
