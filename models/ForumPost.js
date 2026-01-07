const mongoose = require('mongoose');

const forumPostSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  content: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['bursaries', 'careers', 'learnerships', 'business', 'general', 'success-stories', 'advice'],
    default: 'general'
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  views: {
    type: Number,
    default: 0
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  isLocked: {
    type: Boolean,
    default: false
  },
  lastActivity: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for searching and filtering
forumPostSchema.index({ title: 'text', content: 'text' });
forumPostSchema.index({ category: 1, createdAt: -1 });
forumPostSchema.index({ author: 1 });

// Virtual for comment count
forumPostSchema.virtual('commentCount', {
  ref: 'ForumComment',
  localField: '_id',
  foreignField: 'post',
  count: true
});

forumPostSchema.set('toJSON', { virtuals: true });
forumPostSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('ForumPost', forumPostSchema);
