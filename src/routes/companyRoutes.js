const express = require('express');
const router = express.Router();

const { 
  createCompany, 
  getCompanies, 
  getCompanyById,
  toggleFollowCompany, // 👈 استدعاء دالة المتابعة
  addCompanyAdmin      // 👈 استدعاء دالة إضافة المدير
} = require('../controllers/companyController');

const { protect } = require('../middleware/authMiddleware');

// تطبيق الحماية
router.use(protect);

// مسارات الشركات
router.route('/')
  .post(createCompany)
  .get(getCompanies);

router.route('/:id')
  .get(getCompanyById);
router.post('/:id/follow', toggleFollowCompany);
router.post('/:id/admins', addCompanyAdmin);
module.exports = router;