const { OpenAI } = require('openai');
const RScoreService = require('./rScoreService');

// إعداد الاتصال
const openai = new OpenAI({
  baseURL: 'http://127.0.0.1:1234/v1',
  apiKey: 'lm-studio',
});

// تعريف الدالة كمتغير لضمان رؤيتها في كل مكان في الملف
const evaluateContent = async (content) => {
  try {
    if (!content || content.split(' ').length < 3) return 1;

    const completion = await openai.chat.completions.create({
      model: "local-model",
      messages: [
        { 
          role: "system", 
          // 💡 التعديل هنا: تعليمات صريحة بشأن المحتوى النابي
          content: "أنت خبير تقييم محتوى مهني. إذا كان النص يحتوي على شتائم، كلمات نابية، تنمر، أو محتوى غير لائق، أجب بـ -1 حصراً. إذا كان مقبولاً، أجب برقم من 0 إلى 5 حسب الجودة. أجب برقم فقط." 
        },
        { 
          role: "user", 
          content: `قيم هذا النص: "${content}"` 
        }
      ],
      temperature: 0.1,
      max_tokens: 5,
    });

    const rawResponse = completion.choices[0].message.content.trim();
    let score = parseInt(rawResponse);

    // 💡 التعديل هنا: السماح بـ -1 وعدم حصرها بـ 0
    if (isNaN(score)) score = 1;
    if (score < -1) score = -1; // نمنع أي رقم أصغر من -1
    if (score > 5) score = 5;

    return score;
  } catch (error) {
    console.error('[Local AI Evaluation Error]:', error.message);
    return 1;
  }
};// تعريف دالة المعالجة الخلفية كمتغير أيضاً
const processDynamicScoring = (userId, content, actionKey) => {
  setImmediate(async () => {
    try {
      const dynamicPoints = await evaluateContent(content);
      
      if (dynamicPoints > 0) {
        await RScoreService.applyScore(
          userId, 
          actionKey, 
          `تقييم الذكاء المحلي لجودة المحتوى: ${dynamicPoints} نقاط`,
          dynamicPoints 
        );
      }
    } catch (error) {
      console.error('[Background Task Error]:', error.message);
    }
  });
};

// تصدير الدوال بشكل صحيح وواضح
module.exports = {
  evaluateContent,
  processDynamicScoring
};