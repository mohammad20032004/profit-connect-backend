const express = require('express');
const router = express.Router();
const { commentLimiter, reportLimiter } = require('../middleware/rateLimiter');
const { 
  createPost, 
  getPosts, 
  getPost,
  toggleLike, 
  addComment,
  updatePost,    
  deletePost,    
  deleteComment,
  reportPost,
  getPostReports,
  getAllReports,
  reviewReport
} = require('../controllers/postController');

const { protect } = require('../middleware/authMiddleware');
const { uploadPostMedia, convertToWebP } = require('../middleware/uploadMiddleware');
const convertVideoToHls = require('../middleware/videoHlsMiddleware');

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
  .post(postMediaUpload, convertToWebP, convertVideoToHls, createPost)
  .get(getPosts);

// مسار لوحة تحكم البلاغات (Admin) - قبل :postId لتجنب التعارض
router.get('/admin/reports', getAllReports);

// مسار لمنشور محدد (عرض، تعديل، حذف)
router.route('/:postId')
  .get(getPost)
  .put(postMediaUpload, convertToWebP, convertVideoToHls, updatePost)
  .delete(deletePost);

// مسار التفاعلات (الإعجاب والتعليق)
router.post('/:postId/like', toggleLike);
router.post('/:postId/comments', commentLimiter, addComment);

// مسار حذف تعليق محدد
router.delete('/:postId/comments/:commentId', deleteComment);

// مسار البلاغات
router.post('/:postId/report', reportLimiter, reportPost);
router.get('/:postId/reports', getPostReports);

// مراجعة بلاغ (Admin)
router.put('/reports/:reportId/review', reviewReport);

module.exports = router;