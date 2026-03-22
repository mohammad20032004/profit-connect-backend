const mongoose = require('mongoose');

const connectionSchema = new mongoose.Schema(
  {
    // الشخص الذي أرسل الطلب
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    // الشخص المستلم للطلب
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    // حالة الطلب
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending'
    }
  },
  { timestamps: true }
);

// منع إرسال أكثر من طلب بين نفس الشخصين
connectionSchema.index({ requester: 1, recipient: 1 }, { unique: true });

module.exports = mongoose.model('Connection', connectionSchema);