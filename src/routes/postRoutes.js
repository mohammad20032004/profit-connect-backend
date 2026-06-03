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

router.use(protect); // حماية جميع المسارات

// مسار المنشورات العام
router.route('/')
  .post(createPost)
  .get(getPosts);

// مسار لمنشور محدد (تعديل وحذف)
router.route('/:postId')
  .put(updatePost)
  .delete(deletePost);

// مسار التفاعلات (الإعجاب والتعليق)
router.post('/:postId/like', toggleLike);
router.post('/:postId/comments', commentLimiter, addComment);

// مسار حذف تعليق محدد
router.delete('/:postId/comments/:commentId', deleteComment);

module.exports = router;