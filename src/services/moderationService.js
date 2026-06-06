const User = require('../models/User');
const RScoreService = require('./rScoreService');

const THRESHOLDS = {
  WARN: 3,   // تحذير نهائي
  TEMP_BAN: 5,  // حظر مؤقت 24 ساعة
  PERM_BAN: 10, // حظر دائم
};

const applyWarning = async (userId, content, reason) => {
  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { $push: { warnings: { content, reason } } },
      { new: true }
    );

    const count = user.warnings.length;

    if (count >= THRESHOLDS.PERM_BAN) {
      await User.findByIdAndUpdate(userId, { status: 'banned', isActive: false });
      await RScoreService.applyScore(userId, 'PENALTY_VIOLATION', 'حظر دائم بسبب تكرار المخالفات');
      console.warn(`[Moderation] User ${userId} permanently banned.`);

    } else if (count >= THRESHOLDS.TEMP_BAN) {
      const bannedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await User.findByIdAndUpdate(userId, { status: 'banned', bannedUntil });
      await RScoreService.applyScore(userId, 'PENALTY_VIOLATION', 'حظر مؤقت 24 ساعة');
      console.warn(`[Moderation] User ${userId} temporarily banned until ${bannedUntil}.`);

    } else if (count >= THRESHOLDS.WARN) {
      await RScoreService.applyScore(userId, 'bad_content', 'تحذير بسبب محتوى غير لائق');
      console.warn(`[Moderation] User ${userId} received final warning (${count} warnings).`);
    }

    return count;
  } catch (e) {
    console.error('[Moderation Error]:', e.message);
  }
};

module.exports = { applyWarning };
