// Test script to verify JWT_SECRET and generate a fresh token
require('dotenv').config();
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('./models/User');

console.log('\n🔍 ========== JWT SECRET DEBUG ==========');
console.log('JWT_SECRET from .env:', process.env.JWT_SECRET);
console.log('First 20 chars:', process.env.JWT_SECRET ? process.env.JWT_SECRET.substring(0, 20) : 'UNDEFINED');

async function testToken() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
    
    // Find a test user (you can change this email)
    const email = process.argv[2] || 'test@example.com';
    console.log(`\n🔍 Looking for user: ${email}`);
    
    const user = await User.findOne({ email });
    if (!user) {
      console.log('❌ User not found. Please provide a valid email as argument.');
      console.log('Usage: node test-token.js your@email.com');
      process.exit(1);
    }
    
    console.log(`✅ User found: ${user.name} (ID: ${user._id})`);
    
    // Generate a fresh token
    const token = jwt.sign(
      { userId: user._id }, 
      process.env.JWT_SECRET || 'secret', 
      { expiresIn: '7d' }
    );
    
    console.log('\n🎫 ========== FRESH TOKEN GENERATED ==========');
    console.log('Token:', token);
    console.log('\n📋 Use this token in your Authorization header:');
    console.log(`Bearer ${token}`);
    
    // Verify the token works
    console.log('\n🔐 ========== VERIFYING TOKEN ==========');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    console.log('✅ Token verified successfully!');
    console.log('Decoded payload:', decoded);
    
    await mongoose.connection.close();
    console.log('\n✅ Test complete!');
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

testToken();
