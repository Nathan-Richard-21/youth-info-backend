// Quick script to change user role
// Run with: node set-role.js <email> <role>
// Roles: user, stakeholder, admin

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

// Get arguments from command line
const email = process.argv[2];
const role = process.argv[3];

if (!email || !role) {
  console.log('❌ Please provide email and role');
  console.log('Usage: node set-role.js <email> <role>');
  console.log('Roles: user, stakeholder, admin');
  console.log('Example: node set-role.js nathan@example.com admin');
  process.exit(1);
}

const validRoles = ['user', 'stakeholder', 'admin'];
if (!validRoles.includes(role)) {
  console.log(`❌ Invalid role: ${role}`);
  console.log('Valid roles: user, stakeholder, admin');
  process.exit(1);
}

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/youthportal';

async function setRole() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    console.log(`🔍 Looking for user with email: ${email}`);
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      console.log('❌ User not found');
      console.log('💡 Make sure the email is correct and the user has registered');
      
      // Show all users
      console.log('\n📋 Available users:');
      const allUsers = await User.find().select('name email role').limit(10);
      allUsers.forEach(u => {
        console.log(`   - ${u.name} (${u.email}) - ${u.role}`);
      });
      
      process.exit(1);
    }

    console.log(`📋 Found user: ${user.name} (${user.email})`);
    console.log(`📊 Current role: ${user.role}`);

    if (user.role === role) {
      console.log(`✅ User already has role: ${role}`);
      process.exit(0);
    }

    // Update role
    const oldRole = user.role;
    user.role = role;
    await user.save();

    console.log(`✅ User role updated: ${oldRole} → ${role.toUpperCase()}!`);
    console.log('🎉 Done!');
    
    // Show role permissions
    console.log('\n📌 Role permissions:');
    if (role === 'admin') {
      console.log('   ✓ Full system access');
      console.log('   ✓ Manage users and roles');
      console.log('   ✓ Approve/reject opportunities');
      console.log('   ✓ View all reports and analytics');
    } else if (role === 'stakeholder') {
      console.log('   ✓ Post opportunities');
      console.log('   ✓ View stakeholder dashboard');
      console.log('   ✓ Access analytics');
    } else {
      console.log('   ✓ Regular user access');
      console.log('   ✓ Apply to opportunities');
      console.log('   ✓ Save items and post in forums');
    }
    
    console.log('\n🔄 Refresh your browser if you\'re already logged in.');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

setRole();
