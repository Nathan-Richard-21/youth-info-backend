require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const users = await User.find().select('name email role');
  console.log('📋 Users in database:');
  users.forEach(u => console.log(`  - ${u.email} (${u.name}) [${u.role}]`));
  process.exit(0);
});
