
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const Post = require('../models/Post');
const RefreshToken = require('../models/RefreshToken');
const PasswordReset = require('../models/PasswordReset');
const EmailVerification = require('../models/EmailVerification');
const { sendResetCode, sendVerificationCode } = require('../services/emailService');
const { buildAvatarUrl, deleteAvatarFile } = require('../utils/avatarStorage');
const { formatUserResponse } = require('../utils/userResponse');

// دالة مساعدة لإرجاع بيانات المستخدم مع منشوراته (الأحدث أولاً)
async function formatUserWithPosts(user) {
  const userWithPosts = user.toObject ? user.toObject() : user;
  const posts = await Post.find({ user: userWithPosts._id })
    .sort({ createdAt: -1 })
    .populate('user', 'profile.firstName profile.lastName profile.headline profile.avatar')
    .populate({ path: 'comments.user', select: 'profile.firstName profile.lastName profile.avatar' })
    .lean();
  userWithPosts.posts = posts;
  return formatUserResponse(userWithPosts, { includePosts: true });
}

// دالة مساعدة لإنشاء التوكن
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// ===== نظام الريفرش توكن =====
const REFRESH_EXPIRE_DAYS = parseInt(process.env.JWT_REFRESH_EXPIRE_DAYS, 10) || 30;

// تجزئة التوكن قبل تخزينه (لا يُخزَّن التوكن الخام في قاعدة البيانات)
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

// إنشاء ريفرش توكن جديد وتخزينه (مجزأً) في قاعدة البيانات
const createStoredRefreshToken = async (userId, req = {}) => {
  const refreshToken = jwt.sign({ id: userId, type: 'refresh' }, process.env.JWT_SECRET, {
    expiresIn: `${REFRESH_EXPIRE_DAYS}d`,
  });

  await RefreshToken.create({
    user: userId,
    tokenHash: hashToken(refreshToken),
    expiresAt: new Date(Date.now() + REFRESH_EXPIRE_DAYS * 24 * 60 * 60 * 1000),
    userAgent: (req.headers && req.headers['user-agent']) || '',
    ip: req.ip || '',
  });

  return refreshToken;
};

// @desc    إنشاء حساب مستخدم جديد (Signup)
// @route   POST /api/auth/signup
// @access  Public
exports.signup = async (req, res) => {
  try {
    const { firstName, lastName, email, password, role, phoneNumber, industry, yearsOfExperience, skills, rScore, gender } = req.body;

    // الدور عند التسجيل: يسمح فقط بـ (صاحب عمل / باحث عن عمل / صاحب مشروع حر)،
    // ولا يُسمح بتمرير Admin من التسجيل (يُمنح عبر الإدارة فقط)
    const allowedSignupRoles = ['Employer', 'JobSeeker', 'FreelanceClient'];
    const safeRole = allowedSignupRoles.includes(role) ? role : 'JobSeeker';

    // بناء الملف حسب الدور:
    // - صاحب عمل / صاحب مشروع حر => أسئلة تبني صفحة الشركة (لا مهارات/خبرة)
    // - باحث عن عمل => الملف المهني (مجال/خبرة/مهارات)
    const isEmployerType = safeRole === 'Employer' || safeRole === 'FreelanceClient';

    // بناء كائن الموقع الجديد
    // عند استخدام multipart/form-data يصل companyLocation كنص JSON
    let companyLocation;
    let parsedCompanyLocation = req.body.companyLocation;
    if (typeof parsedCompanyLocation === 'string') {
      try {
        parsedCompanyLocation = JSON.parse(parsedCompanyLocation);
      } catch (e) {
        parsedCompanyLocation = null;
      }
    }
    if (parsedCompanyLocation && typeof parsedCompanyLocation === 'object') {
      const loc = parsedCompanyLocation;
      companyLocation = {
        country: loc.country || '',
        city: loc.city || '',
        street: loc.street || '',
        buildingNumber: loc.buildingNumber || '',
        coordinates: {
          type: 'Point',
          coordinates: [
            Number(loc.coordinates?.x) || Number(loc.coordinates?.coordinates?.[0]) || 0,
            Number(loc.coordinates?.y) || Number(loc.coordinates?.coordinates?.[1]) || 0
          ]
        }
      };
    } else {
      companyLocation = undefined;
    }

    const employerProfile = isEmployerType
      ? {
          companyName: req.body.companyName,
          companyDescription: req.body.companyDescription,
          industry: req.body.companyIndustry,
          companyLocation,
          website: req.body.website,
          companySize: req.body.companySize,
          foundedYear: req.body.foundedYear ? Number(req.body.foundedYear) : undefined,
        }
      : undefined;
    const professional = !isEmployerType
      ? { industry, yearsOfExperience, skills }
      : undefined;

    // 1. التحقق من وجود المستخدم مسبقاً
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ success: false, message: 'البريد الإلكتروني مسجل بالفعل' });
    }

    // 2. إنشاء المستخدم الجديد
    user = await User.create({
      email,
      password,
      role: safeRole,
      profile: {
        firstName,
        lastName,
        phoneNumber,
        ...(gender && ['male', 'female'].includes(gender) ? { gender } : {}),
        ...(req.file ? { avatar: buildAvatarUrl(req, req.file.filename) } : {}),
      },
      ...(professional ? { professional } : {}),
      ...(employerProfile ? { employerProfile } : {})
    });

    // 2.1 إشعار ترحيبي لصاحب العمل/صاحب المشروع الحر لبدء إعداد صفحة شركته
    if (isEmployerType) {
      user.notifications.push({
        type: 'company_setup',
        message: 'مرحباً! أكمل إعداد صفحة شركتك لنشر وظائفك ومشاريعك بسهولة.',
        read: false
      });
      await user.save();
    }

    // 3. إنشاء التوكن
    const token = generateToken(user._id);
    const refreshToken = await createStoredRefreshToken(user._id, req);

    // 4. إرسال كود تأكيد البريد الإلكتروني
    const verificationCode = generateResetCode();
    const verificationExpires = new Date(Date.now() + 15 * 60 * 1000);
    await EmailVerification.create({
      user: user._id,
      code: verificationCode,
      expiresAt: verificationExpires,
    });
    await sendVerificationCode(user.email, verificationCode, user.profile.firstName);

    // 5. إرجاع الاستجابة
    res.status(201).json({
      success: true,
      token,
      refreshToken,
      requiresEmailVerification: true,
      message: 'تم إنشاء الحساب بنجاح. يرجى التحقق من بريدك الإلكتروني لإكمال التسجيل.',
      user: await formatUserWithPosts(user)
    });

  } catch (error) {
    if (req.file) {
      await deleteAvatarFile(buildAvatarUrl(req, req.file.filename));
    }

    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    تسجيل دخول المستخدم (Login)
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. التحقق من إرسال البريد الإلكتروني وكلمة المرور في الطلب
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'يرجى إدخال البريد الإلكتروني وكلمة المرور' 
      });
    }

    // 2. البحث عن المستخدم في قاعدة البيانات
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'بيانات الدخول غير صحيحة'
      });
    }

    // 3. التحقق من تطابق كلمة المرور
    const isMatch = await user.matchPassword(password);
    
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'بيانات الدخول غير صحيحة' 
      });
    }

    // 4. التحقق من تأكيد البريد الإلكتروني
    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'لم يتم تأكيد البريد الإلكتروني بعد',
        requiresEmailVerification: true,
        email: user.email
      });
    }

    // 5. إنشاء التوكن
    const token = generateToken(user._id);
    const refreshToken = await createStoredRefreshToken(user._id, req);

    // 6. إرجاع الاستجابة
    res.status(200).json({
      success: true,
      token,
      refreshToken,
      user: await formatUserWithPosts(user)
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    التحقق من التوكن وإرجاع المستخدم الحالي مع بياناته الكاملة
// @route   GET /api/auth/me
// @access  Private
exports.getCurrentUser = async (req, res) => {
  try {
    const userId = req.user.id;

    // جلب بيانات المستخدم الأساسية والمتابعين والمتابَعين
    const user = await User.findById(userId)
      .populate('profile.followers', 'profile.firstName profile.lastName profile.avatar')
      .populate('profile.following', 'profile.firstName profile.lastName profile.avatar');

    // جلب منشورات المستخدم
    const posts = await Post.find({ user: userId }).sort({ createdAt: -1 });

    if (!user) {
        return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
    }

    // دمج كل البيانات في استجابة واحدة
    const userProfile = {
      ...formatUserResponse(user, { includeFreelance: true }),
      posts: posts,
    };

    // جلب بيانات الشركة إن كان المستخدم صاحب عمل/مشروع حر
    const isEmployerType = user.role === 'Employer' || user.role === 'FreelanceClient';
    if (isEmployerType) {
      const Company = require('../models/Company');
      const company = await Company.findOne({ owner: userId })
        .select('name description industry location companySize foundedYear logo coverPhoto website socialLinks contactEmail isVerified status followersCount averageRating createdAt');
      if (company) {
        userProfile.company = company.toObject();
      }
    }

    // جلب بيانات الشركة إن كان المستخدم موظف شركة
    if (user.role === 'CompanyEmployee' && user.companyEmployeeProfile?.companyId) {
      const Company = require('../models/Company');
      const company = await Company.findById(user.companyEmployeeProfile.companyId)
        .select('name description industry location logo coverPhoto status isVerified');
      if (company) {
        userProfile.company = company.toObject();
      }
    }

    // ملخّص ارتباط المستخدم بالمشاريع (كمستقل متقدّم/مقبول، وكناشر مشروع)
    const { getUserProjectSummary } = require('../services/freelanceService');
    userProfile.freelance = await getUserProjectSummary(userId);

    res.status(200).json({
      success: true,
      user: userProfile,
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    تجديد جلسة المستخدم (تناوب الريفرش توكن)
// @route   POST /api/auth/refresh
// @access  Public (يحمل ريفرش توكن صالح)
exports.refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ success: false, message: 'الريفرش توكن مطلوب' });
    }

    const stored = await RefreshToken.findOne({ tokenHash: hashToken(refreshToken) });
    if (!stored || stored.revokedAt) {
      return res.status(401).json({ success: false, message: 'الريفرش توكن غير صالح أو تم إلغاؤه' });
    }

    if (stored.expiresAt < new Date()) {
      await stored.deleteOne();
      return res.status(401).json({ success: false, message: 'انتهت صلاحية الريفرش توكن، يرجى تسجيل الدخول مجدداً' });
    }

    let payload;
    try {
      payload = jwt.verify(refreshToken, process.env.JWT_SECRET);
    } catch (e) {
      return res.status(401).json({ success: false, message: 'الريفرش توكن غير صالح' });
    }

    const user = await User.findById(payload.id);
    if (!user) {
      return res.status(401).json({ success: false, message: 'المستخدم غير موجود' });
    }

    // التناوب: إصدار توكن وصول جديد + ريفرش جديد، وإبطال القديم
    const token = generateToken(user._id);
    const newRefreshToken = await createStoredRefreshToken(user._id, req);

    stored.revokedAt = new Date();
    stored.replacedBy = hashToken(newRefreshToken);
    await stored.save();

    res.status(200).json({
      success: true,
      token,
      refreshToken: newRefreshToken,
      user: await formatUserWithPosts(user),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    تسجيل الخروج وإبطال الريفرش توكن من الخادم
// @route   POST /api/auth/logout
// @access  Public (يحمل ريفرش توكن)
exports.logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ success: false, message: 'الريفرش توكن مطلوب' });
    }

    const stored = await RefreshToken.findOne({ tokenHash: hashToken(refreshToken) });
    if (stored && !stored.revokedAt) {
      stored.revokedAt = new Date();
      await stored.save();
    }

    res.status(200).json({ success: true, message: 'تم تسجيل الخروج وإبطال الجلسة بنجاح' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// إعادة تعيين كلمة المرور عبر البريد الإلكتروني (EmailJS)
// ============================================================

const RESET_CODE_EXPIRY_MINUTES = 10;

// توليد كود عشوائي من 6 أرقام
function generateResetCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// @desc    طلب إعادة تعيين كلمة المرور (إرسال كود)
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'البريد الإلكتروني مطلوب' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'البريد الإلكتروني غير مسجل في المنصة'
      });
    }

    // حذف أي طلبات قديمة لنفس المستخدم
    await PasswordReset.deleteMany({ user: user._id, purpose: 'password_reset' });

    // توليد كود جديد
    const code = generateResetCode();
    const expiresAt = new Date(Date.now() + RESET_CODE_EXPIRY_MINUTES * 60 * 1000);

    await PasswordReset.create({
      user: user._id,
      code,
      purpose: 'password_reset',
      expiresAt,
    });

    // إرسال الكود عبر EmailJS
    const sent = await sendResetCode(user.email, code, user.profile.firstName);

    if (!sent) {
      return res.status(500).json({
        success: false,
        message: 'حدث خطأ أثناء إرسال البريد الإلكتروني، يرجى المحاولة لاحقاً'
      });
    }

    res.status(200).json({
      success: true,
      message: 'تم إرسال كود إعادة التعيين إلى بريدك الإلكتروني'
    });

  } catch (error) {
    console.error('Forgot Password Error:', error.message);
    res.status(500).json({ success: false, message: 'حدث خطأ أثناء معالجة الطلب' });
  }
};

// @desc    التحقق من كود إعادة تعيين كلمة المرور
// @route   POST /api/auth/verify-reset-code
// @access  Public
exports.verifyResetCode = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ success: false, message: 'البريد الإلكتروني والكود مطلوبان' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, message: 'البريد الإلكتروني غير صحيح' });
    }

    // البحث عن الكود غير المستخدم وغير منتهي الصلاحية
    const resetRecord = await PasswordReset.findOne({
      user: user._id,
      purpose: 'password_reset',
      verified: false,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!resetRecord) {
      return res.status(400).json({
        success: false,
        message: 'لا يوجد كود صالح، يرجى طلب كود جديد'
      });
    }

    if (resetRecord.code !== code) {
      return res.status(400).json({ success: false, message: 'الكود غير صحيح' });
    }

    // تعليم الكود كمحقق منه
    resetRecord.verified = true;
    await resetRecord.save();

    // إنشاء توكن مؤقت صالح لمدة 10 دقائق فقط لاستخدامه في إعادة التعيين
    const resetToken = jwt.sign(
      { id: user._id, purpose: 'password_reset', resetId: resetRecord._id },
      process.env.JWT_SECRET,
      { expiresIn: '10m' }
    );

    res.status(200).json({
      success: true,
      message: 'تم التحقق من الكود بنجاح',
      resetToken,
    });

  } catch (error) {
    console.error('Verify Reset Code Error:', error.message);
    res.status(500).json({ success: false, message: 'حدث خطأ أثناء التحقق من الكود' });
  }
};

// @desc    إعادة تعيين كلمة المرور
// @route   POST /api/auth/reset-password
// @access  Public (يحمل resetToken)
exports.resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword) {
      return res.status(400).json({ success: false, message: 'التوكن وكلمة المرور الجديدة مطلوبان' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' });
    }

    // فك تشفير التوكن والتحقق من صحته
    let decoded;
    try {
      decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    } catch (e) {
      return res.status(400).json({ success: false, message: 'التوكن غير صالح أو منتهي الصلاحية' });
    }

    // التأكد من أن التوكن مخصص لإعادة التعيين
    if (decoded.purpose !== 'password_reset') {
      return res.status(400).json({ success: false, message: 'التوكن غير صالح لهذا الغرض' });
    }

    // التحقق من أن السجل لم يتم التحقق منه مسبقاً
    const resetRecord = await PasswordReset.findOne({
      _id: decoded.resetId,
      user: decoded.id,
      verified: true,
    });

    if (!resetRecord) {
      return res.status(400).json({ success: false, message: 'سجل إعادة التعيين غير صالح' });
    }

    // تحديث كلمة المرور (pre-save hook سيشفرها تلقائياً)
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(400).json({ success: false, message: 'المستخدم غير موجود' });
    }

    user.password = newPassword;
    await user.save();

    // حذف جميع أكواد إعادة التعيين لهذا المستخدم
    await PasswordReset.deleteMany({ user: user._id });

    // إبطال جميع الريفرش توكنز (أمان إضافي)
    await RefreshToken.updateMany(
      { user: user._id, revokedAt: null },
      { revokedAt: new Date() }
    );

    res.status(200).json({
      success: true,
      message: 'تم إعادة تعيين كلمة المرور بنجاح، يرجى تسجيل الدخول بكلمة المرور الجديدة'
    });

  } catch (error) {
    console.error('Reset Password Error:', error.message);
    res.status(500).json({ success: false, message: 'حدث خطأ أثناء إعادة تعيين كلمة المرور' });
  }
};

// ============================================================
// تأكيد البريد الإلكتروني
// ============================================================

const EMAIL_VERIFY_EXPIRY_MINUTES = 15;

// @desc    إرسال كود تأكيد البريد الإلكتروني
// @route   POST /api/auth/send-verification
// @access  Public
exports.sendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'البريد الإلكتروني مطلوب' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'البريد الإلكتروني غير مسجل في المنصة' });
    }

    if (user.isVerified) {
      return res.status(400).json({ success: false, message: 'البريد الإلكتروني مؤكد بالفعل' });
    }

    // حذف أي أكواد قديمة
    await EmailVerification.deleteMany({ user: user._id });

    // توليد كود جديد
    const code = generateResetCode();
    const expiresAt = new Date(Date.now() + EMAIL_VERIFY_EXPIRY_MINUTES * 60 * 1000);

    await EmailVerification.create({
      user: user._id,
      code,
      expiresAt,
    });

    // إرسال الكود
    const sent = await sendVerificationCode(user.email, code, user.profile.firstName);

    if (!sent) {
      return res.status(500).json({
        success: false,
        message: 'حدث خطأ أثناء إرسال البريد الإلكتروني، يرجى المحاولة لاحقاً'
      });
    }

    res.status(200).json({
      success: true,
      message: 'تم إرسال كود التأكيد إلى بريدك الإلكتروني'
    });

  } catch (error) {
    console.error('Send Verification Error:', error.message);
    res.status(500).json({ success: false, message: 'حدث خطأ أثناء إرسال كود التأكيد' });
  }
};

// @desc    التحقق من كود تأكيد البريد الإلكتروني
// @route   POST /api/auth/verify-email
// @access  Public
exports.verifyEmail = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ success: false, message: 'البريد الإلكتروني والكود مطلوبان' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'البريد الإلكتروني غير مسجل في المنصة' });
    }

    if (user.isVerified) {
      return res.status(400).json({ success: false, message: 'البريد الإلكتروني مؤكد بالفعل' });
    }

    // البحث عن الكود
    const verificationRecord = await EmailVerification.findOne({
      user: user._id,
      verified: false,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!verificationRecord) {
      return res.status(400).json({
        success: false,
        message: 'لا يوجد كود صالح، يرجى طلب كود جديد'
      });
    }

    if (verificationRecord.code !== code) {
      return res.status(400).json({ success: false, message: 'الكود غير صحيح' });
    }

    // تأكيد البريد
    user.isVerified = true;
    user.emailVerifiedAt = new Date();
    await user.save();

    // حذف جميع أكواد التأكيد
    await EmailVerification.deleteMany({ user: user._id });

    res.status(200).json({
      success: true,
      message: 'تم تأكيد البريد الإلكتروني بنجاح'
    });

  } catch (error) {
    console.error('Verify Email Error:', error.message);
    res.status(500).json({ success: false, message: 'حدث خطأ أثناء تأكيد البريد الإلكتروني' });
  }
};

// @desc    إعادة إرسال كود تأكيد البريد الإلكتروني
// @route   POST /api/auth/resend-verification
// @access  Public
exports.resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'البريد الإلكتروني مطلوب' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'البريد الإلكتروني غير مسجل في المنصة' });
    }

    if (user.isVerified) {
      return res.status(400).json({ success: false, message: 'البريد الإلكتروني مؤكد بالفعل' });
    }

    // حذف أي أكواد قديمة
    await EmailVerification.deleteMany({ user: user._id });

    // توليد كود جديد
    const code = generateResetCode();
    const expiresAt = new Date(Date.now() + EMAIL_VERIFY_EXPIRY_MINUTES * 60 * 1000);

    await EmailVerification.create({
      user: user._id,
      code,
      expiresAt,
    });

    // إرسال الكود
    const sent = await sendVerificationCode(user.email, code, user.profile.firstName);

    if (!sent) {
      return res.status(500).json({
        success: false,
        message: 'حدث خطأ أثناء إرسال البريد الإلكتروني، يرجى المحاولة لاحقاً'
      });
    }

    res.status(200).json({
      success: true,
      message: 'تم إعادة إرسال كود التأكيد إلى بريدك الإلكتروني'
    });

  } catch (error) {
    console.error('Resend Verification Error:', error.message);
    res.status(500).json({ success: false, message: 'حدث خطأ أثناء إعادة إرسال كود التأكيد' });
  }
};
