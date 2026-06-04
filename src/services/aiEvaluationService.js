const { OpenAI } = require('openai');
const RScoreService = require('./rScoreService');

const openai = new OpenAI({
  baseURL: process.env.LM_STUDIO_BASE_URL || 'http://127.0.0.1:1234/v1',
  apiKey: process.env.LM_STUDIO_API_KEY || 'lm-studio',
});

const SYSTEM_PROMPT = `أنت خبير تقييم محتوى مهني. قيّم النص التالي:
- إذا احتوى على شتائم أو كلمات نابية أو تنمر أو محتوى غير لائق: أجب بـ -1 حصراً
- إذا كان مقبولاً: أجب برقم من 0 إلى 5 حسب الجودة (0=عادي، 5=ممتاز)
أجب برقم فقط، مثال: -1 أو 3`;

const evaluateContent = async (content) => {
  if (!content?.trim()) return 1;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const completion = await openai.chat.completions.create({
      model: process.env.LM_STUDIO_MODEL || 'local-model',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `قيم هذا النص: ${content}` },
      ],
      temperature: 0.1,
      max_tokens: 5,
    }, { signal: controller.signal });

    let score = parseInt(completion.choices[0].message.content.trim());

    if (isNaN(score)) score = 1;
    if (score < -1) score = -1;
    if (score > 5) score = 5;

    return score;
  } catch (error) {
    console.error('[AI Evaluation Error]:', error.message);
    return 1;
  } finally {
    clearTimeout(timeout);
  }
};

const processDynamicScoring = (userId, content, actionKey) => {
  setImmediate(async () => {
    try {
      const score = await evaluateContent(content);

      if (score === -1) {
        await RScoreService.applyScore(userId, 'bad_content', 'محتوى غير لائق', -5);
      } else if (score > 0) {
        await RScoreService.applyScore(userId, actionKey, `جودة المحتوى: ${score} نقاط`, score);
      }
    } catch (error) {
      console.error('[Background Task Error]:', error.message);
    }
  });
};

module.exports = { evaluateContent, processDynamicScoring };
