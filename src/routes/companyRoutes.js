const express = require('express');
const router = express.Router();

const { 
  createCompany, 
  getCompanies, 
  getCompanyById 
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

module.exports = router;