const mongoose = require('mongoose');

const forumCommentSchema = new mongoose.Schema({
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ForumPost',
    required: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  parentComment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ForumComment',
    default: null
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes
forumCommentSchema.index({ post: 1, createdAt: 1 });
forumCommentSchema.index({ author: 1 });
forumCommentSchema.index({ parentComment: 1 });

module.exports = mongoose.model('ForumComment', forumCommentSchema);
