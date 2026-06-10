const express = require('express');
const router = express.Router();

// 1. استدعاء المتحكمات (أضفنا deleteUserProfile)
const { 
  getUserProfile, 
  updateUserProfile, 
  deleteUserProfile,
  getUserById,
  updateUserAvatar,
  getSettings,
  updateSettings,
  toggleFollow,
  getFollowers,
  getFollowing
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
router.put('/profile', protect, updateUserProfile);
router.put('/profile/avatar', protect, avatarUploadHandler, updateUserAvatar);
router.get('/settings', protect, getSettings);
router.put('/settings', protect, updateSettings);
router.post('/:userId/follow', protect, toggleFollow);
router.get('/:userId/followers', protect, getFollowers);
router.get('/:userId/following', protect, getFollowing);
router.get('/:userId', protect, getUserById);

module.exports = router;
