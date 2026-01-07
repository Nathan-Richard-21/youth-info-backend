const express = require('express');
const router = express.Router();
const { auth } = require('../utils/authMiddleware');
const Opportunity = require('../models/Opportunity');
const Application = require('../models/Application');
const User = require('../models/User');

// Middleware to check if user is stakeholder
const isStakeholder = async (req, res, next) => {
  if (req.user.role !== 'stakeholder' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Stakeholders only.' });
  }
  next();
};

// Get stakeholder's opportunities
router.get('/opportunities', auth, isStakeholder, async (req, res) => {
  try {
    const opportunities = await Opportunity.find({ createdBy: req.user.id })
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name email companyName');

    res.json(opportunities);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get applications for a specific opportunity
router.get('/applications/:opportunityId', auth, isStakeholder, async (req, res) => {
  try {
    const opportunity = await Opportunity.findById(req.params.opportunityId);
    
    if (!opportunity) {
      return res.status(404).json({ message: 'Opportunity not found' });
    }

    // Check if stakeholder owns this opportunity
    if (opportunity.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const applications = await Application.find({ opportunity: req.params.opportunityId })
      .populate('user', 'name email phone location educationLevel employmentStatus cvUrl')
      .sort({ createdAt: -1 });

    res.json(applications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single application details
router.get('/application/:applicationId', auth, isStakeholder, async (req, res) => {
  try {
    const application = await Application.findById(req.params.applicationId)
      .populate('user', 'name email phone location educationLevel employmentStatus skills cvUrl cvFileName')
      .populate('opportunity', 'title organization category');

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Verify stakeholder owns the opportunity
    const opportunity = await Opportunity.findById(application.opportunity._id);
    if (opportunity.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(application);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update application status
router.put('/application/:applicationId/status', auth, isStakeholder, async (req, res) => {
  try {
    const { status, notes } = req.body;
    
    const application = await Application.findById(req.params.applicationId)
      .populate('opportunity');

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Verify stakeholder owns the opportunity
    const opportunity = await Opportunity.findById(application.opportunity._id);
    if (opportunity.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    application.status = status;
    if (notes) application.notes = notes;
    application.reviewedBy = req.user.id;
    application.reviewedAt = new Date();

    await application.save();

    res.json({ message: 'Application status updated', application });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add notes to application
router.post('/application/:applicationId/notes', auth, isStakeholder, async (req, res) => {
  try {
    const { notes } = req.body;
    
    const application = await Application.findById(req.params.applicationId)
      .populate('opportunity');

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Verify stakeholder owns the opportunity
    const opportunity = await Opportunity.findById(application.opportunity._id);
    if (opportunity.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    application.notes = notes;
    await application.save();

    res.json({ message: 'Notes added', application });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get stakeholder analytics
router.get('/analytics', auth, isStakeholder, async (req, res) => {
  try {
    const opportunities = await Opportunity.find({ createdBy: req.user.id });
    const opportunityIds = opportunities.map(opp => opp._id);

    const applications = await Application.find({ 
      opportunity: { $in: opportunityIds } 
    });

    const analytics = {
      totalOpportunities: opportunities.length,
      activeOpportunities: opportunities.filter(o => o.status === 'approved').length,
      totalApplications: applications.length,
      pendingApplications: applications.filter(a => a.status === 'pending').length,
      approvedApplications: applications.filter(a => a.status === 'approved').length,
      rejectedApplications: applications.filter(a => a.status === 'rejected').length,
      totalViews: opportunities.reduce((sum, opp) => sum + (opp.views || 0), 0),
      
      // Status breakdown for charts
      statusBreakdown: {
        pending: applications.filter(a => a.status === 'pending').length,
        approved: applications.filter(a => a.status === 'approved').length,
        rejected: applications.filter(a => a.status === 'rejected').length,
        'under-review': applications.filter(a => a.status === 'under-review').length,
        shortlisted: applications.filter(a => a.status === 'shortlisted').length,
        interviewed: applications.filter(a => a.status === 'interviewed').length
      },
      
      // Application breakdown by opportunity
      opportunityBreakdown: opportunities.map(opp => ({
        id: opp._id,
        title: opp.title,
        applications: applications.filter(a => a.opportunity.toString() === opp._id.toString()).length,
        views: opp.views || 0,
        status: opp.status
      })),

      // Recent applications (last 7 days)
      recentApplications: applications.filter(a => {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return new Date(a.createdAt) > weekAgo;
      }).length
    };

    res.json(analytics);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create opportunity with internal application
router.post('/opportunities', auth, isStakeholder, async (req, res) => {
  try {
    const opportunityData = {
      ...req.body,
      createdBy: req.user.id,
      status: 'pending' // Admin will approve
    };

    const opportunity = new Opportunity(opportunityData);
    await opportunity.save();

    res.status(201).json(opportunity);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update opportunity
router.put('/opportunities/:id', auth, isStakeholder, async (req, res) => {
  try {
    const opportunity = await Opportunity.findById(req.params.id);

    if (!opportunity) {
      return res.status(404).json({ message: 'Opportunity not found' });
    }

    if (opportunity.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    Object.assign(opportunity, req.body);
    opportunity.updatedBy = req.user.id;
    
    await opportunity.save();

    res.json(opportunity);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete opportunity
router.delete('/opportunities/:id', auth, isStakeholder, async (req, res) => {
  try {
    const opportunity = await Opportunity.findById(req.params.id);

    if (!opportunity) {
      return res.status(404).json({ message: 'Opportunity not found' });
    }

    if (opportunity.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    await opportunity.deleteOne();

    res.json({ message: 'Opportunity deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
