const express = require('express');
const router = express.Router();
const { commentLimiter } = require('../middleware/rateLimiter');
const { 
  createPost, 
  getPosts, 
  toggleLike, 
  addComment,
  updatePost,    
  deletePost,    
  deleteComment  
} = require('../controllers/postController');

const { protect } = require('../middleware/authMiddleware');
const { uploadPostMedia } = require('../middleware/uploadMiddleware');

const postMediaUpload = (req, res, next) => {
  uploadPostMedia.fields([
    { name: 'image', maxCount: 1 },
    { name: 'video', maxCount: 1 },
  ])(req, res, (error) => {
    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
    next();
  });
};

router.use(protect);

// مسار المنشورات العام
router.route('/')
  .post(postMediaUpload, createPost)
  .get(getPosts);

// مسار لمنشور محدد (تعديل وحذف)
router.route('/:postId')
  .put(postMediaUpload, updatePost)
  .delete(deletePost);

// مسار التفاعلات (الإعجاب والتعليق)
router.post('/:postId/like', toggleLike);
router.post('/:postId/comments', commentLimiter, addComment);

// مسار حذف تعليق محدد
router.delete('/:postId/comments/:commentId', deleteComment);

module.exports = router;