const User = require('../models/User');

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
      data: user
    });

  } catch (error) {
    console.error('Profile Error:', error.message);
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
};


// @desc    تحديث بيانات الملف الشخصي للمستخدم الحالي
// @route   PUT /api/user/profile
// @access  Private (يحتاج توكن)
exports.updateUserProfile = async (req, res) => {
  try {
    // 1. نجلب المستخدم من قاعدة البيانات باستخدام الـ ID القادم من التوكن (req.user)
    const user = await User.findById(req.user._id);

    if (user) {
      // 2. تحديث البيانات الشخصية (إذا تم إرسالها في الطلب، وإلا نحتفظ بالقيمة القديمة)
      user.profile.firstName = req.body.firstName || user.profile.firstName;
      user.profile.lastName = req.body.lastName || user.profile.lastName;
      user.profile.headline = req.body.headline || user.profile.headline;
      user.profile.bio = req.body.bio || user.profile.bio;
      user.profile.location = req.body.location || user.profile.location;
      user.profile.avatar = req.body.avatar || user.profile.avatar;
      user.profile.phoneNumber = req.body.phoneNumber || user.profile.phoneNumber;

      // 3. تحديث الروابط الاجتماعية (نتأكد أولاً أن المستخدم أرسل كائن socialLinks)
      if (req.body.socialLinks) {
        user.profile.socialLinks.linkedin = req.body.socialLinks.linkedin || user.profile.socialLinks.linkedin;
        user.profile.socialLinks.github = req.body.socialLinks.github || user.profile.socialLinks.github;
        user.profile.socialLinks.website = req.body.socialLinks.website || user.profile.socialLinks.website;
      }

      // 4. تحديث البيانات المهنية
      if (req.body.industry) user.professional.industry = req.body.industry;
      if (req.body.yearsOfExperience) user.professional.yearsOfExperience = req.body.yearsOfExperience;
      if (req.body.skills) user.professional.skills = req.body.skills; // skills عبارة عن مصفوفة (Array)

      // 5. حفظ البيانات في قاعدة البيانات (هنا سيتدخل الـ pre('save') لتحديث الـ fullname إن لزم الأمر)
      const updatedUser = await user.save();

      // 6. إرسال الاستجابة مع البيانات المُحدثة
      res.status(200).json({
        success: true,
        message: 'تم تحديث الملف الشخصي بنجاح',
        data: updatedUser
      });
    } else {
      res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
    }
  } catch (error) {
    console.error('Update Profile Error:', error.message);
    res.status(500).json({ success: false, message: 'حدث خطأ أثناء تحديث البيانات' });
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