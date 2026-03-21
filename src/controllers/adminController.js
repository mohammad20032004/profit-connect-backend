const Company = require('../models/Company');

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
    const { status } = req.body; // يتوقع أن نرسل 'Approved' أو 'Rejected'

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
    }

    await company.save();

    res.status(200).json({ success: true, message: `تم تغيير حالة الشركة إلى ${status}`, data: company });
  } catch (error) {
    res.status(500).json({ success: false, message: 'حدث خطأ أثناء تحديث حالة الشركة' });
  }
};