const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { buildAvatarUrl, deleteAvatarFile } = require('../utils/avatarStorage');
const { formatUserResponse } = require('../utils/userResponse');

// دالة مساعدة لإنشاء التوكن
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// @desc    إنشاء حساب مستخدم جديد (Signup)
// @route   POST /api/auth/signup
// @access  Public
exports.signup = async (req, res) => {
  try {
    const { firstName, lastName, email, password,role, phoneNumber, industry, yearsOfExperience, skills ,rScore} = req.body;

    // 1. التحقق من وجود المستخدم مسبقاً
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ success: false, message: 'البريد الإلكتروني مسجل بالفعل' });
    }

    // 2. إنشاء المستخدم الجديد
    user = await User.create({
      email,
      password,
      role,
      profile: {
        firstName,
        lastName,
        phoneNumber,
        ...(req.file ? { avatar: buildAvatarUrl(req, req.file.filename) } : {}),
      },
      professional: {
        industry,
        yearsOfExperience,
        skills
      }
    });

    // 3. إنشاء التوكن
    const token = generateToken(user._id);

    // 4. إرجاع الاستجابة حسب الهيكلة المطلوبة
    res.status(201).json({
      success: true,
      token,
      user: formatUserResponse(user)
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
    // ملاحظة: استخدمنا .select('+password') لأننا في نموذج المستخدم (Schema) 
    // قمنا بضبط select: false لكلمة المرور لحمايتها، وهنا نحتاج جلبها للمقارنة
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'بيانات الدخول غير صحيحة' // نستخدم رسالة مبهمة لدواعي أمنية
      });
    }

    // 3. التحقق من تطابق كلمة المرور باستخدام الدالة التي أنشأناها في المودل
    const isMatch = await user.matchPassword(password);
    
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'بيانات الدخول غير صحيحة' 
      });
    }

    // 4. إنشاء التوكن (Token)
    const token = generateToken(user._id);

    // 5. إرجاع الاستجابة المطلوبة للـ Frontend
    res.status(200).json({
      success: true,
      token,
      user: formatUserResponse(user)
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    التحقق من التوكن وإرجاع المستخدم الحالي
// @route   GET /api/auth/me
// @access  Private
exports.getCurrentUser = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      user: formatUserResponse(req.user),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
