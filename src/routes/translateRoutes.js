const express = require('express');
const router = express.Router();
const { translate } = require('../controllers/translateController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, translate);

module.exports = router;
