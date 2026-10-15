const mongoose = require('mongoose');

async function connectDB() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is missing. Add it to server/.env.');
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Atlas connected successfully.');
  } catch (error) {
    console.error(`MongoDB Atlas connection failed: ${error.message}`);
    throw error;
  }
}

module.exports = connectDB;
