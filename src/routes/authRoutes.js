const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
// استدعاء دوال المصادقة
const { signup, login, getCurrentUser } = require('../controllers/authController');

// مسار التسجيل: POST /api/auth/signup
router.post('/signup', signup);

// مسار تسجيل الدخول: POST /api/auth/login
router.post('/login', login);

// مسار التحقق من التوكن وجلب المستخدم الحالي: GET /api/auth/me
router.get('/me', protect, getCurrentUser);

module.exports = router;
