const express = require('express');
const router = express.Router();

const { 
  createCompany, 
  getCompanies, 
  getCompanyById,
  toggleFollowCompany,
  addCompanyAdmin,
  updateCompany,
  deleteCompany,
  updateCompanyStatus,
  getCompanyFollowers,
  addRating,
  getCompanyRatings,
  deleteRating
} = require('../controllers/companyController');

const { protect } = require('../middleware/authMiddleware');

// تطبيق الحماية
router.use(protect);

// مسارات الشركات
router.route('/')
  .post(createCompany)
  .get(getCompanies);

router.route('/:id')
  .get(getCompanyById)
  .put(updateCompany)
  .delete(deleteCompany);
router.patch('/:id/status', updateCompanyStatus);
router.get('/:id/followers', getCompanyFollowers);
router.post('/:id/follow', toggleFollowCompany);
router.post('/:id/admins', addCompanyAdmin);
router.route('/:id/ratings')
  .post(addRating)
  .get(getCompanyRatings)
  .delete(deleteRating);
module.exports = router;