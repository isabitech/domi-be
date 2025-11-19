import mongoose from 'mongoose';

// Use a real/local MongoDB instance for tests to avoid downloading binaries.
// Configure TEST_MONGODB_URI in environment (e.g., mongodb://127.0.0.1:27017/domi_test)
// Falls back to localhost if not provided.

const TEST_URI = process.env.TEST_MONGODB_URI || 'mongodb://127.0.0.1:27017/domi_test';

export async function connect() {
  if (mongoose.connection.readyState === 1) return; // already connected
  await mongoose.connect(TEST_URI, { dbName: 'domi_test', autoIndex: true });
}

export async function closeDatabase() {
  if (mongoose.connection.readyState) {
    await mongoose.connection.close();
  }
}

export async function clearDatabase() {
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
}
