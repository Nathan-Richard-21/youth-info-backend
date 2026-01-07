const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const auth = require('../middleware/auth');

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-randomstring-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Accept images only
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const documentFilter = (req, file, cb) => {
  // Accept documents and images
  const allowedTypes = [
    'image/',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain'
  ];
  
  const isAllowed = allowedTypes.some(type => file.mimetype.startsWith(type) || file.mimetype === type);
  
  if (isAllowed) {
    cb(null, true);
  } else {
    cb(new Error('Only documents (PDF, Word, Excel, images, text) are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max file size
  },
  fileFilter: fileFilter
});

const documentUpload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max file size
  },
  fileFilter: documentFilter
});

// @route   POST /api/upload/image
// @desc    Upload single image
// @access  Private (authenticated users)
router.post('/image', auth, upload.single('image'), (req, res) => {
  try {
    console.log('📸 Image upload request received');
    console.log('User:', req.user?.id);
    console.log('File:', req.file);
    
    if (!req.file) {
      console.log('❌ No file in request');
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Return the file URL
    const fileUrl = `/uploads/${req.file.filename}`;
    
    console.log('✅ Image uploaded successfully:', fileUrl);
    
    res.status(200).json({
      message: 'Image uploaded successfully',
      imageUrl: fileUrl,
      url: fileUrl, // Also include 'url' for consistency
      filename: req.file.filename
    });
  } catch (err) {
    console.error('❌ Upload error:', err);
    res.status(500).json({ message: 'Error uploading image', error: err.message });
  }
});

// @route   POST /api/upload/document
// @desc    Upload single document (PDF, Word, Excel, images, text)
// @access  Private (authenticated users)
router.post('/document', auth, documentUpload.single('document'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Return the file URL
    const fileUrl = `/uploads/${req.file.filename}`;
    
    res.status(200).json({
      message: 'Document uploaded successfully',
      url: fileUrl,
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ message: 'Error uploading document', error: err.message });
  }
});

// @route   POST /api/upload/multiple
// @desc    Upload multiple images/documents
// @access  Private (authenticated users)
router.post('/multiple', auth, upload.array('files', 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    // Return array of file URLs
    const fileUrls = req.files.map(file => ({
      url: `/uploads/${file.filename}`,
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype
    }));
    
    res.status(200).json({
      message: 'Files uploaded successfully',
      files: fileUrls
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ message: 'Error uploading files', error: err.message });
  }
});

// @route   DELETE /api/upload/:filename
// @desc    Delete uploaded file
// @access  Private (authenticated users)
router.delete('/:filename', auth, (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(uploadDir, filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Delete the file
    fs.unlinkSync(filePath);

    res.status(200).json({ message: 'File deleted successfully' });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ message: 'Error deleting file', error: err.message });
  }
});

module.exports = router;
