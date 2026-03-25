const express = require('express');
const router = express.Router();

// 1. استدعاء المتحكمات (أضفنا deleteUserProfile)
const { 
  getUserProfile, 
  updateUserProfile, 
  deleteUserProfile,
  getUserById,
  updateUserAvatar
} = require('../controllers/userController');

// 2. استدعاء حارس البوابة
const { protect } = require('../middleware/authMiddleware');
const { uploadAvatar } = require('../middleware/uploadMiddleware');

const avatarUploadHandler = (req, res, next) => {
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

// مسار الحصول على الملف الشخصي: GET /api/user/profile
router.get('/profile', protect, getUserProfile);

// مسار تحديث الملف الشخصي: PUT /api/user/profile
router.put('/profile', protect, updateUserProfile);

// مسار تحديث الصورة الشخصية: PUT /api/user/profile/avatar
router.put('/profile/avatar', protect, avatarUploadHandler, updateUserAvatar);

// مسار جلب ملف مستخدم آخر (يجب أن يكون أسفل /profile لكي لا يتداخل معه)
router.get('/:userId', protect, getUserById);

// مسار حذف الملف الشخصي: DELETE /api/user/profile
// (نفس الرابط ولكن بطريقة DELETE)
router.delete('/profile', protect, deleteUserProfile);

module.exports = router;
