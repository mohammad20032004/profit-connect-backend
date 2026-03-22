const Connection = require('../models/Connection');
const User = require('../models/User');

// @desc    إرسال طلب اتصال
// @route   POST /api/network/connect/:userId
exports.sendRequest = async (req, res) => {
  try {
    const recipientId = req.params.userId;
    const requesterId = req.user._id;

    // 1. منع المستخدم من الاتصال بنفسه
    if (recipientId === requesterId.toString()) {
      return res.status(400).json({ success: false, message: 'لا يمكنك إرسال طلب اتصال لنفسك' });
    }

    // 2. التأكد من عدم وجود طلب سابق (بأي حالة: معلق أو مقبول)
    const existingConnection = await Connection.findOne({
      $or: [
        { requester: requesterId, recipient: recipientId },
        { requester: recipientId, recipient: requesterId }
      ]
    });

    if (existingConnection) {
      return res.status(400).json({ success: false, message: 'هناك طلب اتصال موجود بالفعل بينكما' });
    }

    // 3. إنشاء الطلب
    const connection = await Connection.create({
      requester: requesterId,
      recipient: recipientId
    });

    res.status(201).json({ success: true, message: 'تم إرسال طلب الاتصال بنجاح', data: connection });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    قبول طلب اتصال
// @route   PUT /api/network/accept/:requestId
exports.acceptRequest = async (req, res) => {
  try {
    const connection = await Connection.findById(req.params.requestId);

    if (!connection) {
      return res.status(404).json({ success: false, message: 'طلب الاتصال غير موجود' });
    }

    // التأكد أن الشخص الذي يقبل هو المستلم الفعلي للطلب
    if (connection.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'غير مصرح لك بقبول هذا الطلب' });
    }

    connection.status = 'accepted';
    await connection.save();

    res.status(200).json({ success: true, message: 'تم قبول طلب الاتصال، أنتما الآن متصلان!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    جلب طلبات الاتصال الواردة (المعلقة)
// @route   GET /api/network/requests
exports.getPendingRequests = async (req, res) => {
  try {
    const requests = await Connection.find({
      recipient: req.user._id,
      status: 'pending'
    }).populate('requester', 'profile.firstName profile.lastName profile.avatar profile.headline');

    res.status(200).json({ success: true, count: requests.length, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// @desc    جلب قائمة جهات الاتصال (الأصدقاء المقبولين)
// @route   GET /api/network/connections
// @access  Private
// ==========================================
exports.getMyConnections = async (req, res) => {
  try {
    const userId = req.user._id;

    // 1. البحث عن جميع العلاقات المقبولة التي يكون المستخدم طرفاً فيها (سواء مرسل أو مستقبل)
    const connections = await Connection.find({
      $or: [{ requester: userId }, { recipient: userId }],
      status: 'accepted'
    })
    // نجلب بيانات الطرفين لكي نقوم بتصفيتها لاحقاً
    .populate('requester', 'profile.firstName profile.lastName profile.headline profile.avatar')
    .populate('recipient', 'profile.firstName profile.lastName profile.headline profile.avatar');

    // 2. تصفية النتائج: نحن نريد إرجاع بيانات "الشخص الآخر" فقط، وليس بيانات المستخدم نفسه
    const friends = connections.map(conn => {
      // إذا كان المستخدم الحالي هو المرسل، نُرجع بيانات المستقبل
      if (conn.requester._id.toString() === userId.toString()) {
        return conn.recipient;
      } 
      // وإذا كان المستخدم الحالي هو المستقبل، نُرجع بيانات المرسل
      else {
        return conn.requester;
      }
    });

    res.status(200).json({ 
      success: true, 
      count: friends.length, 
      data: friends 
    });
  } catch (error) {
    console.error('Get Connections Error:', error.message);
    res.status(500).json({ success: false, message: 'حدث خطأ أثناء جلب جهات الاتصال' });
  }
};

// ==========================================
// @desc    رفض طلب اتصال
// @route   PUT /api/network/reject/:requestId
// @access  Private
// ==========================================
exports.rejectRequest = async (req, res) => {
  try {
    const connection = await Connection.findById(req.params.requestId);

    if (!connection) {
      return res.status(404).json({ success: false, message: 'طلب الاتصال غير موجود' });
    }

    // 🛡️ حماية أمنية: التأكد أن الشخص الذي يرفض هو المستلم الفعلي للطلب
    if (connection.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'غير مصرح لك برفض هذا الطلب' });
    }

    // تغيير الحالة إلى مرفوض
    connection.status = 'rejected';
    await connection.save();

    res.status(200).json({ success: true, message: 'تم رفض طلب الاتصال' });
  } catch (error) {
    console.error('Reject Request Error:', error.message);
    res.status(500).json({ success: false, message: 'حدث خطأ أثناء رفض الطلب' });
  }
};

// ==========================================
// @desc    إلغاء الاتصال (حذف صديق من الشبكة)
// @route   DELETE /api/network/remove/:userId
// @access  Private
// ==========================================
exports.removeConnection = async (req, res) => {
  try {
    const userId = req.user._id;            // المستخدم الحالي
    const targetUserId = req.params.userId; // الشخص المراد حذفه

    // نبحث عن العلاقة التي تجمع بينهما ونحذفها نهائياً من قاعدة البيانات
    const connection = await Connection.findOneAndDelete({
      $or: [
        { requester: userId, recipient: targetUserId },
        { requester: targetUserId, recipient: userId }
      ],
      status: 'accepted' // يجب أن تكون العلاقة مقبولة أصلاً ليتم حذفها
    });

    if (!connection) {
      return res.status(404).json({ success: false, message: 'لا توجد جهة اتصال حالية لحذفها' });
    }

    res.status(200).json({ success: true, message: 'تم إزالة جهة الاتصال بنجاح' });
  } catch (error) {
    console.error('Remove Connection Error:', error.message);
    res.status(500).json({ success: false, message: 'حدث خطأ أثناء إزالة جهة الاتصال' });
  }
};