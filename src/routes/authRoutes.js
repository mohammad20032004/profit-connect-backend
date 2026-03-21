const express = require('express');
const router = express.Router();
const { signup } = require('../controllers/authController');

// مسار التسجيل: POST /api/auth/signup
router.post('/signup', signup);

module.exports = router;