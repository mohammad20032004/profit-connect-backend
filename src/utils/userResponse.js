const formatUserResponse = (user, options = {}) => {
  const userObject = typeof user?.toObject === 'function' ? user.toObject() : user || {};
  const includePosts = options.includePosts === true;

  return {
    id: userObject._id || userObject.id,
    email: userObject.email,
    username: userObject.username,
    role: userObject.role,
    profile: userObject.profile,
    professional: userObject.professional,

    ...(includePosts && userObject.posts ? { posts: userObject.posts } : {}),

    // settings تم إخفاؤه من الاستجابة كما طلبت

    // تم إخفاء الحقول الحساسة/غير المرغوب إظهارها في واجهات المستخدم
    // isActive, isVerified, createdAt, updatedAt
  };
};

module.exports = {
  formatUserResponse,
};
