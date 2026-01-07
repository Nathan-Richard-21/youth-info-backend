const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const axios = require('axios');
const User = require('../models/User');

// EmailJS Configuration from environment variables
const EMAILJS_SERVICE_ID = process.env.EMAILJS_SERVICE_ID || 'service_fxahv48';
const EMAILJS_TEMPLATE_ID = process.env.EMAILJS_TEMPLATE_ID || 'template_tt3lra7';
const EMAILJS_PUBLIC_KEY = process.env.EMAILJS_PUBLIC_KEY || '_gtM9PicpK4G_fbew';
const EMAILJS_PRIVATE_KEY = process.env.EMAILJS_PRIVATE_KEY || 'ikOJQcNEegDlOH6CFtKyv';

console.log('📧 EmailJS REST API configured:', {
  serviceId: EMAILJS_SERVICE_ID,
  templateId: EMAILJS_TEMPLATE_ID,
  publicKey: EMAILJS_PUBLIC_KEY ? '✅ Set' : '❌ Missing'
});

router.post('/register', async (req, res) => {
  try {
    const { 
      name, 
      email, 
      password, 
      role, 
      companyName, 
      companyDescription, 
      companyIndustry, 
      companySize, 
      companyWebsite, 
      companyPhone, 
      companyLocation 
    } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }
    
    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: 'Email already registered' });
    }
    
    const hash = await bcrypt.hash(password, 10);
    
    // Create user object with basic fields
    const userData = {
      name,
      email,
      password: hash,
      role: role || 'user' // Default to 'user' if not specified
    };
    
    // Add company fields if role is stakeholder
    if (role === 'stakeholder') {
      userData.companyName = companyName;
      userData.companyDescription = companyDescription;
      userData.companyIndustry = companyIndustry;
      userData.companySize = companySize;
      userData.companyWebsite = companyWebsite;
      userData.phone = companyPhone; // Using the existing phone field
      userData.location = companyLocation; // Using the existing location field
      userData.verificationStatus = 'pending'; // Set initial verification status
    }
    
    const user = await User.create(userData);
    
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    
    res.json({ 
      token, 
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        role: user.role,
        companyName: user.companyName,
        verificationStatus: user.verificationStatus
      } 
    });
  } catch (err) {
    console.error('❌ REGISTRATION ERROR:', err);
    res.status(500).json({ message: err.message });
  }
});

// Upgrade existing user to stakeholder
router.post('/upgrade-to-stakeholder', async (req, res) => {
  try {
    // Get user from token
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update user to stakeholder with company details
    const {
      companyName,
      companyDescription,
      companyIndustry,
      companySize,
      companyWebsite,
      phone,
      location
    } = req.body;

    user.role = 'stakeholder';
    user.companyName = companyName;
    user.companyDescription = companyDescription;
    user.companyIndustry = companyIndustry;
    user.companySize = companySize;
    user.companyWebsite = companyWebsite;
    user.phone = phone;
    user.location = location;
    user.verificationStatus = 'pending';

    await user.save();

    res.json({
      message: 'Successfully upgraded to stakeholder',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyName: user.companyName,
        verificationStatus: user.verificationStatus
      }
    });
  } catch (err) {
    console.error('❌ UPGRADE ERROR:', err);
    res.status(500).json({ message: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    console.log('🔐 LOGIN ATTEMPT:', req.body.email);
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      console.log('❌ User not found:', email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    console.log('👤 User found:', user.name, 'ID:', user._id);
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      console.log('❌ Invalid password');
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    console.log('✅ LOGIN SUCCESS - Token generated (first 20 chars):', token.substring(0, 20));
    console.log('Token payload will contain userId:', user._id);
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error('❌ LOGIN ERROR:', err);
    res.status(500).json({ message: err.message });
  }
});

// Google Sign-In endpoint
router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;
    
    // Verify Google token (you'll need to install google-auth-library)
    // For now, we'll decode the JWT to get user info
    // In production, you should verify the token with Google's API
    const base64Url = credential.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(Buffer.from(base64, 'base64').toString());
    
    const { email, name, picture, sub: googleId } = payload;
    
    // Check if user exists
    let user = await User.findOne({ email });
    
    if (!user) {
      // Create new user with Google info
      user = await User.create({
        name,
        email,
        password: await bcrypt.hash(googleId + process.env.JWT_SECRET || 'secret', 10), // Random password
        googleId,
        picture
      });
    }
    
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Forgot password - request reset token
router.post('/forgot-password', async (req, res) => {
  console.log('🔵 === FORGOT PASSWORD REQUEST STARTED ===');
  console.log('📥 Request body:', req.body);
  
  try {
    const { email } = req.body;
    console.log('📧 Extracted email:', email);
    
    if (!email) {
      console.log('❌ No email provided');
      return res.status(400).json({ message: 'Email is required' });
    }
    
    console.log('🔍 Searching for user with email:', email);
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log('❌ User not found for email:', email);
      return res.status(404).json({ message: 'No account with that email found' });
    }
    
    console.log('✅ User found:', user.name, '| ID:', user._id);
    
    // Generate reset token
    console.log('🔐 Generating reset token...');
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    console.log('✅ Reset token generated (first 10 chars):', resetToken.substring(0, 10));
    
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    console.log('💾 Saving user with reset token...');
    await user.save();
    console.log('✅ User saved with reset token');
    
    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;
    console.log('🔗 Reset URL created:', resetUrl);
    
    // Send email via EmailJS Node.js SDK
    console.log('📬 Preparing to send email via EmailJS...');
    console.log('EmailJS Config:', {
      serviceId: EMAILJS_SERVICE_ID,
      templateId: EMAILJS_TEMPLATE_ID,
      publicKey: EMAILJS_PUBLIC_KEY ? '✅ Set' : '❌ Missing',
      privateKey: EMAILJS_PRIVATE_KEY ? '✅ Set' : '❌ Missing'
    });
    
    try {
      const templateParams = {
        to_email: email,
        email: email,
        link: resetUrl,
        to_name: user.name
      };
      console.log('📝 Template params:', templateParams);

      console.log('📧 Calling EmailJS REST API...');
      
      // Use EmailJS REST API directly - following documentation
      // IMPORTANT: Include accessToken (private key) for server-side calls
      const emailData = {
        service_id: EMAILJS_SERVICE_ID,
        template_id: EMAILJS_TEMPLATE_ID,
        user_id: EMAILJS_PUBLIC_KEY,
        accessToken: EMAILJS_PRIVATE_KEY,  // Add private key for strict mode
        template_params: templateParams
      };
      
      console.log('📤 Sending POST to EmailJS API with private key...');
      const response = await axios.post(
        'https://api.emailjs.com/api/v1.0/email/send',
        JSON.stringify(emailData),
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('✅ EmailJS Response:', response.status, response.data);
      console.log('✅ Password reset email sent successfully!');
      
      res.json({ 
        message: 'Password reset link has been sent to your email. Please check your inbox.'
      });
      console.log('🔵 === FORGOT PASSWORD REQUEST COMPLETED SUCCESSFULLY ===');
    } catch (emailError) {
      console.error('❌ === EMAILJS ERROR CAUGHT ===');
      console.error('Error name:', emailError.name);
      console.error('Error message:', emailError.message);
      console.error('Error stack:', emailError.stack);
      
      if (emailError.response) {
        console.error('Response status:', emailError.response.status);
        console.error('Response data:', emailError.response.data);
        console.error('Response headers:', emailError.response.headers);
      }
      
      if (emailError.text) {
        console.error('Error text:', emailError.text);
      }
      
      console.error('Full error object:', JSON.stringify(emailError, null, 2));
      
      // Still save the token even if email fails, for development
      res.status(500).json({ 
        message: 'Failed to send email. Please try again later.',
        error: emailError.message,
        details: emailError.text || 'No additional details',
        // In development, include the reset URL
        resetUrl: resetUrl
      });
      console.log('🔵 === FORGOT PASSWORD REQUEST COMPLETED WITH EMAIL ERROR ===');
    }
  } catch (err) {
    console.error('❌ === FORGOT PASSWORD OUTER ERROR ===');
    console.error('Error name:', err.name);
    console.error('Error message:', err.message);
    console.error('Error stack:', err.stack);
    res.status(500).json({ 
      message: err.message,
      error: 'Server error occurred'
    });
    console.log('🔵 === FORGOT PASSWORD REQUEST FAILED ===');
  }
});

// Reset password with token
router.post('/reset-password/:token', async (req, res) => {
  try {
    const { password } = req.body;
    
    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    
    // Hash the token from URL
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    
    // Find user with valid token
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }
    
    // Update password
    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    
    res.json({ message: 'Password reset successful. You can now login with your new password.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
