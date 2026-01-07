const mongoose = require('mongoose');

const whatsAppSubmissionSchema = new mongoose.Schema({
  messageId: {
    type: String,
    required: true,
    unique: true
  },
  senderPhone: {
    type: String,
    required: true
  },
  senderName: {
    type: String,
    default: 'Unknown'
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'video', 'document', 'audio', 'location', 'contacts'],
    required: true
  },
  messageContent: {
    type: String,
    required: true
  },
  mediaUrl: {
    type: String,
    default: null
  },
  category: {
    type: String,
    enum: ['bursary', 'career', 'learnership', 'business', 'general', 'event', 'success-story'],
    default: 'general'
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'published'],
    default: 'pending'
  },
  timestamp: {
    type: Date,
    required: true
  },
  // If approved, this will contain the created opportunity ID
  opportunityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Opportunity',
    default: null
  },
  // Admin who reviewed the submission
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  reviewedAt: {
    type: Date,
    default: null
  },
  reviewNotes: {
    type: String,
    default: ''
  },
  // Additional parsed data from message
  parsedData: {
    title: String,
    description: String,
    organization: String,
    location: String,
    deadline: Date,
    contactEmail: String,
    contactPhone: String,
    website: String,
    requirements: [String],
    amount: String
  },
  metadata: {
    phoneNumberId: String,
    displayPhoneNumber: String
  }
}, {
  timestamps: true
});

// Index for faster queries
whatsAppSubmissionSchema.index({ status: 1, createdAt: -1 });
whatsAppSubmissionSchema.index({ category: 1, status: 1 });
whatsAppSubmissionSchema.index({ senderPhone: 1 });

module.exports = mongoose.model('WhatsAppSubmission', whatsAppSubmissionSchema);
