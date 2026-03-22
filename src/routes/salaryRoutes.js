const express = require('express');
const router = express.Router(); // التعديل هنا: استخدام Router() بدلاً من Fragment()
const { getSalaries,
    getSalaryOptions, 
    getSalaryStats
 } = require('../controllers/salaryController');
 
// المسارات المتخصصة  
router.get('/options', getSalaryOptions);
router.get('/stats', getSalaryStats);
// تعريف مسار جلب البيانات
router.get('/', getSalaries);

module.exports = router;