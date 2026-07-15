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
  getCompanyFollowers, 
  addRating, 
  getCompanyRatings, 
  deleteRating
} = require('../controllers/companyController');

const { protect, employerOnly } = require('../middleware/authMiddleware');
const { uploadCompanyDocs } = require('../middleware/uploadMiddleware');

// تطبيق الحماية
router.use(protect);

// مسارات الشركات
router.route('/')
  .post(protect, employerOnly, uploadCompanyDocs.array('documents', 5), createCompany)
  .get(getCompanies);

router.route('/:id')
  .get(getCompanyById)
  .put(updateCompany)
  .delete(deleteCompany);
router.get('/:id/followers', getCompanyFollowers);
router.post('/:id/follow', toggleFollowCompany);
router.post('/:id/admins', addCompanyAdmin);
router.route('/:id/ratings')
  .post(addRating)
  .get(getCompanyRatings)
  .delete(deleteRating);
module.exports = router;