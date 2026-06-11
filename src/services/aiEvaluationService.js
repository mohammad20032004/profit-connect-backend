const { OpenAI } = require('openai');
const RScoreService = require('./rScoreService');

const openai = new OpenAI({
  baseURL: process.env.LM_STUDIO_BASE_URL || 'http://127.0.0.1:1234/v1',
  apiKey: process.env.LM_STUDIO_API_KEY || 'lm-studio',
});

const SYSTEM_PROMPT = `You are an expert AI content moderator and quality evaluator. Your task is to analyze and score user-generated content based on safety and quality standards.

EVALUATION PROCESS:

STEP 1 - SAFETY CHECK:
First, check if the content contains ANY of the following:
- Profanity, swear words, or vulgar language
- Hate speech, discrimination, or harassment
- Bullying, threats, or intimidation
- Sexual explicit content or nudity
- Violence or graphic content
- Spam, scams, or misleading information
- Personal attacks or defamatory statements
- Illegal activities or harmful behavior

→ If ANY of these are present: Respond with "-1" immediately (do not proceed to quality scoring)

STEP 2 - QUALITY SCORING (only if content passes safety check):
Rate the content quality from 0 to 5 based on these criteria:

0 - POOR: Very short, unclear, irrelevant, or meaningless content
1 - BELOW AVERAGE: Minimal effort, lacks substance, somewhat unclear
2 - AVERAGE: Basic content, understandable but lacks depth or engagement
3 - GOOD: Clear, relevant, shows effort, moderately engaging or informative
4 - VERY GOOD: Well-written, engaging, provides value, thoughtful content
5 - EXCELLENT: Outstanding quality, highly engaging, very informative, well-structured, adds significant value

RESPONSE FORMAT:
- Return ONLY a single integer number: -1, 0, 1, 2, 3, 4, or 5
- Do not include any explanation, text, or additional information
- Examples: "-1" or "3" or "5"

CONTENT TO EVALUATE:
[Insert text here]`;

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

// تقييم بسياق مخصص (للملف الشخصي)
const evaluateWithContext = async (content, systemPrompt) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const completion = await openai.chat.completions.create({
      model: process.env.LM_STUDIO_MODEL || 'local-model',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `قيم هذا النص: ${content}` },
      ],
      temperature: 0.1,
      max_tokens: 5,
    }, { signal: controller.signal });

    let score = parseInt(completion.choices[0].message.content.trim());
    if (isNaN(score)) score = 1;
    if (score < 0) score = 0;
    if (score > 5) score = 5;
    return score;
  } catch (error) {
    console.error('[AI Context Evaluation Error]:', error.message);
    return 1;
  } finally {
    clearTimeout(timeout);
  }
};

module.exports = { evaluateContent, evaluateWithContext, processDynamicScoring };
