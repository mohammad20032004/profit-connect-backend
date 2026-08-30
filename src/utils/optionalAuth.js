const jwt = require('jsonwebtoken');
const User = require('../models/User');

// محاولة التعرف على المستخدم من التوكن إن وُجد (اختياري — لا يمنع الزوار)
async function resolveOptionalUser(req) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return null;
  try {
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded || decoded.type === 'refresh' || !decoded.id) return null;
    const user = await User.findById(decoded.id)
      .select('status professional profile.location profile.following profile.followers');
    return user && user.status === 'active' ? user : null;
  } catch {
    return null;
  }
}

module.exports = { resolveOptionalUser };