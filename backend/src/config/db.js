const mongoose = require('mongoose');

const MAX_RETRIES = 5;
const RETRY_INTERVAL = 3000;

let retryCount = 0;

async function connectDB() {
  const primaryUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/garment_production';
  const localFallbackUri = 'mongodb://127.0.0.1:27017/garment_production';

  const uriToUse = (retryCount >= 2 && primaryUri !== localFallbackUri) ? localFallbackUri : primaryUri;

  try {
    console.log(`Attempting MongoDB connection to: ${uriToUse.includes('@') ? 'Cloud Cluster' : 'Local MongoDB'}...`);
    await mongoose.connect(uriToUse, {
      serverSelectionTimeoutMS: 5000,
    });
    retryCount = 0;
    console.log(`MongoDB connected: ${mongoose.connection.host}`);
  } catch (err) {
    retryCount += 1;
    console.error(`MongoDB connection attempt ${retryCount} failed: ${err.message}`);
    
    // If cloud cluster DNS/SRV fails, try local fallback on next attempt
    if (retryCount < MAX_RETRIES) {
      console.log(`Retrying in ${RETRY_INTERVAL / 1000}s...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_INTERVAL));
      return connectDB();
    }
    console.error('Max retries reached. Exiting.');
    process.exit(1);
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
