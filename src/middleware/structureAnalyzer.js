// الطبقة الثانية: تحليل البنية (العناوين، القوائم، التوازن)
// مخصّص للكشف عن البنية "المخططية" النمطية للذكاء الاصطناعي (عناوين ## + قوائم نقطية)
const detect = (text, lang = 'en') => {
  const signals = [];
  const lines = (text || '').split('\n');

  const headings = lines.filter(l => /^#{1,6}\s/.test(l.trim())).length;
  const bullets = lines.filter(l => /^\s*[-*]\s/.test(l)).length;
  const numbered = lines.filter(l => /^\s*\d+\.\s/.test(l)).length;
  const lists = bullets + numbered;

  const paragraphs = lines.filter(l => l.trim().length > 0);
  const lengths = paragraphs.map(p => p.trim().split(/\s+/).length);
  const mean = lengths.length ? lengths.reduce((a, b) => a + b, 0) / lengths.length : 0;
  const variance = lengths.length ? lengths.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / lengths.length : 0;
  const cv = mean ? Math.sqrt(variance) / mean : 0;

  let score = 0;

  if (headings >= 3) { score += 40; signals.push(`headings:${headings}`); }
  else if (headings > 0) { score += 15; }

  if (lists >= 4) { score += 40; signals.push(`lists:${lists}`); }
  else if (lists > 0) { score += 15; }

  // بنية منتظمة جداً + وجود علامات هيكلية (لتجنّب إيجابيات خاطئة مع النص البشري)
  if (mean > 25 && cv < 0.4 && (headings > 0 || lists > 0)) {
    score += 20; signals.push('uniform_structure');
  }

  score = Math.min(100, score);
  return {
    score,
    signals,
    stats: { headings, lists, meanLength: Math.round(mean), cv: +cv.toFixed(2) }
  };
};

module.exports = { detect };
