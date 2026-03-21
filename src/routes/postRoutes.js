const express = require('express');
const router = express.Router();

// استدعاء جميع دوال المنشورات (بما فيها الدوال الجديدة)
const { 
  createPost, 
  getPosts, 
  toggleLike, 
  addComment 
} = require('../controllers/postController');

const { protect } = require('../middleware/authMiddleware');

// تطبيق الحماية على جميع المسارات
router.use(protect);

// مسارات المنشورات الأساسية
router.route('/')
  .post(createPost)
  .get(getPosts);

// مسار الإعجاب (يحتاج لمعرّف المنشور postId)
router.post('/:postId/like', toggleLike);

// مسار التعليقات
router.post('/:postId/comments', addComment);

module.exports = router;