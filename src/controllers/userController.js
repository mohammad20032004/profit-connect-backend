const User = require('../models/User');
const { buildAvatarUrl, deleteAvatarFile } = require('../utils/avatarStorage');
const { formatUserResponse } = require('../utils/userResponse');
const RScoreService = require('../services/rScoreService');
const { evaluateProfileCompletion } = require('../services/profileScoreService');
// @desc    الحصول على بيانات الملف الشخصي للمستخدم الحالي
// @route   GET /api/user/profile
// @access  Private (يحتاج توكن)
exports.getUserProfile = async (req, res) => {
  try {
    // بفضل حارس البوابة (authMiddleware)، أصبح لدينا الآن req.user جاهزاً!
    // الحارس قام بالفعل بالبحث عن المستخدم في قاعدة البيانات ووضعه هنا.
    const user = req.user; 

    // إذا أردت التأكد من جلب أحدث البيانات (أو جلب بيانات مرتبطة لاحقاً مثل المتابعين)
    // يمكنك استخدام: await User.findById(req.user._id);

    res.status(200).json({
      success: true,
      data: formatUserResponse(user)
    });

  } catch (error) {
    console.error('Profile Error:', error.message);
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
};


// @desc    تحديث بيانات الملف الشخصي للمستخدم الحالي
// @route   PUT /api/user/profile
// @access  Private (يحتاج توكن)
// @desc    تحديث بيانات الملف الشخصي للمستخدم الحالي
exports.updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });

    // حفظ نسخة من البيانات القديمة قبل التعديل لمقارنتها لاحقاً
    const oldUser = user.toObject();

    const { firstName, lastName, bio, headline, location, phoneNumber, skills, industry, yearsOfExperience, socialLinks } = req.body;

    if (firstName)  user.profile.firstName  = firstName;
    if (lastName)   user.profile.lastName   = lastName;
    if (bio)        user.profile.bio        = bio;
    if (headline)   user.profile.headline   = headline;
    if (location)   user.profile.location   = location;
    if (phoneNumber) user.profile.phoneNumber = phoneNumber;
    if (socialLinks?.linkedin) user.profile.socialLinks.linkedin = socialLinks.linkedin;
    if (socialLinks?.github)   user.profile.socialLinks.github   = socialLinks.github;
    if (socialLinks?.website)  user.profile.socialLinks.website  = socialLinks.website;
    if (skills)         user.professional.skills         = skills;
    if (industry)       user.professional.industry       = industry;
    if (yearsOfExperience !== undefined) user.professional.yearsOfExperience = yearsOfExperience;

    const updatedUser = await user.save();

    // تقييم الملف الشخصي ومنح النقاط في الخلفية
    evaluateProfileCompletion(user._id, oldUser, updatedUser.toObject());

    res.status(200).json({ success: true, message: 'تم التحديث بنجاح', data: formatUserResponse(updatedUser) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'حدث خطأ أثناء تحديث البيانات' });
  }
};
// @desc    تحديث الصورة الشخصية للمستخدم الحالي
// @route   PUT /api/user/profile/avatar
// @access  Private (يحتاج توكن)
// @desc    تحديث الصورة الشخصية للمستخدم الحالي
exports.updateUserAvatar = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'يرجى رفع صورة' });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });

    const oldAvatar = user.profile.avatar;
    user.profile.avatar = buildAvatarUrl(req, req.file.filename);

    // 🌟 1. مكافأة رفع الصورة لأول مرة (ONCE)
    if (oldAvatar === 'default-avatar.png') {
       await RScoreService.applyScore(user._id, 'UPLOAD_AVATAR', 'مكافأة إكمال الملف الشخصي: صورة العرض');
       user.profile.rScore += 10; // تحديث فوري للرد
    }

    const updatedUser = await user.save();

    if (oldAvatar && oldAvatar !== updatedUser.profile.avatar) {
      await deleteAvatarFile(oldAvatar);
    }

    res.status(200).json({
      success: true,
      message: 'تم تحديث الصورة الشخصية بنجاح',
      data: { avatar: formatUserResponse(updatedUser).profile.avatar, user: formatUserResponse(updatedUser) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'حدث خطأ أثناء تحديث الصورة الشخصية' });
  }
};
// @desc    حذف حساب المستخدم الحالي نهائياً
// @route   DELETE /api/user/profile
// @access  Private (يحتاج توكن)
exports.deleteUserProfile = async (req, res) => {
  try {
    // 1. نبحث عن المستخدم بواسطة الـ ID الخاص به (المستخرج من التوكن)
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
    }

    // 2. نقوم بحذف المستخدم من قاعدة البيانات
    await user.deleteOne();

    // 3. إرجاع رسالة نجاح
    res.status(200).json({
      success: true,
      message: 'تم حذف الحساب وبياناته بنجاح'
    });

  } catch (error) {
    console.error('Delete Profile Error:', error.message);
    res.status(500).json({ success: false, message: 'حدث خطأ أثناء حذف الحساب' });
  }
};


// @desc    الحصول على بيانات مستخدم آخر بواسطة الـ ID
// @route   GET /api/user/:userId
// @access  Private (يحتاج توكن)
exports.getUserById = async (req, res) => {
  try {
    // نجلب المستخدم ونستبعد كلمة المرور
    const user = await User.findById(req.params.userId).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
    }

    res.status(200).json({
      success: true,
      data: formatUserResponse(user)
    });
  } catch (error) {
    console.error('Get User By Id Error:', error.message);
    // معالجة خطأ كتابة ID بصيغة غير صحيحة
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
    }
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
};
