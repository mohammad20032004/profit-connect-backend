const formatUserResponse = (user, options = {}) => {
  const userObject = typeof user?.toObject === 'function' ? user.toObject() : user || {};
  const includePosts = options.includePosts === true;
  const includeSettings = options.includeSettings !== false;
  const includeFreelance = options.includeFreelance === true;

  const response = {
    id: userObject._id || userObject.id,
    email: userObject.email,
    username: userObject.username,
    role: userObject.role,
    profile: userObject.profile,
    professional: userObject.professional,
    employerProfile: userObject.employerProfile,
    companyEmployeeProfile: userObject.companyEmployeeProfile,

    ...(includePosts && userObject.posts ? { posts: userObject.posts } : {}),
  };

  if (includeSettings) {
    response.settings = userObject.settings;
  }

  // إرفاق بيانات الشركة إن وُجدت (لصاحب العمل/صاحب المشروع الحر/موظفة الشركة)
  if (userObject.company) {
    response.company = userObject.company;
  }

  // إرفاق ملخص حالة العمل الحر إن وُجد (يُحسب مسبقاً في المتحكّم)
  if (userObject.freelance) {
    response.freelance = userObject.freelance;
  } else if (includeFreelance) {
    response.freelance = {
      hasAcceptedProposal: false,
      isActiveFreelancer: false,
      acceptedCount: 0,
      appliedCount: 0,
      appliedProjects: [],
    };
  }

  return response;
};

module.exports = {
  formatUserResponse,
};
