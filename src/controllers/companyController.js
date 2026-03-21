const Company = require('../models/Company');

// @desc    إنشاء صفحة شركة جديدة
// @route   POST /api/companies
// @access  Private
// @desc    إنشاء صفحة شركة جديدة
// @route   POST /api/companies
// @access  Private
exports.createCompany = async (req, res) => {
  try {
    // 1. جلب جميع الحقول الجديدة من الطلب
    const { 
      name, 
      description, 
      industry, 
      location, 
      companySize, 
      foundedYear,     // 👈 جديد
      website, 
      socialLinks,     // 👈 جديد
      contactEmail     // 👈 جديد
    } = req.body;

    // 2. إنشاء الشركة 
    const company = await Company.create({
      name,
      description,
      industry,
      location,
      companySize,
      foundedYear,
      website,
      socialLinks,
      contactEmail,
      owner: req.user._id,
      admins: [req.user._id] // 💡 حركة احترافية: نجعل المالك هو أول مدير (Admin) للشركة تلقائياً
    });

    res.status(201).json({ success: true, data: company });
  } catch (error) {
    console.error('Create Company Error:', error.message);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'اسم الشركة مستخدم بالفعل' });
    }
    res.status(500).json({ success: false, message: 'حدث خطأ أثناء إنشاء الشركة' });
  }
};
// @desc    جلب جميع الشركات
// @route   GET /api/companies
// @access  Private (أو Public حسب رغبتك، سنجعلها Private حالياً)
exports.getCompanies = async (req, res) => {
  try {
    // نجلب الشركات ومعها بيانات المالك الأساسية
    const companies = await Company.find()
      .populate('owner', 'profile.firstName profile.lastName profile.avatar');

    res.status(200).json({
      success: true,
      count: companies.length,
      data: companies
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'حدث خطأ أثناء جلب الشركات' });
  }
};

// @desc    جلب شركة محددة بالـ ID
// @route   GET /api/companies/:id
// @access  Private
exports.getCompanyById = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id)
      .populate('owner', 'profile.firstName profile.lastName profile.avatar');

    if (!company) {
      return res.status(404).json({ success: false, message: 'الشركة غير موجودة' });
    }

    res.status(200).json({ success: true, data: company });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ success: false, message: 'الشركة غير موجودة' });
    }
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
};