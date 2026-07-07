const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'عنوان المشروع مطلوب'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'وصف المشروع مطلوب'],
  },
  category: {
    type: String,
    required: [true, 'التصنيف مطلوب'],
    trim: true,
  },
  skills: [String],
  budget: {
    min: { type: Number, default: 0 },
    max: { type: Number, default: 0 },
    currency: { type: String, default: 'SAR' },
  },
  deadline: Date,
  status: {
    type: String,
    enum: ['Open', 'InProgress', 'Completed', 'Cancelled'],
    default: 'Open',
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  attachments: [String],
}, { timestamps: true });

module.exports = mongoose.model('Project', projectSchema);
