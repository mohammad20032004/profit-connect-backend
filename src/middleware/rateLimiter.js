const rateLimit = require('express-rate-limit');

// منع المستخدم من إضافة أكثر من 5 تعليقات في الدقيقة الواحدة
exports.commentLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // إطار زمني: دقيقة واحدة
  max: 5, // الحد الأقصى: 5 طلبات في الدقيقة
  message: {
    success: false,
    message: 'لقد قمت بكتابة الكثير من التعليقات بسرعة. يرجى الانتظار قليلاً.'
  }
});