// الطبقة الخامسة: التجميع النهائي ودمج قيمة تشخيص النموذج المحلي
const phraseDetector = require('./phraseDetector');
const structureAnalyzer = require('./structureAnalyzer');
const linguisticAnalyzer = require('./linguisticAnalyzer');
const vocabularyAnalyzer = require('./vocabularyAnalyzer');
const { detectAIGenerated } = require('../services/aiEvaluationService');

// كشف لغة النص (عربي/إنجليزي)
const detectLanguage = (text) => {
  if (/[؀-ۿ]/.test(text || '')) return 'ar';
  return 'en';
};

// تحويل محتوى HTML إلى نص متعدد الأسطر (لكي تعمل تحليلات البنية لكل سطر)
const toPlainLines = (html) => {
  return (html || '')
    .replace(/<\/p>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{2,}/g, '\n')
    .trim();
};

/**
 * يشغّل الطبقات الأربع ثم يدمجها مع قيمة النموذج المحلي في نسبة نهائية.
 * @param {string} text المحتوى الخام (قد يحتوي وسوم HTML)
 * @returns { probability, language, modelProbability, layers, signals }
 */
const run = async (text) => {
  const lang = detectLanguage(text);
  const plain = toPlainLines(text);

  const phrase = phraseDetector.detect(plain, lang);
  const structure = structureAnalyzer.detect(plain, lang);
  const linguistic = linguisticAnalyzer.detect(plain, lang);
  const vocabulary = vocabularyAnalyzer.detect(plain, lang);

  // القيمة من النموذج المحلي (localOnly)
  let modelProbability = await detectAIGenerated(text);

  // تجميع القواعد بتقنية Noisy-OR: أي طبقة مرتفعة ترفع النهائية بقوة،
  // والنص البشري (كل الطبقات منخفضة) يبقى منخفضاً.
  const layerProbs = [phrase.score, structure.score, linguistic.score, vocabulary.score].map(s => s / 100);
  const ruleCombined = 1 - layerProbs.reduce((acc, p) => acc * (1 - p), 1);

  // تعزيز القواعد: الأس أقل من 1 يرفع القيم المتوسطة/المرتفعة بقوة
  const GAMMA = 0.6;
  const ruleBoosted = Math.pow(ruleCombined, GAMMA);
  const ruleScore = Math.round(ruleBoosted * 100);

  // الدمج مع قيمة النموذج: القواعد مهيمنة (0.85) لأن النموذج المحلي غير موثوق،
  // فيساهم بحد أقصى 15 نقطة ولا يمكنه رفع نص بشري من تلقاء نفسه.
  let probability;
  if (modelProbability === null || Number.isNaN(modelProbability)) {
    probability = ruleScore;
  } else {
    probability = Math.round(ruleScore * 0.85 + modelProbability * 0.15);
  }

  const signals = [
    ...phrase.signals.map(s => `phrase:${s}`),
    ...structure.signals.map(s => `structure:${s}`),
    ...linguistic.signals.map(s => `linguistic:${s}`),
    ...vocabulary.signals.map(s => `vocab:${s}`),
  ];

  return {
    probability,
    language: lang,
    modelProbability,
    layers: {
      phrase: phrase.score,
      structure: structure.score,
      linguistic: linguistic.score,
      vocabulary: vocabulary.score,
      ruleScore: ruleScore,
    },
    signals,
  };
};

module.exports = { run, detectLanguage, toPlainLines };
