const mongoose = require('mongoose');

const OppSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['bursary','career','learnership','business','event','success-story'], 
    required: true 
  },
  subcategory: { type: String }, // e.g., "Undergraduate", "Postgraduate", "Jobs", "Internships"
  
  // Organization details
  organization: { type: String },
  contactEmail: { type: String },
  contactPhone: { type: String },
  website: { type: String },
  applyUrl: { type: String }, // External application URL
  
  // Internal Application System (LinkedIn-style)
  allowInternalApplication: { type: Boolean, default: false },
  applicationQuestions: [{
    question: { type: String },
    type: { type: String, enum: ['text','textarea','choice','file'], default: 'text' },
    required: { type: Boolean, default: false },
    options: [{ type: String }] // For choice type
  }],
  requiredDocuments: [{
    name: { type: String }, // e.g., "CV", "Cover Letter", "ID Copy"
    description: { type: String },
    required: { type: Boolean, default: true }
  }],
  
  // Location and eligibility
  location: { type: String },
  eligibility: { type: String },
  requirements: [{ type: String }],
  
  // Dates
  deadline: { type: Date },
  closingDate: { type: Date, required: true }, // When opportunity closes/expires
  startDate: { type: Date },
  endDate: { type: Date },
  
  // Financial (for bursaries/funding)
  amount: { type: String },
  fundingType: { type: String }, // "Full", "Partial", "Variable"
  
  // Employment (for careers)
  employmentType: { type: String }, // "Full-time", "Part-time", "Contract", "Internship"
  salary: { type: String },
  experience: { type: String },
  
  // Images and media
  imageUrl: { type: String },
  attachments: [{ type: String }],
  
  // SEO and search
  tags: [{ type: String }],
  keywords: [{ type: String }],
  
  // Status and moderation
  status: { 
    type: String, 
    enum: ['pending','approved','rejected'], 
    default: 'pending' 
  },
  rejectionReason: { type: String },
  
  // Analytics
  views: { type: Number, default: 0 },
  applications: { type: Number, default: 0 },
  
  // Meta
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  featured: { type: Boolean, default: false },
  urgent: { type: Boolean, default: false }
}, {
  timestamps: true
});

// Indexes for better query performance
OppSchema.index({ category: 1, status: 1 });
OppSchema.index({ deadline: 1 });
OppSchema.index({ location: 1 });
OppSchema.index({ tags: 1 });
OppSchema.index({ title: 'text', description: 'text', organization: 'text' });

module.exports = mongoose.model('Opportunity', OppSchema);
