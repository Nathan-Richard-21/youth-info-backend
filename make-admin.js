// Quick script to make a user admin
// Run with: node make-admin.js <email>

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

// Get email from command line argument
const email = process.argv[2];

if (!email) {
  console.log('❌ Please provide an email address');
  console.log('Usage: node make-admin.js <email>');
  process.exit(1);
}

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/youthportal';

async function makeAdmin() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    console.log(`🔍 Looking for user with email: ${email}`);
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      console.log('❌ User not found');
      console.log('💡 Make sure the email is correct and the user has registered');
      process.exit(1);
    }

    console.log(`📋 Found user: ${user.name} (${user.email})`);
    console.log(`📊 Current role: ${user.role}`);

    if (user.role === 'admin') {
      console.log('✅ User is already an admin!');
      process.exit(0);
    }

    // Update to admin
    user.role = 'admin';
    await user.save();

    console.log('✅ User role updated to ADMIN!');
    console.log('🎉 Done! You can now access admin features.');
    console.log('🔄 Refresh your browser if you\'re already logged in.');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

makeAdmin();
