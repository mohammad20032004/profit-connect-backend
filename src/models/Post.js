const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    // ربط المنشور بصاحبه (المؤلف)
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: [true, 'محتوى المنشور مطلوب'],
      trim: true
    },
    image: {
      type: String,
      default: null
    },
    video: {
      type: String,
      default: null
    },
    visibility: {
      type: String,
      enum: ['public', 'private', 'connections'],
      default: 'public'
    },
    // مصفوفة تحتوي على معرّفات (IDs) الأشخاص الذين أعجبوا بالمنشور
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    // مصفوفة التعليقات (كل تعليق يحتوي على صاحبه، ومحتواه، ووقت كتابته)
    comments: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true
        },
        content: {
          type: String,
          required: true,
          trim: true
        },
        createdAt: {
          type: Date,
          default: Date.now
        }
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model('Post', postSchema);