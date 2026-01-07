const express = require('express');
const router = express.Router();
const { auth, isAdmin } = require('../utils/authMiddleware');
const User = require('../models/User');
const Opportunity = require('../models/Opportunity');
const Application = require('../models/Application');
const Report = require('../models/Report');
const OpenAI = require('openai');

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ============ DASHBOARD STATS ============
router.get('/stats', auth, isAdmin, async (req, res) => {
  try {
    const [
      totalUsers, 
      totalOpportunities, 
      pendingApprovals, 
      activeReports,
      usersByRole,
      opportunitiesByCategory,
      opportunitiesByStatus,
      recentApplications
    ] = await Promise.all([
      User.countDocuments(),
      Opportunity.countDocuments(),
      Opportunity.countDocuments({ status: 'pending' }),
      Report.countDocuments({ status: { $in: ['pending', 'under-review'] } }),
      // Users by role for pie chart
      User.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } }
      ]),
      // Opportunities by category for pie chart
      Opportunity.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } }
      ]),
      // Opportunities by status for pie chart
      Opportunity.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      // Recent applications count (last 30 days)
      Application.countDocuments({ 
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } 
      })
    ]);
    
    res.json({
      totalUsers,
      totalOpportunities,
      pendingApprovals,
      activeReports,
      recentApplications,
      usersByRole: usersByRole.map(r => ({ name: r._id || 'user', value: r.count })),
      opportunitiesByCategory: opportunitiesByCategory.map(c => ({ name: c._id, value: c.count })),
      opportunitiesByStatus: opportunitiesByStatus.map(s => ({ name: s._id, value: s.count }))
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ============ USER MANAGEMENT ============
router.get('/users', auth, isAdmin, async (req, res) => {
  try {
    const { search, role, page = 1, limit = 50 } = req.query;
    const query = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (role && role !== 'all') {
      query.role = role;
    }
    
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const count = await User.countDocuments(query);
    
    res.json({
      users,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/users/:id', auth, isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    // Get user's applications and saved items
    const [applications, savedCount] = await Promise.all([
      Application.find({ user: req.params.id }).populate('opportunity', 'title category'),
      user.savedOpportunities.length
    ]);
    
    res.json({ user, applications, savedCount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch('/users/:id/suspend', auth, isAdmin, async (req, res) => {
  try {
    const { reason } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { 
        isSuspended: true, 
        suspensionReason: reason,
        isActive: false 
      },
      { new: true }
    ).select('-password');
    
    res.json({ message: 'User suspended', user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch('/users/:id/activate', auth, isAdmin, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { 
        isSuspended: false, 
        suspensionReason: null,
        isActive: true 
      },
      { new: true }
    ).select('-password');
    
    res.json({ message: 'User activated', user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update user role (ADMIN ONLY)
router.patch('/users/:id/role', auth, isAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    
    // Validate role
    const validRoles = ['user', 'stakeholder', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ 
        message: 'Invalid role. Must be: user, stakeholder, or admin' 
      });
    }
    
    // Don't allow changing your own role
    if (req.params.id === req.user.id) {
      return res.status(403).json({ 
        message: 'Cannot change your own role' 
      });
    }
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    console.log(`✅ User role updated: ${user.email} → ${role} (by ${req.user.email})`);
    
    res.json({ 
      message: `User role updated to ${role}`, 
      user 
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update stakeholder verification status (ADMIN ONLY)
router.patch('/users/:id/verification', auth, isAdmin, async (req, res) => {
  try {
    const { verificationStatus } = req.body;
    
    // Validate verification status
    const validStatuses = ['pending', 'verified', 'rejected'];
    if (!validStatuses.includes(verificationStatus)) {
      return res.status(400).json({ 
        message: 'Invalid verification status. Must be: pending, verified, or rejected' 
      });
    }
    
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Only allow verification for stakeholders
    if (user.role !== 'stakeholder') {
      return res.status(400).json({ 
        message: 'Verification status can only be set for stakeholder accounts' 
      });
    }
    
    user.verificationStatus = verificationStatus;
    await user.save();
    
    console.log(`✅ Stakeholder verification updated: ${user.email} → ${verificationStatus} (by ${req.user.email})`);
    
    res.json({ 
      message: `Stakeholder ${verificationStatus === 'verified' ? 'approved' : verificationStatus === 'rejected' ? 'rejected' : 'status updated'}`, 
      user 
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/users/:id', auth, isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    // Don't allow deleting other admins
    if (user.role === 'admin' && req.user.id !== req.params.id) {
      return res.status(403).json({ message: 'Cannot delete admin users' });
    }
    
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ============ OPPORTUNITY MANAGEMENT ============
router.get('/opportunities', auth, isAdmin, async (req, res) => {
  try {
    const { search, status, category, page = 1, limit = 50 } = req.query;
    const query = {};
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { organization: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (category && category !== 'all') {
      query.category = category;
    }
    
    const opportunities = await Opportunity.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const count = await Opportunity.countDocuments(query);
    
    res.json({
      opportunities,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/opportunities/:id', auth, isAdmin, async (req, res) => {
  try {
    const opportunity = await Opportunity.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');
    
    if (!opportunity) return res.status(404).json({ message: 'Opportunity not found' });
    
    res.json(opportunity);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/opportunities', auth, isAdmin, async (req, res) => {
  try {
    const opportunityData = {
      ...req.body,
      createdBy: req.user.id,
      status: 'approved' // Admin posts are auto-approved
    };
    
    const opportunity = new Opportunity(opportunityData);
    await opportunity.save();
    
    res.status(201).json({ message: 'Opportunity created', opportunity });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/opportunities/:id', auth, isAdmin, async (req, res) => {
  try {
    const opportunity = await Opportunity.findByIdAndUpdate(
      req.params.id,
      { 
        ...req.body, 
        updatedBy: req.user.id 
      },
      { new: true, runValidators: true }
    );
    
    if (!opportunity) return res.status(404).json({ message: 'Opportunity not found' });
    
    res.json({ message: 'Opportunity updated', opportunity });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.patch('/opportunities/:id', auth, isAdmin, async (req, res) => {
  try {
    const { status, rejectionReason, featured, urgent } = req.body;
    const update = { updatedBy: req.user.id };
    
    if (status) update.status = status;
    if (rejectionReason) update.rejectionReason = rejectionReason;
    if (typeof featured === 'boolean') update.featured = featured;
    if (typeof urgent === 'boolean') update.urgent = urgent;
    
    const opportunity = await Opportunity.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true }
    );
    
    if (!opportunity) return res.status(404).json({ message: 'Opportunity not found' });
    
    res.json({ message: 'Opportunity updated', opportunity });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Approve opportunity
router.post('/opportunities/:id/approve', auth, isAdmin, async (req, res) => {
  try {
    const opportunity = await Opportunity.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'approved',
        updatedBy: req.user.id 
      },
      { new: true }
    );
    
    if (!opportunity) return res.status(404).json({ message: 'Opportunity not found' });
    
    res.json({ message: 'Opportunity approved', opportunity });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Reject opportunity
router.post('/opportunities/:id/reject', auth, isAdmin, async (req, res) => {
  try {
    const { rejectionReason } = req.body;
    const opportunity = await Opportunity.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'rejected',
        rejectionReason: rejectionReason || 'No reason provided',
        updatedBy: req.user.id 
      },
      { new: true }
    );
    
    if (!opportunity) return res.status(404).json({ message: 'Opportunity not found' });
    
    res.json({ message: 'Opportunity rejected', opportunity });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// AI Fraud Detection
router.post('/opportunities/:id/fraud-check', auth, isAdmin, async (req, res) => {
  try {
    const opportunity = await Opportunity.findById(req.params.id)
      .populate('createdBy', 'name email');
    
    if (!opportunity) return res.status(404).json({ message: 'Opportunity not found' });
    
    console.log(`🔍 Fraud check requested for: ${opportunity.title} (by ${req.user.email})`);
    
    // Check if OpenAI is configured
    if (!process.env.OPENAI_API_KEY) {
      console.log('⚠️ OpenAI API key not configured, using rule-based detection');
      
      // Fallback: Rule-based fraud detection
      const fraudIndicators = analyzeFraudIndicators(opportunity);
      
      return res.json({
        riskLevel: fraudIndicators.riskLevel,
        riskScore: fraudIndicators.score,
        flags: fraudIndicators.flags,
        analysis: fraudIndicators.summary,
        recommendations: fraudIndicators.recommendations,
        usedAI: false
      });
    }
    
    try {
      // Use AI for advanced fraud detection
      const prompt = `Analyze this job/opportunity posting for potential fraud or scam indicators. Provide a detailed analysis.

Title: ${opportunity.title}
Organization: ${opportunity.organization}
Category: ${opportunity.category}
Description: ${opportunity.description}
Requirements: ${opportunity.requirements || 'N/A'}
Application Method: ${opportunity.applicationMethod}
${opportunity.applicationLink ? `Application Link: ${opportunity.applicationLink}` : ''}
${opportunity.contactEmail ? `Contact Email: ${opportunity.contactEmail}` : ''}
${opportunity.contactPhone ? `Contact Phone: ${opportunity.contactPhone}` : ''}
Location: ${opportunity.location || 'N/A'}
Deadline: ${opportunity.deadline || 'N/A'}

Analyze for:
1. Unrealistic promises (too good to be true)
2. Request for upfront payments or fees
3. Poor grammar, spelling errors
4. Vague or unprofessional descriptions
5. Suspicious contact information
6. Missing or fake organization details
7. Urgent/pressure tactics
8. Lack of legitimate application process
9. Red flags in requirements or qualifications

Provide:
- Risk Level: LOW, MEDIUM, or HIGH
- Risk Score: 0-100 (0=legitimate, 100=definite scam)
- Specific Flags: List any concerning elements found
- Analysis: Brief explanation of findings
- Recommendations: What admin should verify or investigate

Format your response as JSON:
{
  "riskLevel": "LOW/MEDIUM/HIGH",
  "riskScore": 0-100,
  "flags": ["flag1", "flag2", ...],
  "analysis": "detailed analysis text",
  "recommendations": ["recommendation1", "recommendation2", ...]
}`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert fraud detection analyst specializing in identifying job scams, fake opportunities, and fraudulent postings. Analyze opportunities for South African youth and provide detailed, actionable fraud risk assessments.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 800,
        temperature: 0.3, // Lower temperature for more consistent, factual analysis
      });

      const aiResponse = completion.choices[0].message.content;
      console.log('✅ AI fraud analysis completed');
      
      // Try to parse JSON response
      let fraudAnalysis;
      try {
        // Extract JSON from response (in case AI adds extra text)
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          fraudAnalysis = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in response');
        }
      } catch (parseError) {
        console.log('⚠️ Failed to parse AI response as JSON, using text response');
        // Fallback: Use rule-based detection
        const fraudIndicators = analyzeFraudIndicators(opportunity);
        fraudAnalysis = {
          riskLevel: fraudIndicators.riskLevel,
          riskScore: fraudIndicators.score,
          flags: fraudIndicators.flags,
          analysis: aiResponse, // Use AI text even if not JSON
          recommendations: fraudIndicators.recommendations
        };
      }
      
      res.json({
        ...fraudAnalysis,
        usedAI: true,
        model: 'gpt-4'
      });
      
    } catch (aiError) {
      console.error('❌ AI fraud detection error:', aiError.message);
      
      // Fallback to rule-based detection
      const fraudIndicators = analyzeFraudIndicators(opportunity);
      
      res.json({
        riskLevel: fraudIndicators.riskLevel,
        riskScore: fraudIndicators.score,
        flags: fraudIndicators.flags,
        analysis: fraudIndicators.summary,
        recommendations: fraudIndicators.recommendations,
        usedAI: false,
        error: 'AI analysis unavailable, using rule-based detection'
      });
    }
    
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Rule-based fraud detection (fallback)
function analyzeFraudIndicators(opportunity) {
  const flags = [];
  let score = 0;
  
  // Check for common scam keywords
  const scamKeywords = [
    'easy money', 'work from home', 'no experience needed', 'guaranteed income',
    'make money fast', 'limited time', 'act now', 'urgent', 'western union',
    'money transfer', 'processing fee', 'registration fee', 'application fee',
    'training fee', 'deposit required', 'pay upfront', 'bitcoin', 'cryptocurrency'
  ];
  
  const textToCheck = `${opportunity.title} ${opportunity.description} ${opportunity.requirements || ''}`.toLowerCase();
  
  scamKeywords.forEach(keyword => {
    if (textToCheck.includes(keyword)) {
      flags.push(`Suspicious keyword detected: "${keyword}"`);
      score += 15;
    }
  });
  
  // Check for missing critical information
  if (!opportunity.organization || opportunity.organization.length < 3) {
    flags.push('Missing or incomplete organization name');
    score += 20;
  }
  
  if (!opportunity.contactEmail && !opportunity.contactPhone && !opportunity.applicationLink) {
    flags.push('No valid contact information provided');
    score += 25;
  }
  
  // Check for suspicious email domains
  if (opportunity.contactEmail) {
    const suspiciousDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
    const emailDomain = opportunity.contactEmail.split('@')[1]?.toLowerCase();
    if (suspiciousDomains.includes(emailDomain)) {
      flags.push('Using personal email instead of company domain');
      score += 10;
    }
  }
  
  // Check description quality
  if (opportunity.description && opportunity.description.length < 100) {
    flags.push('Very short or vague description');
    score += 10;
  }
  
  // Check for ALL CAPS (common in scams)
  if (opportunity.title === opportunity.title.toUpperCase() && opportunity.title.length > 10) {
    flags.push('Title in ALL CAPS (aggressive marketing)');
    score += 5;
  }
  
  // Check for unrealistic salary/benefits promises
  const unrealisticPhrases = ['high salary', 'earn thousands', 'luxury', 'millionaire', 'get rich'];
  unrealisticPhrases.forEach(phrase => {
    if (textToCheck.includes(phrase)) {
      flags.push(`Unrealistic promise detected: "${phrase}"`);
      score += 15;
    }
  });
  
  // Determine risk level
  let riskLevel = 'LOW';
  if (score >= 50) riskLevel = 'HIGH';
  else if (score >= 25) riskLevel = 'MEDIUM';
  
  // Generate recommendations
  const recommendations = [];
  if (score > 0) {
    recommendations.push('Verify organization legitimacy through official channels');
    recommendations.push('Check if organization has official website and social media presence');
    recommendations.push('Contact organization directly using publicly listed contact information');
  }
  if (flags.some(f => f.includes('fee') || f.includes('payment'))) {
    recommendations.push('⚠️ WARNING: Legitimate opportunities never require upfront payment');
  }
  if (flags.some(f => f.includes('email'))) {
    recommendations.push('Verify the contact email matches the organization\'s official domain');
  }
  
  return {
    riskLevel,
    score: Math.min(score, 100),
    flags: flags.length > 0 ? flags : ['No obvious red flags detected'],
    summary: flags.length > 0 
      ? `Found ${flags.length} potential concern(s). Manual verification recommended.`
      : 'No obvious fraud indicators detected. Appears legitimate but always verify independently.',
    recommendations: recommendations.length > 0 ? recommendations : ['Standard verification: Check organization background and credentials']
  };
}

router.delete('/opportunities/:id', auth, isAdmin, async (req, res) => {
  try {
    const opportunity = await Opportunity.findByIdAndDelete(req.params.id);
    if (!opportunity) return res.status(404).json({ message: 'Opportunity not found' });
    
    res.json({ message: 'Opportunity deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ============ REPORT MANAGEMENT ============
router.get('/reports', auth, isAdmin, async (req, res) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;
    const query = {};
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    const reports = await Report.find(query)
      .populate('reportedBy', 'name email')
      .populate('resolvedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const count = await Report.countDocuments(query);
    
    res.json({
      reports,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch('/reports/:id/resolve', auth, isAdmin, async (req, res) => {
  try {
    const { resolution, actionTaken } = req.body;
    
    const report = await Report.findByIdAndUpdate(
      req.params.id,
      {
        status: 'resolved',
        resolvedBy: req.user.id,
        resolvedAt: new Date(),
        resolution,
        actionTaken
      },
      { new: true }
    );
    
    if (!report) return res.status(404).json({ message: 'Report not found' });
    
    res.json({ message: 'Report resolved', report });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch('/reports/:id/dismiss', auth, isAdmin, async (req, res) => {
  try {
    const { resolution } = req.body;
    
    const report = await Report.findByIdAndUpdate(
      req.params.id,
      {
        status: 'dismissed',
        resolvedBy: req.user.id,
        resolvedAt: new Date(),
        resolution
      },
      { new: true }
    );
    
    if (!report) return res.status(404).json({ message: 'Report not found' });
    
    res.json({ message: 'Report dismissed', report });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ============ APPLICATIONS MANAGEMENT ============
router.get('/applications', auth, isAdmin, async (req, res) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;
    const query = {};
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    const applications = await Application.find(query)
      .populate('user', 'name email')
      .populate('opportunity', 'title category')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const count = await Application.countDocuments(query);
    
    res.json({
      applications,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
