const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { uploadAvatar } = require('../middleware/uploadMiddleware');
// استدعاء دوال المصادقة
const { signup, login, getCurrentUser, refresh, logout, forgotPassword, verifyResetCode, resetPassword, sendVerification, verifyEmail, resendVerification } = require('../controllers/authController');

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

// مسار تجديد الجلسة: POST /api/auth/refresh
router.post('/refresh', refresh);

// مسار تسجيل الخروج وإبطال الجلسة: POST /api/auth/logout
router.post('/logout', logout);

// مسارات إعادة تعيين كلمة المرور
router.post('/forgot-password', forgotPassword);
router.post('/verify-reset-code', verifyResetCode);
router.post('/reset-password', resetPassword);

// مسارات تأكيد البريد الإلكتروني
router.post('/send-verification', sendVerification);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerification);

module.exports = router;
