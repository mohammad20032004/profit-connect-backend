const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
  let token;

  // 1. التأكد من وجود التوكن في الترويسة (Headers) وأنه يبدأ بكلمة Bearer
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // 2. استخراج التوكن (فصل كلمة Bearer عن التوكن الفعلي)
      token = req.headers.authorization.split(' ')[1];

      // 3. فك تشفير التوكن والتأكد من صحته باستخدام المفتاح السري
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 4. البحث عن المستخدم في قاعدة البيانات باستخدام الـ ID الموجود داخل التوكن
      // ونقوم باستبعاد كلمة المرور من النتيجة لزيادة الأمان
      req.user = await User.findById(decoded.id).select('-password');

      // إذا كان المستخدم غير موجود (مثلاً تم حذف حسابه مؤخراً)
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'المستخدم غير موجود، التوكن غير صالح',
        });
      }

      // 5. السماح للطلب بالمرور إلى الـ Controller التالي
      next();
    } catch (error) {
      console.error('Auth Error:', error.message);
      return res.status(401).json({
        success: false,
        message: 'غير مصرح لك بالوصول، التوكن غير صالح أو منتهي الصلاحية',
      });
    }
  }

  // إذا لم يتم إرسال توكن من الأساس
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'غير مصرح لك بالوصول، يرجى تسجيل الدخول أولاً',
    });
  }
};