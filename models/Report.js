const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
  // Reporter information
  reportedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  
  // What is being reported
  reportType: { 
    type: String, 
    enum: ['opportunity', 'user', 'comment', 'other'], 
    required: true 
  },
  reportedItem: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true,
    refPath: 'reportType' 
  },
  
  // Report details
  reason: { 
    type: String, 
    enum: ['spam', 'inappropriate', 'misinformation', 'scam', 'harassment', 'other'], 
    required: true 
  },
  description: { type: String, required: true },
  
  // Status
  status: { 
    type: String, 
    enum: ['pending', 'under-review', 'resolved', 'dismissed'], 
    default: 'pending' 
  },
  
  // Resolution
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resolvedAt: { type: Date },
  resolution: { type: String },
  actionTaken: { type: String } // "content-removed", "user-suspended", "no-action", etc.
}, {
  timestamps: true
});

// Indexes
ReportSchema.index({ status: 1 });
ReportSchema.index({ reportedBy: 1 });
ReportSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Report', ReportSchema);
