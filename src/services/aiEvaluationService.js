const { GoogleGenerativeAI } = require('@google/generative-ai');
const RScoreService = require('./rScoreService'); // استدعاء خدمة النقاط الأساسية

// تهيئة Gemini (يجب أن يكون المفتاح في ملف .env في النسخة النهائية)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "ضع_مفتاحك_هنا_مؤقتا");

/**
 * دالة لتقييم النص باستخدام الذكاء الاصطناعي وإرجاع عدد النقاط
 */
const evaluateContent = async (content) => {
  try {
    // إذا كان النص قصيراً جداً (أقل من 3 كلمات)، لا نرسله لتقليل استهلاك الـ API
    if (!content || content.split(' ').length < 3) return 1;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    const prompt = `
      أنت خبير في تقييم جودة المحتوى المهني على منصة تشبه LinkedIn.
      قيم هذا النص من 0 إلى 5 نقاط بناءً على:
      - الاحترافية والفائدة العلمية/المهنية.
      - المجهود المبذول في الكتابة.
      إذا كان مجرد شكر أو كلام عام، أعطه 1 أو 2.
      إذا كان مزعجاً (Spam) أو غير لائق، أعطه 0.
      الرد يجب أن يكون رقماً فقط (مثال: 4).
      
      النص: "${content}"
    `;

    const result = await model.generateContent(prompt);
    let score = parseInt(result.response.text().trim());

    // حماية إضافية للتأكد من أن الرقم منطقي
    if (isNaN(score)) score = 1;
    if (score < 0) score = 0;
    if (score > 5) score = 5;

    return score;
  } catch (error) {
    console.error('[AI Evaluation Error]:', error.message);
    return 1; // نعطي نقطة واحدة كتعويض إذا فشل الاتصال
  }
};

/**
 * دالة الخلفية: تُستدعى من الـ Controllers ولا تجعل المستخدم ينتظر
 */
exports.processDynamicScoring = (userId, content, actionKey) => {
  // setImmediate تفصل هذه العملية عن مسار الطلب الرئيسي (Non-blocking)
  setImmediate(async () => {
    try {
      const dynamicPoints = await evaluateContent(content);
      
      // إذا كان النص ليس سبام (نقاط > 0)، نمنحه النقاط
      if (dynamicPoints > 0) {
        await RScoreService.applyScore(
          userId, 
          actionKey, 
          `تقييم الذكاء الاصطناعي لجودة المحتوى: ${dynamicPoints} نقاط`,
          dynamicPoints // هذا المعامل يخبر الخدمة باستخدام النقاط الديناميكية بدل الثابتة
        );
      }
    } catch (error) {
      console.error('[Background Task Error]:', error.message);
    }
  });
};