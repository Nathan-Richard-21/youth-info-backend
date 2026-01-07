const express = require('express');
const router = express.Router();
const { auth } = require('../utils/authMiddleware');
const Report = require('../models/Report');

// Get user's reports
router.get('/my', auth, async (req, res) => {
  try {
    const reports = await Report.find({ reportedBy: req.user.id })
      .sort({ createdAt: -1 });
    
    res.json(reports);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Submit a report
router.post('/', auth, async (req, res) => {
  try {
    const { reportType, reportedItem, reason, description } = req.body;
    
    if (!reportType || !reportedItem || !reason || !description) {
      return res.status(400).json({ 
        message: 'Report type, reported item, reason, and description are required' 
      });
    }
    
    const report = new Report({
      reportedBy: req.user.id,
      reportType,
      reportedItem,
      reason,
      description
    });
    
    await report.save();
    
    res.status(201).json({ 
      message: 'Report submitted successfully. We will review it shortly.', 
      report 
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get single report
router.get('/:id', auth, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('reportedBy', 'name email')
      .populate('resolvedBy', 'name email');
    
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    
    // Check if user owns this report
    if (report.reportedBy._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    res.json(report);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
