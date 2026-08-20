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

// منع المستخدم من إرسال أكثر من 3 بلاغات في الدقيقة الواحدة
exports.reportLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 3,
  message: {
    success: false,
    message: 'لقد قمت بإرسال الكثير من البلاغات بسرعة. يرجى الانتظار قليلاً.'
  }
});