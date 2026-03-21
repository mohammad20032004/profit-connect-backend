const express = require('express');
const router = express.Router();

// 1. استدعاء المتحكمات (أضفنا deleteUserProfile)
const { 
  getUserProfile, 
  updateUserProfile, 
  deleteUserProfile 
} = require('../controllers/userController');

// 2. استدعاء حارس البوابة
const { protect } = require('../middleware/authMiddleware');

// مسار الحصول على الملف الشخصي: GET /api/user/profile
router.get('/profile', protect, getUserProfile);

// مسار تحديث الملف الشخصي: PUT /api/user/profile
router.put('/profile', protect, updateUserProfile);

// مسار حذف الملف الشخصي: DELETE /api/user/profile
// (نفس الرابط ولكن بطريقة DELETE)
router.delete('/profile', protect, deleteUserProfile);

module.exports = router;