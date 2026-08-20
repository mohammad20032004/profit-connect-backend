const mongoose = require('mongoose');

const postReportSchema = new mongoose.Schema(
  {
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      required: true
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    postOwner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    reason: {
      type: String,
      enum: [
        'spam',
        'nudity',
        'violence',
        'hate_speech',
        'misinformation',
        'harassment',
        'copyright',
        'self_harm',
        'other'
      ],
      required: true
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: ''
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'dismissed'],
      default: 'pending'
    }
  },
  { timestamps: true }
);

postReportSchema.index({ post: 1, reportedBy: 1 }, { unique: true });
postReportSchema.index({ postOwner: 1, createdAt: -1 });

module.exports = mongoose.model('PostReport', postReportSchema);
