const mongoose = require('mongoose');

const scoreHistorySchema = new mongoose.Schema(
  {
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    actionKey: { 
      type: String, 
      required: true,
      index: true // تسريع عمليات البحث المستمرة
    },
    points: { 
      type: Number, 
      required: true 
    },
    description: { 
      type: String 
    }
  }, 
  { timestamps: true }
);

module.exports = mongoose.model('ScoreHistory', scoreHistorySchema);