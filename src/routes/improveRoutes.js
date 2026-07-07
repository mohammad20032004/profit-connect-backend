const express = require('express');
const router = express.Router();
const { improve } = require('../controllers/improveController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, improve);

module.exports = router;
