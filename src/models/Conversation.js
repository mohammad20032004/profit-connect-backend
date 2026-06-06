const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  },
  lastMessageAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// فهرس للبحث السريع عن محادثة بين مستخدمين
conversationSchema.index({ participants: 1 });

module.exports = mongoose.model('Conversation', conversationSchema);
