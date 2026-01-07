const express = require('express');
const router = express.Router();
const { auth } = require('../utils/authMiddleware');
const Application = require('../models/Application');
const Opportunity = require('../models/Opportunity');

// Get user's applications
router.get('/my', auth, async (req, res) => {
  try {
    const applications = await Application.find({ user: req.user.id })
      .populate('opportunity', 'title category organization status deadline')
      .sort({ createdAt: -1 });
    
    res.json(applications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single application
router.get('/:id', auth, async (req, res) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate('opportunity', 'title category organization')
      .populate('user', 'name email');
    
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }
    
    // Check if user owns this application
    if (application.user._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    res.json(application);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Submit application
router.post('/', auth, async (req, res) => {
  try {
    console.log('\n=== APPLICATION SUBMISSION DEBUG ===');
    console.log('📝 Raw req.body:', req.body);
    console.log('📝 req.body type:', typeof req.body);
    console.log('📝 req.body constructor:', req.body?.constructor?.name);
    console.log('📝 Request headers:', req.headers);
    console.log('📝 Content-Type:', req.headers['content-type']);
    console.log('📝 Request body keys:', Object.keys(req.body));
    
    console.log('\n--- DOCUMENTS FIELD ANALYSIS ---');
    console.log('📝 req.body.documents:', req.body.documents);
    console.log('📝 Documents field type:', typeof req.body.documents);
    console.log('📝 Documents is array:', Array.isArray(req.body.documents));
    console.log('📝 Documents constructor:', req.body.documents?.constructor?.name);
    
    if (req.body.documents) {
      console.log('📝 Documents length:', req.body.documents.length);
      console.log('📝 Documents[0]:', req.body.documents[0]);
      console.log('📝 Documents[0] type:', typeof req.body.documents[0]);
      console.log('📝 Documents stringified:', JSON.stringify(req.body.documents));
    }
    
    console.log('\n--- ANSWERS FIELD ANALYSIS ---');
    console.log('📝 req.body.answers:', req.body.answers);
    console.log('📝 Answers is array:', Array.isArray(req.body.answers));
    
    console.log('\n--- FULL BODY STRINGIFIED ---');
    console.log('📝 Full body:', JSON.stringify(req.body, null, 2));
    console.log('=================================\n');
    
    // Support both 'opportunityId' and 'opportunity' field names
    const { opportunityId, opportunity, coverLetter, resume, documents, answers } = req.body;
    const oppId = opportunityId || opportunity;
    
    if (!oppId) {
      console.log('❌ Missing opportunityId in request body');
      console.log('Available fields:', Object.keys(req.body));
      return res.status(400).json({ 
        message: 'Opportunity ID is required',
        receivedFields: Object.keys(req.body)
      });
    }
    
    console.log('✅ Opportunity ID found:', oppId);
    
    // Check if opportunity exists and is approved
    const opportunityDoc = await Opportunity.findById(oppId);
    if (!opportunityDoc) {
      console.log('❌ Opportunity not found with ID:', oppId);
      return res.status(404).json({ message: 'Opportunity not found' });
    }
    
    if (opportunityDoc.status !== 'approved') {
      return res.status(400).json({ message: 'This opportunity is not accepting applications' });
    }
    
    // Check if user already applied
    const existingApplication = await Application.findOne({
      user: req.user.id,
      opportunity: oppId
    });
    
    if (existingApplication) {
      return res.status(400).json({ message: 'You have already applied to this opportunity' });
    }
    
    console.log('\n--- CREATING APPLICATION OBJECT ---');
    console.log('💾 user:', req.user.id);
    console.log('💾 opportunity:', oppId);
    console.log('💾 coverLetter:', coverLetter);
    console.log('💾 resume:', resume);
    console.log('💾 documents (before save):', documents);
    console.log('💾 documents type:', typeof documents);
    console.log('💾 documents is array:', Array.isArray(documents));
    console.log('💾 answers:', answers);
    console.log('💾 answers type:', typeof answers);
    console.log('💾 answers is array:', Array.isArray(answers));
    
    const applicationData = {
      user: req.user.id,
      opportunity: oppId,
      coverLetter,
      resume,
      documents,
      answers
    };
    
    console.log('💾 Application data object:', JSON.stringify(applicationData, null, 2));
    
    const application = new Application(applicationData);
    
    console.log('💾 Application instance created:', application);
    console.log('💾 Application.documents:', application.documents);
    console.log('💾 Application.documents is array:', Array.isArray(application.documents));
    
    console.log('💾 Attempting to save...');
    await application.save();
    console.log('✅ Application saved successfully!');
    
    // Increment application count on opportunity
    opportunityDoc.applications += 1;
    await opportunityDoc.save();
    
    console.log('✅ Application created successfully:', application._id);
    
    res.status(201).json({ 
      message: 'Application submitted successfully', 
      application 
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update application (before review)
router.put('/:id', auth, async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);
    
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }
    
    // Check if user owns this application
    if (application.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    // Can only update if still pending
    if (application.status !== 'pending') {
      return res.status(400).json({ message: 'Cannot update application after it has been reviewed' });
    }
    
    const { coverLetter, resume, documents, answers } = req.body;
    
    if (coverLetter) application.coverLetter = coverLetter;
    if (resume) application.resume = resume;
    if (documents) application.documents = documents;
    if (answers) application.answers = answers;
    
    await application.save();
    
    res.json({ message: 'Application updated', application });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Withdraw application
router.delete('/:id', auth, async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);
    
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }
    
    // Check if user owns this application
    if (application.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    application.status = 'withdrawn';
    await application.save();
    
    res.json({ message: 'Application withdrawn successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
