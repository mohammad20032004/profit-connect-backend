const express = require('express');
const router = express.Router();

const { getPendingCompanies, updateCompanyStatus, setUserRole } = require('../controllers/adminController');
const { protect, admin } = require('../middleware/authMiddleware');

// تطبيق الحارسين على جميع المسارات في هذا الملف
router.use(protect, admin);

router.get('/companies/pending', getPendingCompanies);
router.put('/companies/:id/status', updateCompanyStatus);
router.put('/users/:id/role', setUserRole);

module.exports = router;