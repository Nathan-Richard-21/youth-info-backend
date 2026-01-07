const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    console.log('\n🔐 ======== AUTH MIDDLEWARE (utils/authMiddleware.js) ========');
    
    const header = req.headers.authorization;
    console.log('📥 Authorization header:', header ? `${header.substring(0, 30)}...` : 'MISSING');
    
    if (!header) {
      console.log('❌ No authorization header found');
      return res.status(401).json({ message: 'No token' });
    }
    
    const token = header.split(' ')[1];
    console.log('🎫 Token extracted:', token ? `${token.substring(0, 20)}...` : 'FAILED');
    
    if (!token) {
      console.log('❌ Token extraction failed');
      return res.status(401).json({ message: 'No token' });
    }
    
    // Verify token
    const jwtSecret = process.env.JWT_SECRET || 'secret';
    console.log('🔑 Using JWT_SECRET:', jwtSecret ? `${jwtSecret.substring(0, 10)}...` : 'UNDEFINED');
    const payload = jwt.verify(token, jwtSecret);
    console.log('✅ Token verified. Decoded payload:', JSON.stringify(payload, null, 2));
    
    // Support BOTH token formats: {userId: ...} and {id: ...}
    const userId = payload.userId || payload.id;
    console.log('🔍 Extracted user ID:', userId);
    
    if (!userId) {
      console.log('❌ No userId found in token payload');
      return res.status(401).json({ message: 'Invalid token format' });
    }
    
    // Look up user in database
    console.log('🔎 Looking up user in database with ID:', userId);
    req.user = await User.findById(userId).select('-password');
    
    console.log('👤 User lookup result:', req.user ? `FOUND: ${req.user.name} (${req.user.email})` : 'NOT FOUND');
    
    if (!req.user) {
      console.log('❌ User not found in database');
      return res.status(401).json({ message: 'User not found' });
    }
    
    console.log('✅ Authentication successful! User attached to request.');
    console.log('========================================\n');
    next();
  } catch (err) {
    console.log('❌ Token verification failed:', err.message);
    console.log('Error details:', err);
    return res.status(401).json({ message: 'Invalid token' });
  }
};

const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') return next();
  return res.status(403).json({ message: 'Requires admin' });
};

module.exports = { auth, isAdmin };
