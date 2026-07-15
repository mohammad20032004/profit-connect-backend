const Company = require('../models/Company');
const User = require('../models/User');

// @desc    جلب جميع الشركات المعلقة التي تنتظر الموافقة
// @route   GET /api/admin/companies/pending
// @access  Private/Admin
exports.getPendingCompanies = async (req, res) => {
  try {
    const companies = await Company.find({ status: 'Pending' })
      .populate('owner', 'profile.firstName profile.lastName email');

    res.status(200).json({ success: true, count: companies.length, data: companies });
  } catch (error) {
    res.status(500).json({ success: false, message: 'حدث خطأ أثناء جلب الشركات المعلقة' });
  }
};

// @desc    الموافقة على شركة أو رفضها
// @route   PUT /api/admin/companies/:id/status
// @access  Private/Admin
exports.updateCompanyStatus = async (req, res) => {
  try {
    const { status, rejectionReason } = req.body; // يتوقع أن نرسل 'Approved' أو 'Rejected'

    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'الحالة يجب أن تكون Approved أو Rejected' });
    }

    const company = await Company.findById(req.params.id);

    if (!company) {
      return res.status(404).json({ success: false, message: 'الشركة غير موجودة' });
    }

    company.status = status;

    // إذا تمت الموافقة، نجعل الشركة موثقة أيضاً
    if (status === 'Approved') {
      company.isVerified = true;
      company.rejectionReason = '';
    } else {
      // عند الرفض نسجّل سبب الرفض إن وُجد
      company.isVerified = false;
      company.rejectionReason = rejectionReason || '';
    }

    await company.save();

    res.status(200).json({ success: true, message: `تم تغيير حالة الشركة إلى ${status}`, data: company });
  } catch (error) {
    res.status(500).json({ success: false, message: 'حدث خطأ أثناء تحديث حالة الشركة' });
  }
};

// @desc    منح/تعديل دور مستخدم (مثلاً ترقيته إلى Employer ليسمح له بإنشاء شركات)
// @route   PUT /api/admin/users/:id/role
// @access  Private/Admin
exports.setUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const allowedRoles = ['Employer', 'JobSeeker', 'Admin', 'FreelanceClient'];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ success: false, message: 'الدور غير صالح' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
    }

    user.role = role;
    await user.save();

    res.status(200).json({
      success: true,
      message: `تم تعيين دور المستخدم إلى ${role}`,
      data: { id: user._id, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'حدث خطأ أثناء تحديث دور المستخدم' });
  }
};

