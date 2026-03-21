const express = require('express');
const router = express.Router();
// استدعاء دالة login بجانب signup
const { signup, login } = require('../controllers/authController');

// مسار التسجيل: POST /api/auth/signup
router.post('/signup', signup);

// مسار تسجيل الدخول: POST /api/auth/login
router.post('/login', login);

module.exports = router;