const mongoose = require('mongoose');

const LOCAL_FALLBACK_URI = process.env.LOCAL_MONGO_URI || 'mongodb://127.0.0.1:27017/garment_production';

async function connectDB() {
  const primaryUri = process.env.MONGO_URI || LOCAL_FALLBACK_URI;

  // Try primary URI first
  try {
    const isCloud = primaryUri.includes('@') || primaryUri.includes('mongodb+srv');
    console.log(`Attempting MongoDB connection to: ${isCloud ? 'Cloud Atlas Cluster' : 'Local MongoDB'}...`);
    
    await mongoose.connect(primaryUri, {
      serverSelectionTimeoutMS: 3000,
    });
    console.log(`MongoDB connected successfully: ${mongoose.connection.host}`);
    return;
  } catch (err) {
    console.warn(`Primary MongoDB connection failed (${err.message}).`);
    
    // If primary was cloud and failed, immediately attempt local MongoDB fallback
    if (primaryUri !== LOCAL_FALLBACK_URI) {
      console.log(`Falling back to Local MongoDB: ${LOCAL_FALLBACK_URI}...`);
      try {
        await mongoose.connect(LOCAL_FALLBACK_URI, {
          serverSelectionTimeoutMS: 3000,
        });
        console.log(`Local MongoDB connected successfully: ${mongoose.connection.host}`);
        return;
      } catch (fallbackErr) {
        console.error(`Local MongoDB connection also failed: ${fallbackErr.message}`);
        console.error('Ensure MongoDB is running locally on port 27017 or whitelist your IP on MongoDB Atlas.');
        process.exit(1);
      }
    } else {
      process.exit(1);
    }
  }
}

mongoose.connection.on('connected', () => {
  console.log('Mongoose connection established.');
});

mongoose.connection.on('error', (err) => {
  console.error(`Mongoose connection error: ${err.message}`);
});

mongoose.connection.on('disconnected', () => {
  console.warn('Mongoose connection disconnected.');
});

process.on('SIGINT', async () => {
  await mongoose.connection.close();
  process.exit(0);
});

module.exports = connectDB;

