require('dotenv').config();

const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Category = require('../models/Category');
const User = require('../models/User');

const DEFAULT_CATEGORIES = ['Technical', 'Cultural', 'Sports', 'Workshop', 'Seminar', 'Hackathon'];

async function seedAdmin() {
  const { ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be set in server/.env.');
  }
  if (ADMIN_PASSWORD.length < 8 || ADMIN_PASSWORD.length > 128) {
    throw new Error('ADMIN_PASSWORD must contain 8 to 128 characters.');
  }

  await connectDB();
  const email = ADMIN_EMAIL.trim().toLowerCase();
  const existingAdmin = await User.findOne({ email });

  if (existingAdmin) {
    if (existingAdmin.role !== 'admin') {
      throw new Error(`An account for ${email} exists but is not an admin.`);
    }
    console.log(`Admin account ${email} already exists; no changes made.`);
  } else {
    await User.create({
      name: 'CampusConnect Admin',
      email,
      passwordHash: ADMIN_PASSWORD,
      role: 'admin'
    });
    console.log(`Initial admin account created for ${email}.`);
  }

  await Category.bulkWrite(
    DEFAULT_CATEGORIES.map((name) => ({
      updateOne: {
        filter: { name },
        update: { $setOnInsert: { name, description: '' } },
        upsert: true
      }
    }))
  );
  console.log('Default categories are ready.');
}

seedAdmin()
  .catch((error) => {
    console.error(`Seed failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
