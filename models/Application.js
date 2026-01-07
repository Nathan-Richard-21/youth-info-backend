const mongoose = require('mongoose');

const ApplicationSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  opportunity: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Opportunity', 
    required: true 
  },
  
  // Application status
  status: { 
    type: String, 
    enum: ['pending', 'under-review', 'approved', 'rejected', 'withdrawn'], 
    default: 'pending' 
  },
  
  // Application data
  coverLetter: { type: String },
  resume: { type: String }, // URL to uploaded resume
  documents: [{ 
    name: { type: String }, 
    url: { type: String }, 
    type: { type: String }
  }],
  
  // Additional fields
  answers: [{ 
    question: { type: String }, 
    answer: { type: String }
  }],
  
  // Tracking
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: { type: Date },
  notes: { type: String }
}, {
  timestamps: true
});

// Indexes
ApplicationSchema.index({ user: 1, opportunity: 1 });
ApplicationSchema.index({ status: 1 });
ApplicationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Application', ApplicationSchema);
