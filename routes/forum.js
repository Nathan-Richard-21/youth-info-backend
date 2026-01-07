const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ForumPost = require('../models/ForumPost');
const ForumComment = require('../models/ForumComment');

// @route   GET /api/forum/posts
// @desc    Get all forum posts with filtering
// @access  Public
router.get('/posts', async (req, res) => {
  try {
    const { category, search, page = 1, limit = 20, sort = '-lastActivity' } = req.query;
    
    const query = {};
    if (category && category !== 'all') query.category = category;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }
    
    const posts = await ForumPost.find(query)
      .populate('author', 'name')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();
    
    // Get comment counts for each post
    const postsWithCounts = await Promise.all(posts.map(async (post) => {
      const commentCount = await ForumComment.countDocuments({ post: post._id, isDeleted: false });
      return { ...post, commentCount };
    }));
    
    const count = await ForumPost.countDocuments(query);
    
    res.json({
      posts: postsWithCounts,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/forum/posts/:id
// @desc    Get single forum post with comments
// @access  Public
router.get('/posts/:id', async (req, res) => {
  try {
    const post = await ForumPost.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    ).populate('author', 'name');
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Get comments (top-level only, replies loaded separately)
    const comments = await ForumComment.find({ 
      post: req.params.id, 
      parentComment: null,
      isDeleted: false 
    })
      .populate('author', 'name')
      .sort('createdAt')
      .lean();
    
    // Get reply counts for each comment
    const commentsWithCounts = await Promise.all(comments.map(async (comment) => {
      const replyCount = await ForumComment.countDocuments({ 
        parentComment: comment._id, 
        isDeleted: false 
      });
      return { ...comment, replyCount };
    }));
    
    res.json({ post, comments: commentsWithCounts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/forum/posts
// @desc    Create new forum post
// @access  Private
router.post('/posts', auth, async (req, res) => {
  try {
    const { title, content, category, tags } = req.body;
    
    if (!title || !content || !category) {
      return res.status(400).json({ message: 'Title, content, and category are required' });
    }
    
    const post = new ForumPost({
      title,
      content,
      category,
      tags: tags || [],
      author: req.userId
    });
    
    await post.save();
    await post.populate('author', 'name');
    
    res.status(201).json({ message: 'Post created successfully', post });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/forum/posts/:id
// @desc    Update forum post
// @access  Private (author only)
router.put('/posts/:id', auth, async (req, res) => {
  try {
    const post = await ForumPost.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Check if user is author
    if (post.author.toString() !== req.userId.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    const { title, content, tags } = req.body;
    
    if (title) post.title = title;
    if (content) post.content = content;
    if (tags) post.tags = tags;
    
    await post.save();
    await post.populate('author', 'name');
    
    res.json({ message: 'Post updated successfully', post });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/forum/posts/:id
// @desc    Delete forum post
// @access  Private (author only)
router.delete('/posts/:id', auth, async (req, res) => {
  try {
    const post = await ForumPost.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Check if user is author or admin
    if (post.author.toString() !== req.userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    await ForumPost.findByIdAndDelete(req.params.id);
    await ForumComment.deleteMany({ post: req.params.id });
    
    res.json({ message: 'Post deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/forum/posts/:id/like
// @desc    Like/unlike a post
// @access  Private
router.post('/posts/:id/like', auth, async (req, res) => {
  try {
    const post = await ForumPost.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    const likeIndex = post.likes.indexOf(req.userId);
    
    if (likeIndex > -1) {
      // Unlike
      post.likes.splice(likeIndex, 1);
    } else {
      // Like
      post.likes.push(req.userId);
    }
    
    await post.save();
    
    res.json({ message: 'Post liked', likes: post.likes.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/forum/comments
// @desc    Add comment to post
// @access  Private
router.post('/comments', auth, async (req, res) => {
  try {
    const { postId, content, parentComment } = req.body;
    
    if (!postId || !content) {
      return res.status(400).json({ message: 'Post ID and content are required' });
    }
    
    const post = await ForumPost.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    if (post.isLocked) {
      return res.status(403).json({ message: 'Post is locked for comments' });
    }
    
    const comment = new ForumComment({
      post: postId,
      author: req.userId,
      content,
      parentComment: parentComment || null
    });
    
    await comment.save();
    await comment.populate('author', 'name');
    
    // Update post's last activity
    post.lastActivity = Date.now();
    await post.save();
    
    res.status(201).json({ message: 'Comment added', comment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/forum/comments/:commentId/replies
// @desc    Get replies to a comment
// @access  Public
router.get('/comments/:commentId/replies', async (req, res) => {
  try {
    const replies = await ForumComment.find({ 
      parentComment: req.params.commentId,
      isDeleted: false 
    })
      .populate('author', 'name')
      .sort('createdAt');
    
    res.json(replies);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/forum/comments/:id
// @desc    Delete comment
// @access  Private (author only)
router.delete('/comments/:id', auth, async (req, res) => {
  try {
    const comment = await ForumComment.findById(req.params.id);
    
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    
    if (comment.author.toString() !== req.userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    comment.isDeleted = true;
    comment.content = '[Comment deleted]';
    await comment.save();
    
    res.json({ message: 'Comment deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/forum/comments/:id/like
// @desc    Like/unlike a comment
// @access  Private
router.post('/comments/:id/like', auth, async (req, res) => {
  try {
    const comment = await ForumComment.findById(req.params.id);
    
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    
    const likeIndex = comment.likes.indexOf(req.userId);
    
    if (likeIndex > -1) {
      comment.likes.splice(likeIndex, 1);
    } else {
      comment.likes.push(req.userId);
    }
    
    await comment.save();
    
    res.json({ message: 'Comment liked', likes: comment.likes.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
