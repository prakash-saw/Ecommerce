const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;

  const uri = process.env.MONGODB_URI;
  const isProduction = process.env.NODE_ENV === 'production';

  if (uri && uri !== 'placeholder') {
    try {
      console.log('Connecting to configured MongoDB URI...');
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
      });
      isConnected = true;
      console.log('MongoDB connected successfully via MONGODB_URI.');
      return;
    } catch (err) {
      console.error(`Could not connect to configured MONGODB_URI: ${err.message}.`);
      if (isProduction) {
        throw new Error(`Production database connection failed: ${err.message}. Refusing fallback to in-memory database in production.`);
      }
      console.warn('Falling back to local in-memory Mongo instance for resilient development.');
    }
  } else if (isProduction) {
    throw new Error('Production database configuration error: MONGODB_URI environment variable is required in production.');
  }

  // Fallback to MongoMemoryServer strictly for non-production environments
  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    console.log('Spinning up zero-config In-Memory MongoDB instance (development only)...');
    const mongod = await MongoMemoryServer.create();
    const memoryUri = mongod.getUri();
    await mongoose.connect(memoryUri);
    isConnected = true;
    console.log(`In-memory MongoDB active at: ${memoryUri}`);
  } catch (memErr) {
    console.warn(`MongoMemoryServer could not start (${memErr.message}).`);
    console.warn('Ensure MONGODB_URI is specified in .env to connect to your MongoDB Atlas cluster.');
  }
};

module.exports = connectDB;
