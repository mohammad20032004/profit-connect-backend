// الطبقة الثالثة: التحليل اللغوي (طول الجمل، التباين، البدايات المكررة)
const detect = (text, lang = 'en') => {
  const signals = [];
  const raw = text || '';
  const sentences = (raw.match(/[^.!?؟]+/g) || [raw])
    .map(s => s.trim())
    .filter(Boolean);

  if (!sentences.length) return { score: 0, signals, stats: {} };

  const lengths = sentences.map(s => s.split(/\s+/).length);
  const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const variance = lengths.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / lengths.length;
  const cv = mean ? Math.sqrt(variance) / mean : 0;

  const starters = sentences
    .map(s => (s.split(/\s+/)[0] || '').toLowerCase().replace(/[^a-zء-ي]/gi, ''))
    .filter(Boolean);
  const freq = {};
  starters.forEach(st => { freq[st] = (freq[st] || 0) + 1; });
  const repeated = Object.values(freq).filter(c => c >= 3).length;

  let score = 0;

  // تباين منخفض جداً في طول الجمل (نص آلي موزون) — عتبة صارمة لتقليل الإيجابيات الخاطئة
  if (mean > 15 && cv < 0.35) { score += 35; signals.push('low_sentence_variance'); }
  else if (mean > 15 && cv < 0.5) { score += 15; }

  if (repeated > 0) { score += 30; signals.push(`repeated_starters:${repeated}`); }

  if (mean > 25) { score += 10; }

  score = Math.min(100, score);
  return {
    score,
    signals,
    stats: { meanLength: +mean.toFixed(1), cv: +cv.toFixed(2), repeatedStarters: repeated }
  };
};

module.exports = { detect };
