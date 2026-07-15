// الطبقة الرابعة: تحليل المفردات (التنوع المعجمي + الكلمات المتحفظة/الصيغية)
const HEDGES = {
  en: ["may", "might", "could", "perhaps", "generally", "typically", "often", "usually",
       "potentially", "arguably", "relatively", "fundamentally", "essentially"],
  ar: ["ربما", "قد", "غالباً", "عادةً", "بشكل عام", "نسبياً", "أساساً", "في الغالب", "يمكن", "يتمكن"]
};

const SOPHISTICATED = {
  en: ["leverage", "robust", "pivotal", "underscore", "foster", "realm", "landscape",
       "navigate", "intricate", "holistic", "synergy", "paradigm", "seamless",
       "comprehensive", "nuanced"],
  ar: ["يُسهم", "يبرز", "يُعَد", "تتجلى", "يتبلور", "منظور", "دمج", "تكامل", "استراتيجية", "هيكلة"]
};

const detect = (text, lang = 'en') => {
  const signals = [];
  const tokens = (text || '').toLowerCase().match(/[a-zء-ي]+/gi) || [];

  if (!tokens.length) return { score: 0, signals, stats: {} };

  const unique = new Set(tokens);
  const ttr = unique.size / tokens.length; // التنوع المعجمي (Type-Token Ratio)

  const hedges = HEDGES[lang] || HEDGES.en;
  const soph = SOPHISTICATED[lang] || SOPHISTICATED.en;
  const lower = (text || '').toLowerCase();

  let hedgeCount = 0;
  hedges.forEach(h => { if (lower.includes(h)) hedgeCount++; });

  let sophCount = 0;
  soph.forEach(s => { if (lower.includes(s)) sophCount++; });

  let score = 0;

  // التنوع المعجمي المنخفض (النص الآلي يكرر الكلمات)
  if (ttr < 0.4) { score += 25; signals.push('low_diversity'); }
  else if (ttr < 0.5) { score += 10; }

  // كثرة الكلمات المتحفظة/الصيغية
  if (hedgeCount >= 3) { score += 20; signals.push(`hedges:${hedgeCount}`); }
  else if (hedgeCount > 0) { score += 8; }

  // كثرة الكلمات "المتطورة" النمطية للذكاء الاصطناعي
  if (sophCount >= 3) { score += 25; signals.push(`sophisticated:${sophCount}`); }
  else if (sophCount > 0) { score += 10; }

  score = Math.min(100, score);
  return {
    score,
    signals,
    stats: { ttr: +ttr.toFixed(2), hedgeCount, sophCount }
  };
};

module.exports = { detect, HEDGES, SOPHISTICATED };
