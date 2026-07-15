// الطبقة الأولى: كشف العبارات النمطية الشائعة في نصوص الذكاء الاصطناعي (عربي/إنجليزي)
const PHRASES = {
  en: [
    "it's worth noting", "it is worth noting", "in conclusion", "to conclude",
    "moreover", "furthermore", "additionally", "in addition", "delve",
    "in today's", "in today's world", "in the digital age", "it is important to",
    "it's important to", "as an ai", "navigating the complexities",
    "when it comes to", "a testament to", "underscores", "robust", "leverage",
    "fostering", "foster", "in the realm of", "plays a pivotal role",
    "it's crucial to", "it is crucial to", "bear in mind", "in essence",
    "to sum up", "overall", "in summary", "it should be noted",
    "in the landscape of", "at its core", "dive into", "unravel",
    "in the context of", "serves as", "embark on", "myriad", "underscoring"
  ],
  ar: [
    "من الجدير بالذكر", "لا شك أن", "في الختام", "بكل تأكيد", "يمكن القول إن",
    "من المهم أن", "في ظل التطورات", "إن من", "يتضح لنا", "على سبيل المثال لا الحصر",
    "يُعد", "يُسهم", "يبرز", "بشكل عام", "في سياق", "يلعب دوراً", "من هذا المنظور",
    "في عصرنا الحالي", "من الناحية", "من الضروري", "لا بد من", "تجدر الإشارة",
    "من هنا نجد", "في المحصلة", "بعبارة أخرى", "لذا فإن", "تتجلى أهمية"
  ]
};

/**
 * يكشف العبارات النمطية للذكاء الاصطناعي.
 * الحساسية عالية: كل عبارة نمطية ترفع النسبة بقوة.
 * @returns { score: 0-100, signals: string[], hits: number }
 */
const detect = (text, lang = 'en') => {
  const lower = (text || '').toLowerCase();
  const phrases = PHRASES[lang] || PHRASES.en;
  const signals = [];
  let hits = 0;

  for (const p of phrases) {
    if (lower.includes(p)) {
      hits++;
      signals.push(p);
    }
  }

  // كل عبارة ترفع 25 نقطة (1=25، 2=50، 3=75، 4+=100)
  const score = Math.min(100, Math.round((hits / 4) * 100));
  return { score, signals, hits };
};

module.exports = { detect, PHRASES };
