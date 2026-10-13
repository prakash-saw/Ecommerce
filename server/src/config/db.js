const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;

  const uri = process.env.MONGODB_URI;

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
      console.warn(`Could not connect to configured MONGODB_URI: ${err.message}.`);
      console.warn('Falling back to local in-memory Mongo instance for resilient development.');
    }
  }

  // Fallback to MongoMemoryServer for immediate zero-config testing if available
  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    console.log('Spinning up zero-config In-Memory MongoDB instance...');
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
