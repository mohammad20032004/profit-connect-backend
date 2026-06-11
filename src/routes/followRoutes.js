
const express = require('express');
const router = express.Router();
const { followUser, unfollowUser } = require('../controllers/followController');
const { protect } = require('../middleware/authMiddleware');

// Follow a user
router.route('/:userId/follow').post(protect, followUser);

// Unfollow a user
router.route('/:userId/follow').delete(protect, unfollowUser);

module.exports = router;
