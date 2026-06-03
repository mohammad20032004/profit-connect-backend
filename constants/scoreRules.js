// أنواع القيود: 
// ONCE: تمنح مرة واحدة فقط في عمر الحساب (مثل رفع الصورة)
// DAILY_LIMIT: لها حد أقصى من النقاط في اليوم الواحد (مثل كتابة المنشورات)
// UNLIMITED: بدون قيود (مثل الخصومات أو العقوبات)

const SCORE_RULES = {
  UPLOAD_AVATAR: { points: 10, type: 'ONCE' },
  COMPLETE_PROFILE: { points: 15, type: 'ONCE' },
  ADD_SKILL: { points: 2, type: 'DAILY_LIMIT', maxDaily: 10 }, // 5 مهارات كحد أقصى يومياً
  CREATE_POST: { points: 5, type: 'DAILY_LIMIT', maxDaily: 20 }, // 4 منشورات تُكافأ يومياً كحد أقصى
  RECEIVE_LIKE: { points: 1, type: 'DAILY_LIMIT', maxDaily: 50 },
  ADD_COMMENT: { points: 2, type: 'DAILY_LIMIT', maxDaily: 20 },
  FOLLOW_COMPANY: { points: 1, type: 'DAILY_LIMIT', maxDaily: 10 },
  PENALTY_VIOLATION: { points: -20, type: 'UNLIMITED' } // خصم للمخالفات
};

module.exports = SCORE_RULES;