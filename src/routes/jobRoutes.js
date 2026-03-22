const express = require('express');
const router = express.Router();

const { 
  createJob, 
  getJobs, 
  applyForJob,// 👈 استدعاء دالة التقديم 
  getJobApplicants,        // 👈 دالة جلب المتقدمين
  updateApplicationStatus,  // 👈 دالة تحديث حالة الطلب
  getMyApplications // 👈 استيراد الدالة الجديدة
} = require('../controllers/jobController');

const { protect } = require('../middleware/authMiddleware');

router.get('/', getJobs); 
router.post('/', protect, createJob); 
// مسار التقديم على وظيفة معينة (يحتاج تسجيل دخول)
router.post('/:id/apply', protect, applyForJob);
// 👈 مسار جلب المتقدمين لوظيفة معينة
router.get('/:id/applicants', protect, getJobApplicants);
// 👈 مسار تحديث حالة الطلب (لاحظ أننا نمرر الـ ID الخاص بطلب التوظيف نفسه)
router.put('/applications/:applicationId/status', protect, updateApplicationStatus);
// مسار جلب طلبات المستخدم (يجب أن يكون فوق المسارات التي تحتوي على :id)
router.get('/my-applications', protect, getMyApplications);


module.exports = router;