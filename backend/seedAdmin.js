const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

// Use the same MONGODB_URI as server.js
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ Error: MONGODB_URI is not defined in .env file');
  console.log('Please make sure your backend/.env file has MONGODB_URI defined');
  process.exit(1);
}

const DEFAULT_ADMIN = {
  email: 'admin@habittrack.io',
  password: 'Admin@123',
  name: 'System Admin',
  role: 'admin'
};

async function seedAdmin() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    console.log('   URI:', MONGODB_URI);
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if user with this email already exists
    const existingUser = await User.findOne({ email: DEFAULT_ADMIN.email });
    
    if (existingUser) {
      // Check if it's already an admin
      if (existingUser.role === 'admin') {
        console.log('ℹ️  Admin user already exists with this email');
        console.log(`   Email: ${existingUser.email}`);
        console.log(`   Role: ${existingUser.role}`);
      } else {
        // Update existing user to admin
        existingUser.role = 'admin';
        await existingUser.save();
        console.log('✅ User updated to admin successfully!');
        console.log(`   Email: ${existingUser.email}`);
      }
    } else {
      // Create new admin user
      const admin = new User(DEFAULT_ADMIN);
      await admin.save();
      console.log('✅ Default admin created successfully!');
      console.log(`   Email: ${DEFAULT_ADMIN.email}`);
      console.log(`   Password: ${DEFAULT_ADMIN.password}`);
    }

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.message.includes('MONGODB_URI')) {
      console.log('\n📝 Please check your backend/.env file:');
      console.log('   MONGODB_URI=mongodb://localhost:27017/habit-tracker');
      console.log('   (or your MongoDB Atlas connection string)');
    }
    process.exit(1);
  }
}

seedAdmin();
