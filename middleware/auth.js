const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to verify JWT token and attach user to request
const auth = async (req, res, next) => {
  try {
    console.log('🔐 AUTH MIDDLEWARE START');
    console.log('📍 Request URL:', req.method, req.originalUrl);
    
    // Get token from header
    const authHeader = req.header('Authorization');
    console.log('📨 Authorization header:', authHeader ? `${authHeader.substring(0, 20)}...` : 'MISSING');
    
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      console.log('❌ NO TOKEN PROVIDED');
      return res.status(401).json({ message: 'No authentication token, access denied' });
    }
    
    console.log('🔑 Token received (first 20 chars):', token.substring(0, 20));
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    console.log('✅ Token verified. Decoded payload:', JSON.stringify(decoded, null, 2));
    
    // Support both old and new token formats
    const userId = decoded.userId || decoded.id;
    console.log('🔍 Extracted user ID:', userId);
    
    if (!userId) {
      console.log('❌ NO USER ID IN TOKEN - Token payload:', decoded);
      return res.status(401).json({ message: 'Invalid token format - missing user ID' });
    }
    
    // Find user by id from token
    console.log('🔎 Looking up user in database with ID:', userId);
    const user = await User.findById(userId).select('-password');
    console.log('👤 User lookup result:', user ? `FOUND: ${user.name} (${user.email})` : 'NOT FOUND');
    
    if (!user) {
      console.log('❌ USER NOT FOUND IN DATABASE');
      console.log('Searched for ID:', userId);
      console.log('Token was:', decoded);
      return res.status(401).json({ message: 'User not found in database' });
    }
    
    if (!user.isActive) {
      console.log('❌ USER ACCOUNT DEACTIVATED');
      return res.status(403).json({ message: 'Account is deactivated' });
    }
    
    if (user.isSuspended) {
      console.log('❌ USER ACCOUNT SUSPENDED');
      return res.status(403).json({ message: 'Account is suspended', reason: user.suspensionReason });
    }
    
    // Attach user to request
    req.user = user;
    req.userId = user._id;
    console.log('✅ AUTH SUCCESS - User:', user.name, '(', user.email, ')');
    next();
  } catch (err) {
    console.error('❌ AUTH MIDDLEWARE ERROR:', err.message);
    console.error('Error details:', err);
    res.status(401).json({ message: 'Token is not valid', error: err.message });
  }
};

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Admin privileges required.' });
  }
};

module.exports = auth;
module.exports.isAdmin = isAdmin;
