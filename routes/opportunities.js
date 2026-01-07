const express = require('express');
const router = express.Router();
const { auth } = require('../utils/authMiddleware');
const Opportunity = require('../models/Opportunity');
const Application = require('../models/Application');

// Get all approved opportunities (public route)
router.get('/', async (req, res) => {
  try {
    const { 
      category, 
      subcategory,
      location, 
      search, 
      featured,
      createdBy,
      page = 1, 
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    // If createdBy is specified, don't filter by status (user wants to see all their posts)
    const filter = createdBy ? { createdBy } : { 
      status: 'approved',
      // Only show opportunities that haven't expired
      $or: [
        { closingDate: { $gte: new Date() } },
        { closingDate: { $exists: false } }
      ]
    };
    
    if (category && category !== 'all') {
      filter.category = category;
    }
    
    if (subcategory) {
      filter.subcategory = subcategory;
    }
    
    if (location) {
      filter.location = { $regex: location, $options: 'i' };
    }
    
    if (featured === 'true') {
      filter.featured = true;
    }
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { organization: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    const opportunities = await Opportunity.find(filter)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-__v');
    
    const count = await Opportunity.countDocuments(filter);
    
    res.json({
      opportunities,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      total: count
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single opportunity by ID
router.get('/:id', async (req, res) => {
  try {
    const opportunity = await Opportunity.findById(req.params.id);
    
    if (!opportunity) {
      return res.status(404).json({ message: 'Opportunity not found' });
    }
    
    // Increment view count
    opportunity.views += 1;
    await opportunity.save();
    
    res.json(opportunity);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create opportunity (requires auth)
router.post('/', auth, async (req, res) => {
  try {
    console.log('\n========================================');
    console.log('📝 CREATE OPPORTUNITY REQUEST');
    console.log('========================================');
    
    // Check if user exists (auth middleware should have set this)
    console.log('🔍 Checking req.user:', req.user ? 'EXISTS' : 'NULL');
    
    if (!req.user) {
      console.error('❌ req.user is null - auth middleware failed!');
      console.error('This should never happen if auth middleware ran');
      return res.status(500).json({ 
        message: 'Internal server error: User not attached to request' 
      });
    }
    
    console.log('✅ User authenticated:');
    console.log('  - Name:', req.user.name);
    console.log('  - Email:', req.user.email);
    console.log('  - ID (_id):', req.user._id);
    console.log('  - Role:', req.user.role);
    
    console.log('\n📦 Request Body:');
    console.log(JSON.stringify(req.body, null, 2));
    
    // Determine status based on user role
    let status = 'pending'; // Default: pending for approval
    if (req.user.role === 'admin') {
      status = 'approved'; // Admins auto-approve their posts
      console.log('👑 User is admin - auto-approving');
    } else {
      console.log('👤 User is regular user - pending approval');
    }
    
    const opportunityData = {
      ...req.body,
      createdBy: req.user._id,
      status: status
    };
    
    console.log('\n💾 Creating opportunity with data:');
    console.log(JSON.stringify(opportunityData, null, 2));
    
    const opportunity = new Opportunity(opportunityData);
    const saved = await opportunity.save();
    
    console.log('✅ Opportunity created successfully!');
    console.log('  - ID:', saved._id);
    console.log('  - Title:', saved.title);
    console.log('  - Status:', saved.status);
    console.log('========================================\n');
    
    res.status(201).json({ 
      message: status === 'approved' 
        ? 'Opportunity created successfully' 
        : 'Opportunity submitted for admin approval', 
      opportunity: saved
    });
  } catch (err) {
    console.error('\n❌❌❌ CREATE OPPORTUNITY ERROR ❌❌❌');
    console.error('Error message:', err.message);
    console.error('Error name:', err.name);
    console.error('Error stack:', err.stack);
    
    if (err.errors) {
      console.error('\n📋 Validation errors:');
      Object.keys(err.errors).forEach(key => {
        console.error(`  - ${key}:`, err.errors[key].message);
      });
    }
    
    console.error('========================================\n');
    
    res.status(400).json({ 
      message: err.message,
      errors: err.errors,
      details: err.errors ? Object.keys(err.errors).map(k => ({
        field: k,
        message: err.errors[k].message
      })) : undefined
    });
  }
});

// Update opportunity (requires auth and ownership)
router.put('/:id', auth, async (req, res) => {
  try {
    const opportunity = await Opportunity.findById(req.params.id);
    
    if (!opportunity) {
      return res.status(404).json({ message: 'Opportunity not found' });
    }
    
    // Check if user owns this opportunity
    if (opportunity.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to edit this opportunity' });
    }
    
    const updated = await Opportunity.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedBy: req.user.id },
      { new: true, runValidators: true }
    );
    
    res.json({ message: 'Opportunity updated', opportunity: updated });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete opportunity (requires auth and ownership)
router.delete('/:id', auth, async (req, res) => {
  try {
    const opportunity = await Opportunity.findById(req.params.id);
    
    if (!opportunity) {
      return res.status(404).json({ message: 'Opportunity not found' });
    }
    
    // Check if user owns this opportunity
    if (opportunity.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this opportunity' });
    }
    
    await Opportunity.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Opportunity deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Save/bookmark opportunity
router.post('/:id/save', auth, async (req, res) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.user.id);
    
    if (!user.savedOpportunities.includes(req.params.id)) {
      user.savedOpportunities.push(req.params.id);
      await user.save();
    }
    
    res.json({ message: 'Opportunity saved' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Unsave/unbookmark opportunity
router.delete('/:id/save', auth, async (req, res) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.user.id);
    
    user.savedOpportunities = user.savedOpportunities.filter(
      id => id.toString() !== req.params.id
    );
    await user.save();
    
    res.json({ message: 'Opportunity removed from saved' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Apply to opportunity
router.post('/:id/apply', auth, async (req, res) => {
  try {
    const opportunity = await Opportunity.findById(req.params.id);
    
    if (!opportunity) {
      return res.status(404).json({ message: 'Opportunity not found' });
    }
    
    if (opportunity.status !== 'approved') {
      return res.status(400).json({ message: 'This opportunity is not available for applications' });
    }
    
    // Check if user already applied
    const existingApplication = await Application.findOne({
      user: req.user.id,
      opportunity: req.params.id
    });
    
    if (existingApplication) {
      return res.status(400).json({ message: 'You have already applied to this opportunity' });
    }
    
    const application = new Application({
      user: req.user.id,
      opportunity: req.params.id,
      ...req.body
    });
    
    await application.save();
    
    // Increment application count
    opportunity.applications += 1;
    await opportunity.save();
    
    res.status(201).json({ 
      message: 'Application submitted successfully', 
      application 
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
