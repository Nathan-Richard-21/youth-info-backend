const express = require('express');
const router = express.Router();
const WhatsAppSubmission = require('../models/WhatsAppSubmission');
const Opportunity = require('../models/Opportunity');
const { auth, isAdmin } = require('../middleware/auth');

// Get all WhatsApp submissions (admin only)
router.get('/submissions', auth, isAdmin, async (req, res) => {
  try {
    const { status, category, page = 1, limit = 20 } = req.query;
    
    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;

    const submissions = await WhatsAppSubmission.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('reviewedBy', 'name email')
      .populate('opportunityId', 'title');

    const count = await WhatsAppSubmission.countDocuments(filter);

    res.json({
      submissions,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    console.error('Error fetching submissions:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single submission
router.get('/submissions/:id', auth, isAdmin, async (req, res) => {
  try {
    const submission = await WhatsAppSubmission.findById(req.params.id)
      .populate('reviewedBy', 'name email')
      .populate('opportunityId');

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    res.json(submission);
  } catch (error) {
    console.error('Error fetching submission:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update submission parsed data (admin can edit before approval)
router.put('/submissions/:id/parse', auth, isAdmin, async (req, res) => {
  try {
    const { parsedData } = req.body;

    const submission = await WhatsAppSubmission.findByIdAndUpdate(
      req.params.id,
      { parsedData },
      { new: true }
    );

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    res.json(submission);
  } catch (error) {
    console.error('Error updating parsed data:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Approve submission and create opportunity
router.post('/submissions/:id/approve', auth, isAdmin, async (req, res) => {
  try {
    const submission = await WhatsAppSubmission.findById(req.params.id);

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    if (submission.status !== 'pending') {
      return res.status(400).json({ message: 'Submission already processed' });
    }

    // Create opportunity from submission
    const opportunityData = {
      title: submission.parsedData?.title || `Opportunity from ${submission.senderName}`,
      description: submission.parsedData?.description || submission.messageContent,
      category: submission.category,
      organization: submission.parsedData?.organization || submission.senderName,
      contactEmail: submission.parsedData?.contactEmail || '',
      contactPhone: submission.parsedData?.contactPhone || submission.senderPhone,
      website: submission.parsedData?.website || '',
      location: submission.parsedData?.location || 'Eastern Cape',
      requirements: submission.parsedData?.requirements || [],
      deadline: submission.parsedData?.deadline || null,
      amount: submission.parsedData?.amount || null,
      status: 'active',
      source: 'whatsapp',
      postedBy: req.userId
    };

    const opportunity = new Opportunity(opportunityData);
    await opportunity.save();

    // Update submission status
    submission.status = 'approved';
    submission.opportunityId = opportunity._id;
    submission.reviewedBy = req.userId;
    submission.reviewedAt = new Date();
    submission.reviewNotes = req.body.notes || '';
    await submission.save();

    res.json({
      message: 'Submission approved and opportunity created',
      submission,
      opportunity
    });
  } catch (error) {
    console.error('Error approving submission:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reject submission
router.post('/submissions/:id/reject', auth, isAdmin, async (req, res) => {
  try {
    const submission = await WhatsAppSubmission.findById(req.params.id);

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    if (submission.status !== 'pending') {
      return res.status(400).json({ message: 'Submission already processed' });
    }

    submission.status = 'rejected';
    submission.reviewedBy = req.userId;
    submission.reviewedAt = new Date();
    submission.reviewNotes = req.body.notes || '';
    await submission.save();

    res.json({
      message: 'Submission rejected',
      submission
    });
  } catch (error) {
    console.error('Error rejecting submission:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete submission
router.delete('/submissions/:id', auth, isAdmin, async (req, res) => {
  try {
    const submission = await WhatsAppSubmission.findByIdAndDelete(req.params.id);

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    res.json({ message: 'Submission deleted' });
  } catch (error) {
    console.error('Error deleting submission:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get submission statistics
router.get('/submissions/stats/overview', auth, isAdmin, async (req, res) => {
  try {
    const stats = await WhatsAppSubmission.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const categoryStats = await WhatsAppSubmission.aggregate([
      {
        $match: { status: 'pending' }
      },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      byStatus: stats,
      pendingByCategory: categoryStats
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
