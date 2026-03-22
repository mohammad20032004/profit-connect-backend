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

// لا تنسَ استدعاء نموذج المستخدم في أعلى الملف إذا لم يكن موجوداً:
// const User = require('../models/User');

// @desc    متابعة / إلغاء متابعة شركة (Toggle Follow)
// @route   POST /api/companies/:id/follow
// @access  Private
exports.toggleFollowCompany = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);

    if (!company) {
      return res.status(404).json({ success: false, message: 'الشركة غير موجودة' });
    }

    // التحقق مما إذا كان المستخدم يتابع الشركة بالفعل
    const index = company.followers.indexOf(req.user._id);
    let isFollowing = false;

    if (index === -1) {
      // إذا لم يكن يتابعها (-1)، نقوم بإضافته
      company.followers.push(req.user._id);
      company.followersCount += 1; // زيادة العداد
      isFollowing = true;
    } else {
      // إذا كان يتابعها مسبقاً، نقوم بإلغاء المتابعة
      company.followers.splice(index, 1);
      company.followersCount -= 1; // إنقاص العداد
    }

    await company.save();

    res.status(200).json({
      success: true,
      isFollowing,
      followersCount: company.followersCount
    });
  } catch (error) {
    console.error('Follow Company Error:', error.message);
    res.status(500).json({ success: false, message: 'حدث خطأ أثناء معالجة المتابعة' });
  }
};

// @desc    إضافة مدير جديد للشركة
// @route   POST /api/companies/:id/admins
// @access  Private
exports.addCompanyAdmin = async (req, res) => {
  try {
    const { newAdminId } = req.body; // الـ ID الخاص بالمستخدم الذي نريد ترقيته لمدير

    const company = await Company.findById(req.params.id);

    if (!company) {
      return res.status(404).json({ success: false, message: 'الشركة غير موجودة' });
    }

    // 🔒 حماية أمنية: فقط "مالك" الشركة يمكنه إضافة مدراء آخرين
    if (company.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'غير مصرح لك! المالك فقط يمكنه إضافة مدراء' });
    }

    // التأكد من أن المستخدم المطلوب إضافته موجود في قاعدة البيانات
    const User = require('../models/User'); // استدعاء الموديل
    const newAdmin = await User.findById(newAdminId);
    
    if (!newAdmin) {
      return res.status(404).json({ success: false, message: 'المستخدم المطلوب إضافته غير موجود' });
    }

    // التأكد من أنه ليس مديراً بالفعل لتجنب التكرار
    if (company.admins.includes(newAdminId)) {
      return res.status(400).json({ success: false, message: 'هذا المستخدم هو مدير بالفعل في هذه الشركة' });
    }

    // إضافته لمصفوفة المدراء
    company.admins.push(newAdminId);
    await company.save();

    res.status(200).json({
      success: true,
      message: 'تمت إضافة المدير بنجاح',
      adminsCount: company.admins.length
    });
  } catch (error) {
    console.error('Add Admin Error:', error.message);
    res.status(500).json({ success: false, message: 'حدث خطأ أثناء إضافة المدير' });
  }
};