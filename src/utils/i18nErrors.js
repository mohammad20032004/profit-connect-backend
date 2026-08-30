// أداة رسائل الخطأ متعددة اللغات
// الهدف: توحيد رسائل الخطأ بحقل code ثابت + message مترجمة حسب لغة الطلب.
// يمكن للفرونت‌إند الاستفادة منها لعرض رسائل (مثل انقطاع الاتصال) بعدة لغات وبحجم كبير.
//
// طريقة الإضافة: أضف كوداً جديداً داخل errorMessages مع ترجماته (ar, en, fr, ...).
// طريقة الاستخدام في الـ controller:
//   const { sendError } = require('../utils/i18nErrors');
//   return sendError(res, 404, 'NOT_FOUND', { lang: getLangFromReq(req) });

const errorMessages = {
  NOT_FOUND: {
    ar: 'المسار غير موجود',
    en: 'Route not found',
  },
  SERVER_ERROR: {
    ar: 'حدث خطأ في الخادم',
    en: 'An internal server error occurred',
  },
  NETWORK_OFFLINE: {
    ar: 'لا يوجد اتصال بالإنترنت. يرجى التحقق من شبكتك والمحاولة مرة أخرى',
    en: 'No internet connection. Please check your network and try again',
  },
  CONNECTION_TIMEOUT: {
    ar: 'انتهت مهلة الاتصال بالخادم، يرجى المحاولة لاحقاً',
    en: 'Connection to the server timed out, please try again later',
  },
  UNAUTHORIZED: {
    ar: 'غير مصرح لك بالوصول',
    en: 'You are not authorized to access this resource',
  },
  FORBIDDEN: {
    ar: 'غير مسموح لك بتنفيذ هذا الإجراء',
    en: 'You are not allowed to perform this action',
  },
  VALIDATION_ERROR: {
    ar: 'بيانات غير صالحة',
    en: 'Invalid input data',
  },
  BAD_REQUEST: {
    ar: 'طلب غير صالح',
    en: 'Bad request',
  },
};

const SUPPORTED_LANGS = ['ar', 'en'];

function normalizeLang(value) {
  if (!value) return 'ar';
  const lang = value
    .split(',')[0]
    .trim()
    .split('-')[0]
    .toLowerCase();
  return SUPPORTED_LANGS.includes(lang) ? lang : 'ar';
}

function getLangFromReq(req) {
  if (!req) return 'ar';
  const header = req.get && req.get('Accept-Language');
  const query = req.query && req.query.lang;
  const body = req.body && req.body.lang;
  return normalizeLang(header || query || body);
}

function localize(code, lang = 'ar') {
  const entry = errorMessages[code] || errorMessages.SERVER_ERROR;
  return entry[lang] || entry.ar || entry.en;
}

function sendError(res, status, code, options = {}) {
  const lang = options.lang || 'ar';
  const payload = {
    success: false,
    code,
    message: localize(code, lang),
  };
  if (options.extra) Object.assign(payload, options.extra);
  return res.status(status).json(payload);
}

module.exports = {
  errorMessages,
  SUPPORTED_LANGS,
  normalizeLang,
  getLangFromReq,
  localize,
  sendError,
};
