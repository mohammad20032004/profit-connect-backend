const User = require('../models/User');
const jwt = require('jsonwebtoken');

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
    const { firstName, lastName, email, password,role, phoneNumber, industry, yearsOfExperience, skills } = req.body;

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
        phoneNumber
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
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        username: user.username,
        profile: user.profile
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};