const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { uploadAvatar } = require('../middleware/uploadMiddleware');
// استدعاء دوال المصادقة
const { signup, login, getCurrentUser } = require('../controllers/authController');

const signupAvatarUploadHandler = (req, res, next) => {
  uploadAvatar.single('avatar')(req, res, (error) => {
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    next();
  });
};

// مسار التسجيل: POST /api/auth/signup
router.post('/signup', signupAvatarUploadHandler, signup);

// مسار تسجيل الدخول: POST /api/auth/login
router.post('/login', login);

// مسار التحقق من التوكن وجلب المستخدم الحالي: GET /api/auth/me
router.get('/me', protect, getCurrentUser);

module.exports = router;
