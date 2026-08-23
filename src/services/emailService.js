const EMAILJS_API_URL = 'https://api.emailjs.com/api/v1.0/email/send';

/**
 * إرسال بريد إلكتروني عبر EmailJS
 * @param {string} templateName - اسم القالب في EmailJS
 * @param {object} templateParams - المتغيرات المرسلة للقالب
 * @param {string} toEmail - البريد الإلكتروني للمستلم
 */
async function sendEmail(templateName, templateParams, toEmail) {
  const serviceId = process.env.EMAILJS_SERVICE_ID;
  const privateKey = process.env.EMAILJS_PRIVATE_KEY;

  if (!serviceId || !privateKey) {
    console.error('[EmailJS] Missing EMAILJS_SERVICE_ID or EMAILJS_PRIVATE_KEY in .env');
    return false;
  }

  const payload = {
    service_id: serviceId,
    template_id: templateName,
    user_id: process.env.EMAILJS_PUBLIC_KEY,
    accessToken: privateKey,
    template_params: {
      to_email: toEmail,
      email: toEmail,
      ...templateParams,
    },
  };

  try {
    const response = await fetch(EMAILJS_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('[EmailJS] Send failed:', response.status, text);
      return false;
    }

    console.log(`[EmailJS] Email sent to ${toEmail} via template "${templateName}"`);
    return true;
  } catch (error) {
    console.error('[EmailJS] Error:', error.message);
    return false;
  }
}

/**
 * إرسال كود إعادة تعيين كلمة المرور
 */
async function sendResetCode(email, code, firstName) {
  return sendEmail(
    process.env.EMAILJS_RESET_TEMPLATE || 'password_reset',
    {
      to_name: firstName || 'المستخدم',
      reset_code: code,
      message: `كود إعادة تعيين كلمة المرور الخاص بك هو: ${code}`,
    },
    email
  );
}

/**
 * إرسال كود تأكيد البريد الإلكتروني
 */
async function sendVerificationCode(email, code, firstName) {
  return sendEmail(
    process.env.EMAILJS_VERIFICATION_TEMPLATE || 'email_verification',
    {
      to_name: firstName || 'المستخدم',
      verification_code: code,
      message: `كود تأكيد بريدك الإلكتروني هو: ${code}`,
    },
    email
  );
}

module.exports = { sendEmail, sendResetCode, sendVerificationCode };
