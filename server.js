const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
// const fileUpload = require('express-fileupload'); // DISABLED - Using multer instead

dotenv.config();
console.log('🔑 JWT_SECRET loaded:', process.env.JWT_SECRET ? `${process.env.JWT_SECRET.substring(0, 10)}...` : 'NOT SET!');
const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increase limit and ensure JSON parsing
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Handle URL-encoded data
// DISABLED express-fileupload - Using multer in upload routes instead
// app.use(fileUpload({
//   createParentPath: true,
//   limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
//   abortOnLimit: true
// }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');
const oppRoutes = require('./routes/opportunities');
const chatRoutes = require('./routes/chat');
const applicationRoutes = require('./routes/applications');
const reportRoutes = require('./routes/reports');
const uploadRoutes = require('./routes/upload');
const forumRoutes = require('./routes/forum');
const stakeholderRoutes = require('./routes/stakeholder');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/opportunities', oppRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/forum', forumRoutes);
app.use('/api/stakeholder', stakeholderRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Token verification endpoint
const auth = require('./middleware/auth');
app.get('/api/verify-token', auth, (req, res) => {
  res.json({ 
    valid: true, 
    user: { 
      id: req.user._id, 
      name: req.user.name, 
      email: req.user.email,
      role: req.user.role 
    } 
  });
});

const PORT = process.env.PORT || 5000;
const MONGO = process.env.MONGO_URI || 'mongodb://localhost:27017/youthportal';

mongoose.connect(MONGO, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error('DB connection error', err);
  });
