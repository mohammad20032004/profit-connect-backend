const sanitizeHtml = require('sanitize-html');

// قائمة السماح (whitelist) لوسوم التنسيق المدعومة في محتوى المنشور
const POST_ALLOWED_TAGS = ['b', 'strong', 'i', 'em', 'u', 's', 'span', 'br', 'p', 'a'];

// تعقيم محتوى المنشور للسماح فقط بـ (عريض، مائل، تحته خط، لون، رابط)
const sanitizePostContent = (dirty) => {
  if (!dirty) return dirty;
  return sanitizeHtml(dirty, {
    allowedTags: POST_ALLOWED_TAGS,
    allowedAttributes: {
      span: ['style'],
      a: ['href'],
    },
    // نسمح فقط بخاصية اللون (hex أو rgb) لمنع أي كود خطير
    allowedStyles: {
      span: {
        color: [/^#[0-9a-fA-F]{3,6}$/, /^rgb\(\s*\d{1,3}%?\s*,\s*\d{1,3}%?\s*,\s*\d{1,3}%?\s*\)$/],
      },
    },
    allowedSchemes: ['http', 'https'],
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer', target: '_blank' }),
    },
  });
};

// إزالة كل الوسوم للحصول على نص عادي (يُستخدم قبل تقييم المحتوى بالذكاء)
const stripHtml = (html) => sanitizeHtml(html || '', { allowedTags: [], allowedAttributes: {} });

module.exports = { sanitizePostContent, stripHtml };
