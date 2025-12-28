const mongoose = require('mongoose');
require('dotenv').config();

console.log('🔧 Initializing MongoDB connection...');

// Environment variables validation
const mongodbUri = process.env.MONGODB_URI;

console.log('Environment check:');
console.log('- MONGODB_URI:', mongodbUri ? '✅ Set' : '❌ Missing');

if (!mongodbUri) {
  console.error('❌ MONGODB_URI environment variable is not set');
  throw new Error('MONGODB_URI is required');
}

// Connect to MongoDB
async function connectDB() {
  try {
    console.log('🔍 Testing database connection...');
    await mongoose.connect(mongodbUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected successfully');
    return mongoose.connection;
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error.message);
    throw error;
  }
}

// Call the connection function
connectDB();

module.exports = mongoose.connection;
